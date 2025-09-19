import React from "react";
import ProjectPills from "./ProjectPills";

const BasicsCard: React.FC = () => {
  return (
    <section className="bg-white rounded-xl shadow-sm border p-6 space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Projects</h2>
      </header>

      {/* Project selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select:</label>
        <ProjectPills />
      </div>
    </section>
  );
};

export default BasicsCard;

