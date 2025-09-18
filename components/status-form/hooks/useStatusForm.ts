// components/status-form/hooks/useStatusForm.ts
"use client";

// Re-export the hook from the provider so both import styles work:
//
//   import useStatusForm from "@/components/status-form/hooks/useStatusForm";
//   import { useStatusForm } from "@/components/status-form/hooks/useStatusForm";
//
export { useStatusForm } from "../context";

// Also provide a default export that points to the same hook
import { useStatusForm as _useStatusForm } from "../context";
export default _useStatusForm;

