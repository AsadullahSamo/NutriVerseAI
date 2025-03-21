export interface User {
  id: number;
  clerkId: string;
  email?: string;
  name?: string;
  preferences?: Record<string, any>;
}