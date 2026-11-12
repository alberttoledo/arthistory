import type { EpisodeStatus } from "@cf/core/schemas.ts";
import { STATUS_COLOR, STATUS_LABEL } from "@/lib/status";

export function StatusDot({ status }: { status: EpisodeStatus }) {
  return (
    <span className="status" style={{ ["--s" as string]: STATUS_COLOR[status] }}>
      <i aria-hidden />{STATUS_LABEL[status]}
    </span>
  );
}
