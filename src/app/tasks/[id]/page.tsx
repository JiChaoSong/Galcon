import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { TaskAnswerForm } from "./task-answer-form";

export default async function TaskExecutionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const task = await prisma.testTask.findUnique({
    where: { id },
    include: { question: true, platform: true, targetBrand: true, project: true },
  });

  if (!task) {
    notFound();
  }

  const nextTask = await prisma.testTask.findFirst({
    where: { projectId: task.projectId, status: "pending", createdAt: { gt: task.createdAt } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <main className="mx-auto max-w-2xl p-8">
      <Link
        href={`/projects/${task.projectId}/tasks`}
        className="mb-4 inline-block text-sm text-blue-600 hover:underline"
      >
        ← 返回任务列表
      </Link>
      <h1 className="mb-1 text-xl font-semibold">{task.platform.name}</h1>
      <p className="mb-6 text-sm text-gray-500">目标品牌：{task.targetBrand.name}</p>
      <TaskAnswerForm task={task} nextTaskId={nextTask?.id ?? null} />
    </main>
  );
}
