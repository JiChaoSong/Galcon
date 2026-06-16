import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { POST } from "./route";

describe("/api/questions/batch-import", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("imports questions and binds them to the project", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          questions: [{ questionText: "问题一" }, { questionText: "问题二" }],
        }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body).toHaveLength(2);
    const links = await prisma.projectQuestion.findMany({ where: { projectId: project.id } });
    expect(links).toHaveLength(2);
  });

  it("dedupes identical question text within the same batch", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          projectId: project.id,
          questions: [{ questionText: "重复问题" }, { questionText: "重复问题" }],
        }),
      }),
    );
    const body = await res.json();

    expect(body).toHaveLength(1);
  });

  it("reuses an existing question instead of creating a duplicate row", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const existing = await prisma.question.create({ data: { questionText: "已存在的问题" } });

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ projectId: project.id, questions: [{ questionText: "已存在的问题" }] }),
      }),
    );

    const allMatching = await prisma.question.findMany({ where: { questionText: "已存在的问题" } });
    expect(allMatching).toHaveLength(1);
    expect(allMatching[0].id).toBe(existing.id);
  });
});
