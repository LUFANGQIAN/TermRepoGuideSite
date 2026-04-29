import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setupHttp } from './services/http'

const app = createApp(App)

app.use(createPinia())
app.use(router)

setupHttp()

app.mount('#app')
