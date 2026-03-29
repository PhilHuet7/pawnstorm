import { create } from "zustand";

type NotificationType = "check" | "checkmate" | "stalemate";

type Notification = {
  type: NotificationType;
  message: string;
  duration: number;
};

type NotificationState = {
  notification: Notification | null;
  push: (type: NotificationType, message: string, duration: number) => void;
  clearNotification: () => void;
};

let timerId: ReturnType<typeof setTimeout>;

export const useNotificationStore = create<NotificationState>((set) => ({
  notification: null,

  push: (type, message, duration) => {
    clearTimeout(timerId);
    set({ notification: { type, message, duration } });
    timerId = setTimeout(() => {
      set({ notification: null });
    }, duration);
  },

  clearNotification: () => {
    clearTimeout(timerId);
    set({ notification: null });
  },
}));
