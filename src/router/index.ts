import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/projects',
    children: [
      {
        path: 'projects',
        name: 'Projects',
        component: () => import('@/views/ProjectManage.vue'),
        meta: { title: '项目管理' },
      },
      {
        path: 'settings/:section?',
        name: 'Settings',
        component: () => import('@/views/Settings.vue'),
        meta: { title: '系统设置' },
      },
      {
        path: 'about',
        name: 'About',
        component: () => import('@/views/About.vue'),
        meta: { title: '关于' },
      },

    ],
  },
  {
    path: '/projects/:id',
    component: () => import('@/layouts/ProjectLayout.vue'),
    redirect: (to) => ({ name: 'ProjectBrands', params: { id: to.params.id } }),
    children: [
      {
        path: 'overview',
        name: 'ProjectOverview',
        component: () => import('@/views/project/Overview.vue'),
        meta: { title: '项目概览', parentMenu: 'ProjectBrands' },
      },
      {
        path: 'brands',
        name: 'ProjectBrands',
        component: () => import('@/views/project/Brands.vue'),
        meta: { title: '项目概览' },
      },
      {
        path: 'questions',
        name: 'ProjectQuestions',
        component: () => import('@/views/project/Questions.vue'),
        meta: { title: '问题库' },
      },
      {
        path: 'tasks',
        name: 'ProjectTasks',
        component: () => import('@/views/project/Tasks.vue'),
        meta: { title: '测试任务' },
      },
      {
        path: 'tasks/:batchId/execute',
        name: 'TaskExecution',
        component: () => import('@/views/project/TaskExecution.vue'),
        meta: { title: '测试任务执行台', parentMenu: 'ProjectTasks' },
      },
      {
        path: 'metrics',
        name: 'ProjectMetrics',
        component: () => import('@/views/project/Metrics.vue'),
        meta: { title: '指标分析' },
      },
      {
        path: 'report',
        name: 'ProjectReport',
        component: () => import('@/views/project/Report.vue'),
        meta: { title: '报告' },
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
