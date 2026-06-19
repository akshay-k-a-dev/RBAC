"use strict";

const ApiGateway = require("moleculer-web");
const { MoleculerError } = require("moleculer").Errors;

module.exports = {
  name: "api",
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 3001,
    ip: "0.0.0.0",

    // CORS — allow the Next.js dev server and production origin
    cors: {
      origin: [
        "http://localhost:3000",
        process.env.FRONTEND_URL || "http://localhost:3000",
      ],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },

    routes: [
      {
        path: "/api",
        whitelist: [
          "auth.*",
          "users.*",
          "roles.*",
        ],

        // === Aliases ===
        aliases: {
          // Auth
          "POST auth/login": "auth.login",

          // Users (admin-only enforced in the service via hooks)
          "POST users":       "users.create",
          "GET users":        "users.list",
          "DELETE users/:id": "users.delete",

          // Roles (admin-only enforced in service)
          "POST roles/assign": "roles.assign",

          // Self-service permissions (any authenticated user)
          "GET me/permissions": "users.myPermissions",
        },

        // Extract Bearer token and store in ctx.meta.token for all calls
        onBeforeCall(ctx, route, req) {
          const authHeader = req.headers["authorization"] || "";
          if (authHeader.startsWith("Bearer ")) {
            ctx.meta.token = authHeader.slice(7);
          }
        },

        // Map HTTP verbs → Moleculer params automatically
        mappingPolicy: "restrict",
        bodyParsers: {
          json: { strict: false, limit: "1MB" },
          urlencoded: { extended: true, limit: "1MB" },
        },
      },
    ],

    // Centralized error formatter — always returns { error: string }
    onError(req, res, err) {
      const status = err.code || err.status || 500;
      const message =
        err.type === "VALIDATION_ERROR"
          ? err.data?.map?.((e) => e.message).join(", ") || "Validation error"
          : err.message || "Internal server error";

      res.setHeader("Content-Type", "application/json");
      res.writeHead(status);
      res.end(JSON.stringify({ error: message }));
    },
  },
};
