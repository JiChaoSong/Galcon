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
}
