"use client";

import React from "react";
import { DndContext } from "@dnd-kit/core";

const ClientProvider = ({ children }: { children: React.ReactNode }) => {
  return <DndContext>{children}</DndContext>;
};

export default ClientProvider;
