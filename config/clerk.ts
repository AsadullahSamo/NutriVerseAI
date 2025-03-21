import { clerkClient } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs";

export const getClerkUser = async () => {
  const { userId } = auth();
  
  if (!userId) {
    return null;
  }

  const user = await clerkClient.users.getUser(userId);
  return user;
};

export const requireAuth = async () => {
  const { userId } = auth();
  
  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
};
