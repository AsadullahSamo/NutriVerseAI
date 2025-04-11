import { z } from "zod"

export const insertUserSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  preferences: z.object({}).optional()
})

export const loginUserSchema = insertUserSchema.pick({
  username: true,
  password: true
}) 