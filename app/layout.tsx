import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { ToastProvider } from "../components/ToastContext";
import EditNameModal from "../components/EditNameModal";
import ExitConfirmModal from "../components/ExitConfirmModal";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Typing Speed Test",
  description: "Evaluate your typing speed and accuracy under pressure with a beautiful, minimalist, and sleek developer terminal theme. Fully integrated with AI passage generation and global live leaderboard.",
  keywords: ["typing speed test", "typing test", "wpm", "keyboard test", "words per minute"],
  authors: [{ name: "Ahmad" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${jetbrains.variable}`}>
      <body className="bg-charcoal-900 text-slate-100 antialiased font-sans min-h-screen selection:bg-electric-500/30 selection:text-electric-400">
        <ToastProvider>
          <div className="flex flex-col min-h-screen">
            <Header />
            <div className="flex-grow flex flex-col">
              {children}
            </div>
            <Footer />
            <EditNameModal />
            <ExitConfirmModal />
          </div>
        </ToastProvider>
      </body>
    </html>
  );
}
