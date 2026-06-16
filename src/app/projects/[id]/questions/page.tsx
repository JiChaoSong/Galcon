import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { QuestionManager } from "./question-manager";

export default async function ProjectQuestionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const project = await prisma.project.findUnique({ where: { id } });
  if (!project) {
    notFound();
  }

  const projectQuestions = await prisma.projectQuestion.findMany({
    where: { projectId: id },
    include: { question: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto max-w-4xl p-8">
      <h1 className="mb-6 text-2xl font-semibold">{project.name} · 问题库</h1>
      <QuestionManager projectId={id} initialQuestions={projectQuestions.map((pq) => pq.question)} />
    </main>
  );
}
