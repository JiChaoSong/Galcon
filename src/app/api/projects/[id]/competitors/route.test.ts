import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/projects/:id/competitors", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a competitor relationship", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const target = await prisma.brand.create({ data: { name: "纷享销客" } });
    const competitor = await prisma.brand.create({ data: { name: "销售易" } });

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          targetBrandId: target.id,
          competitorBrandId: competitor.id,
          competitorType: "直接竞品",
          priority: "高",
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.targetBrandId).toBe(target.id);
    expect(body.competitorBrandId).toBe(competitor.id);
  });

  it("rejects a duplicate competitor relationship with 409", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const target = await prisma.brand.create({ data: { name: "纷享销客" } });
    const competitor = await prisma.brand.create({ data: { name: "销售易" } });

    await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          targetBrandId: target.id,
          competitorBrandId: competitor.id,
          competitorType: "直接竞品",
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );

    const res = await POST(
      new Request("http://localhost", {
        method: "POST",
        body: JSON.stringify({
          targetBrandId: target.id,
          competitorBrandId: competitor.id,
          competitorType: "直接竞品",
        }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );

    expect(res.status).toBe(409);
  });

  it("lists competitors for a project", async () => {
    const project = await prisma.project.create({ data: { name: "P1", type: "样板报告" } });
    const target = await prisma.brand.create({ data: { name: "纷享销客" } });
    const competitor = await prisma.brand.create({ data: { name: "销售易" } });
    await prisma.competitor.create({
      data: { projectId: project.id, targetBrandId: target.id, competitorBrandId: competitor.id, competitorType: "直接竞品" },
    });

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: project.id }),
    });
    const body = await res.json();

    expect(body).toHaveLength(1);
  });
});
