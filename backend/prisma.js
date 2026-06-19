"use strict";

const { PrismaClient } = require("@prisma/client");
const { withAccelerate } = require("@prisma/extension-accelerate");

// Shared singleton PrismaClient instance across all Moleculer services.
// Extended with Prisma Accelerate for connection pooling + edge caching.
// Each service imports this module and calls `this.prisma.*` directly inside
// action handlers — no moleculer-db mixin needed.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"],
}).$extends(withAccelerate());

module.exports = prisma;
