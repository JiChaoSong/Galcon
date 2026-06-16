import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/projects", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("creates a project and returns 201", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "CRM 行业样板报告", type: "样板报告", industry: "B2B SaaS" }),
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("CRM 行业样板报告");
    expect(body.status).toBe("draft");
  });

  it("rejects an invalid project type", async () => {
    const req = new Request("http://localhost/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: "Bad project", type: "不存在的类型" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("lists projects ordered by most recently updated", async () => {
    await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "First project", type: "样板报告" }),
      }),
    );
    await POST(
      new Request("http://localhost/api/projects", {
        method: "POST",
        body: JSON.stringify({ name: "Second project", type: "客户诊断" }),
      }),
    );

    const res = await GET();
    const body = await res.json();

    expect(body).toHaveLength(2);
  });
});
