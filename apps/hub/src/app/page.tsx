import { Board } from "@/components/Board";
import { DEFAULT_CHANNEL, getChannel } from "@/lib/data";

export default function Home() {
  const ch = getChannel(DEFAULT_CHANNEL)!;
  return <><div className="pagehead"><h2>{ch.name} <em>rollouts</em></h2><p className="mono muted">Teaser → film → carousel · times in {ch.timezone}</p></div><Board channel={ch} /></>;
}
