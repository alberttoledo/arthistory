import type { EpisodeStatus } from "@cf/core/schemas.ts";

export const STATUS_LABEL: Record<EpisodeStatus, string> = {
  idea: "Idea", scripted: "Scripted", voiced: "Voiced", planned: "Planned",
  rendered: "Rendered", approved: "Approved", posted: "Posted",
};

export const STATUS_COLOR: Record<EpisodeStatus, string> = {
  idea: "#b7bfcb", scripted: "#8d9bb3", voiced: "#6f86ad", planned: "#4f6fae",
  rendered: "#c18a1d", approved: "#2f8f5f", posted: "#18202e",
};
