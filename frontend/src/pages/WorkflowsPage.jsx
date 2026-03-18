import { useState, useEffect, useCallback } from "react";
import { api } from "../api";
import { StatusBadge } from "../components/StatusBadge";
import { Modal } from "../components/Modal";
import { Input, Textarea, Btn, ErrorMsg } from "../components/Form";

// ── Workflow create/edit form ─────────────────────────────────────────────────

function WorkflowForm({ initial, onSave, onClose }) {
  const [name, setName]           = useState(initial?.name ?? "");
  const [isActive, setIsActive]   = useState(initial?.is_active ?? true);
  const [schemaText, setSchemaText] = useState(
    initial?.input_schema ? JSON.stringify(initial.input_schema, null, 2) : ""
  );
  const [err, setErr]     = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) { setErr("Name is required"); return; }
    let input_schema = null;
    if (schemaText.trim()) {
      try { input_schema = JSON.parse(schemaText); }
      catch { setErr("Invalid JSON in input schema"); return; }
    }
    setSaving(true); setErr("");
    try {
      await onSave({ name: name.trim(), is_active: isActive, input_schema });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      <Input label="Workflow Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Expense Approval" />

      {initial && (
        <p className="text-xs font-mono text-zinc-500 bg-zinc-800 rounded px-3 py-2">
          Current version: <span className="text-sky-400">v{initial.version}</span>
          {" "}— saving will auto-increment to{" "}
          <span className="text-sky-400">v{initial.version + 1}</span>
        </p>
      )}

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="w-4 h-4 accent-sky-500" />
        <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Active</span>
      </label>

      <Textarea label="Input Schema (JSON)" value={schemaText}
        onChange={e => setSchemaText(e.target.value)} rows={7}
        placeholder={'{\n  "amount":   {"type": "number", "required": true},\n  "country":  {"type": "string", "required": true},\n  "priority": {"type": "string", "required": true, "allowed_values": ["High","Medium","Low"]}\n}'} />

      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} disabled={saving}>{saving ? "Saving…" : (initial ? "Update" : "Create")}</Btn>
      </div>
    </div>
  );
}

// ── Execute modal ─────────────────────────────────────────────────────────────

