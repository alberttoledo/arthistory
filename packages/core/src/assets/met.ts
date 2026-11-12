import { getJson } from "./fetch.ts";
import type { SourceHit } from "./index.ts";

interface MetObject {
  objectID: number;
  title: string;
  artistDisplayName: string;
  objectDate: string;
  isPublicDomain: boolean;
  primaryImage: string;
  objectURL: string;
}

const BASE = "https://collectionapi.metmuseum.org/public/collection/v1";

/** `ref` is a Met object id. Only public-domain objects are allowed. */
export async function met(ref: string): Promise<SourceHit> {
  const obj = await getJson<MetObject>(`${BASE}/objects/${ref}`);
  if (!obj.isPublicDomain || !obj.primaryImage) throw new Error(`Met ${ref} has no public-domain image`);
  return {
    url: obj.primaryImage,
    credit: [obj.title, obj.artistDisplayName, obj.objectDate, "The Metropolitan Museum of Art (Public Domain)"]
      .filter(Boolean).join(" — "),
    pageUrl: obj.objectURL,
  };
}

export async function searchMet(query: string, limit = 10): Promise<MetObject[]> {
  const s = await getJson<{ objectIDs: number[] | null }>(
    `${BASE}/search?hasImages=true&isPublicDomain=true&q=${encodeURIComponent(query)}`,
  );
  const ids = (s.objectIDs ?? []).slice(0, limit);
  return Promise.all(ids.map((id) => getJson<MetObject>(`${BASE}/objects/${id}`)));
}
