// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router';
import DataUpload from '../views/DataUpload.vue';
import DataManipulation from '../views/DataManipulation.vue';

const routes = [
  {
    path: '/DataUpload',
    name: 'DataUpload',
    component: DataUpload
  },
  {
    path: '/DataManipulation',
    name: 'DataManipulation',
    component: DataManipulation
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
