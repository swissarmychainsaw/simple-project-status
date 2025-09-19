// components/status-form/sections/AdditionalResources.tsx
import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type AdditionalResourcesProps = {
  links?: { href: string; label?: string }[];
};

export default function AdditionalResources({ links = [] }: AdditionalResourcesProps) {
  return (
    <div className="mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Additional Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {links.map((l, i) => (
              <li key={i}>
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:no-underline"
                >
                  {l.label ?? l.href}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

