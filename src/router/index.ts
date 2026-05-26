import type { App } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('@/views/home.vue'),
  },
  {
    path: '/app',
    name: 'app',
    component: () => import('@/views/port.vue'),
  },
  {
    path: '/app/about',
    name: 'appAbout',
    component: () => import('@/views/port.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('@/views/about.vue'),
  },
  {
    path: '/text',
    name: 'text',
    component: () => import('@/views/text.vue'),
  },
  {
    path: '/request',
    name: 'request',
    component: () => import('@/views/request.vue'),
  },
  {
    path: '/flowchart',
    name: 'flowchart',
    component: () => import('@/views/flowchart.vue'),
  },
  {
    path: '/lottery',
    name: 'lottery',
    component: () => import('@/views/lottery.vue'),
  },
]
export const router = createRouter({
  history: createWebHistory(import.meta.env.VITE_PUBLIC_PATH),
  routes: routes,
  strict: true,
  scrollBehavior: () => ({ left: 0, top: 0 }),
});
export function setupRouter(app: App<Element>) {
  app.use(router);
}