import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { resetDb } from "@/lib/test/reset-db";
import { PATCH } from "./route";

describe("/api/questions/:id", () => {
  beforeEach(async () => {
    await resetDb();
  });

  it("updates question text and status", async () => {
    const question = await prisma.question.create({ data: { questionText: "Old text" } });

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ questionText: "New text", status: "deprecated" }),
      }),
      { params: Promise.resolve({ id: question.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.questionText).toBe("New text");
    expect(body.status).toBe("deprecated");
  });
});
