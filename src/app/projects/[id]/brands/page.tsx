import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { BrandManager } from "./brand-manager";

export default async function ProjectBrandsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const [boundBrands, allBrands, competitors] = await Promise.all([
    prisma.projectBrand.findMany({
      where: { projectId: id },
      include: { brand: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.brand.findMany({ orderBy: { name: "asc" } }),
    prisma.competitor.findMany({
      where: { projectId: id },
      include: { targetBrand: true, competitorBrand: true },
    }),
  ]);

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{project.name} · 品牌与竞品</h1>
      <BrandManager
        projectId={id}
        initialBoundBrands={boundBrands}
        allBrands={allBrands}
        initialCompetitors={competitors}
      />
    </main>
  );
}
