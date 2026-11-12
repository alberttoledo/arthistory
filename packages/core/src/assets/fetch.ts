import fs from "node:fs";

export const USER_AGENT = "ContentFactory/0.1 (local video tool; contact toledoalbert@gmail.com)";

export async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as T;
}

export async function download(url: string, file: string) {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT } });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
}
