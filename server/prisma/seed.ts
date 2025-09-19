import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash("admin1234", 10);
    await prisma.user.upsert({
        where: { email: "admin@mytown.local" },
        create: {
            email: "admin@mytown.local",
            password: hash,
            username: "Admin",
            role: "ADMIN",
        },
        update: {},
    });
}

main().finally(async () => prisma.$disconnect());
