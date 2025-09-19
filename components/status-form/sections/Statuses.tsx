// components/status-form/sections/Statuses.tsx
import React from "react";
import { useStatusForm } from "../context";

const STATUS_OPTIONS = ["Green", "Yellow", "Red"];

const Select: React.FC<{
  id: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ id, value, onChange }) => (
  <div className="relative">
    <select
      id={id}
      className="w-full rounded-md border bg-white px-3 py-2 text-sm appearance-none pr-8"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {STATUS_OPTIONS.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-500">▾</span>
  </div>
);

const Statuses: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};

  const write = (patch: Record<string, any>) => {
    if (typeof ctx?.updateFormData === "function") {
      Object.entries(patch).forEach(([k, v]) => ctx.updateFormData(k, v));
      return;
    }
    if (typeof ctx?.setFormData === "function") {
      ctx.setFormData((p: any) => ({ ...(p || {}), ...patch }));
      return;
    }
    if (typeof ctx?.setState === "function") {
      ctx.setState((p: any) => ({ ...(p || {}), formData: { ...(p?.formData || {}), ...patch } }));
      return;
    }
  };

  return (
    <section className="bg-gray-50 rounded-xl border p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Date */}
        <div>
          <label htmlFor="date" className="text-sm font-medium block mb-2">
            Date
          </label>
          <input
            id="date"
            type="date"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            value={(fd.date as string) ?? ""}
            onChange={(e) => write({ date: e.target.value })}
          />
        </div>

        {/* Last Status */}
        <div>
          <label htmlFor="statusLast" className="text-sm font-medium block mb-2">
            Last Status
          </label>
          <Select
            id="statusLast"
            value={(fd.statusLast as string) ?? "Green"}
            onChange={(v) => write({ statusLast: v })}
          />
        </div>

        {/* Current Status */}
        <div>
          <label htmlFor="statusCurrent" className="text-sm font-medium block mb-2">
            Current Status
          </label>
          <Select
            id="statusCurrent"
            value={(fd.statusCurrent as string) ?? "Green"}
            onChange={(v) => write({ statusCurrent: v })}
          />
        </div>

        {/* Trending */}
        <div>
          <label htmlFor="statusTrending" className="text-sm font-medium block mb-2">
            Trending
          </label>
          <Select
            id="statusTrending"
            value={(fd.statusTrending as string) ?? "Green"}
            onChange={(v) => write({ statusTrending: v })}
          />
        </div>
      </div>
    </section>
  );
};

export default Statuses;

