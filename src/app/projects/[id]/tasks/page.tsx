import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskGenerator } from "./task-generator";

const PAGE_SIZE = 50;

export default async function ProjectTasksPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { id } = await params;
  const { status, page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam ?? "1"));

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const [activeQuestions, platforms, boundBrands, tasks, total] = await Promise.all([
    prisma.projectQuestion.findMany({
      where: { projectId: id, question: { status: "active" } },
      include: { question: true },
    }),
    prisma.platform.findMany({ orderBy: { name: "asc" } }),
    prisma.projectBrand.findMany({ where: { projectId: id, role: "target" }, include: { brand: true } }),
    prisma.testTask.findMany({
      where: { projectId: id, ...(status ? { status } : {}) },
      include: { question: true, platform: true, targetBrand: true },
      orderBy: { createdAt: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.testTask.count({ where: { projectId: id, ...(status ? { status } : {}) } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{project.name} · 测试任务</h1>

      <TaskGenerator
        projectId={id}
        questions={activeQuestions.map((pq) => pq.question)}
        platforms={platforms}
        brands={boundBrands.map((pb) => pb.brand)}
      />

      <div className="mb-3 mt-10 flex gap-3 text-sm">
        {["", "pending", "completed", "needs_review", "abnormal"].map((s) => (
          <Link
            key={s}
            href={`/projects/${id}/tasks${s ? `?status=${s}` : ""}`}
            className={`rounded px-2 py-1 ${status === s || (!status && s === "") ? "bg-black text-white" : "bg-gray-100"}`}
          >
            {s === "" ? "全部" : s}
          </Link>
        ))}
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b text-left text-gray-500">
            <th className="py-2">问题</th>
            <th>平台</th>
            <th>目标品牌</th>
            <th>状态</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => (
            <tr key={task.id} className="border-b">
              <td className="max-w-sm truncate py-2">{task.question.questionText}</td>
              <td>{task.platform.name}</td>
              <td>{task.targetBrand.name}</td>
              <td>{task.status}</td>
              <td>
                <Link className="text-blue-600 hover:underline" href={`/tasks/${task.id}`}>
                  执行 →
                </Link>
              </td>
            </tr>
          ))}
          {tasks.length === 0 && (
            <tr>
              <td colSpan={5} className="py-6 text-center text-gray-400">
                暂无任务，请先在上方生成测试任务。
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="mt-4 flex gap-2 text-sm">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/projects/${id}/tasks?${status ? `status=${status}&` : ""}page=${p}`}
              className={`rounded px-2 py-1 ${p === page ? "bg-black text-white" : "bg-gray-100"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
