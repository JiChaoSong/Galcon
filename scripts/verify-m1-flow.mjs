const BASE = "http://localhost:3000";

async function postJson(url, body) {
  const res = await fetch(url, { method: "POST", body: JSON.stringify(body) });
  if (!res.ok) {
    throw new Error(`POST ${url} failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function main() {
  const project = await postJson(`${BASE}/api/projects`, {
    name: "验证流程项目",
    type: "样板报告",
    industry: "B2B SaaS",
  });
  console.log("created project", project.id);

  const targetLink = await postJson(`${BASE}/api/projects/${project.id}/brands`, {
    name: "纷享销客",
    industry: "CRM",
  });
  const targetBrandId = targetLink.brand.id;
  console.log("bound target brand", targetBrandId);

  const competitorLink = await postJson(`${BASE}/api/projects/${project.id}/brands`, {
    name: "销售易",
  });
  const competitorBrandId = competitorLink.brand.id;

  await postJson(`${BASE}/api/projects/${project.id}/competitors`, {
    targetBrandId,
    competitorBrandId,
    competitorType: "直接竞品",
    priority: "高",
  });
  console.log("added competitor relationship");

  const questionTexts = Array.from({ length: 5 }, (_, i) => ({ questionText: `验证问题 ${i + 1}` }));
  const imported = await postJson(`${BASE}/api/questions/batch-import`, {
    projectId: project.id,
    questions: questionTexts,
  });
  console.log("imported questions", imported.length);

  const platforms = await (await fetch(`${BASE}/api/platforms`)).json();

  const generated = await postJson(`${BASE}/api/projects/${project.id}/tasks/generate`, {
    questionIds: imported.map((q) => q.id),
    platformIds: platforms.map((p) => p.id),
    brandIds: [targetBrandId],
  });
  const expectedCount = imported.length * platforms.length;
  console.log(`generated ${generated.createdCount} tasks (expected ${expectedCount})`);
  if (generated.createdCount !== expectedCount) {
    throw new Error("task count mismatch");
  }

  const tasksBody = await (await fetch(`${BASE}/api/projects/${project.id}/tasks?pageSize=1`)).json();
  const firstTask = tasksBody.items[0];

  const answered = await postJson(`${BASE}/api/tasks/${firstTask.id}/answer`, {
    answerText: "纷享销客是国内领先的 CRM 厂商，常被与销售易对比。",
  });
  console.log("answered task, status:", answered.status);
  if (answered.status !== "completed") {
    throw new Error("expected task status to be completed after answering");
  }

  const projectDetail = await (await fetch(`${BASE}/api/projects/${project.id}`)).json();
  console.log("project detail counts:", projectDetail._count);

  console.log("M1 ACCEPTANCE FLOW: PASS");
}

main().catch((err) => {
  console.error("M1 ACCEPTANCE FLOW: FAIL");
  console.error(err);
  process.exit(1);
});
