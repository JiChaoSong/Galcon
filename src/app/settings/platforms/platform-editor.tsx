"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Platform } from "@/generated/prisma/client";

export function PlatformEditor({ initialPlatforms }: { initialPlatforms: Platform[] }) {
  const router = useRouter();
  const [savingId, setSavingId] = useState<string | null>(null);

  async function updatePlatform(
    id: string,
    data: Partial<Pick<Platform, "supportsCitation" | "supportsWebSearch" | "notes">>,
  ) {
    setSavingId(id);
    await fetch(`/api/platforms/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    setSavingId(null);
    router.refresh();
  }

  return (
    <table className="w-full border-collapse text-sm">
      <thead>
        <tr className="border-b text-left text-gray-500">
          <th className="py-2">平台</th>
          <th>地区</th>
          <th>支持引用源</th>
          <th>支持联网</th>
          <th>测试方式</th>
        </tr>
      </thead>
      <tbody>
        {initialPlatforms.map((platform) => (
          <tr key={platform.id} className="border-b">
            <td className="py-3 font-medium">{platform.name}</td>
            <td>{platform.region}</td>
            <td>
              <input
                type="checkbox"
                checked={platform.supportsCitation}
                disabled={savingId === platform.id}
                onChange={(e) => updatePlatform(platform.id, { supportsCitation: e.target.checked })}
              />
            </td>
            <td>
              <input
                type="checkbox"
                checked={platform.supportsWebSearch}
                disabled={savingId === platform.id}
                onChange={(e) => updatePlatform(platform.id, { supportsWebSearch: e.target.checked })}
              />
            </td>
            <td>{platform.testMethod}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
