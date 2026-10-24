import AuditLog from '../models/AuditLog.js';

export const logAudit = async ({ req, actor, action, entity, entityId = '', description = '', before = null, after = null }) => {
  try {
    const actorData = actor || (req?.user ? {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    } : {
      name: 'System',
      email: 'system@local',
      role: 'system',
    });

    const ip = req?.ip || req?.headers?.['x-forwarded-for'] || '127.0.0.1';

    await AuditLog.create({
      actor: actorData,
      action,
      entity,
      entityId: String(entityId),
      description,
      before,
      after,
      ip,
    });
  } catch (err) {
    console.error('Audit Log Error (non-blocking):', err.message);
  }
};
