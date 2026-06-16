"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Brand, Platform, Question, TestTask } from "@/generated/prisma/client";

type TaskWithRelations = TestTask & { question: Question; platform: Platform; targetBrand: Brand };

export function TaskAnswerForm({ task, nextTaskId }: { task: TaskWithRelations; nextTaskId: string | null }) {
  const router = useRouter();
  const [answerText, setAnswerText] = useState(task.answerText ?? "");
  const [status, setStatus] = useState(task.status);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copyQuestion() {
    await navigator.clipboard.writeText(task.question.questionText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveAnswer() {
    if (!answerText.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/tasks/${task.id}/answer`, {
      method: "POST",
      body: JSON.stringify({ answerText: answerText.trim() }),
    });
    setSaving(false);
    if (res.ok) {
      const body = await res.json();
      setStatus(body.status);
      router.refresh();
    }
  }

  async function markAbnormal() {
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      body: JSON.stringify({ status: "abnormal" }),
    });
    if (res.ok) {
      setStatus("abnormal");
      router.refresh();
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-medium">提问内容</label>
          <button type="button" onClick={copyQuestion} className="text-xs text-blue-600 hover:underline">
            {copied ? "已复制" : "复制"}
          </button>
        </div>
        <p className="rounded border bg-gray-50 px-3 py-2 text-sm">{task.question.questionText}</p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">粘贴 AI 回答</label>
        <textarea
          className="w-full rounded border px-3 py-2 text-sm"
          rows={10}
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          placeholder={`将 ${task.platform.name} 的完整回答粘贴到这里`}
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={saving || !answerText.trim()}
          onClick={saveAnswer}
          className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        >
          {saving ? "保存中..." : "保存回答"}
        </button>
        <button type="button" onClick={markAbnormal} className="rounded border px-3 py-2 text-sm">
          标记异常
        </button>
        <span className="text-sm text-gray-500">当前状态：{status}</span>
      </div>

      {nextTaskId && (
        <Link href={`/tasks/${nextTaskId}`} className="inline-block text-sm text-blue-600 hover:underline">
          下一条任务 →
        </Link>
      )}
    </div>
  );
}
