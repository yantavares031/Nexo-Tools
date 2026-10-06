import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { APP_VERSION } from "@/lib/version";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXO Tools",
  description: "Fluxos administrativos e financeiros de forma simples e integrada",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${inter.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <span
          className="fixed bottom-3 right-3 text-[10px] text-neutral-400 max-lg:hidden"
          title={`NEXO Tools v${APP_VERSION}`}
        >
          v{APP_VERSION}
        </span>
      </body>
    </html>
  );
}
