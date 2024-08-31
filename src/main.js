// src/main.js
import { createApp } from 'vue';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@coreui/coreui/dist/css/coreui.min.css';
import CoreuiVue from '@coreui/vue';
import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/saga-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import store from './store';
import router from './router'; // Import the router
import App from './finalApp.vue';
const app = createApp(App); 
import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';

app.use(PrimeVue);
app.use(CoreuiVue);
app.use(store);
app.use(router); // Use the router
app.use(ToastService);
app.component('Toast', Toast);

app.mount('#app');
