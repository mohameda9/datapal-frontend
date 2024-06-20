import { createApp } from 'vue'

import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import '@coreui/coreui/dist/css/coreui.min.css';
import CoreuiVue from '@coreui/vue';

const app = createApp(App);
app.use(CoreuiVue);
app.mount('#app');
