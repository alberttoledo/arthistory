import type { PieceStatus } from "@/lib/status";
import { fmtShort } from "@/lib/time";

export function StatusChip({ s }: { s: PieceStatus }) {
  const label = s.state === "none" ? "Not made" : s.state === "draft" ? "Draft" : s.state === "final" ? "Final"
    : s.state === "scheduled" ? fmtShort(s.at!) : "Published";
  return (
    <span className={`chip chip-${s.state}`}>
      {label}{s.state === "final" && !s.confirmed && <i title="Claude's guess, waiting for you to confirm"> · unconfirmed</i>}
    </span>
  );
}
