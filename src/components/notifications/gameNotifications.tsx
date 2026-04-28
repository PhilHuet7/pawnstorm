"use client";

import { useGameNotifications } from "@/hooks/useGameNotifications";
import { useNotificationStore } from "@/store/useNotificationStore";

const typeStyles: Record<string, string> = {
  check: "border-pawnstorm-gold text-pawnstorm-gold text-5xl px-8 py-4",
  checkmate: "border-pawnstorm-gold text-pawnstorm-gold text-3xl px-10 py-5",
  stalemate: "border-gray-400 text-gray-300 text-3xl px-10 py-5",
};

const GameNotifications = () => {
  useGameNotifications();

  const notification = useNotificationStore((s) => s.notification);
  const clearNotification = useNotificationStore((s) => s.clearNotification);

  if (!notification) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center ml-36 justify-center pointer-events-none">
      <div
        onClick={clearNotification}
        className={`pointer-events-auto cursor-pointer relative overflow-hidden
          bg-pawnstorm-blue/95 border-2 rounded-lg font-bold tracking-wider
          shadow-lg backdrop-blur-sm
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
