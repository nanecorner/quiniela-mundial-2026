import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quiniela del Mundial",
  description: "Demuestra quién sabe más de fútbol en tu grupo de amigos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="py-6 text-center text-sm font-medium text-gray-500 bg-slate-950/80 backdrop-blur-sm border-t border-white/5 relative z-50">
          Hecho por D'cReaM 🐢
        </footer>
      </body>
    </html>
  );
}
