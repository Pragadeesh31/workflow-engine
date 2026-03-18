import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../api";
import { Modal } from "../components/Modal";
import { Input, Textarea, Select, Btn, ErrorMsg } from "../components/Form";

// ── Step Form ─────────────────────────────────────────────────────────────────

function StepForm({ workflowId, initial, onSave, onClose }) {
  const [name, setName]         = useState(initial?.name ?? "");
  const [stepType, setStepType] = useState(initial?.step_type ?? "task");
  const [stepOrder, setStepOrder] = useState(initial?.step_order ?? 1);
  const [metaText, setMetaText] = useState(
    initial?.step_metadata ? JSON.stringify(initial.step_metadata, null, 2) : "{}"
  );
  const [err, setErr]     = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim()) { setErr("Name is required"); return; }
    let step_metadata = null;
    if (metaText.trim()) {
      try { step_metadata = JSON.parse(metaText); }
      catch { setErr("Invalid JSON in metadata"); return; }
    }
    setSaving(true); setErr("");
    try {
      await onSave({ name: name.trim(), step_type: stepType, step_order: Number(stepOrder), step_metadata });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  const metaPlaceholders = {
    approval:     '{\n  "assignee_email": "manager@example.com"\n}',
    notification: '{\n  "channel": "email",\n  "to": "team@example.com"\n}',
    task:         '{\n  "instructions": "Describe the task here"\n}',
  };

  return (
    <div className="space-y-4">
      <Input label="Step Name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Manager Approval" />
      <div className="grid grid-cols-2 gap-4">
        <Select label="Step Type" value={stepType} onChange={e => setStepType(e.target.value)}>
          <option value="task">Task</option>
          <option value="approval">Approval</option>
          <option value="notification">Notification</option>
        </Select>
        <Input label="Order" type="number" value={stepOrder} onChange={e => setStepOrder(e.target.value)} min={1} />
      </div>
      <Textarea label="Metadata (JSON)" value={metaText} onChange={e => setMetaText(e.target.value)}
        rows={4} placeholder={metaPlaceholders[stepType]} />
      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} disabled={saving}>{saving ? "Saving…" : (initial ? "Update" : "Create")}</Btn>
      </div>
    </div>
  );
}

// ── Rule Form with live condition validation ───────────────────────────────────

