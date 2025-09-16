// app/listen/page.tsx
export default function ListenPage({ searchParams }: { searchParams: { src?: string } }) {
  const raw = typeof searchParams?.src === "string" ? decodeURIComponent(searchParams.src) : "";
  const isSharePoint = raw.includes(".sharepoint.com");
  const src = isSharePoint
    ? raw.includes("/_layouts/15/stream.aspx")
      ? raw
      : raw.replace("/_layouts/15/download.aspx?sourceurl=", "/_layouts/15/stream.aspx?id=")
    : raw;

  if (!src) return <div style={{ padding: 24 }}>Missing audio source.</div>;

  return (
    <div style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>Listen to this report</h1>
      {isSharePoint ? (
        <iframe src={src} title="Audio Player" width="100%" height="80" style={{ border: 0, overflow: "hidden" }} allow="autoplay" />
      ) : (
        <audio controls src={src} style={{ width: "100%", height: 32 }} />
      )}
    </div>
  );
}

