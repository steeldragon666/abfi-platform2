import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "ABFI - Australian Bioenergy Feedstock Institute",
    template: "%s | ABFI",
  },
  description:
    "Australia's national feedstock coordination platform connecting bioenergy suppliers with producers through standardised ratings and verified records.",
  keywords: [
    "bioenergy",
    "feedstock",
    "Australia",
    "SAF",
    "sustainable aviation fuel",
    "biofuel",
    "renewable energy",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
