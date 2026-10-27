export function normalizeApprovalEvent(event) {
  if (!event?.event_id || !event?.operator_id || !event?.action) {
    throw new Error("Incomplete approval event");
  }
  const actionMap = { approve: "APPROVE", reject: "REJECT", cancel: "CANCEL" };
  const action = actionMap[String(event.action).toLowerCase()];
  if (!action) throw new Error("Unsupported approval event action");
  return {
    externalEventId: event.event_id,
    actorExternalId: event.operator_id,
    action,
    note: String(event.comment || "").slice(0, 500),
  };
}

export function buildNotificationCard({ title, status, instanceId, actionUrl }) {
  if (!String(instanceId).startsWith("demo_") && !actionUrl) {
    throw new Error("Non-demo cards require an explicit action URL");
  }
  return {
    config: { wide_screen_mode: true },
    header: { template: status === "REJECTED" ? "red" : "blue", title: { tag: "plain_text", content: title } },
    elements: [
      { tag: "markdown", content: `流程编号：${instanceId}\n当前状态：${status}` },
      ...(actionUrl ? [{ tag: "action", actions: [{ tag: "button", text: { tag: "plain_text", content: "查看详情" }, url: actionUrl, type: "primary" }] }] : []),
    ],
  };
}

export function createMockDirectory() {
  const users = new Map([
    ["demo_external_user_a", { id: "demo_user_a", displayName: "演示申请人" }],
    ["demo_external_admin", { id: "demo_admin", displayName: "演示管理员" }],
  ]);
  return {
    async resolveUser(externalId) {
      return users.get(externalId) || null;
    },
  };
}
