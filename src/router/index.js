// src/router.js
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from '../HomePage.vue';
import ProjectPage from '../ProjectPage.vue';

const routes = [
  {
    path: '/',
    name: 'HomePage',
    component: HomePage
  },
  {
    path: '/project',
    name: 'ProjectPage',
    component: ProjectPage
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
