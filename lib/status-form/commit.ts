// lib/status-form/commit.ts
export function commitFormPatch(ctx: any, patch: Record<string, any>) {
  if (!ctx || !patch) return;
  if (typeof ctx.setFormData === "function") {
    ctx.setFormData((prev: any) => ({ ...(prev || {}), ...patch }));
    return;
  }
  if (typeof ctx.updateFormData === "function") {
    for (const [k, v] of Object.entries(patch)) ctx.updateFormData(k, v);
    return;
  }
  if (typeof ctx.setState === "function") {
    ctx.setState((prev: any) => ({
      ...(prev || {}),
      formData: { ...(prev?.formData || {}), ...patch },
    }));
  }
}

