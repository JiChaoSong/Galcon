import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NewProjectDialog } from "./new-project-dialog";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { projectBrands: true, questions: true, testTasks: true } },
    },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">GEO 诊断工作台</h1>
        <NewProjectDialog />
      </div>

      {projects.length === 0 ? (
        <p className="text-gray-500">暂无项目，请新建一个开始。</p>
      ) : (
        <div className="space-y-2">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="flex items-center justify-between rounded border px-4 py-3 hover:bg-gray-50"
            >
              <div>
                <p className="font-medium">{project.name}</p>
                <p className="text-sm text-gray-500">
                  {project.type} · {project.industry ?? "未设置行业"} · {project.status}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                品牌 {project._count.projectBrands} · 问题 {project._count.questions} · 任务 {project._count.testTasks}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
