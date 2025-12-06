import { createApp } from 'vue';
import app from './app.vue';
import './index.scss';
import { initAutoHeight, adjustIframeHeight } from './utils/iframeHeight';

/**
 * 计算并应用界面缩放比例
 * 确保界面保持3:2比例，所有元素（包括背景和组件）统一缩放
 */
function applyScale() {
  const interfaceElement = document.querySelector('.opening-interface') as HTMLElement;
  if (!interfaceElement) return;

  // 基准尺寸：1200px x 800px (3:2比例)
  const BASE_WIDTH = 1200;
  const BASE_HEIGHT = 800;

  // 获取容器尺寸（使用视口尺寸，确保充分利用空间，减少四周空白）
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;

  // 计算缩放比例：取宽度和高度比例中较小的，确保完整显示
  // 减去一些padding，避免紧贴边缘，但不要限制最小值，允许缩小
  const padding = 20;
  const availableWidth = Math.max(containerWidth - padding * 2, 0);
  const availableHeight = Math.max(containerHeight - padding * 2, 0);
  
  // 确保不会除以0
  if (availableWidth <= 0 || availableHeight <= 0) {
    return;
  }
  
  const scaleX = availableWidth / BASE_WIDTH;
  const scaleY = availableHeight / BASE_HEIGHT;
  const scale = Math.min(scaleX, scaleY, 1); // 不超过1，不放大，但允许缩小到能完整显示

  // 应用缩放，使用 top center 作为原点，避免上方被裁剪
  interfaceElement.style.transform = `scale(${scale})`;
  interfaceElement.style.transformOrigin = 'top center';

  console.info(`[开场界面] 应用缩放比例: ${scale.toFixed(3)} (容器: ${containerWidth}x${containerHeight})`);
}

/**
 * 初始化缩放功能
 */
function initScale() {
  // 立即应用一次
  applyScale();

  // 监听窗口大小变化
  let resizeTimer: ReturnType<typeof setTimeout>;
  const handleResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      applyScale();
      // 缩放后重新调整iframe高度
      adjustIframeHeight();
    }, 100);
  };
  
  window.addEventListener('resize', handleResize);

  // 使用 ResizeObserver 监听容器大小变化（更精确）
  const container = document.querySelector('.opening-interface-wrapper');
  if (container && typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      applyScale();
      adjustIframeHeight();
    });
    observer.observe(container);
    
    // 也监听界面元素本身的变化（Vue更新时）
    const interfaceElement = document.querySelector('.opening-interface');
    if (interfaceElement) {
      observer.observe(interfaceElement);
    }
  }

  // 延迟多次应用，确保DOM完全加载和Vue渲染完成
  setTimeout(() => {
    applyScale();
    adjustIframeHeight();
  }, 100);
  
  setTimeout(() => {
    applyScale();
    adjustIframeHeight();
  }, 300);
  
  setTimeout(() => {
    applyScale();
    adjustIframeHeight();
  }, 500);
  
  setTimeout(() => {
    applyScale();
    adjustIframeHeight();
  }, 1000);
}

$(() => {
  try {
    console.info('[开场界面] 开始初始化...');
    const appElement = document.getElementById('app');
    if (!appElement) {
      throw new Error('找不到 #app 元素');
    }

    console.info('[开场界面] 创建 Vue 应用实例...');
    const vueApp = createApp(app);

    console.info('[开场界面] 挂载到 #app...');
    vueApp.mount('#app');

    console.info('[开场界面] Vue 应用挂载成功，初始化缩放和自适应高度...');

    // 等待Vue渲染完成后再初始化缩放
    setTimeout(() => {
      initScale();
      // 初始化自适应高度调整
      initAutoHeight();
    }, 100);

    console.info('[开场界面] 初始化成功！');
  } catch (error) {
    console.error('[开场界面] 初始化失败:', error);
    const appElement = document.getElementById('app');
    if (appElement) {
      appElement.innerHTML = `
        <div style="padding: 20px; color: red; background: white; font-family: monospace;">
          <h2>❌ 开场界面初始化错误</h2>
          <p><strong>错误信息:</strong></p>
          <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto;">${error instanceof Error ? error.message : String(error)}</pre>
          ${error instanceof Error && error.stack ? `<p><strong>堆栈跟踪:</strong></p><pre style="background: #f5f5f5; padding: 10px; border-radius: 4px; overflow: auto; font-size: 12px;">${error.stack}</pre>` : ''}
        </div>
      `;
    }
  }
});
