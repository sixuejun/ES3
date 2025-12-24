import * as PIXI from 'pixi.js';
import { createApp } from 'vue';
import './styles/globals.css';

// 将 PIXI 挂载到全局，供 pixi-live2d-display 使用
(window as any).PIXI = PIXI;

// 动态加载脚本的通用函数
function loadScript(src: string, checkGlobal?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 如果指定了全局变量检查，且已经加载，直接返回
    if (checkGlobal && (window as any)[checkGlobal]) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.async = false; // 确保按顺序加载
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
}

// 确保 Live2D 运行时已加载（兼容 HTML 预加载和动态加载）
async function ensureLive2DRuntimes(): Promise<void> {
  try {
    // 1. 检查并加载 Cubism 2.1 运行时 (live2d.min.js)
    if (typeof (window as any).Live2D === 'undefined') {
      console.info('[Live2D] 开始加载 Cubism 2.1 运行时...');
      await loadScript('https://cdn.jsdelivr.net/gh/dylanNew/live2d/webgl/Live2D/lib/live2d.min.js', 'Live2D');
      console.info('[Live2D] Cubism 2.1 运行时加载成功');
    } else {
      console.info('[Live2D] Cubism 2.1 运行时已从 HTML 预加载');
    }

    // 2. 检查并加载 Cubism 4 运行时 (live2dcubismcore.min.js)
    if (typeof (window as any).Live2DCubismCore === 'undefined') {
      console.info('[Live2D] 开始加载 Cubism 4 运行时...');
      await loadScript('https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js', 'Live2DCubismCore');
      console.info('[Live2D] Cubism 4 运行时加载成功');
    } else {
      console.info('[Live2D] Cubism 4 运行时已从 HTML 预加载');
    }

    console.info('[Live2D] 所有运行时已就绪，支持 Cubism 2/3/4 模型');
  } catch (error) {
    console.error('[Live2D] 运行时加载失败:', error);
    throw error;
  }
}

$(() => {
  // 确保 Live2D 运行时已加载，然后动态导入组件
  // 使用 webpack 的 eager 模式确保组件被打包到主 bundle 中，避免代码分割路径问题
  ensureLive2DRuntimes()
    .then(async () => {
      // 运行时已加载，现在可以安全地导入组件
      // 使用 /* webpackMode: "eager" */ 确保不创建单独的 chunk
      const { default: GalgamePlayer } = await import(
        /* webpackMode: "eager" */
        './components/GalgamePlayer.vue'
      );
      createApp(GalgamePlayer).mount('#app');
      console.info('[应用] Vue 应用已挂载');
    })
    .catch(error => {
      console.error('[应用] 启动失败:', error);
      toastr.error('应用启动失败：Live2D 运行时加载失败，请刷新页面重试');
    });
});
