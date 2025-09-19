// components/status-form/sections/BasicsCard.tsx
import React from "react";
import ProjectPills from "./ProjectPills";
import Statuses from "./Statuses";
import People from "./People";
import { BANNER_LABELS } from "./labels"; // keep available if other bits need it later

const BasicsCard: React.FC = () => {
  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Basics</h2>
      </header>

      {/* Project selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Project</label>
        <ProjectPills />
      </div>

      {/* Status block (Date, Last, Current, Trending) */}
      <Statuses />

      {/* People block (TPM, Eng DRI, Sponsors) */}
      <People />
    </section>
  );
};

export default BasicsCard;

