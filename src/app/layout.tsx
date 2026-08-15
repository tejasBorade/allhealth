import type { Metadata } from "next";
import { Inter, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ReduxProvider from "@/components/providers/ReduxProvider";
import ThemeRegistry from "@/components/providers/ThemeRegistry";
import ToastProvider from "@/components/providers/ToastProvider";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["700", "800", "900"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "FriendlyHealthy",
  description: "Connecting doctors, staff, and patients in one place",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ReduxProvider>
          <ThemeRegistry>
            <ToastProvider>{children}</ToastProvider>
          </ThemeRegistry>
        </ReduxProvider>
      </body>
    </html>
  );
}
