import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { PATCH } from "./route";

describe("/api/platforms/:id", () => {
  beforeEach(async () => {
    // Ensure at least one platform exists
    const count = await prisma.platform.count();
    if (count === 0) {
      await prisma.platform.createMany({
        data: [
          { name: "DeepSeek", region: "国内", supportsWebSearch: true, testMethod: "手动" },
          { name: "Kimi", region: "国内", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
          { name: "豆包", region: "国内", supportsWebSearch: true, testMethod: "手动" },
          { name: "通义千问", region: "国内", supportsWebSearch: true, testMethod: "手动" },
          { name: "ChatGPT", region: "海外", supportsCitation: true, supportsWebSearch: true, testMethod: "手动" },
        ],
        skipDuplicates: true,
      });
    }
  });

  it("updates platform configuration", async () => {
    const platforms = await prisma.platform.findMany({ take: 1 });
    const platform = platforms[0];

    const res = await PATCH(
      new Request("http://localhost", {
        method: "PATCH",
        body: JSON.stringify({ supportsWebSearch: true, notes: "已开启联网" }),
      }),
      { params: Promise.resolve({ id: platform.id }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.supportsWebSearch).toBe(true);
  });
});
