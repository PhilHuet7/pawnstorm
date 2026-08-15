"use client";

import React, { useEffect } from "react";
import { DndContext } from "@dnd-kit/core";
import { useSettingsStore } from "@/store/useSettingsStore";

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  // Settings persist to localStorage with skipHydration, so they are read back
  // here — after React has hydrated — to avoid a server/client render mismatch.
  useEffect(() => {
    void useSettingsStore.persist.rehydrate();
  }, []);

  return <DndContext>{children}</DndContext>;
};

export default ClientProvider;
