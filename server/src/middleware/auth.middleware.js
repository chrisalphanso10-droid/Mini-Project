/**
 * FixIt Now - Authentication & Role-Based Access Control (RBAC) Middleware
 * Conforms to docs/SRS.md Section 5 & docs/PLAN.md Phase 3.
 *
 * Requirements:
 * - Verify JWT token from Authorization header (Bearer <token>) or x-access-token.
 * - Enforce role requirement (customer, partner, admin).
 * - Reject unauthorized requests with 401 or 403.
 */

import { verifyToken } from '../services/token.service.js';
import db from '../config/db.js';

/**
 * Authenticates request via JWT
 * For partners: enforces session_version verification to reject invalidated tokens (Fix 3)
 */
export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || req.headers['x-access-token'] || req.query?.token;

  if (!authHeader) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. No authentication token provided.',
    });
  }

  let token = authHeader;
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json({
      status: 'error',
      message: 'Access denied. Malformed token format.',
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded; // { id, email, role, name, session_version }

    // Fix 3: Reject tokens whose version differs (401) for partners
    if (decoded.role === 'partner') {
      const pRes = await db.query(
        'SELECT COALESCE(session_version, 0) AS session_version FROM partners WHERE id = $1',
        [decoded.id]
      );

      if (pRes.rows.length === 0) {
        return res.status(401).json({
          status: 'error',
          message: 'Partner account not found. Please log in again.',
        });
      }

      const dbVersion = Number(pRes.rows[0].session_version ?? 0);
      const tokenVersion = Number(decoded.session_version ?? 0);

      if (dbVersion !== tokenVersion) {
        return res.status(401).json({
          status: 'error',
          message: 'Session invalidated. You have logged out from another session.',
        });
      }
    }

    next();
  } catch {
    return res.status(401).json({
      status: 'error',
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
}

/**
 * Role-Based Access Control Guard
 * @param {...('customer' | 'partner' | 'admin')} allowedRoles
 */
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required before checking authorization.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `Forbidden. Access restricted for role "${req.user.role}". Required: ${allowedRoles.join(' or ')}.`,
      });
    }

    next();
  };
}

export default {
  authenticateToken,
  requireRole,
};
