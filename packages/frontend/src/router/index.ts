import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/input',
      name: 'input',
      component: () => import('@/views/InputView.vue'),
    },
    {
      path: '/understand',
      name: 'understand',
      component: () => import('@/views/UnderstandView.vue'),
    },
    {
      path: '/speak',
      name: 'speak',
      component: () => import('@/views/SpeakView.vue'),
    },
    {
      path: '/reflect',
      name: 'reflect',
      component: () => import('@/views/ReflectView.vue'),
    },
    {
      path: '/history',
      name: 'history',
      component: () => import('@/views/HistoryView.vue'),
    },
    {
      path: '/summary',
      name: 'summary',
      component: () => import('@/views/SummaryView.vue'),
    },
  ],
});

export default router;
