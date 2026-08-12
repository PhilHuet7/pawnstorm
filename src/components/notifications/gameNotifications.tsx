"use client";

import { useGameNotifications } from "@/hooks/useGameNotifications";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useEffect, useRef } from "react";

const typeStyles: Record<string, string> = {
  check: "border-pawnstorm-gold text-pawnstorm-gold text-5xl px-8 py-4",
  checkmate: "border-pawnstorm-gold text-pawnstorm-gold text-3xl px-10 py-5",
  stalemate: "border-gray-400 text-gray-300 text-3xl px-10 py-5",
};

const GameNotifications = () => {
  useGameNotifications();

  const notification = useNotificationStore((s) => s.notification);
  const clearNotification = useNotificationStore((s) => s.clearNotification);

  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notification) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target as Node)
      )
        clearNotification();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notification, clearNotification]);

  if (!notification) return null;

  return (
    // pointer-events-none so the board stays clickable underneath while a
    // notification is up; only the card itself takes pointer events.
    <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center">
      <div
        ref={notificationRef}
        onClick={(e) => e.stopPropagation()}
        className={`pointer-events-auto cursor-default relative overflow-hidden
          bg-pawnstorm-blue/95 border-2 rounded-lg font-bold tracking-wider
          shadow-lg
          animate-notificationIn
          ${typeStyles[notification.type]}`}
      >
        {notification.message}

        <div
          className="absolute bottom-0 left-0 h-1 bg-pawnstorm-gold/60 animate-notificationShrink"
          style={{ animationDuration: `${notification.duration}ms` }}
        />
      </div>
    </div>
  );
};

export default GameNotifications;
