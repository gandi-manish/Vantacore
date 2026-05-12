import "dotenv/config";
import { PrismaClient, Role, UserStatus } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("Missing DATABASE_URL");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const password = await bcrypt.hash("Password@123", 10);

  const users = [
    {
      email: "employee@vantacore.local",
      passwordHash: password,
      role: Role.employee,
      department: "Engineering",
      status: UserStatus.active,
    },
    {
      email: "manager@vantacore.local",
      passwordHash: password,
      role: Role.manager,
      department: "Engineering",
      status: UserStatus.active,
    },
    {
      email: "admin@vantacore.local",
      passwordHash: password,
      role: Role.admin,
      department: "IT",
      status: UserStatus.active,
    },
    {
      email: "security@vantacore.local",
      passwordHash: password,
      role: Role.security_analyst,
      department: "Security",
      status: UserStatus.active,
    },
    {
      email: "auditor@vantacore.local",
      passwordHash: password,
      role: Role.auditor,
      department: "Compliance",
      status: UserStatus.active,
    },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  console.log("Seeded users successfully");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });