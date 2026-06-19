"use strict";

const { MoleculerError } = require("moleculer").Errors;
const AuthMixin = require("../mixins/auth.mixin");
const prisma = require("../prisma");
const { ROLES, ALL_PERMISSIONS } = require("../roles");

module.exports = {
  name: "roles",
  mixins: [AuthMixin],

  hooks: {
    before: {
      "*":    ["verifyToken"],
      assign: [function (ctx) { return this.requirePermission("roles:assign")(ctx); }],
    },
  },

  actions: {
    /**
     * POST /api/roles/assign  — Admin only
     * Assign a role and optional custom permission set to a user.
     * If "permissions" is omitted, defaults to the role's standard permission set.
     */
    assign: {
      params: {
        userId:      { type: "string", min: 1 },
        role:        { type: "enum", values: ["admin", "user"] },
        permissions: {
          type: "array",
          items: { type: "string" },
          optional: true,
        },
      },

      async handler(ctx) {
        const { userId, role } = ctx.params;
        let { permissions } = ctx.params;

        // Validate custom permissions if provided
        if (permissions !== undefined) {
          const invalid = permissions.filter((p) => !ALL_PERMISSIONS.includes(p));
          if (invalid.length > 0) {
            throw new MoleculerError(
              `Invalid permission(s): ${invalid.join(", ")}`,
              400,
              "BAD_REQUEST"
            );
          }
        } else {
          // Default to the role's standard permissions
          permissions = ROLES[role] || [];
        }

        // Target user must exist
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new MoleculerError("User not found", 404, "NOT_FOUND");
        }

        // Guard: don't demote the last admin
        if (user.role === "admin" && role === "user") {
          const adminCount = await prisma.user.count({ where: { role: "admin" } });
          if (adminCount <= 1) {
            throw new MoleculerError(
              "Cannot demote the last remaining admin",
              400,
              "BAD_REQUEST"
            );
          }
        }

        await prisma.user.update({
          where: { id: userId },
          data: { role, permissions },
        });

        return { success: true };
      },
    },
  },
};
