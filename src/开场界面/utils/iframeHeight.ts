/**
 * iframe 高度自适应工具
 * 用于在 iframe 中自动调整高度以适应内容
 */

/**
 * 获取页面的实际内容高度
 * 考虑缩放后的实际显示高度
 */
function getContentHeight(): number {
  const interfaceElement = document.querySelector('.opening-interface') as HTMLElement;
  
  if (interfaceElement) {
    // 基准高度：800px (3:2比例)
    const BASE_HEIGHT = 800;
    
    // 获取容器尺寸（与index.ts中的逻辑一致）
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    
    // 计算缩放比例（与index.ts中的逻辑一致）
    const BASE_WIDTH = 1200;
    const padding = 20;
    const availableWidth = Math.max(containerWidth - padding * 2, 0);
    const availableHeight = Math.max(containerHeight - padding * 2, 0);
    
    if (availableWidth > 0 && availableHeight > 0) {
      const scaleX = availableWidth / BASE_WIDTH;
      const scaleY = availableHeight / BASE_HEIGHT;
      const scale = Math.min(scaleX, scaleY, 1);
      
      // 返回缩放后的实际高度，加上一些额外的空间以确保可以看到所有内容
      const scaledHeight = BASE_HEIGHT * scale;
      // 由于内容可能超出固定高度，使用更大的高度值
      return Math.max(400, Math.min(scaledHeight * 1.1, 2000)); // 增加10%的余量
    }
  }
  
  // 降级方案：使用传统方法
  const body = document.body;
  const html = document.documentElement;
  const app = document.getElementById('app');

  const heights = [
    body.scrollHeight,
    body.offsetHeight,
    html.clientHeight,
    html.scrollHeight,
    html.offsetHeight,
    app?.scrollHeight || 0,
    app?.offsetHeight || 0,
  ];

  const maxHeight = Math.max(...heights.filter(h => h > 0));
  return Math.max(400, Math.min(maxHeight, 2000));
}

/**
 * 调整 iframe 高度（导出供外部调用）
 */
export function adjustIframeHeight() {
  try {
    const height = getContentHeight();
    const iframe = window.frameElement as HTMLIFrameElement | null;

    if (iframe) {
      // 如果是 iframe，设置高度
      iframe.style.height = `${height}px`;
      console.info(`[开场界面] 调整 iframe 高度: ${height}px`);
    } else {
      // 如果不是 iframe（开发环境），设置 body 高度
      document.body.style.minHeight = `${height}px`;
      console.info(`[开场界面] 调整 body 高度: ${height}px`);
    }
  } catch (error) {
    console.warn('[开场界面] 调整高度失败:', error);
  }
}

/**
 * 初始化自适应高度调整
 */
export function initAutoHeight() {
  // 立即调整一次
  adjustIframeHeight();

  // 使用 ResizeObserver 监听内容变化
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(() => {
      // 使用防抖，避免频繁调用
      clearTimeout((window as any).__heightAdjustTimeout);
      (window as any).__heightAdjustTimeout = setTimeout(() => {
        adjustIframeHeight();
      }, 100);
    });

    const app = document.getElementById('app');
    if (app) {
      observer.observe(app);
    }
    observer.observe(document.body);
    observer.observe(document.documentElement);

    // 监听窗口大小变化
    window.addEventListener('resize', () => {
      adjustIframeHeight();
    });

    console.info('[开场界面] 已启用 ResizeObserver 自动高度调整');
  } else {
    // 降级方案：使用 MutationObserver 和定时器
    const mutationObserver = new MutationObserver(() => {
      adjustIframeHeight();
    });

    mutationObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'class'],
    });

    // 定期检查（作为后备方案）
    setInterval(() => {
      adjustIframeHeight();
    }, 500);

    console.info('[开场界面] 已启用 MutationObserver 自动高度调整（降级方案）');
  }

  // 监听 Vue 应用挂载完成
  setTimeout(() => {
    adjustIframeHeight();
  }, 100);

  // 延迟再次调整，确保所有内容都加载完成
  setTimeout(() => {
    adjustIframeHeight();
  }, 500);

  setTimeout(() => {
    adjustIframeHeight();
  }, 1000);
}

