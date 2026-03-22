import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/hooks/use-auth";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CareBot - Personal Health Companion",
  description: "Your all-in-one health companion — track, analyze, and understand your health through conversation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={true}>
          <AuthProvider>
            <div className="h-screen w-screen relative">
              <div
                className="absolute inset-0 -z-10"
                style={{
                  backgroundColor: "var(--background)",
                  backgroundImage: `
                    radial-gradient(circle at 25% 25%, oklch(0.25 0.01 260) 0.5px, transparent 1px),
                    radial-gradient(circle at 75% 75%, oklch(0.18 0.01 260) 0.5px, transparent 1px)
                  `,
                  backgroundSize: "10px 10px",
                  imageRendering: "pixelated",
                }}
              />
              {children}
            </div>
            <Toaster richColors position="top-right" />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
