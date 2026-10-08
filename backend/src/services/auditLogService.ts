import { FastifyRequest } from 'fastify';
import { pool } from '../config/database.js';

export interface AuditParams {
  req: FastifyRequest;
  action: string;
  objectType: string;
  objectId: string;
  oldValue: any;
  newValue: any;
  reason: string;
  client?: any;
}

export class AuditLogService {
  /**
   * Appends an immutable, tamper-evident record into admin_audit_logs.
   * If database client is provided, executes within the active transaction.
   */
  static async log(params: AuditParams): Promise<void> {
    const { req, action, objectType, objectId, oldValue, newValue, reason, client } = params;

    const adminId = (req as any).user?.id || 'a0000000-0000-0000-0000-000000000001';
    const adminName = (req as any).user?.username || (req as any).user?.email || 'Operations Admin';
    const adminRole = (req as any).user?.role || 'SUPER_ADMIN';

    const clientIp =
      ((req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()) ||
      req.ip ||
      '127.0.0.1';
    const userAgent = (req.headers['user-agent'] as string) || 'Admin Console';

    const queryTarget = client || pool;

    await queryTarget.query(
      `INSERT INTO admin_audit_logs (
        admin_id, admin_name, admin_role, action, object_type, object_id,
        old_value, new_value, before_state_json, after_state_json,
        ip_address, user_agent, reason, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())`,
      [
        adminId,
        adminName,
        adminRole,
        action,
        objectType,
        objectId,
        typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue ?? null),
        typeof newValue === 'string' ? newValue : JSON.stringify(newValue ?? null),
        oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : JSON.stringify({ val: oldValue })) : null,
        newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : JSON.stringify({ val: newValue })) : null,
        clientIp,
        userAgent,
        reason,
      ]
    );
  }
}
