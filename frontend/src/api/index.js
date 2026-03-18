const BASE_URL = import.meta.env.VITE_API_URL || "";

async function request(method, path, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE_URL}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  return res.json();
}

export const api = {
  health: () => request("GET", "/health"),

  // Workflows
  getWorkflows:   (q, offset = 0, limit = 50) => {
    const p = new URLSearchParams({ offset, limit });
    if (q) p.set("q", q);
    return request("GET", `/workflows/?${p}`);
  },
  getWorkflow:    (id)         => request("GET",    `/workflows/${id}`),
  createWorkflow: (data)       => request("POST",   "/workflows/", data),
  updateWorkflow: (id, data)   => request("PUT",    `/workflows/${id}`, data),
  deleteWorkflow: (id)         => request("DELETE", `/workflows/${id}`),
  executeWorkflow:(id, payload)=> request("POST",   `/workflows/${id}/execute`, payload),

  // Steps
  getSteps:    (workflowId)      => request("GET",    `/workflows/${workflowId}/steps`),
  createStep:  (workflowId, data)=> request("POST",   `/workflows/${workflowId}/steps`, data),
  updateStep:  (stepId, data)    => request("PUT",    `/steps/${stepId}`, data),
  deleteStep:  (stepId)          => request("DELETE", `/steps/${stepId}`),

  // Rules
  getRules:          (stepId)            => request("GET",    `/steps/${stepId}/rules`),
  createRule:        (stepId, data)      => request("POST",   `/steps/${stepId}/rules`, data),
  updateRule:        (ruleId, data)      => request("PUT",    `/rules/${ruleId}`, data),
  deleteRule:        (ruleId)            => request("DELETE", `/rules/${ruleId}`),
  reorderRules:      (stepId, ids)       => request("POST",   `/steps/${stepId}/rules/reorder`, { ordered_ids: ids }),
  validateCondition: (condition)         => request("POST",   "/rules/validate-condition", { condition }),

  // Executions
  getExecutions:    ()           => request("GET",  "/executions/"),
  getExecution:     (id)         => request("GET",  `/executions/${id}`),
  getExecutionLogs: (id)         => request("GET",  `/executions/${id}/logs`),
  approveExecution: (id, payload)=> request("POST", `/executions/${id}/approve`, payload),
  cancelExecution:  (id)         => request("POST", `/executions/${id}/cancel`),
  retryExecution:   (id)         => request("POST", `/executions/${id}/retry`),
};
