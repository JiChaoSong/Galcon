"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Brand, Competitor, ProjectBrand } from "@/generated/prisma/client";

type BoundBrand = ProjectBrand & { brand: Brand };
type CompetitorRow = Competitor & { targetBrand: Brand; competitorBrand: Brand };

const COMPETITOR_TYPES = ["直接竞品", "替代方案", "国际竞品", "间接竞品"] as const;
const PRIORITIES = ["高", "中", "低"] as const;

export function BrandManager({
  projectId,
  initialBoundBrands,
  allBrands,
  initialCompetitors,
}: {
  projectId: string;
  initialBoundBrands: BoundBrand[];
  allBrands: Brand[];
  initialCompetitors: CompetitorRow[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [newBrandName, setNewBrandName] = useState("");
  const [targetBrandId, setTargetBrandId] = useState("");
  const [competitorBrandId, setCompetitorBrandId] = useState("");
  const [competitorType, setCompetitorType] = useState<string>(COMPETITOR_TYPES[0]);
  const [priority, setPriority] = useState<string>(PRIORITIES[1]);
  const [error, setError] = useState<string | null>(null);

  const boundBrandIds = new Set(initialBoundBrands.map((b) => b.brandId));
  const searchResults = useMemo(
    () =>
      query.trim()
        ? allBrands.filter((b) => b.name.includes(query.trim()) && !boundBrandIds.has(b.id)).slice(0, 8)
        : [],
    [query, allBrands, boundBrandIds],
  );

  async function bindBrand(body: Record<string, unknown>) {
    setError(null);
    const res = await fetch(`/api/projects/${projectId}/brands`, { method: "POST", body: JSON.stringify(body) });
    if (!res.ok) {
      setError("添加品牌失败");
      return;
    }
    setQuery("");
    setNewBrandName("");
    router.refresh();
  }

  async function addCompetitor() {
    setError(null);
    if (!targetBrandId || !competitorBrandId) {
      setError("请选择目标品牌和竞品品牌");
      return;
    }
    const res = await fetch(`/api/projects/${projectId}/competitors`, {
      method: "POST",
      body: JSON.stringify({ targetBrandId, competitorBrandId, competitorType, priority }),
    });
    if (!res.ok) {
      setError("添加竞品关系失败（可能已存在该关系）");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 font-medium">已绑定品牌</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {initialBoundBrands.map((pb) => (
            <li key={pb.id} className="rounded border px-3 py-2">
              {pb.brand.name} <span className="text-gray-400">({pb.role})</span> — {pb.brand.industry ?? "未设置行业"}
            </li>
          ))}
          {initialBoundBrands.length === 0 && <li className="text-gray-400">暂无品牌</li>}
        </ul>

        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs text-gray-500">搜索已有品牌复用</label>
            <input
              className="rounded border px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="输入品牌名称"
            />
            {searchResults.length > 0 && (
              <ul className="mt-1 max-w-xs rounded border bg-white text-sm shadow">
                {searchResults.map((b) => (
                  <li key={b.id}>
                    <button
                      type="button"
                      className="block w-full px-3 py-1.5 text-left hover:bg-gray-50"
                      onClick={() => bindBrand({ brandId: b.id })}
                    >
                      {b.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-500">或创建新品牌</label>
            <div className="flex gap-2">
              <input
                className="rounded border px-3 py-2 text-sm"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="新品牌名称"
              />
              <button
                type="button"
                className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
                disabled={!newBrandName.trim()}
                onClick={() => bindBrand({ name: newBrandName.trim() })}
              >
                添加
              </button>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-medium">竞品关系</h2>
        <ul className="mb-4 space-y-1 text-sm">
          {initialCompetitors.map((c) => (
            <li key={c.id} className="rounded border px-3 py-2">
              {c.targetBrand.name} 的竞品: {c.competitorBrand.name} — {c.competitorType} / 优先级 {c.priority}
            </li>
          ))}
          {initialCompetitors.length === 0 && <li className="text-gray-400">暂无竞品关系</li>}
        </ul>

        <div className="flex flex-wrap items-end gap-3 text-sm">
          <LabeledSelect
            label="目标品牌"
            value={targetBrandId}
            onChange={setTargetBrandId}
            options={initialBoundBrands.map((pb) => [pb.brand.id, pb.brand.name] as [string, string])}
          />
          <LabeledSelect
            label="竞品品牌"
            value={competitorBrandId}
            onChange={setCompetitorBrandId}
            options={allBrands.map((b) => [b.id, b.name] as [string, string])}
          />
          <LabeledSelect
            label="竞品类型"
            value={competitorType}
            onChange={setCompetitorType}
            options={COMPETITOR_TYPES.map((t) => [t, t] as [string, string])}
          />
          <LabeledSelect
            label="优先级"
            value={priority}
            onChange={setPriority}
            options={PRIORITIES.map((p) => [p, p] as [string, string])}
          />
          <button type="button" className="rounded bg-black px-3 py-2 text-white" onClick={addCompetitor}>
            添加竞品关系
          </button>
        </div>
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}

function LabeledSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div>
      <label className="mb-1 block text-xs text-gray-500">{label}</label>
      <select className="rounded border px-2 py-2" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">请选择</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
