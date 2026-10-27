import assert from "node:assert/strict";
import test from "node:test";
import {
  act,
  createBooking,
  createInstance,
  hasBookingConflict,
  maintenanceWorkflow,
  visitorWorkflow,
} from "../src/index.js";

test("visitor request completes both approval steps", () => {
  let request = createInstance(visitorWorkflow, { id: "demo_visitor_001" }, { at: "2099-01-01T00:00:00.000Z" });
  request = act(request, { type: "SUBMIT", actorId: "demo_requester" }, visitorWorkflow);
  assert.equal(request.currentStep, "host_confirmation");
  request = act(request, { type: "APPROVE", actorId: "demo_host" }, visitorWorkflow);
  assert.equal(request.currentStep, "admin_review");
  request = act(request, { type: "APPROVE", actorId: "demo_admin" }, visitorWorkflow);
  assert.equal(request.status, "APPROVED");
  assert.equal(request.audit.length, 3);
});

test("maintenance request cannot skip steps", () => {
  const request = createInstance(maintenanceWorkflow, { id: "demo_maintenance_001" });
  assert.throws(() => act(request, { type: "APPROVE" }, maintenanceWorkflow), /Unsupported action/);
});

test("terminal instances cannot change", () => {
  let request = createInstance(visitorWorkflow, { id: "demo_visitor_002" });
  request = act(request, { type: "CANCEL", actorId: "demo_requester" }, visitorWorkflow);
  assert.throws(() => act(request, { type: "SUBMIT" }, visitorWorkflow), /Terminal/);
});

test("meeting room conflict uses half-open intervals", () => {
  const first = createBooking({
    id: "demo_booking_001", roomId: "demo_room_a", organizerId: "demo_user_a",
    startsAt: "2099-01-01T09:00:00.000Z", endsAt: "2099-01-01T10:00:00.000Z",
  });
  const touching = createBooking({
    id: "demo_booking_002", roomId: "demo_room_a", organizerId: "demo_user_b",
    startsAt: "2099-01-01T10:00:00.000Z", endsAt: "2099-01-01T11:00:00.000Z",
  });
  const overlapping = { ...touching, id: "demo_booking_003", startsAt: "2099-01-01T09:30:00.000Z" };
  assert.equal(hasBookingConflict(touching, [first]), false);
  assert.equal(hasBookingConflict(overlapping, [first]), true);
});
