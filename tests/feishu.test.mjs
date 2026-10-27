import assert from "node:assert/strict";
import test from "node:test";
import {
  buildNotificationCard,
  createMockDirectory,
  normalizeApprovalEvent,
} from "../src/index.js";

test("normalizes a Feishu-style approval event", () => {
  const event = normalizeApprovalEvent({
    event_id: "demo_event_001",
    operator_id: "demo_external_admin",
    action: "approve",
    comment: "演示通过",
  });
  assert.equal(event.action, "APPROVE");
  assert.equal(event.actorExternalId, "demo_external_admin");
});

test("builds a data-minimized notification card", () => {
  const card = buildNotificationCard({ title: "访客申请待处理", status: "PENDING", instanceId: "demo_instance_001" });
  const serialized = JSON.stringify(card);
  assert.match(serialized, /demo_instance_001/);
  assert.doesNotMatch(serialized, /app_secret|access_token/i);
});

test("mock directory only resolves synthetic users", async () => {
  const directory = createMockDirectory();
  assert.equal((await directory.resolveUser("demo_external_admin")).id, "demo_admin");
  assert.equal(await directory.resolveUser("unknown"), null);
});
