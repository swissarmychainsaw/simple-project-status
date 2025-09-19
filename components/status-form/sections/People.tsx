"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import useStatusForm from "@/components/status-form/hooks/useStatusForm";

/**
 * Compact "People" card shown under the Control Panel.
 * Uses the status-form context's read/write helpers so we don't touch form wiring.
 */
const People: React.FC = () => {
  const { formData, write } = useStatusForm();

  const setVal = (key: string, v: string) => write(key, v);

  // keep both keys in sync for compatibility with email builder
  const setEngDri = (v: string) => {
    write("engineeringDri", v);
    write("engDri", v);
  };

  const setBizSponsor = (v: string) => {
    write("businessSponsor", v);
    write("bizSponsor", v);
  };

  const setEngSponsor = (v: string) => {
    write("engineeringSponsor", v);
    write("engSponsor", v);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Team</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">TPM</label>
            <Input
              value={formData?.tpm ?? ""}
              onChange={(e) => setVal("tpm", e.target.value)}
              placeholder="TPM name(s)"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Engineering DRI</label>
            <Input
              value={formData?.engineeringDri ?? formData?.engDri ?? ""}
              onChange={(e) => setEngDri(e.target.value)}
              placeholder="Engineering DRI"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Business Sponsor</label>
            <Input
              value={formData?.businessSponsor ?? formData?.bizSponsor ?? ""}
              onChange={(e) => setBizSponsor(e.target.value)}
              placeholder="Business Sponsor"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Engineering Sponsor</label>
            <Input
              value={formData?.engineeringSponsor ?? formData?.engSponsor ?? ""}
              onChange={(e) => setEngSponsor(e.target.value)}
              placeholder="Engineering Sponsor"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default People;

