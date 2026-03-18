export function Input({ label, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">{label}</span>}
      <input
        {...props}
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100
          placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors font-mono"
      />
    </label>
  );
}

export function Textarea({ label, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">{label}</span>}
      <textarea
        {...props}
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100
          placeholder-zinc-600 focus:outline-none focus:border-sky-500 transition-colors font-mono resize-none"
      />
    </label>
  );
}

export function Select({ label, children, ...props }) {
  return (
    <label className="block">
      {label && <span className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">{label}</span>}
      <select
        {...props}
        className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100
          focus:outline-none focus:border-sky-500 transition-colors font-mono"
      >
        {children}
      </select>
    </label>
  );
}

export function Btn({ variant = "primary", className = "", ...props }) {
  const base = "inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-mono font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-sky-600 hover:bg-sky-500 text-white",
    danger:  "bg-red-600/80 hover:bg-red-500 text-white",
    ghost:   "bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700",
    success: "bg-emerald-600 hover:bg-emerald-500 text-white",
  };
  return <button {...props} className={`${base} ${variants[variant] ?? variants.primary} ${className}`} />;
}

export function ErrorMsg({ msg }) {
  if (!msg) return null;
  return (
    <div className="bg-red-500/10 border border-red-500/30 rounded px-4 py-2 text-red-400 text-sm font-mono">
      ⚠ {msg}
    </div>
  );
}
