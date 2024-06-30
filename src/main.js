import { createApp } from 'vue'

import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@coreui/coreui/dist/css/coreui.min.css';
import CoreuiVue from '@coreui/vue';
// import 'ant-design-vue/dist/antd.css';
// import Antd from 'ant-design-vue';


const app = createApp(App);
app.use(CoreuiVue); 
// app.use(Antd);

// Optionally install the BootstrapVue icon components plugin
app.mount('#app');
