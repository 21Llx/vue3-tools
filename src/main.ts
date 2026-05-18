import { createApp } from 'vue'
import './styles/style.css'
import './styles/index.less'
import App from './App.vue'
import { setupRouter } from '@/router';
// import { registerMicroApps, start } from 'qiankun';

// registerMicroApps([
//   {
//     name: 'vue2-template', // app name registered
//     entry: '//localhost:8080',
//     container: '#container',
//     activeRule: '/app',
//     props: {
//       slogan: 'Hello Qiankun',
//     },
//   }
// ]);

// start();
function bootstrap() {
  window.document.documentElement.setAttribute('data-theme', 'default')
  const app = createApp(App);
  setupRouter(app);
  app.mount('#app');
}

bootstrap()