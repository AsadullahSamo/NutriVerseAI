import passport from "passport"
import { Strategy as LocalStrategy } from "passport-local"
import session from "express-session"
import { scrypt, randomBytes, timingSafeEqual } from "crypto"
import { promisify } from "util"
import { storage } from "./storage"

const scryptAsync = promisify(scrypt)

async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex")
  const buf = await scryptAsync(password, salt, 64)
  return `${(buf as any).toString("hex")}.${salt}`
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split(".")
  const hashedBuf = Buffer.from(hashed, "hex")
  const suppliedBuf = await scryptAsync(supplied, salt, 64)
  return timingSafeEqual(hashedBuf as any, suppliedBuf as any)
}

// Generate a unique secret key
function generateSecretKey() {
  // Generate 32 random bytes and convert to hex for a 64-character key
  return randomBytes(32).toString("hex")
}

// Convert raw storage data to proper types
function processStorageUser(raw) {
  return {
    ...raw,
    preferences: typeof raw.preferences === "object" ? raw.preferences : {}
  }
}

// Helper to remove sensitive data from user object
function sanitizeUser(raw) {
  const user = processStorageUser(raw)
  const { password, dnaProfile, moodJournal, secretKey, ...safeUser } = user
  return safeUser
}

export function setupAuth(app) {
  // Session middleware setup
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || "your_secure_session_secret",
    resave: true,
    saveUninitialized: true,
    store: (storage as any).sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: false, // Allow client-side access for debugging
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === 'production' ? "none" : "lax",
      path: "/",
      domain: process.env.NODE_ENV === 'production' ? undefined : 'localhost'
    },
    name: "sessionId"
  })

  app.set("trust proxy", 1)
  app.use(sessionMiddleware)
  app.use(passport.initialize())
  app.use(passport.session())

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username)
        if (!user) {
          return done(null, false, {
            message: "User does not exist. Please register an account."
          })
        }
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, {
            message: "Incorrect password. Please try again."
          })
        }
        return done(null, sanitizeUser(user))
      } catch (err) {
        return done(err)
      }
    })
  )

  passport.serializeUser((user, done) => {
    done(null, (user as any).id)
  })

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await storage.getUser(id)
      if (!user) {
        return done(null, false)
      }
      done(null, sanitizeUser(user))
    } catch (err) {
      done(err)
    }
  })

  // Registration endpoint
  app.post("/api/register", async (req, res) => {
    try {
      // Validate required fields are present
      if (!req.body.username || req.body.username.trim() === "") {
        return res.status(400).json({ message: "Username is required" })
      }

      if (!req.body.password || req.body.password.trim() === "") {
        return res.status(400).json({ message: "Password is required" })
      }

      // Validate username length
      if (req.body.username.length < 3) {
        return res
          .status(400)
          .json({ message: "Username must be at least 3 characters long" })
      }

      // Validate password length
      if (req.body.password.length < 6) {
        return res
          .status(400)
          .json({ message: "Password must be at least 6 characters long" })
      }

      const existingUser = await storage.getUserByUsername(req.body.username)
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" })
      }

      // Generate secret key for the user
      const secretKey = generateSecretKey()

      const hashedPassword = await hashPassword(req.body.password)
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
        secretKey
      })

      const safeUser = sanitizeUser(user)

      // Send the response with both user data and secret key
      req.login(safeUser, err => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Failed to log in after registration" })
        }
        res.status(201).json({
          user: safeUser,
          secretKey,
          message:
            "Please save this secret key in a secure place. You will need it to reset your password if you forget it."
        })
      })
    } catch (err) {
      console.error("Registration error:", err)
      res.status(500).json({ message: "Registration failed" })
    }
  })

  // Login endpoint with support for both password and secret key
  app.post("/api/login", async (req, res, next) => {
    const { username, password, secretKey } = req.body

    // If secret key is provided, use it for authentication
    if (secretKey) {
      try {
        const user = await storage.getUserByUsername(username)
        if (!user) {
          return res.status(401).json({ message: "User does not exist. Please register an account." })
        }

        // Verify secret key
        if (user.secretKey !== secretKey) {
          return res.status(401).json({ message: "Invalid secret key. Please try again." })
        }

        const safeUser = sanitizeUser(user)
        req.login(safeUser, err => {
          if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: "Login failed. Please try again later." })
          }

          const responseData = {
            ...safeUser,
            token: safeUser.id // Simple token = user ID
          };

          console.log('Login successful:', {
            userId: safeUser.id,
            sessionId: req.sessionID,
            cookies: req.headers.cookie,
            origin: req.headers.origin,
            responseIncludesToken: !!responseData.token
          });

          // Return user data with token for cross-domain auth
          res.json(responseData)
        })
      } catch (err) {
        next(err)
      }
    } else {
      // Use regular password authentication
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return res.status(500).json({ message: "Login failed. Please try again later." })
        }
        if (!user) {
          // Provide more specific error messages based on the info message
          let errorMessage = "Invalid credentials. Please check your username and password."
          if (info && info.message) {
            if (info.message.includes("User does not exist")) {
              errorMessage = "User does not exist. Please register an account."
            } else if (info.message.includes("Incorrect password")) {
              errorMessage = "Incorrect password. Please try again."
            }
          }
          return res.status(401).json({ message: errorMessage })
        }
        req.login(user, err => {
          if (err) {
            return res.status(500).json({ message: "Login failed. Please try again later." })
          }

          const responseData = {
            ...user,
            token: user.id // Simple token = user ID
          };

          console.log('Regular login successful:', {
            userId: user.id,
            sessionId: req.sessionID,
            cookies: req.headers.cookie,
            origin: req.headers.origin,
            responseIncludesToken: !!responseData.token
          });

          res.json(responseData)
        })
      })(req, res, next)
    }
  })

  // Change password endpoint - updated to handle both authenticated and unauthenticated requests
  app.post("/api/account/change-password", async (req, res) => {
    try {
      const { username, currentPassword, newPassword, secretKey } = req.body

      // Handle unauthenticated password reset using secret key
      if (!req.isAuthenticated()) {
        if (!username || !secretKey || !newPassword) {
          return res.status(400).json({
            message:
              "Username, secret key, and new password are required for password reset"
          })
        }

        const user = await storage.getUserByUsername(username)
        if (!user) {
          return res.status(404).json({ message: "User not found" })
        }

        // Verify secret key
        if (user.secretKey !== secretKey) {
          return res.status(401).json({ message: "Invalid secret key" })
        }

        if (newPassword.length < 6) {
          return res
            .status(400)
            .json({
              message: "New password must be at least 6 characters long"
            })
        }

        const hashedPassword = await hashPassword(newPassword)
        await storage.updateUser(user.id, {
          ...user,
          password: hashedPassword
        })

        return res.json({ message: "Password updated successfully" })
      }

      // Handle authenticated password change
      const {
        currentPassword: oldPassword,
        newPassword: updatedPassword
      } = req.body

      if (!oldPassword || !updatedPassword) {
        return res
          .status(400)
          .json({ message: "Current password and new password are required" })
      }

      const user = await storage.getUser(req.user.id)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      if (!(await comparePasswords(oldPassword, user.password))) {
        return res
          .status(401)
          .json({ message: "Current password is incorrect" })
      }

      if (updatedPassword.length < 6) {
        return res
          .status(400)
          .json({ message: "New password must be at least 6 characters long" })
      }

      const hashedPassword = await hashPassword(updatedPassword)
      await storage.updateUser(user.id, {
        ...user,
        password: hashedPassword
      })

      res.json({ message: "Password updated successfully" })
    } catch (error) {
      console.error("Password change error:", error)
      res.status(500).json({ message: "Failed to change password" })
    }
  })

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    req.logout(err => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" })
      }
      res.json({ message: "Logged out successfully" })
    })
  })

  // Get user endpoint - with debugging and token fallback
  app.get("/api/user", async (req, res) => {
    console.log('User endpoint hit:', {
      isAuthenticated: req.isAuthenticated(),
      session: req.session?.passport,
      cookies: req.headers.cookie,
      authorization: req.headers.authorization,
      origin: req.headers.origin
    });

    // Try session authentication first
    if (req.isAuthenticated()) {
      return res.json(req.user)
    }

    // Fallback to token authentication
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        // Simple token validation (user ID)
        const user = await storage.getUser(token);
        if (user) {
          const { password, dnaProfile, moodJournal, secretKey, ...safeUser } = user;
          return res.json(safeUser);
        }
      } catch (error) {
        console.error('Token validation error:', error);
      }
    }

    return res.status(401).json({ message: "Not authenticated" })
  })

  // Update account profile endpoint
  app.patch("/api/account/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" })
      }

      const updates = {
        ...req.user,
        ...req.body,
        id: req.user.id // Ensure ID doesn't change
      }

      const user = await storage.updateUser(req.user.id, updates)
      res.json(sanitizeUser(user))
    } catch (error) {
      console.error("Profile update error:", error)
      res.status(500).json({ message: "Failed to update profile" })
    }
  })

  // Add account deletion endpoint
  app.delete("/api/account", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" })
      }

      const { password } = req.body

      // Verify password before deletion
      const user = await storage.getUser(req.user.id)
      if (!user) {
        return res.status(404).json({ message: "User not found" })
      }

      // Check if password is correct
      if (!(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid password" })
      }

      // Delete the user account
      await storage.deleteUser(req.user.id)

      // Store the user ID for logout after response is sent
      const userId = req.user.id

      // Send success response with status code only, no JSON body
      res.status(200).end()

      // Destroy the session after response is sent
      req.session.destroy(err => {
        if (err) {
          console.error("Session destruction error:", err)
        }
      })
    } catch (error) {
      console.error("Account deletion error:", error)
      res.status(500).json({ message: "Failed to delete account" })
    }
  })

  // Delete account endpoint
  app.post("/api/account/delete", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password is required" });
      }

      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Verify password
      if (!(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Incorrect password" });
      }

      // Delete the user and all associated data
      await storage.deleteUser(user.id);

      // Logout the user
      req.logout((err) => {
        if (err) {
          console.error("Error during logout:", err);
        }
        res.json({ message: "Account deleted successfully" });
      });
    } catch (err) {
      console.error("Delete account error:", err);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  return sessionMiddleware
}
