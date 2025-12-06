import { createApp } from 'vue';
import GalgamePlayer from './components/GalgamePlayer.vue';
import './styles/globals.css';

$(() => {
  createApp(GalgamePlayer).mount('#app');
});
