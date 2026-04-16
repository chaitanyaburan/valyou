import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import Ticker from "@/components/Ticker";
import BottomNav from "@/components/BottomNav";
import RiskDisclosureGate from "@/components/RiskDisclosureGate";
import ThemeScript from "@/components/ThemeScript";
import { PeraTestnetProvider } from "@/components/providers/PeraTestnetProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppTourProvider } from "@/contexts/AppTourContext";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Valyou — Invest in Ideas",
  description: "Fund projects. Prove talent. Hire with confidence.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-screen bg-background text-foreground transition-colors duration-200">
        <ThemeScript />
        <RiskDisclosureGate>
          <PeraTestnetProvider>
            <AuthProvider>
              <AppTourProvider>
                <Navbar />
                <div className="pt-14 sm:pt-16">
                  <Ticker />
                </div>
                <main className="mx-auto max-w-7xl px-3 sm:px-4 md:px-6 pb-20 lg:pb-6">
                  {children}
                </main>
                <BottomNav />
              </AppTourProvider>
            </AuthProvider>
          </PeraTestnetProvider>
        </RiskDisclosureGate>
      </body>
    </html>
  );
}
