import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { APP_VERSION } from "@/lib/version";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXO Tools",
  description: "Fluxos administrativos e financeiros de forma simples e integrada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <span
          className="fixed bottom-3 right-3 text-[10px] text-slate-400"
          title={`NEXO Tools v${APP_VERSION}`}
        >
          v{APP_VERSION}
        </span>
      </body>
    </html>
  );
}
