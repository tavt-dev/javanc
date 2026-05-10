import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/features/auth/auth-provider";
import { AppShell } from "@/components/app-shell";
import { LanguageProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "JavaNC Portfolio",
  description: "Business frontend for profiles, projects, companies, and jobs"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <LanguageProvider>
          <AuthProvider>
            <AppShell>{children}</AppShell>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
