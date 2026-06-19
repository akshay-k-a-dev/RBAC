"use strict";

/**
 * Central ROLES → default permissions map.
 * Used when creating a user (no explicit permissions supplied) and
 * when assigning a role without specifying an explicit permissions array.
 */
const ROLES = {
  admin: ["users:create", "users:delete", "users:view", "roles:assign", "permissions:view"],
  user: ["permissions:view"],
};

/**
 * All valid permission strings.
 * Used for validation when assigning custom permission arrays.
 */
const ALL_PERMISSIONS = [
  "users:create",
  "users:delete",
  "users:view",
  "roles:assign",
  "permissions:view",
];

module.exports = { ROLES, ALL_PERMISSIONS };
