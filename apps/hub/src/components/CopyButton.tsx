"use client";
import { useState } from "react";

export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [state, setState] = useState(label);
  return (
    <button className={`copybtn mono${state === "Copied" ? " ok" : ""}`} onClick={async () => {
      try { await navigator.clipboard.writeText(text); setState("Copied"); } catch { setState("Select & copy"); }
      setTimeout(() => setState(label), 1400);
    }}>{state}</button>
  );
}
