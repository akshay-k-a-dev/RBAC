import { PrismaClient, Role } from "@prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";
import * as bcrypt from "bcryptjs";

const prisma = new PrismaClient().$extends(withAccelerate());

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "Admin@123";
const ADMIN_NAME = process.env.SEED_ADMIN_NAME || "System Admin";

async function main() {
  console.log("🌱 Running seed…");

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const admin = await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: {
      // If admin already exists, refresh their permissions/role but don't touch the password
      role: Role.admin,
      permissions: ["users:create", "users:delete", "users:view", "roles:assign", "permissions:view"],
    },
    create: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      passwordHash,
      role: Role.admin,
      permissions: ["users:create", "users:delete", "users:view", "roles:assign", "permissions:view"],
    },
  });

  console.log(`✅ Seed admin upserted: ${admin.email} (id: ${admin.id})`);
  console.log(`   Email:    ${ADMIN_EMAIL}`);
  console.log("   Password: [REDACTED]");
  console.log("⚠️  Change the admin password after first login in production!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
