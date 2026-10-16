import { getAdminClient } from "@/lib/supabase/admin";

export interface AuditEventParams {
  action: string;
  resourceType: string;
  userId?: string | null;
  userRole?: string | null;
  resourceId?: string | null;
  patientId?: string | null;
  details?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Record an append-only audit log entry for sensitive health record / role actions.
 * Non-blocking: logs warnings on failures without interrupting user requests.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const admin = getAdminClient();
    await admin.from("access_audit_log").insert({
      action: params.action,
      resource_type: params.resourceType,
      user_id: params.userId || null,
      user_role: params.userRole || null,
      resource_id: params.resourceId || null,
      patient_id: params.patientId || null,
      details: params.details || {},
      ip_address: params.ipAddress || null,
    });
  } catch (err) {
    console.warn("[AuditLog] Failed to record audit log entry:", err);
  }
}
