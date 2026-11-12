import { Queue } from "./Queue";

export default function QueuePage() {
  return (
    <>
      <header className="page-head">
        <div><h1>Render queue</h1><p className="muted">Jobs run one at a time on this computer. The list resets when the Studio restarts.</p></div>
      </header>
      <Queue />
    </>
  );
}
