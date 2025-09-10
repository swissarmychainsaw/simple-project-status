"use client";

import { useState } from "react";
import StatusForm from "@/components/status-form";

export default function Page() {
  const [headerTitle, setHeaderTitle] = useState("Status Report Generator");

  return (
    <main className="min-h-screen">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="max-w-[900px] mx-auto px-4 py-3">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {headerTitle}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create polished, executive-ready status reports with real-time preview
          </p>
        </div>
      </header>

      <StatusForm onTitleChange={setHeaderTitle} />
    </main>
  );
}
