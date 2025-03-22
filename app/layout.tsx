import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { UserPreferencesProvider } from "@/contexts/UserPreferencesContext";

const inter = Inter({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <UserPreferencesProvider>
          <ClerkProvider>
            <body className={inter.className}>{children}</body>
          </ClerkProvider>
        </UserPreferencesProvider>
      </body>
    </html>
  );
}
