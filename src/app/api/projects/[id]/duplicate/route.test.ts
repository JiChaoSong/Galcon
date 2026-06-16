import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/projects/:id/duplicate", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("duplicates a project with a new name and binds its questions", async () => {
    const project = await prisma.project.create({
      data: { name: "Original", type: "样板报告" },
    });
    const question = await prisma.question.create({
      data: { questionText: "测试问题" },
    });
    await prisma.projectQuestion.create({
      data: { projectId: project.id, questionId: question.id },
    });

    const res = await POST(
      new Request("http://localhost", { method: "POST" }),
      { params: Promise.resolve({ id: project.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toContain("Original");
    expect(body.name).toContain("副本");
    expect(body.id).not.toBe(project.id);

    const questionLinks = await prisma.projectQuestion.findMany({
      where: { projectId: body.id },
    });
    expect(questionLinks).toHaveLength(1);
  });
});
