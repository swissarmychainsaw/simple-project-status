// components/status-form/hooks/useStatusForm.ts
"use client";

// Re-export the hook from the provider so both import styles work:
//
//   import useStatusForm from "@/components/status-form/hooks/useStatusForm";
//   import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";
//

// Also provide a default export that points to the same hook
import { useStatusForm as _useStatusForm } from "../context";
export default _useStatusForm;
// components/status-form/hooks/useStatusForm.ts
export { useStatusForm } from "../context";
export { StatusFormProvider } from "../context";


