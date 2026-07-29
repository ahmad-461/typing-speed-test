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
  metadataBase: new URL("https://typing-speed-test-pi-smoky.vercel.app"),
  title: "NOKY — Premium Terminal Typing Speed Test ⚡",
  description: "A gamified typing speed and accuracy platform with AI-generated passages, real-time coaching, and a persistent leaderboard — styled as a dark cyber-terminal experience.",
  keywords: ["typing speed test", "typing test", "wpm", "keyboard test", "words per minute", "NOKY", "Ahmad portfolio"],
  authors: [{ name: "Ahmad", url: "https://github.com/ahmad-461/typing-speed-test" }],
  openGraph: {
    title: "NOKY — Premium Terminal Typing Speed Test ⚡",
    description: "A gamified typing speed and accuracy platform with AI-generated passages, real-time coaching, and a persistent leaderboard — styled as a dark cyber-terminal experience.",
    url: "https://typing-speed-test-pi-smoky.vercel.app",
    siteName: "NOKY Terminal Systems",
    images: [
      {
        url: "/logo.svg",
        width: 512,
        height: 512,
        alt: "NOKY Logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NOKY — Premium Terminal Typing Speed Test ⚡",
    description: "A gamified typing speed and accuracy platform with AI-generated passages, real-time coaching, and a persistent leaderboard — styled as a dark cyber-terminal experience.",
    images: ["/logo.svg"],
  },
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
