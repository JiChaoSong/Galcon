import { prisma } from "@/lib/prisma";

// Deletes all M1 data in FK-safe order. Platforms are seed data shared
// across tests and intentionally left alone.
export async function resetDb() {
  await prisma.testTask.deleteMany();
  await prisma.projectQuestion.deleteMany();
  await prisma.competitor.deleteMany();
  await prisma.projectBrand.deleteMany();
  await prisma.question.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.project.deleteMany();

  // Re-seed platforms if they were deleted
  const platformCount = await prisma.platform.count();
  if (platformCount < 5) {
    await prisma.platform.createMany({
      data: [
        { name: "DeepSeek", region: "国内", supportsWebSearch: true, testMethod: "手动" },
        { name: "Kimi", region: "国内", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
        { name: "豆包", region: "国内", supportsWebSearch: true, testMethod: "手动" },
        { name: "通义千问", region: "国内", supportsWebSearch: true, testMethod: "手动" },
        { name: "ChatGPT", region: "海外", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
      ],
      skipDuplicates: true,
    });
  }
}
