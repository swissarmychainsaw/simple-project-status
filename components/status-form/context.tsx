"use client";
import React, { createContext, useContext } from "react";
import type { ReactNode } from "react";
import type { BannerKey } from "@/components/status-form/projectProfiles";
import { useStatusForm } from "./hooks/useStatusForm";

type ProviderProps = {
  initialProject?: BannerKey;
  children: ReactNode;
};

const Ctx = createContext<ReturnType<typeof useStatusForm> | null>(null);

export function StatusFormProvider({ initialProject, children }: ProviderProps) {
  const store = useStatusForm(initialProject);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStatusFormCtx() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStatusFormCtx must be used within StatusFormProvider");
  return ctx;
}

