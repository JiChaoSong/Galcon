"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewProjectDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("样板报告");
  const [saving, setSaving] = useState(false);

  async function create() {
    if (!name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      body: JSON.stringify({ name: name.trim(), type }),
    });
    setSaving(false);
    if (res.ok) {
      const project = await res.json();
      setOpen(false);
      setName("");
      router.push(`/projects/${project.id}`);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded bg-black px-4 py-2 text-sm text-white"
      >
        新建项目
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="w-full max-w-md rounded bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-lg font-medium">新建项目</h2>
        <label className="mb-1 block text-sm">项目名称</label>
        <input
          className="mb-3 w-full rounded border px-3 py-2 text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：CRM 行业样板报告"
        />
        <label className="mb-1 block text-sm">项目类型</label>
        <select
          className="mb-4 w-full rounded border px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value)}
        >
          <option value="样板报告">样板报告</option>
          <option value="客户诊断">客户诊断</option>
          <option value="月度复测">月度复测</option>
        </select>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border px-3 py-2 text-sm"
          >
            取消
          </button>
          <button
            type="button"
            disabled={saving || !name.trim()}
            onClick={create}
            className="rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50"
          >
            {saving ? "创建中..." : "创建"}
          </button>
        </div>
      </div>
    </div>
  );
}
