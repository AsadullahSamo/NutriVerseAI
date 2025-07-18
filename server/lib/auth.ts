import { storage } from "../storage"

export async function getAuth(req) {
  if (!req.session?.passport?.user) {
    return null
  }

  try {
    const user = await storage.getUser(req.session.passport.user)
    if (!user) {
      return null
    }

    // Remove sensitive data
    const { password, dnaProfile, moodJournal, secretKey, ...safeUser } = user
    return safeUser
  } catch (error) {
    console.error("Error getting user from session:", error)
    return null
  }
} 