"use strict";

const bcrypt = require("bcryptjs");
const { MoleculerError } = require("moleculer").Errors;
const AuthMixin = require("../mixins/auth.mixin");
const prisma = require("../prisma");

module.exports = {
  name: "auth",
  mixins: [AuthMixin],

  actions: {
    /**
     * POST /api/auth/login
     * Public — no token required.
     */
    login: {
      params: {
        email: { type: "email" },
        password: { type: "string", min: 1 },
      },

      async handler(ctx) {
        const { email, password } = ctx.params;

        // Fetch user — use a generic error to prevent user enumeration
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          throw new MoleculerError("Invalid email or password", 401, "UNAUTHORIZED");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          throw new MoleculerError("Invalid email or password", 401, "UNAUTHORIZED");
        }

        // Build JWT payload — include permissions so downstream hooks can check
        // without a DB call on every request
        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
        };

        const token = this.signToken(payload);

        return {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            permissions: user.permissions,
          },
        };
      },
    },
  },
};
