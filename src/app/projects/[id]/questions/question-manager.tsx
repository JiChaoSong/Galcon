"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Question } from "@/generated/prisma/client";

const QUESTION_TYPES = ["品类推荐", "竞品对比", "场景解决", "采购决策", "替代方案", "品牌认知", "风险口碑"] as const;

export function QuestionManager({
  projectId,
  initialQuestions,
}: {
  projectId: string;
  initialQuestions: Question[];
}) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [type, setType] = useState<string>(QUESTION_TYPES[0]);
  const [batchText, setBatchText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);

  async function addSingle() {
    if (!text.trim()) return;
    setError(null);
    const res = await fetch("/api/questions", {
      method: "POST",
      body: JSON.stringify({ questionText: text.trim(), questionType: type, projectId }),
    });
    if (!res.ok) {
      setError("添加问题失败");
      return;
    }
    setText("");
    router.refresh();
  }

  async function importBatch() {
    const lines = batchText
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length === 0) return;

    setImporting(true);
    setError(null);
    const res = await fetch("/api/questions/batch-import", {
      method: "POST",
      body: JSON.stringify({ projectId, questions: lines.map((questionText) => ({ questionText })) }),
    });
    setImporting(false);

    if (!res.ok) {
      setError("批量导入失败");
      return;
    }
    setBatchText("");
    router.refresh();
  }

  async function toggleStatus(question: Question) {
    const nextStatus = question.status === "active" ? "deprecated" : "active";
    const res = await fetch(`/api/questions/${question.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus }),
    });
    if (res.ok) {
      router.refresh();
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="mb-2 font-medium">新增单条问题</h2>
          <textarea
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            rows={3}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例如：CRM 行业有哪些值得推荐的厂商？"
          />
          <select
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            {QUESTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <button type="button" className="rounded bg-black px-3 py-2 text-sm text-white" onClick={addSingle}>
            添加问题
          </button>
        </div>

        <div>
          <h2 className="mb-2 font-medium">批量导入（每行一个问题）</h2>
          <textarea
            className="mb-2 w-full rounded border px-3 py-2 text-sm"
            rows={5}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder={"问题一\n问题二\n问题三"}
          />
          <button
            type="button"
            disabled={importing}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
            onClick={importBatch}
          >
            {importing ? "导入中..." : "批量导入"}
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="mb-3 font-medium">问题列表（{initialQuestions.length}）</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-2">问题内容</th>
              <th>类型</th>
              <th>状态</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {initialQuestions.map((q) => (
              <tr key={q.id} className="border-b">
                <td className="py-2">{q.questionText}</td>
                <td>{q.questionType ?? "-"}</td>
                <td>{q.status}</td>
                <td>
                  <button type="button" className="text-blue-600 hover:underline" onClick={() => toggleStatus(q)}>
                    {q.status === "active" ? "废弃" : "启用"}
                  </button>
                </td>
              </tr>
            ))}
            {initialQuestions.length === 0 && (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400">
                  暂无问题，请在左侧新增或批量导入。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
