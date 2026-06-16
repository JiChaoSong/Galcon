import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/projects/:id/tasks/generate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  async function setupProject() {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const brand = await prisma.brand.create({ data: { name: "纷享销客" } });
    const q1 = await prisma.question.create({ data: { questionText: "问题一" } });
    const q2 = await prisma.question.create({ data: { questionText: "问题二" } });
    const platforms = await prisma.platform.findMany();
    return { project, brand, questions: [q1, q2], platforms: platforms.slice(0, 2) };
  }

  it("generates question x platform x brand tasks with prompt text filled in", async () => {
    const { project, brand, questions, platforms } = await setupProject();

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          questionIds: questions.map((q) => q.id),
          platformIds: platforms.map((p) => p.id),
          brandIds: [brand.id],
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.createdCount).toBe(4);

    const tasks = await prisma.testTask.findMany({ where: { projectId: project.id } });
    expect(tasks).toHaveLength(4);
    expect(tasks[0].promptText).toBe(tasks[0].questionId === questions[0].id ? "问题一" : "问题二");
  });

  it("does not duplicate tasks when called again with the same inputs", async () => {
    const { project, brand, questions, platforms } = await setupProject();
    const payload = JSON.stringify({
      questionIds: questions.map((q) => q.id),
      platformIds: platforms.map((p) => p.id),
      brandIds: [brand.id],
    });

    await POST(new Request("http://localhost", { method: "POST", body: payload }), {
      params: Promise.resolve({ id: project.id }),
    });
    const second = await POST(new Request("http://localhost", { method: "POST", body: payload }), {
      params: Promise.resolve({ id: project.id }),
    });
    const secondBody = await second.json();

    expect(secondBody.createdCount).toBe(0);
    const tasks = await prisma.testTask.findMany({ where: { projectId: project.id } });
    expect(tasks).toHaveLength(4);
  });
});
