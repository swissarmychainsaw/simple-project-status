"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useStatusFormCtx } from "../context";

export default function ActionsBar() {
  const { toast } = useToast();
  const { generate, emailReport, generatedHtml, isGenerating, isEmailing } = useStatusFormCtx();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={async () => {
              await generate();
              toast({ title: "HTML generated", description: "Preview updated." });
            }}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating…" : "Generate HTML"}
          </Button>
          <Button
            onClick={() => {
              if (!generatedHtml) {
                toast({ title: "Nothing to copy", description: "Generate HTML first." });
                return;
              }
              navigator.clipboard
                .writeText(generatedHtml)
                .then(() => toast({ title: "Copied", description: "HTML copied to clipboard." }))
                .catch(() =>
                  toast({
                    title: "Copy failed",
                    description: "Couldn’t access clipboard.",
                    variant: "destructive",
                  })
                );
            }}
            variant="outline"
          >
            Copy HTML
          </Button>
          <Button
            onClick={async () => {
              try {
                await emailReport();
                toast({ title: "Email sent" });
              } catch (e: any) {
                toast({ title: "Email failed", description: e?.message || "Unknown error", variant: "destructive" });
              }
            }}
            disabled={isEmailing}
            variant="default"
          >
            {isEmailing ? "Sending…" : "Email me this report"}
          </Button>
        </div>

        {generatedHtml ? (
          <Textarea value={generatedHtml} readOnly className="bg-white font-mono text-xs h-64" />
        ) : null}
      </CardContent>
    </Card>
  );
}

