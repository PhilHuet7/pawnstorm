"use client";

import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { useNotificationStore } from "@/store/useNotificationStore";

export const useGameNotifications = () => {
  const version = useGameStore((s) => s.positionVersion);
  const inCheck = useGameStore((s) => s.inCheck);
  const checkmate = useGameStore((s) => s.checkmate);
  const stalemate = useGameStore((s) => s.stalemate);
  const turn = useGameStore((s) => s.turn);
  const push = useNotificationStore((s) => s.push);

  const prevVersion = useRef(version);

  useEffect(() => {
    console.log("version", version, "checkmate", checkmate, "inCheck", inCheck);
    if (version === prevVersion.current) return;
    prevVersion.current = version;

    if (checkmate) {
      const winner = turn === "w" ? "Black" : "White";
      push("checkmate", `Checkmate! ${winner} wins`, 999999);
    } else if (stalemate) {
      push("stalemate", "Stalemate — Draw", 999999);
    } else if (inCheck) {
      push("check", "Check!", 999999);
    }
  }, [version, inCheck, checkmate, stalemate, turn, push]);
};
