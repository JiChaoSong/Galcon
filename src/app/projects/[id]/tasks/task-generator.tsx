"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand, Platform, Question } from "@/generated/prisma/client";

export function TaskGenerator({
  projectId,
  questions,
  platforms,
  brands,
}: {
  projectId: string;
  questions: Question[];
  platforms: Platform[];
  brands: Brand[];
}) {
  const router = useRouter();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>(questions.map((q) => q.id));
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>(platforms.map((p) => p.id));
  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>(brands.map((b) => b.id));
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  function toggle(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  }

  async function generate() {
    if (selectedQuestionIds.length === 0 || selectedPlatformIds.length === 0 || selectedBrandIds.length === 0) {
      setResult("请至少选择一个问题、一个平台和一个品牌");
      return;
    }

    setGenerating(true);
    setResult(null);
    const res = await fetch(`/api/projects/${projectId}/tasks/generate`, {
      method: "POST",
      body: JSON.stringify({
        questionIds: selectedQuestionIds,
        platformIds: selectedPlatformIds,
        brandIds: selectedBrandIds,
      }),
    });
    setGenerating(false);

    if (!res.ok) {
      setResult("生成失败");
      return;
    }

    const body = await res.json();
    setResult(`新生成 ${body.createdCount} 条测试任务`);
    router.refresh();
  }

  return (
    <section className="rounded border p-4">
      <h2 className="mb-3 font-medium">生成测试任务</h2>
      <div className="mb-3 grid grid-cols-3 gap-4 text-sm">
        <CheckboxGroup
          title={`问题 (${selectedQuestionIds.length}/${questions.length})`}
          items={questions.map((q) => [q.id, q.questionText] as [string, string])}
          selected={selectedQuestionIds}
          onToggle={(id) => toggle(selectedQuestionIds, setSelectedQuestionIds, id)}
        />
        <CheckboxGroup
          title={`平台 (${selectedPlatformIds.length}/${platforms.length})`}
          items={platforms.map((p) => [p.id, p.name] as [string, string])}
          selected={selectedPlatformIds}
          onToggle={(id) => toggle(selectedPlatformIds, setSelectedPlatformIds, id)}
        />
        <CheckboxGroup
          title={`品牌 (${selectedBrandIds.length}/${brands.length})`}
          items={brands.map((b) => [b.id, b.name] as [string, string])}
          selected={selectedBrandIds}
          onToggle={(id) => toggle(selectedBrandIds, setSelectedBrandIds, id)}
        />
      </div>
      <button
        type="button"
        disabled={generating}
        className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
        onClick={generate}
      >
        {generating ? "生成中..." : "生成测试任务"}
      </button>
      {result && <p className="mt-2 text-sm text-gray-600">{result}</p>}
    </section>
  );
}

function CheckboxGroup({
  title,
  items,
  selected,
  onToggle,
}: {
  title: string;
  items: [string, string][];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{title}</p>
      <div className="max-h-40 space-y-1 overflow-y-auto rounded border p-2">
        {items.map(([id, label]) => (
          <label key={id} className="flex items-center gap-2 truncate">
            <input type="checkbox" checked={selected.includes(id)} onChange={() => onToggle(id)} />
            <span className="truncate">{label}</span>
          </label>
        ))}
        {items.length === 0 && <p className="text-gray-400">无可选项</p>}
      </div>
    </div>
  );
}
