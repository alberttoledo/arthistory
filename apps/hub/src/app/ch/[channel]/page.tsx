import { notFound } from "next/navigation";
import { Board } from "@/components/Board";
import { getChannel, getChannels } from "@/lib/data";

export const dynamicParams = false;
export const generateStaticParams = () => getChannels().map((c) => ({ channel: c.slug }));
export async function generateMetadata({ params }: { params: Promise<{ channel: string }> }) {
  return { title: getChannel((await params).channel)?.name ?? "Channel" };
}

export default async function ChannelPage({ params }: { params: Promise<{ channel: string }> }) {
  const ch = getChannel((await params).channel);
  if (!ch) notFound();
  return <><div className="pagehead"><h2>{ch.name} <em>rollouts</em></h2><p className="mono muted">Teaser → film → carousel · times in {ch.timezone}</p></div><Board channel={ch} /></>;
}
