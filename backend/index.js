"use strict";

require("dotenv").config();

const { ServiceBroker } = require("moleculer");
const moleculerConfig = require("./moleculer.config");

const broker = new ServiceBroker(moleculerConfig);

// Load all services
broker.loadService("./services/api.service.js");
broker.loadService("./services/auth.service.js");
broker.loadService("./services/users.service.js");
broker.loadService("./services/roles.service.js");

// Graceful shutdown
process.on("SIGINT", () => broker.stop());
process.on("SIGTERM", () => broker.stop());

broker
  .start()
  .then(() => broker.logger.info("✅ All services started successfully."))
  .catch((err) => {
    broker.logger.error("❌ Failed to start services:", err);
    process.exit(1);
  });
