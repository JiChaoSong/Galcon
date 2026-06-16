import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { PATCH } from "./route";

describe("/api/tasks/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("marks a task as needs_review", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const question = await prisma.question.create({ data: { questionText: "问题一" } });
    const platforms = await prisma.platform.findMany({ take: 1 });
    const task = await prisma.testTask.create({
      data: {
        projectId: project.id,
        questionId: question.id,
        platformId: platforms[0].id,
        targetBrandId: brand.id,
      },
    });

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "needs_review" }),
      }),
      { params: Promise.resolve({ id: task.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("needs_review");
  });
});
