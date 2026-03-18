import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { Btn, ErrorMsg, Input } from "../components/Form";

// ── Execution logs modal ──────────────────────────────────────────────────────

function LogsModal({ executionId, onClose }) {
  const [logs, setLogs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr]         = useState("");

  useEffect(() => {
    api.getExecutionLogs(executionId)
      .then(setLogs)
      .catch(e => setErr(e.message))
      .finally(() => setLoading(false));
  }, [executionId]);

  function duration(start, end) {
    if (!start || !end) return null;
    const ms = new Date(end) - new Date(start);
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  }

  return (
    <div>
      <ErrorMsg msg={err} />
      {loading ? (
        <p className="text-zinc-600 text-sm font-mono py-8 text-center">Loading…</p>
      ) : logs.length === 0 ? (
        <p className="text-zinc-600 text-sm font-mono py-8 text-center">No logs</p>
      ) : (
        <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
          {logs.map((log, i) => (
            <div key={log.id} className="bg-zinc-800/60 border border-zinc-700 rounded-lg p-4">
              {/* Header row */}
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="text-xs font-mono text-zinc-500">#{i + 1}</span>
                <StatusBadge status={log.status} />
                <span className="text-sm font-medium text-zinc-200">{log.step_name}</span>
                <span className={`text-xs font-mono px-1.5 py-0.5 rounded border ${
                  log.step_type === "approval"
                    ? "text-amber-400 border-amber-500/30 bg-amber-500/10"
                    : log.step_type === "notification"
                    ? "text-sky-400 border-sky-500/30 bg-sky-500/10"
                    : "text-zinc-400 border-zinc-600 bg-zinc-800"
                }`}>{log.step_type}</span>
                {log.attempt > 1 && (
                  <span className="text-xs font-mono text-orange-400 border border-orange-500/30 bg-orange-500/10 px-1.5 py-0.5 rounded">
                    attempt #{log.attempt}
                  </span>
                )}
              </div>

              {/* Error */}
              {log.error_message && (
                <p className="text-xs font-mono text-red-400 bg-red-500/10 border border-red-500/20 rounded px-3 py-2 mb-2">
                  {log.error_message}
                </p>
              )}

              {/* Approver */}
              {log.approver_id && (
                <p className="text-xs font-mono text-zinc-500 mb-1">
                  Approver: <span className="text-zinc-300">{log.approver_id}</span>
                </p>
              )}

              {/* Next step */}
              {log.selected_next_step && (
                <p className="text-xs font-mono text-zinc-500 mb-2">
                  → <span className="text-sky-400">{log.selected_next_step}</span>
                </p>
              )}

              {/* Rule evaluations */}
              {log.evaluated_rules && log.evaluated_rules.length > 0 && (
                <details className="mb-2">
                  <summary className="text-xs font-mono text-zinc-500 cursor-pointer hover:text-zinc-300 select-none">
                    Rule evaluations ({log.evaluated_rules.length})
                  </summary>
                  <div className="mt-2 space-y-1">
                    {log.evaluated_rules.map((r, ri) => (
                      <div key={ri} className={`flex items-start gap-2 text-xs font-mono px-2 py-1 rounded ${
                        r.matched ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-900 text-zinc-500"}`}>
                        <span className="shrink-0">{r.matched ? "✓" : "✗"}</span>
                        <span className="break-all">{r.condition}</span>
                        {r.error && <span className="text-red-400 ml-auto shrink-0">err</span>}
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Timing */}
              <div className="flex gap-4 mt-1 flex-wrap">
                {log.started_at && (
                  <span className="text-xs font-mono text-zinc-600">
                    started {new Date(log.started_at).toLocaleTimeString()}
                  </span>
                )}
                {log.ended_at && (
                  <span className="text-xs font-mono text-zinc-600">
                    ended {new Date(log.ended_at).toLocaleTimeString()}
                  </span>
                )}
                {duration(log.started_at, log.ended_at) && (
                  <span className="text-xs font-mono text-zinc-600">
                    duration {duration(log.started_at, log.ended_at)}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-end mt-4">
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
      </div>
    </div>
  );
}

// ── Approve modal ─────────────────────────────────────────────────────────────

function ApproveModal({ execution, onClose, onDone }) {
  const [approverId, setApproverId] = useState("");
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState("");

  async function handle(approved) {
    setLoading(true); setErr("");
    try {
      await api.approveExecution(execution.id, { approver_id: approverId || undefined, approved });
      onDone();
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-zinc-400 text-sm font-mono">
        Execution <span className="text-sky-400 text-xs break-all">{execution.id}</span>
        {" "}is awaiting approval at the current step.
      </p>
      <Input label="Approver ID (optional)" value={approverId}
        onChange={e => setApproverId(e.target.value)} placeholder="user@example.com" />
      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="ghost"   onClick={onClose}>Cancel</Btn>
        <Btn variant="danger"  onClick={() => handle(false)} disabled={loading}>✕ Reject</Btn>
        <Btn variant="success" onClick={() => handle(true)}  disabled={loading}>✓ Approve</Btn>
      </div>
    </div>
  );
}

// ── Executions page ───────────────────────────────────────────────────────────

export function ExecutionsPage() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [err, setErr]               = useState("");
  const [modal, setModal]           = useState(null);
  const [filter, setFilter]         = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    try { setExecutions(await api.getExecutions()); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleCancel(id) {
    if (!confirm("Cancel this execution?")) return;
    try { await api.cancelExecution(id); load(); }
    catch (e) { alert(e.message); }
  }

  async function handleRetry(id) {
    try { await api.retryExecution(id); load(); }
    catch (e) { alert(e.message); }
  }

  const STATUS_FILTERS = ["all", "in_progress", "pending", "completed", "failed", "canceled"];
  const filtered = filter === "all" ? executions : executions.filter(e => e.status === filter);

  function fmt(ts) { return ts ? new Date(ts).toLocaleString() : "—"; }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">Executions</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{filtered.length} of {executions.length} total</p>
        </div>
        <Btn variant="ghost" onClick={load}>↻ Refresh</Btn>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-5 flex-wrap">
        {STATUS_FILTERS.map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              filter === s
                ? "bg-sky-500/20 text-sky-400 border-sky-500/40"
                : "bg-zinc-800 text-zinc-500 border-zinc-700 hover:text-zinc-300"}`}>
            {s}
          </button>
        ))}
      </div>

      <ErrorMsg msg={err} />

      {loading ? (
        <div className="text-zinc-600 font-mono text-sm py-20 text-center">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <div className="text-4xl mb-3">◎</div>
          <p className="font-mono text-sm">No executions {filter !== "all" ? `with status "${filter}"` : "yet"}</p>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                {["ID", "Workflow", "Version", "Status", "Triggered By", "Start Time", "End Time", "Actions"].map(h => (
                  <th key={h} className="text-left px-3 py-3 text-xs font-mono text-zinc-500 uppercase tracking-widest whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((ex, i) => (
                <tr key={ex.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-3 py-3 font-mono text-xs text-zinc-500 max-w-[120px] truncate" title={ex.id}>{ex.id.slice(0, 8)}…</td>
                  <td className="px-3 py-3 font-mono text-xs text-zinc-300 max-w-[140px] truncate" title={ex.workflow_id}>{ex.workflow_id.slice(0, 8)}…</td>
                  <td className="px-3 py-3 font-mono text-xs text-zinc-400">v{ex.workflow_version}</td>
                  <td className="px-3 py-3"><StatusBadge status={ex.status} /></td>
                  <td className="px-3 py-3 text-zinc-400 text-xs font-mono">{ex.triggered_by ?? "—"}</td>
                  <td className="px-3 py-3 text-zinc-500 text-xs font-mono whitespace-nowrap">{fmt(ex.started_at)}</td>
                  <td className="px-3 py-3 text-zinc-500 text-xs font-mono whitespace-nowrap">{fmt(ex.ended_at)}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      <Btn variant="ghost"   className="!px-2 !py-1 text-xs" onClick={() => setModal({ logs: ex.id })}>Logs</Btn>
                      {ex.status === "pending" && (
                        <Btn variant="success" className="!px-2 !py-1 text-xs" onClick={() => setModal({ approve: ex })}>Approve</Btn>
                      )}
                      {ex.status === "failed" && (
                        <Btn variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => handleRetry(ex.id)}>Retry</Btn>
                      )}
                      {["in_progress", "pending"].includes(ex.status) && (
                        <Btn variant="danger" className="!px-2 !py-1 text-xs" onClick={() => handleCancel(ex.id)}>Cancel</Btn>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal?.logs && (
        <Modal title="Execution Logs" onClose={() => setModal(null)} wide>
          <LogsModal executionId={modal.logs} onClose={() => setModal(null)} />
        </Modal>
      )}
      {modal?.approve && (
        <Modal title="Approve Step" onClose={() => setModal(null)}>
          <ApproveModal execution={modal.approve} onClose={() => setModal(null)} onDone={load} />
        </Modal>
      )}
    </div>
  );
}
