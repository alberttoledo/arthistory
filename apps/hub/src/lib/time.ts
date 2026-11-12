// Post times are wall-clock strings in the channel timezone ("2026-11-20T18:00").
// We never convert them: parse as UTC and format as UTC so every viewer sees the same day and hour.
const parse = (at: string) => {
  const [d, t] = at.split("T"); const [y, m, day] = d.split("-").map(Number); const [h, mi] = t.split(":").map(Number);
  return new Date(Date.UTC(y, m - 1, day, h, mi));
};
const fmt = (at: string, o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...o, timeZone: "UTC" }).format(parse(at));
export const fmtShort = (at: string) => fmt(at, { weekday: "short", day: "numeric", month: "short" }) + " · " + at.slice(11, 16);
export const fmtLong = (at: string) => fmt(at, { weekday: "long", day: "numeric", month: "long", year: "numeric" }) + " · " + at.slice(11, 16);
export const dayKey = (at: string) => at.slice(0, 10);
