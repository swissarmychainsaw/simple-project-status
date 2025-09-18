"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useStatusFormCtx } from "../context";
import { BANNER_LABELS, PROJECT_KEYS, type BannerKey } from "@/components/status-form/projectProfiles";

export default function BasicsCard() {
  const { formData, update, designOptions, updateDesign } = useStatusFormCtx();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Project</label>
          <select
            className="mt-1 block w-full border rounded-md px-3 py-2 bg-white"
            value={designOptions.optBannerId as string}
            onChange={(e) => updateDesign("optBannerId", e.target.value as BannerKey)}
          >
            {PROJECT_KEYS.map((k) => (
              <option key={k} value={k}>
                {BANNER_LABELS[k]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Program / Project Title</label>
          <Input
            value={formData.programTitle}
            onChange={(e) => update("programTitle", e.target.value)}
            placeholder="e.g., Global Network Services"
            className="bg-white mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Program Summary</label>
          <Textarea
            rows={6}
            value={formData.programSummary}
            onChange={(e) => update("programSummary", e.target.value)}
            className="bg-white mt-1 resize-y"
            placeholder="Short description of the program…"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Date</label>
          <Input
            type="date"
            value={formData.asOf}
            onChange={(e) => update("asOf", e.target.value)}
            className="bg-white mt-1"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Email To</label>
          <Input
            value={formData.emailTo}
            onChange={(e) => update("emailTo", e.target.value)}
            placeholder="you@example.com"
            className="bg-white mt-1"
          />
        </div>
      </CardContent>
    </Card>
  );
}

