import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET } from "./route";

describe("/api/projects/:id/tasks", () => {
  beforeEach(async () => {
    await resetDb();
    // Ensure we have at least 3 platforms
    const count = await prisma.platform.count();
    if (count < 3) {
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
  });

  it("paginates and filters tasks by status", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const question = await prisma.question.create({ data: { questionText: "问题一" } });
    const platforms = await prisma.platform.findMany({ take: 3 });

    // Create tasks sequentially to avoid unique constraint conflicts
    for (let i = 0; i < platforms.length; i++) {
      await prisma.testTask.create({
        data: {
          projectId: project.id,
          questionId: question.id,
          platformId: platforms[i].id,
          targetBrandId: brand.id,
          status: i === 0 ? "completed" : "pending",
          promptText: `task ${i}`,
        },
      });
    }

    const filtered = await GET(new Request(`http://localhost/api/x?status=completed`), {
      params: Promise.resolve({ id: project.id }),
    });
    const filteredBody = await filtered.json();
    expect(filteredBody.items).toHaveLength(1);
    expect(filteredBody.total).toBe(1);

    const paged = await GET(new Request(`http://localhost/api/x?pageSize=2&page=1`), {
      params: Promise.resolve({ id: project.id }),
    });
    const pagedBody = await paged.json();
    expect(pagedBody.items).toHaveLength(2);
    expect(pagedBody.total).toBe(3);
  });
});
