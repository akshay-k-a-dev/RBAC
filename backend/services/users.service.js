"use strict";

const bcrypt = require("bcryptjs");
const { MoleculerError } = require("moleculer").Errors;
const AuthMixin = require("../mixins/auth.mixin");
const prisma = require("../prisma");
const { ROLES } = require("../roles");

const SALT_ROUNDS = 12;

module.exports = {
  name: "users",
  mixins: [AuthMixin],

  hooks: {
    before: {
      // All actions require a valid JWT
      "*": ["verifyToken"],
      // Admin-only actions
      create: [function (ctx) { return this.requirePermission("users:create")(ctx); }],
      list:   [function (ctx) { return this.requirePermission("users:view")(ctx); }],
      delete: [function (ctx) { return this.requirePermission("users:delete")(ctx); }],
      // myPermissions: only requires a valid token (verifyToken above covers it)
    },
  },

  actions: {
    /**
     * POST /api/users  — Admin only
     * Create a new user account.
     */
    create: {
      params: {
        name:     { type: "string", min: 1, max: 100 },
        email:    { type: "email" },
        password: { type: "string", min: 6 },
        role:     { type: "enum", values: ["admin", "user"], optional: true },
      },

      async handler(ctx) {
        const { name, email, password, role = "user" } = ctx.params;

        // Check for duplicate email
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          throw new MoleculerError("Email already exists", 409, "CONFLICT");
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const permissions = ROLES[role] || ROLES.user;

        const user = await prisma.user.create({
          data: { name, email, passwordHash, role, permissions },
          select: { id: true, name: true, email: true, role: true, permissions: true, createdAt: true },
        });

        // Set HTTP status 201
        ctx.meta.$statusCode = 201;
        return user;
      },
    },

    /**
     * GET /api/users  — Admin only
     * List all users (excluding password hashes).
     */
    list: {
      async handler(ctx) {
        const users = await prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            permissions: true,
            createdAt: true,
          },
          orderBy: { createdAt: "asc" },
        });
        return users;
      },
    },

    /**
     * DELETE /api/users/:id  — Admin only
     * Delete a user by ID, with safety guards.
     */
    delete: {
      params: {
        id: { type: "string", min: 1 },
      },

      async handler(ctx) {
        const { id } = ctx.params;
        const requesterId = ctx.meta.user.id;

        // Guard: cannot delete yourself
        if (id === requesterId) {
          throw new MoleculerError("Cannot delete your own account", 400, "BAD_REQUEST");
        }

        // Guard: target must exist
        const target = await prisma.user.findUnique({ where: { id } });
        if (!target) {
          throw new MoleculerError("User not found", 404, "NOT_FOUND");
        }

        // Guard: cannot delete the last remaining admin
        if (target.role === "admin") {
          const adminCount = await prisma.user.count({ where: { role: "admin" } });
          if (adminCount <= 1) {
            throw new MoleculerError("Cannot delete the last remaining admin", 400, "BAD_REQUEST");
          }
        }

        await prisma.user.delete({ where: { id } });
        return { success: true };
      },
    },

    /**
     * GET /api/me/permissions  — Any authenticated user
     * Return the caller's own role and permissions.
     * Reads live from DB (not just JWT) to catch mid-session permission changes.
     */
    myPermissions: {
      async handler(ctx) {
        const userId = ctx.meta.user.id;
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { role: true, permissions: true },
        });
        if (!user) {
          throw new MoleculerError("User not found", 404, "NOT_FOUND");
        }
        return { role: user.role, permissions: user.permissions };
      },
    },
  },
};
