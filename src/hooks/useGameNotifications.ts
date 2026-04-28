"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useNotificationStore } from "@/store/useNotificationStore";

export const useGameNotifications = () => {
  const version = useGameStore((s) => s.positionVersion);
  const push = useNotificationStore((s) => s.push);

  const prevVersion = useRef(version);

  useEffect(() => {
    if (version === prevVersion.current) return;
    prevVersion.current = version;

    // Read directly from the store so we always get the committed snapshot,
    // not a potentially-stale closure value from a separate subscription.
    const { inCheck, checkmate, stalemate, turn } = useGameStore.getState();

    if (checkmate) {
      const winner = turn === "w" ? "Black" : "White";
      push("checkmate", `Checkmate! ${winner} wins`, 999999);
    } else if (stalemate) {
      push("stalemate", "Stalemate — Draw", 999999);
    } else if (inCheck) {
      push("check", "Check!", 5000);
    }
  }, [version, push]);
};
