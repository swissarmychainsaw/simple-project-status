// components/status-form/PageChrome.tsx
import React from "react";

export default function PageChrome({
  bannerKey,
  children,
}: {
  bannerKey?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen bg-gray-50 py-8 project-tint"
      data-project={bannerKey}
    >
      <div className="max-w-[900px] mx-auto px-4">
        <div aria-hidden className="tint-bar" />
        {children}
      </div>
    </div>
  );
}

