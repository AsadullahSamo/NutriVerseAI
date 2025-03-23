import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";

// Define core types
type UserPreferences = Record<string, any>;

type StorageUser = {
  id: number;
  username: string;
  password: string;
  email?: string;
  name?: string;
  preferences: UserPreferences;
  dnaProfile?: unknown;
  moodJournal?: unknown[] | null;
};

type SafeUser = {
  id: number;
  username: string;
  email?: string;
  name?: string;
  preferences: UserPreferences;
};

// Type declarations for Express
declare module 'express-session' {
  interface SessionData {
    userId?: number;
  }
}

declare module 'express' {
  interface User extends SafeUser {}
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Helper to cast unknown preferences to proper type
function normalizePreferences(prefs: unknown): UserPreferences {
  if (typeof prefs === 'object' && prefs !== null) {
    return prefs as UserPreferences;
  }
  return {};
}

// Helper to remove sensitive data from user object
function sanitizeUser(user: Partial<StorageUser> & { id: number; username: string }): SafeUser {
  const { password, dnaProfile, moodJournal, ...safeUser } = user;
  return {
    ...safeUser,
    preferences: typeof user.preferences === 'object' ? user.preferences as UserPreferences : {},
    id: user.id,
    username: user.username
  };
}

export function setupAuth(app: Express) {
  const sessionMiddleware = session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      domain: process.env.NODE_ENV === 'production' ? process.env.DOMAIN : undefined
    },
    name: 'sessionId'
  });

  app.set('trust proxy', 1);
  app.use(sessionMiddleware);
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user) {
          return done(null, false, { message: "User does not exist. Please register an account." });
        }
        if (!(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Incorrect password. Please try again." });
        }
        return done(null, sanitizeUser(user));
      } catch (err) {
        return done(err);
      }
    })
  );

  passport.serializeUser<number>((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser<number>(async (id, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, sanitizeUser(user));
    } catch (err) {
      done(err);
    }
  });

  // Update account profile endpoint
  app.patch("/api/account/profile", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const updates = {
        ...req.user,
        ...req.body,
        id: req.user.id // Ensure ID doesn't change
      };

      const user = await storage.updateUser(req.user.id, updates);
      res.json(sanitizeUser(user));
    } catch (error) {
      console.error('Profile update error:', error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      // Validate required fields are present
      if (!req.body.username || req.body.username.trim() === '') {
        return res.status(400).json({ message: "Username is required" });
      }
      
      if (!req.body.password || req.body.password.trim() === '') {
        return res.status(400).json({ message: "Password is required" });
      }
      
      // Validate username length
      if (req.body.username.length < 3) {
        return res.status(400).json({ message: "Username must be at least 3 characters long" });
      }
      
      // Validate password length
      if (req.body.password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters long" });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      const safeUser = sanitizeUser(user);
      req.login(safeUser, (err) => {
        if (err) {
          return res.status(500).json({ message: "Failed to log in after registration" });
        }
        res.status(201).json(safeUser);
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/login", (req: Request, res: Response, next: NextFunction) => {
    passport.authenticate("local", (err: any, user: SafeUser | false, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Login failed" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  // User account endpoints
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    res.json(req.user);
  });

  // Add account deletion endpoint
  app.delete("/api/account", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { password } = req.body;
      
      // Verify password before deletion
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if password is correct
      if (!(await comparePasswords(password, user.password))) {
        return res.status(401).json({ message: "Invalid password" });
      }
      
      // Delete the user account
      await storage.deleteUser(req.user.id);
      
      // Logout the user
      req.logout((err) => {
        if (err) {
          console.error("Logout error during account deletion:", err);
          return res.status(500).json({ message: "Error during logout process" });
        }
        
        res.json({ message: "Account deleted successfully" });
      });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ message: "Failed to delete account" });
    }
  });

  // Change password endpoint
  app.post("/api/account/change-password", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required" });
      }

      // Verify current password
      const user = await storage.getUser(req.user.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (!(await comparePasswords(currentPassword, user.password))) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }

      // Prevent reusing the same password
      if (await comparePasswords(newPassword, user.password)) {
        return res.status(400).json({ message: "New password must be different from current password" });
      }

      // Validate new password length and complexity
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "New password must be at least 6 characters long" });
      }

      const hashedPassword = await hashPassword(newPassword);

      // Update user with new password
      await storage.updateUser(user.id, {
        ...user,
        password: hashedPassword
      });

      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ message: "Failed to change password" });
    }
  });

  return sessionMiddleware;
}