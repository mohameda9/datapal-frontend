// src/main.js
import { createApp } from 'vue';
import finalApp from './finalApp.vue'; // Entry view
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '@coreui/coreui/dist/css/coreui.min.css';
import CoreuiVue from '@coreui/vue';
import PrimeVue from 'primevue/config';
import 'primevue/resources/themes/saga-blue/theme.css'; // Choose a theme
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import store from './store';
const app = createApp(finalApp);

app.use(PrimeVue);
app.use(CoreuiVue);
app.use(store)

app.mount('#app');
