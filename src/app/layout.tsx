import type { Metadata } from "next";
import { Geist_Mono, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import AuthProvider from '@/providers/auth-provider';
import { VaultProvider } from "@/providers/vault-provider";
import { VaultCategoryProvider } from "@/providers/vault-category-provider"

const poppinsSans = Poppins({
  variable: "--font-poppins-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"]
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PassManager",
  description: "Secure all your passwords at one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${poppinsSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <VaultProvider>
              <VaultCategoryProvider>
                {children}
                <Toaster richColors position="top-right" />
              </VaultCategoryProvider>
            </VaultProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
