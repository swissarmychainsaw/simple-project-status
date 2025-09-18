"use client";

import React from "react";
import RichSection from "./RichSection";

export default function Resources() {
  return (
    <RichSection
      label="Additional Resources"
      titleKey="resourcesTitle"
      subtitleKey="resourcesSectionTitle"
      htmlKey="resourcesHtml"
      titlePlaceholder="Additional Resources"
      subtitlePlaceholder="Links, docs, references, owners, etc."
      htmlPlaceholder='<ul><li><a href="https://…">Spec</a></li><li>Runbook …</li></ul>'
    />
  );
}

