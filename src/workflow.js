const TERMINAL = new Set(["APPROVED", "REJECTED", "CANCELLED"]);

export function defineWorkflow(definition) {
  if (!definition?.key || !Array.isArray(definition.steps) || !definition.steps.length) {
    throw new Error("A workflow key and at least one step are required");
  }
  const keys = new Set();
  for (const step of definition.steps) {
    if (!step.key || keys.has(step.key)) throw new Error("Workflow step keys must be unique");
    keys.add(step.key);
  }
  return Object.freeze({ ...definition, steps: Object.freeze([...definition.steps]) });
}

export function createInstance(workflow, payload, options = {}) {
  const now = options.at || new Date().toISOString();
  return {
    id: payload.id || `demo_instance_${Date.now()}`,
    workflowKey: workflow.key,
    status: "DRAFT",
    currentStep: null,
    payload: structuredClone(payload),
    createdAt: now,
    updatedAt: now,
    audit: [],
  };
}

export function act(instance, action, workflow, options = {}) {
  if (TERMINAL.has(instance.status)) throw new Error("Terminal workflow instances cannot change");
  const now = options.at || new Date().toISOString();
  let status = instance.status;
  let currentStep = instance.currentStep;

  if (action.type === "SUBMIT" && status === "DRAFT") {
    status = "PENDING";
    currentStep = workflow.steps[0].key;
  } else if (action.type === "APPROVE" && status === "PENDING") {
    const index = workflow.steps.findIndex((step) => step.key === currentStep);
    if (index < 0) throw new Error("Unknown current workflow step");
    const next = workflow.steps[index + 1];
    status = next ? "PENDING" : "APPROVED";
    currentStep = next?.key || null;
  } else if (action.type === "REJECT" && status === "PENDING") {
    status = "REJECTED";
    currentStep = null;
  } else if (action.type === "CANCEL" && ["DRAFT", "PENDING"].includes(status)) {
    status = "CANCELLED";
    currentStep = null;
  } else {
    throw new Error(`Unsupported action ${action.type} for ${status}`);
  }

  return {
    ...instance,
    status,
    currentStep,
    updatedAt: now,
    audit: [
      ...instance.audit,
      {
        action: action.type,
        actorId: action.actorId || "demo_system",
        note: action.note || "",
        at: now,
      },
    ],
  };
}
