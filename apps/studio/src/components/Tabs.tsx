"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Tabs whose selection lives in ?tab= so links and reloads keep the place. */
export function Tabs({ tabs, initial }: { tabs: { id: string; label: string; panel: React.ReactNode }[]; initial?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [active, setActive] = useState(params.get("tab") ?? initial ?? tabs[0].id);
  const select = (id: string) => {
    setActive(id);
    const q = new URLSearchParams(params);
    q.set("tab", id);
    router.replace(`${pathname}?${q}`, { scroll: false });
  };
  return (
    <>
      <div className="tabs" role="tablist">
        {tabs.map((t) => <button key={t.id} role="tab" aria-selected={active === t.id} onClick={() => select(t.id)}>{t.label}</button>)}
      </div>
      {tabs.map((t) => <div key={t.id} role="tabpanel" hidden={active !== t.id}>{t.panel}</div>)}
    </>
  );
}
