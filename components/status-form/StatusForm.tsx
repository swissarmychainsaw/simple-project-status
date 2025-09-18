import React from "react";
import { useStatusForm } from "./context"; // your provider accessor
import BasicsCard from "./sections/BasicsCard";
import ExecSummary from "./sections/ExecSummary";
import Highlights from "./sections/Highlights";
import Milestones from "./sections/Milestones";
import KeyDecisions from "./sections/KeyDecisions";
import Risks from "./sections/Risks";
import Resources from "./sections/Resources";
import ActionsBar from "./sections/ActionsBar";
import { themeFor } from "./theme";
import type { BannerKey } from "./theme";

/**
 * Thin composition + project theming.
 * - Reads designOptions.optProjectId (BannerKey)
 * - Applies background + header tint and subtle card border accents
 */
const StatusForm: React.FC = () => {
  const ctx = useStatusForm() as any;
  const optProjectId = (ctx?.designOptions?.optProjectId as BannerKey | undefined) ?? null;
  const t = themeFor(optProjectId);

  return (
    <div className={`min-h-screen ${t.containerBg} py-8`}>
      {/* Header */}
      <header className={`${t.headerBg} ${t.headerText} shadow-sm`}>
        <div className="mx-auto max-w-5xl px-4 py-4">
          <h1 className="text-xl font-semibold">Status Report Builder</h1>
          {optProjectId ? (
            <p className="text-sm opacity-90 mt-1">
              Project theme active
            </p>
          ) : null}
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-5xl px-4 mt-6 space-y-6">
        {/* You can pass theme classes down if you want per-card accents */}
        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-0">
            <BasicsCard />
          </div>
        </section>

        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-6">
            <ExecSummary />
          </div>
        </section>

        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-6">
            <Highlights />
          </div>
        </section>

        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-6">
            <Milestones />
          </div>
        </section>

        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-6">
            <KeyDecisions />
          </div>
        </section>

        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-6">
            <Risks />
          </div>
        </section>

        <section className={`rounded-xl border ${t.cardBorder} bg-white shadow-sm`}>
          <div className="p-6">
            <Resources />
          </div>
        </section>

        <ActionsBar />
      </main>
    </div>
  );
};

export default StatusForm;

