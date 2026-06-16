import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      _count: { select: { projectBrands: true, questions: true, testTasks: true } },
      projectBrands: { include: { brand: true } },
      testTasks: {
        where: { status: "completed" },
        select: { id: true },
      },
    },
  });

  if (!project) {
    notFound();
  }

  const taskCompletion = project._count.testTasks > 0
    ? `${project.testTasks.length}/${project._count.testTasks}`
    : "0/0";

  return (
    <main className="mx-auto max-w-4xl p-8">
      <Link href="/" className="mb-4 inline-block text-sm text-blue-600 hover:underline">
        ← 返回项目列表
      </Link>
      <h1 className="mb-2 text-2xl font-semibold">{project.name}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {project.type} · {project.industry ?? "未设置行业"} · {project.status}
      </p>

      <div className="mb-6 grid grid-cols-4 gap-4">
        <StatCard label="品牌" value={project._count.projectBrands} />
        <StatCard label="问题" value={project._count.questions} />
        <StatCard label="测试任务" value={project._count.testTasks} />
        <StatCard label="已完成" value={taskCompletion} />
      </div>

      <nav className="mb-8 flex gap-4 text-sm">
        <Link href={`/projects/${id}/brands`} className="text-blue-600 hover:underline">
          品牌与竞品
        </Link>
        <Link href={`/projects/${id}/questions`} className="text-blue-600 hover:underline">
          问题库
        </Link>
        <Link href={`/projects/${id}/tasks`} className="text-blue-600 hover:underline">
          测试任务
        </Link>
        <span className="text-gray-400">指标分析（M2 开放）</span>
        <span className="text-gray-400">报告生成（M3 开放）</span>
      </nav>

      <section>
        <h2 className="mb-3 font-medium">目标品牌</h2>
        <ul className="space-y-1 text-sm">
          {project.projectBrands.map((pb) => (
            <li key={pb.id}>
              {pb.brand.name} <span className="text-gray-400">({pb.role})</span>
            </li>
          ))}
          {project.projectBrands.length === 0 && (
            <li className="text-gray-400">暂无品牌，请先在「品牌与竞品」中添加。</li>
          )}
        </ul>
      </section>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
