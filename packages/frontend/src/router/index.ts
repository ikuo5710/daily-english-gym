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
  ],
});

export default router;
