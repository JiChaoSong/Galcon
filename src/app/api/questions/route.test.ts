import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/questions", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a standalone question", async () => {
    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ questionText: "CRM 行业有哪些推荐？", questionType: "品类推荐" }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.status).toBe("active");
  });

  it("creates a question and binds it to a project when projectId is given", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({ questionText: "CRM 行业有哪些推荐？", projectId: project.id }),
      }),
    );
    const body = await res.json();

    const link = await prisma.projectQuestion.findFirst({ where: { projectId: project.id, questionId: body.id } });
    expect(link).not.toBeNull();
  });

  it("filters questions by projectId", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const inProject = await prisma.question.create({ data: { questionText: "In project" } });
    await prisma.question.create({ data: { questionText: "Not in project" } });
    await prisma.projectQuestion.create({ data: { projectId: project.id, questionId: inProject.id } });

    const res = await GET(new Request(`http://localhost/api/questions?projectId=${project.id}`));
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].questionText).toBe("In project");
  });
});
