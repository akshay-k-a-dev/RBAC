"use strict";

module.exports = {
  namespace: "rbac",
  nodeID: "rbac-node-1",
  logger: {
    type: "Console",
    options: {
      level: process.env.LOG_LEVEL || "info",
      colors: true,
      moduleColors: false,
      formatter: "full",
      objectPrinter: null,
      autoPadding: false,
    },
  },
  transporter: null, // In-process (single node). Switch to NATS for multi-container.
  cacher: null,
  serializer: "JSON",
  requestTimeout: 15 * 1000, // 15s
  retryPolicy: {
    enabled: false,
  },
  maxCallLevel: 10,
  heartbeatInterval: 10,
  heartbeatTimeout: 30,
  contextParamsCloning: false,
  tracking: {
    enabled: false,
  },
  disableBalancer: false,
  registry: {
    strategy: "RoundRobin",
    preferLocal: true,
  },
  circuitBreaker: {
    enabled: false,
  },
  bulkhead: {
    enabled: false,
  },
  validator: true,
  errorHandler: null,
  metrics: {
    enabled: false,
  },
  tracing: {
    enabled: false,
  },
};
