"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  pushToast: (
    message: string,
    type?: ToastType
  ) => void;
}

const ToastContext = createContext<
  ToastContextValue | undefined
>(undefined);

export function ToastProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [toasts, setToasts] = useState<
    ToastItem[]
  >([]);

  const pushToast = useCallback(
    (
      message: string,
      type: ToastType = "info"
    ) => {
      const id =
        Date.now() + Math.floor(Math.random() * 1000);
      setToasts((prev) => [
        ...prev,
        { id, message, type },
      ]);

      window.setTimeout(() => {
        setToasts((prev) =>
          prev.filter((toast) => toast.id !== id)
        );
      }, 2800);
    },
    []
  );

  const value = useMemo(
    () => ({ pushToast }),
    [pushToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[70] flex w-[92vw] max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`rounded-2xl border px-4 py-3 text-sm shadow-lg backdrop-blur-sm transition ${
              toast.type === "success"
                ? "border-[#b78b63] bg-[#f8ebdc]/95 text-[#4e3324]"
                : toast.type === "error"
                  ? "border-[#d6a29b] bg-[#fae6e3]/95 text-[#7a2f25]"
                  : "border-[#d7bf9d] bg-[#fff7ec]/95 text-[#5a3b2a]"
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error(
      "useToast must be used within ToastProvider"
    );
  }

  return context;
}
