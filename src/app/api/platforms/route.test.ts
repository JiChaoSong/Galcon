import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

describe("/api/platforms", () => {
  beforeEach(async () => {
    // Re-seed platforms if they were deleted by other tests
    const count = await prisma.platform.count();
    if (count < 5) {
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

  it("lists all platforms", async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.length).toBeGreaterThanOrEqual(5);
  });
});
