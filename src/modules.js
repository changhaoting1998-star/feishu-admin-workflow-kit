import { defineWorkflow } from "./workflow.js";

export const visitorWorkflow = defineWorkflow({
  key: "visitor_request",
  label: "访客申请",
  steps: [
    { key: "host_confirmation", role: "HOST" },
    { key: "admin_review", role: "ADMIN" },
  ],
});

export const maintenanceWorkflow = defineWorkflow({
  key: "maintenance_request",
  label: "行政报修",
  steps: [
    { key: "triage", role: "ADMIN" },
    { key: "service_confirmation", role: "TECHNICIAN" },
    { key: "requester_acceptance", role: "REQUESTER" },
  ],
});

export function createBooking(input, options = {}) {
  for (const key of ["id", "roomId", "organizerId", "startsAt", "endsAt"]) {
    if (!input[key]) throw new Error(`Missing booking field: ${key}`);
  }
  if (new Date(input.startsAt) >= new Date(input.endsAt)) {
    throw new Error("Booking end must be after start");
  }
  return {
    ...input,
    status: "CONFIRMED",
    createdAt: options.at || new Date().toISOString(),
  };
}

export function hasBookingConflict(candidate, existingBookings) {
  const start = new Date(candidate.startsAt).getTime();
  const end = new Date(candidate.endsAt).getTime();
  return existingBookings.some((booking) => {
    if (booking.roomId !== candidate.roomId || booking.status === "CANCELLED") return false;
    return start < new Date(booking.endsAt).getTime() && end > new Date(booking.startsAt).getTime();
  });
}
