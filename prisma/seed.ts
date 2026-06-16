import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const platforms = [
  { name: "DeepSeek", region: "国内", supportsCitation: false, supportsWebSearch: true, testMethod: "手动" },
  { name: "Kimi", region: "国内", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
  { name: "豆包", region: "国内", supportsCitation: false, supportsWebSearch: true, testMethod: "手动" },
  { name: "通义千问", region: "国内", supportsCitation: false, supportsWebSearch: true, testMethod: "手动" },
  { name: "ChatGPT", region: "海外", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
];

async function main() {
  for (const platform of platforms) {
    await prisma.platform.upsert({
      where: { name: platform.name },
      update: platform,
      create: platform,
    });
  }
  console.log("Seeded 5 platforms");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
