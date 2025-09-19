// components/status-form/sections/People.tsx
"use client";
import React from "react";
import { useStatusForm } from "../context";
import { commitFormPatch } from "@/lib/status-form/commit";

const People: React.FC = () => {
  const ctx = useStatusForm() as any;
  const fd = (ctx?.formData as any) ?? {};
  const write = (patch: Record<string, any>) => commitFormPatch(ctx, patch);

  return (
    <section className="bg-gray-50 rounded-xl border p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div>
          <label htmlFor="tpm" className="text-sm font-medium block mb-2">TPM</label>
          <input
            id="tpm" type="text"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            value={(fd.tpm as string) ?? ""}
            onChange={(e) => write({ tpm: e.target.value })}
          />
        </div>

        <div>
          <label htmlFor="engDri" className="text-sm font-medium block mb-2">Engineering DRI</label>
          <input
            id="engDri" type="text"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            value={(fd.engDri as string) ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              // keep both in sync so readers of either key see it
              write({ engDri: v, engineeringDri: v });
            }}
          />
        </div>

        <div>
          <label htmlFor="businessSponsor" className="text-sm font-medium block mb-2">Business Sponsor</label>
          <input
            id="businessSponsor" type="text"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            value={(fd.businessSponsor as string) ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              write({ businessSponsor: v, bizSponsor: v });
            }}
          />
        </div>

        <div>
          <label htmlFor="engineeringSponsor" className="text-sm font-medium block mb-2">Engineering Sponsor</label>
          <input
            id="engineeringSponsor" type="text"
            className="w-full rounded-md border bg-white px-3 py-2 text-sm"
            value={(fd.engineeringSponsor as string) ?? ""}
            onChange={(e) => {
              const v = e.target.value;
              write({ engineeringSponsor: v, engSponsor: v });
            }}
          />
        </div>
      </div>
    </section>
  );
};

export default People;