function ExecuteModal({ workflow, onClose }) {
  const schema = workflow.input_schema ?? {};
  const defaultData = Object.fromEntries(
    Object.entries(schema).map(([k, v]) => {
      if (v.type === "number") return [k, 0];
      if (v.allowed_values?.length) return [k, v.allowed_values[0]];
      return [k, ""];
    })
  );

  const [dataText, setDataText]       = useState(JSON.stringify(defaultData, null, 2));
  const [triggeredBy, setTriggeredBy] = useState("");
  const [result, setResult]           = useState(null);
  const [err, setErr]                 = useState("");
  const [loading, setLoading]         = useState(false);

  async function run() {
    let data;
    try { data = JSON.parse(dataText); } catch { setErr("Invalid JSON"); return; }
    setLoading(true); setErr(""); setResult(null);
    try {
      const res = await api.executeWorkflow(workflow.id, { data, triggered_by: triggeredBy || undefined });
      setResult(res);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-4">
      <p className="text-zinc-400 text-sm font-mono">
        Execute <span className="text-sky-400">{workflow.name}</span>
        <span className="text-zinc-600 ml-2">v{workflow.version}</span>
      </p>

      {/* Show schema fields as hint */}
      {Object.keys(schema).length > 0 && (
        <div className="bg-zinc-800/50 border border-zinc-700 rounded p-3">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Expected fields</p>
          <div className="space-y-1">
            {Object.entries(schema).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-xs font-mono">
                <span className="text-zinc-300">{k}</span>
                <span className="text-zinc-600">{v.type}</span>
                {v.required && <span className="text-red-400 text-xs">required</span>}
                {v.allowed_values && <span className="text-zinc-500">[{v.allowed_values.join(", ")}]</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      <Input label="Triggered By (optional)" value={triggeredBy}
        onChange={e => setTriggeredBy(e.target.value)} placeholder="user@example.com" />
      <Textarea label="Input Data (JSON)" value={dataText}
        onChange={e => setDataText(e.target.value)} rows={7} />
      <ErrorMsg msg={err} />

      {result && (
        <div className="bg-zinc-800 border border-zinc-700 rounded p-4">
          <p className="text-xs font-mono text-zinc-400 mb-2 uppercase tracking-wider">Result</p>
          <div className="flex items-center gap-3 mb-3">
            <StatusBadge status={result.status} />
            <span className="text-zinc-500 text-xs font-mono truncate">{result.id}</span>
          </div>
          {result.status === "pending" && (
            <p className="text-xs font-mono text-amber-400 mb-2">
              ⏸ Paused at approval step — go to Executions to approve.
            </p>
          )}
          <details>
            <summary className="text-xs font-mono text-zinc-600 cursor-pointer hover:text-zinc-400">Raw response</summary>
            <pre className="mt-2 text-xs text-zinc-400 overflow-auto max-h-48 bg-zinc-900 rounded p-2">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="ghost" onClick={onClose}>Close</Btn>
        <Btn variant="success" onClick={run} disabled={loading}>{loading ? "Running…" : "▶ Execute"}</Btn>
      </div>
    </div>
  );
}

// ── Workflows page ────────────────────────────────────────────────────────────

export function WorkflowsPage({ onViewSteps }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [err, setErr]             = useState("");
  const [search, setSearch]       = useState("");
  const [modal, setModal]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setWorkflows(await api.getWorkflows(search || undefined)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!confirm("Delete this workflow and all its steps/rules?")) return;
    try { await api.deleteWorkflow(id); load(); }
    catch (e) { alert(e.message); }
  }

  async function handleToggle(wf) {
    try { await api.updateWorkflow(wf.id, { is_active: !wf.is_active }); load(); }
    catch (e) { alert(e.message); }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">Workflows</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">{workflows.length} workflow{workflows.length !== 1 ? "s" : ""}</p>
        </div>
        <div className="flex items-center gap-3">
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search…"
            className="bg-zinc-800 border border-zinc-700 rounded px-3 py-1.5 text-sm text-zinc-100
              placeholder-zinc-600 focus:outline-none focus:border-sky-500 font-mono w-48" />
          <Btn onClick={() => setModal("create")}>+ New Workflow</Btn>
        </div>
      </div>

      <ErrorMsg msg={err} />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-zinc-600 font-mono text-sm">Loading…</div>
      ) : workflows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <div className="text-4xl mb-3">⬡</div>
          <p className="font-mono text-sm">No workflows found</p>
          <Btn className="mt-4" onClick={() => setModal("create")}>Create your first workflow</Btn>
        </div>
      ) : (
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80">
                {["Name", "Steps", "Version", "Status", "Actions"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {workflows.map((wf, i) => (
                <tr key={wf.id} className={`border-b border-zinc-800/60 hover:bg-zinc-800/40 transition-colors ${i % 2 === 0 ? "" : "bg-zinc-900/30"}`}>
                  <td className="px-4 py-3">
                    <span className="font-medium text-zinc-100">{wf.name}</span>
                    <span className="block text-xs text-zinc-600 font-mono mt-0.5 truncate max-w-xs">{wf.id}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400 text-center">
                    <span className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs">{wf.step_count ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-400">v{wf.version}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleToggle(wf)} title="Click to toggle active/inactive">
                      <StatusBadge status={wf.is_active ? "completed" : "canceled"} />
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <Btn variant="ghost"   className="!px-2 !py-1 text-xs" onClick={() => onViewSteps(wf)}>Steps</Btn>
                      <Btn variant="success" className="!px-2 !py-1 text-xs" onClick={() => setModal({ exec: wf })}>▶ Run</Btn>
                      <Btn variant="ghost"   className="!px-2 !py-1 text-xs" onClick={() => setModal({ edit: wf })}>Edit</Btn>
                      <Btn variant="danger"  className="!px-2 !py-1 text-xs" onClick={() => handleDelete(wf.id)}>Del</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal === "create" && (
        <Modal title="New Workflow" onClose={() => setModal(null)}>
          <WorkflowForm onSave={d => api.createWorkflow(d)} onClose={() => { setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.edit && (
        <Modal title="Edit Workflow" onClose={() => setModal(null)}>
          <WorkflowForm initial={modal.edit}
            onSave={d => api.updateWorkflow(modal.edit.id, d)}
            onClose={() => { setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.exec && (
        <Modal title="Execute Workflow" onClose={() => setModal(null)} wide>
          <ExecuteModal workflow={modal.exec} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}
