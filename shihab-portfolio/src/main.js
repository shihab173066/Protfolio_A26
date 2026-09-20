import { createApp } from 'vue'
import './index.css'
import App from './App.vue'
import router from './router'
import { reveal } from './directives/reveal'
import { initContent } from './composables/useContent'
import { initAuth } from './composables/useAuth'

initContent()
// Resolve any existing admin session before the router renders, so a reload on
// /#/admin does not flash the sign-in form.
initAuth()

createApp(App).use(router).directive('reveal', reveal).mount('#app')
