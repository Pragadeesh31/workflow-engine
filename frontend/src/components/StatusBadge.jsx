export function StatusBadge({ status }) {
  const styles = {
    completed:   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    in_progress: "bg-sky-500/15     text-sky-400     border-sky-500/30",
    pending:     "bg-amber-500/15   text-amber-400   border-amber-500/30",
    failed:      "bg-red-500/15     text-red-400     border-red-500/30",
    canceled:    "bg-zinc-500/15    text-zinc-400    border-zinc-500/30",
    rejected:    "bg-orange-500/15  text-orange-400  border-orange-500/30",
  };
  const cls = styles[status] ?? "bg-zinc-500/15 text-zinc-400 border-zinc-500/30";
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-xs font-mono uppercase tracking-wider ${cls}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {status ?? "unknown"}
    </span>
  );
}
