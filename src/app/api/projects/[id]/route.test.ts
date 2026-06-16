import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { DELETE, GET, PATCH } from "./route";

describe("/api/projects/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("returns a project with aggregate counts", async () => {
    const project = await prisma.project.create({
      data: { name: "Test Project", type: "样板报告" },
    });

    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: project.id }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe(project.id);
    expect(body._count.projectBrands).toBe(0);
  });

  it("returns 404 for an unknown project", async () => {
    const res = await GET(new Request("http://localhost"), {
      params: Promise.resolve({ id: "00000000-0000-0000-0000-000000000000" }),
    });
    expect(res.status).toBe(404);
  });

  it("updates project fields", async () => {
    const project = await prisma.project.create({
      data: { name: "Test Project", type: "样板报告" },
    });

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ status: "testing" }),
      }),
      { params: Promise.resolve({ id: project.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("testing");
  });

  it("archives a project instead of hard-deleting it", async () => {
    const project = await prisma.project.create({
      data: { name: "Test Project", type: "样板报告" },
    });

    const res = await DELETE(new Request("http://localhost"), {
      params: Promise.resolve({ id: project.id }),
    });
    expect(res.status).toBe(200);

    const stillExists = await prisma.project.findUnique({ where: { id: project.id } });
    expect(stillExists?.status).toBe("archived");
  });
});
