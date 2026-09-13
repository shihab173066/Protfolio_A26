import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import router from './router'
import { reveal } from './directives/reveal'
import { initContent } from './composables/useContent'

initContent()

createApp(App).use(router).directive('reveal', reveal).mount('#app')
