"use client";
import React from "react";
import { useStatusForm } from "../context";
import { commitFormPatch } from "@/lib/status-form/commit";

const STATUS_OPTIONS = ["Green", "Yellow", "Red"];

const L = {
  label: "text-sm font-medium block mb-2",
  input: "w-full rounded-md border bg-white px-3 py-2 text-sm",
  selectWrap: "relative",
  select: "w-full rounded-md border bg-white px-3 py-2 text-sm appearance-none pr-8",
  caret: "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500",
};

const StatusAndPeopleCard: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const write = (patch: Record<string, any>) => commitFormPatch(ctx, patch);

  // keep alias keys in sync for your email builder
  const setEngDri     = (v: string) => write({ engineeringDri: v, engDri: v });
  const setBizSponsor = (v: string) => write({ businessSponsor: v, bizSponsor: v });
  const setEngSponsor = (v: string) => write({ engineeringSponsor: v, engSponsor: v });

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header>
        <h2 className="text-lg font-semibold">Status &amp; Team</h2>
      </header>

      {/* Row 1: Date + Statuses */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label htmlFor="date" className={L.label}>Date</label>
          <input
            id="date"
            type="date"
            className={L.input}
            value={(fd.date as string) ?? ""}
            onChange={(e) => write({ date: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="statusLast" className={L.label}>Last Status</label>
          <div className={L.selectWrap}>
            <select
              id="statusLast"
              className={L.select}
              value={(fd.statusLast as string) ?? "Green"}
              onChange={(e) => write({ statusLast: e.target.value })}
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <span className={L.caret}>▾</span>
          </div>
        </div>

        <div>
          <label htmlFor="statusCurrent" className={L.label}>Current Status</label>
          <div className={L.selectWrap}>
            <select
              id="statusCurrent"
              className={L.select}
              value={(fd.statusCurrent as string) ?? "Green"}
              onChange={(e) => write({ statusCurrent: e.target.value })}
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <span className={L.caret}>▾</span>
          </div>
        </div>

        <div>
          <label htmlFor="statusTrending" className={L.label}>Trending</label>
          <div className={L.selectWrap}>
            <select
              id="statusTrending"
              className={L.select}
              value={(fd.statusTrending as string) ?? "Green"}
              onChange={(e) => write({ statusTrending: e.target.value })}
            >
              {STATUS_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <span className={L.caret}>▾</span>
          </div>
        </div>
      </div>

      {/* Row 2: People */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">TPM</label>
          <input
            className={L.input}
            value={fd?.tpm ?? ""}
            onChange={(e) => write({ tpm: e.target.value })}
            placeholder="TPM name(s)"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Engineering DRI</label>
          <input
            className={L.input}
            value={fd?.engineeringDri ?? fd?.engDri ?? ""}
            onChange={(e) => setEngDri(e.target.value)}
            placeholder="Engineering DRI"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Business Sponsor</label>
          <input
            className={L.input}
            value={fd?.businessSponsor ?? fd?.bizSponsor ?? ""}
            onChange={(e) => setBizSponsor(e.target.value)}
            placeholder="Business Sponsor"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-sm font-medium text-slate-700">Engineering Sponsor</label>
          <input
            className={L.input}
            value={fd?.engineeringSponsor ?? fd?.engSponsor ?? ""}
            onChange={(e) => setEngSponsor(e.target.value)}
            placeholder="Engineering Sponsor"
          />
        </div>
      </div>
    </section>
  );
};

export default StatusAndPeopleCard;
