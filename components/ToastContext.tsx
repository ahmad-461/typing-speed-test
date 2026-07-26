"use client";

import React, { createContext, useContext, useState, useRef } from "react";

export interface Toast {
  id: string;
  type: "level_up" | "achievement";
  title: string;
  message: string;
  badgeId?: string;
}

interface ToastContextType {
  queueToast: (type: "level_up" | "achievement", title: string, message: string, badgeId?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [activeToast, setActiveToast] = useState<Toast | null>(null);
  const toastQueue = useRef<Omit<Toast, "id">[]>([]);
  const isDisplaying = useRef(false);

  const processQueue = React.useCallback(() => {
    if (isDisplaying.current || toastQueue.current.length === 0) return;

    isDisplaying.current = true;
    const nextToast = toastQueue.current.shift()!;
    const id = Math.random().toString(36).substring(2, 9);

    setActiveToast({ ...nextToast, id });

    // Show toast for 4 seconds, then fade out and handle next toast
    setTimeout(() => {
      setActiveToast(null);
      // Wait for exit transition (200ms) before processing the next toast in queue
      setTimeout(() => {
        isDisplaying.current = false;
        processQueue();
      }, 200);
    }, 4000);
  }, []);

  const queueToast = React.useCallback((type: "level_up" | "achievement", title: string, message: string, badgeId?: string) => {
    toastQueue.current.push({ type, title, message, badgeId });
    processQueue();
  }, [processQueue]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const { type, title, message, badgeId } = customEvent.detail;
        queueToast(type, title, message, badgeId);
      }
    };

    window.addEventListener("tst-toast", handleToastEvent);
    return () => {
      window.removeEventListener("tst-toast", handleToastEvent);
    };
  }, [queueToast]);

  return (
    <ToastContext.Provider value={{ queueToast }}>
      {children}

      {/* Slide-in subtle celebratory Toast notification */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-[#121316] border-2 border-[#3B82F6] rounded-2xl p-5 shadow-2xl shadow-[#3B82F6]/10 flex items-start gap-4 animate-slide-in select-none">
          {/* Subtle electric blue decoration bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-400 to-electric-600 rounded-t-2xl" />

          {/* Icon */}
          <div className="flex-shrink-0 text-2xl pt-0.5">
            {activeToast.type === "level_up" ? "🎉" : "🏆"}
          </div>

          {/* Content */}
          <div className="flex-grow space-y-1">
            <span className="font-mono text-[10px] uppercase tracking-widest font-extrabold text-[#3B82F6] block">
              {activeToast.type === "level_up" ? "// LEVEL UP" : "// ACHIEVEMENT UNLOCKED"}
            </span>
            <h4 className="text-sm font-extrabold text-white font-sans leading-snug">
              {activeToast.title}
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {activeToast.message}
            </p>
          </div>

          {/* Dismiss Button */}
          <button
            onClick={() => setActiveToast(null)}
            className="flex-shrink-0 text-slate-500 hover:text-white transition-colors text-xs font-mono"
          >
            [X]
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
