import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { GET, POST } from "./route";

describe("/api/brands", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("searches brands by name", async () => {
    await prisma.brand.create({ data: { name: "纷享销客" } });
    await prisma.brand.create({ data: { name: "销售易" } });

    const res = await GET(new Request("http://localhost/api/brands?q=纷享"));
    const body = await res.json();

    expect(body).toHaveLength(1);
    expect(body[0].name).toBe("纷享销客");
  });

  it("creates a new brand", async () => {
    const res = await POST(
      new Request("http://localhost/api/brands", {
        method: "POST",
        body: JSON.stringify({ name: "纷享销客", industry: "CRM" }),
      }),
    );
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.name).toBe("纷享销客");
  });
});