function RuleForm({ stepId, allSteps, initial, onSave, onClose }) {
  const [condition, setCondition]   = useState(initial?.condition ?? "");
  const [nextStepId, setNextStepId] = useState(initial?.next_step_id ?? "");
  const [priority, setPriority]     = useState(initial?.priority ?? 999);
  const [err, setErr]               = useState("");
  const [condErr, setCondErr]       = useState("");
  const [validating, setValidating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const debounce = useRef(null);

  function handleConditionChange(e) {
    const val = e.target.value;
    setCondition(val);
    setCondErr("");
    if (debounce.current) clearTimeout(debounce.current);
    if (!val.trim()) return;
    debounce.current = setTimeout(async () => {
      setValidating(true);
      try {
        const res = await api.validateCondition(val.trim());
        setCondErr(res.valid ? "" : (res.error ?? "Invalid condition"));
      } catch { /* network error — don't block */ }
      finally { setValidating(false); }
    }, 600);
  }

  async function submit() {
    if (!condition.trim()) { setErr("Condition is required"); return; }
    if (condErr) { setErr("Fix the condition syntax error first"); return; }
    setSaving(true); setErr("");
    try {
      await onSave({ condition: condition.trim(), next_step_id: nextStepId || null, priority: Number(priority) });
      onClose();
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  }

  return (
    <div className="space-y-4">
      {/* Condition input with live validation */}
      <div>
        <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Condition</label>
        <input
          value={condition}
          onChange={handleConditionChange}
          placeholder='amount > 100 && country == "US"   or   DEFAULT'
          className={`w-full bg-zinc-800 border rounded px-3 py-2 text-sm text-zinc-100 placeholder-zinc-600
            focus:outline-none font-mono transition-colors
            ${condErr ? "border-red-500 focus:border-red-400" : "border-zinc-700 focus:border-sky-500"}`}
        />
        {validating && <p className="text-xs font-mono text-zinc-500 mt-1">Checking…</p>}
        {!validating && condErr && <p className="text-xs font-mono text-red-400 mt-1">⚠ {condErr}</p>}
        {!validating && !condErr && condition.trim() &&
          <p className="text-xs font-mono text-emerald-500 mt-1">✓ Valid</p>}
        <p className="text-xs font-mono text-zinc-600 mt-1.5 leading-relaxed">
          Ops: <code className="text-zinc-500">== != &lt; &gt; &lt;= &gt;= &amp;&amp; ||</code>
          &nbsp;·&nbsp;
          Fns: <code className="text-zinc-500">contains(f,"v") startsWith(f,"v") endsWith(f,"v")</code>
          &nbsp;·&nbsp;
          Catch-all: <code className="text-zinc-500">DEFAULT</code>
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Next step dropdown */}
        <div>
          <label className="block text-xs font-mono text-zinc-400 uppercase tracking-wider mb-1.5">Next Step</label>
          <select value={nextStepId} onChange={e => setNextStepId(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:border-sky-500 font-mono">
            <option value="">— END (workflow completes) —</option>
            {(allSteps ?? []).map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
        <Input label="Priority" type="number" value={priority} onChange={e => setPriority(e.target.value)} min={1} />
      </div>

      <ErrorMsg msg={err} />
      <div className="flex justify-end gap-2 pt-2">
        <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
        <Btn onClick={submit} disabled={saving || !!condErr}>
          {saving ? "Saving…" : (initial ? "Update" : "Add Rule")}
        </Btn>
      </div>
    </div>
  );
}

// ── Rules Panel with drag-and-drop reordering ─────────────────────────────────

function RulesPanel({ step, allSteps, onClose }) {
  const [rules, setRules]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(null);
  const [err, setErr]           = useState("");
  const [reordering, setReordering] = useState(false);
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { setRules(await api.getRules(step.id)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [step.id]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!confirm("Delete this rule?")) return;
    try { await api.deleteRule(id); load(); }
    catch (e) { alert(e.message); }
  }

  // DnD handlers
  function onDragStart(e, idx) {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
    e.currentTarget.style.opacity = "0.45";
  }
  function onDragEnd(e)         { e.currentTarget.style.opacity = "1"; }
  function onDragOver(e, idx)   { e.preventDefault(); dragOverIdx.current = idx; }

  async function onDrop(e) {
    e.preventDefault();
    const from = dragIdx.current, to = dragOverIdx.current;
    if (from === null || to === null || from === to) return;

    const sorted    = [...rules].sort((a, b) => a.priority - b.priority);
    const reordered = [...sorted];
    const [moved]   = reordered.splice(from, 1);
    reordered.splice(to, 0, moved);
    const withPriorities = reordered.map((r, i) => ({ ...r, priority: i + 1 }));

    setRules(withPriorities);
    dragIdx.current = dragOverIdx.current = null;
    setReordering(true);
    try {
      const updated = await api.reorderRules(step.id, withPriorities.map(r => r.id));
      setRules(updated);
    } catch (e) {
      setErr("Failed to save order: " + e.message);
      load();
    } finally { setReordering(false); }
  }

  function stepName(id) {
    if (!id) return null;
    return (allSteps ?? []).find(s => s.id === id)?.name ?? id.slice(0, 8) + "…";
  }

  const sorted = [...rules].sort((a, b) => a.priority - b.priority);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Rules for</p>
          <p className="text-zinc-100 font-mono font-semibold text-base">{step.name}</p>
          <p className="text-xs font-mono text-zinc-600 mt-0.5 capitalize">{step.step_type} step</p>
        </div>
        <div className="flex gap-2">
          <Btn onClick={() => setModal("create")}>+ Add Rule</Btn>
          <Btn variant="ghost" onClick={onClose}>← Back to Steps</Btn>
        </div>
      </div>

      {reordering && <p className="text-xs font-mono text-zinc-500 mb-2 animate-pulse">Saving new order…</p>}
      <ErrorMsg msg={err} />

      {loading ? (
        <p className="text-zinc-600 font-mono text-sm py-8 text-center">Loading…</p>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
          <p className="font-mono text-sm mb-4">No rules yet — add one to control branching</p>
          <Btn onClick={() => setModal("create")}>+ Add First Rule</Btn>
        </div>
      ) : (
        <>
          <p className="text-xs font-mono text-zinc-600 mb-3">⠿ Drag rows to reorder priority</p>
          <div className="space-y-2">
            {sorted.map((rule, idx) => (
              <div key={rule.id}
                draggable
                onDragStart={e => onDragStart(e, idx)}
                onDragEnd={onDragEnd}
                onDragOver={e => onDragOver(e, idx)}
                onDrop={onDrop}
                className="bg-zinc-800/60 border border-zinc-700 rounded-lg px-4 py-3
                  flex items-start gap-3 cursor-grab active:cursor-grabbing
                  hover:border-zinc-500 transition-colors select-none">
                <span className="text-zinc-600 shrink-0 mt-0.5 text-base" title="Drag to reorder">⠿</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-700 px-1.5 py-0.5 rounded shrink-0">P{rule.priority}</span>
                    <code className="text-sm text-amber-300 font-mono truncate">{rule.condition}</code>
                  </div>
                  <p className="text-xs font-mono text-zinc-500">
                    →{" "}
                    {rule.next_step_id
                      ? <span className="text-sky-400">{stepName(rule.next_step_id)}</span>
                      : <span className="text-zinc-400 italic">END</span>}
                  </p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Btn variant="ghost"  className="!px-2 !py-1 text-xs" onClick={() => setModal({ edit: rule })}>Edit</Btn>
                  <Btn variant="danger" className="!px-2 !py-1 text-xs" onClick={() => handleDelete(rule.id)}>Del</Btn>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modal === "create" && (
        <Modal title="Add Rule" onClose={() => setModal(null)} wide>
          <RuleForm stepId={step.id} allSteps={allSteps}
            onSave={d => api.createRule(step.id, d)}
            onClose={() => { setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.edit && (
        <Modal title="Edit Rule" onClose={() => setModal(null)} wide>
          <RuleForm stepId={step.id} allSteps={allSteps} initial={modal.edit}
            onSave={d => api.updateRule(modal.edit.id, d)}
            onClose={() => { setModal(null); load(); }} />
        </Modal>
      )}
    </div>
  );
}

// ── Steps Page ────────────────────────────────────────────────────────────────

export function StepsPage({ workflow, onBack }) {
  const [steps, setSteps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [rulesFor, setRulesFor] = useState(null);
  const [err, setErr]         = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try { setSteps(await api.getSteps(workflow.id)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [workflow.id]);

  useEffect(() => { load(); }, [load]);

  async function handleDelete(id) {
    if (!confirm("Delete this step and its rules?")) return;
    try { await api.deleteStep(id); load(); }
    catch (e) { alert(e.message); }
  }

  const sorted = [...steps].sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));

  if (rulesFor) {
    return <RulesPanel step={rulesFor} allSteps={sorted} onClose={() => setRulesFor(null)} />;
  }

  const typeStyle = {
    approval:     "text-amber-400 border-amber-500/30 bg-amber-500/10",
    notification: "text-sky-400   border-sky-500/30   bg-sky-500/10",
    task:         "text-zinc-400  border-zinc-600     bg-zinc-800",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={onBack} className="text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors mb-1">
            ← Workflows
          </button>
          <h1 className="text-lg font-mono font-bold text-zinc-100 uppercase tracking-widest">{workflow.name}</h1>
          <p className="text-zinc-500 text-xs font-mono mt-0.5">
            {steps.length} step{steps.length !== 1 ? "s" : ""} · v{workflow.version}
          </p>
        </div>
        <Btn onClick={() => setModal("create")}>+ Add Step</Btn>
      </div>

      <ErrorMsg msg={err} />

      {loading ? (
        <div className="text-zinc-600 font-mono text-sm py-20 text-center">Loading…</div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
          <div className="text-4xl mb-3">◈</div>
          <p className="font-mono text-sm mb-4">No steps yet</p>
          <Btn onClick={() => setModal("create")}>+ Add First Step</Btn>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((step, i) => (
            <div key={step.id}
              className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex items-center gap-4 hover:border-zinc-700 transition-colors">
              {/* Order badge */}
              <div className="w-8 h-8 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs font-mono text-zinc-400 shrink-0">
                {step.step_order ?? i + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-zinc-100">{step.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs font-mono px-2 py-0.5 rounded border ${typeStyle[step.step_type] ?? typeStyle.task}`}>
                    {step.step_type ?? "task"}
                  </span>
                  <span className="text-xs font-mono text-zinc-600 truncate">{step.id}</span>
                </div>
              </div>
              <div className="flex gap-1.5 shrink-0">
                <Btn variant="ghost"  className="!px-2 !py-1 text-xs" onClick={() => setRulesFor(step)}>Rules</Btn>
                <Btn variant="ghost"  className="!px-2 !py-1 text-xs" onClick={() => setModal({ edit: step })}>Edit</Btn>
                <Btn variant="danger" className="!px-2 !py-1 text-xs" onClick={() => handleDelete(step.id)}>Del</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal === "create" && (
        <Modal title="Add Step" onClose={() => setModal(null)}>
          <StepForm workflowId={workflow.id}
            onSave={d => api.createStep(workflow.id, d)}
            onClose={() => { setModal(null); load(); }} />
        </Modal>
      )}
      {modal?.edit && (
        <Modal title="Edit Step" onClose={() => setModal(null)}>
          <StepForm workflowId={workflow.id} initial={modal.edit}
            onSave={d => api.updateStep(modal.edit.id, d)}
            onClose={() => { setModal(null); load(); }} />
        </Modal>
      )}
    </div>
  );
}
