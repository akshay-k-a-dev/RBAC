"use strict";

const jwt = require("jsonwebtoken");
const { MoleculerError } = require("moleculer").Errors;

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";

/**
 * Auth mixin — provides reusable action hooks for JWT verification and
 * permission-based authorization. Import this mixin into any service that
 * needs protected actions.
 *
 * Usage:
 *   mixins: [AuthMixin],
 *   hooks: {
 *     before: {
 *       "*": "verifyToken",
 *       someAction: ["requirePermission('users:create')"],
 *     }
 *   }
 *
 * Or use the helpers directly in a service method:
 *   await this.verifyToken(ctx);
 *   await this.requirePermission(ctx, "users:create");
 */
const AuthMixin = {
  name: "auth-mixin",

  methods: {
    /**
     * Verifies the JWT from ctx.meta.token.
     * Populates ctx.meta.user with the decoded payload on success.
     * Throws 401 if token is missing or invalid.
     */
    async verifyToken(ctx) {
      const token = ctx.meta.token;
      if (!token) {
        throw new MoleculerError("Unauthorized: no token provided", 401, "UNAUTHORIZED");
      }
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        ctx.meta.user = decoded;
      } catch (err) {
        throw new MoleculerError("Unauthorized: invalid or expired token", 401, "UNAUTHORIZED");
      }
    },

    /**
     * Factory that returns a hook function checking for a specific permission.
     * Must be called AFTER verifyToken (ctx.meta.user must be set).
     *
     * @param {...string} perms  One or more required permission strings (OR logic — any one suffices).
     */
    requirePermission(...perms) {
      return async function (ctx) {
        if (!ctx.meta.user) {
          throw new MoleculerError("Unauthorized", 401, "UNAUTHORIZED");
        }
        const userPerms = ctx.meta.user.permissions || [];
        const hasAny = perms.some((p) => userPerms.includes(p));
        if (!hasAny) {
          throw new MoleculerError(
            `Insufficient permissions. Required: ${perms.join(" or ")}`,
            403,
            "FORBIDDEN"
          );
        }
      };
    },

    /**
     * Signs a JWT for the given user payload.
     * @param {object} payload  Data to embed (id, name, email, role, permissions)
     * @returns {string}  Signed JWT string
     */
    signToken(payload) {
      return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    },
  },
};

module.exports = AuthMixin;
