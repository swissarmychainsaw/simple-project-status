"use client";

import React from "react";

/** A small card that just surfaces the Google Doc template link. */
export default function ImportsCard() {
  return (
    <section className="bg-white rounded-xl shadow-sm border p-6">
      <header className="flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">Import Google Doc</h2>
        <a
          href="https://docs.google.com/document/u/2/d/11MCIp3uURs0nife0qkgnYkGOoLbf9WZIeAw6GtjNZW4/copy?tab=t.0"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-300"
        >
          Use this Google Doc Template
        </a>
      </header>
      <p className="mt-3 text-sm text-gray-600">
        Make a copy of the template, add your content, then use the importer to pull sections into this form.
      </p>
    </section>
  );
}

