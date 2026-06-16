import { prisma } from "@/lib/prisma";
import { PlatformEditor } from "./platform-editor";

export default async function PlatformSettingsPage() {
  const platforms = await prisma.platform.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="mx-auto max-w-3xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">AI 平台配置</h1>
      <PlatformEditor initialPlatforms={platforms} />
    </main>
  );
}
