import { useState, useEffect } from "react";
import { WorkflowsPage } from "./pages/WorkflowsPage";
import { StepsPage } from "./pages/StepsPage";
import { ExecutionsPage } from "./pages/ExecutionsPage";
import { api } from "./api";

const NAV = [
  { id: "workflows",  label: "Workflows",  icon: "⬡" },
  { id: "executions", label: "Executions", icon: "◎" },
];

export default function App() {
  const [tab, setTab]         = useState("workflows");
  const [stepsFor, setStepsFor] = useState(null);
  const [health, setHealth]   = useState(null);

  useEffect(() => {
    api.health().then(() => setHealth(true)).catch(() => setHealth(false));
  }, []);

  function handleViewSteps(wf) { setStepsFor(wf); setTab("steps"); }
  function handleBack()        { setStepsFor(null); setTab("workflows"); }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 bg-zinc-900 border-r border-zinc-800 flex flex-col">
        <div className="px-5 py-5 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-sky-500 rounded flex items-center justify-center text-xs font-bold text-white">W</div>
            <div>
              <p className="text-xs font-mono font-bold text-zinc-100 uppercase tracking-widest">Workflow</p>
              <p className="text-xs font-mono text-zinc-500 leading-none">Engine</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(n => (
            <button key={n.id}
              onClick={() => { setTab(n.id); if (n.id === "workflows") setStepsFor(null); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm font-mono transition-colors text-left
                ${(tab === n.id || (n.id === "workflows" && tab === "steps"))
                  ? "bg-sky-500/15 text-sky-400 border border-sky-500/25"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent"}`}>
              <span className="text-base leading-none">{n.icon}</span>
              {n.label}
            </button>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-zinc-800">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              health === null ? "bg-zinc-600 animate-pulse" :
              health          ? "bg-emerald-400" : "bg-red-400"}`} />
            <span className="text-xs font-mono text-zinc-500">
              {health === null ? "Connecting…" : health ? "API Online" : "API Offline"}
            </span>
          </div>
          {health === false && (
            <p className="text-xs font-mono text-zinc-600 mt-1">Check backend at :8000</p>
          )}
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {tab === "workflows"  && <WorkflowsPage onViewSteps={handleViewSteps} />}
          {tab === "steps"      && stepsFor && <StepsPage workflow={stepsFor} onBack={handleBack} />}
          {tab === "executions" && <ExecutionsPage />}
        </div>
      </main>
    </div>
  );
}
