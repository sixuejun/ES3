/**
 * Pixi Live2D 渲染器
 * 使用 pixi-live2d-display 库来渲染 Live2D 模型
 */

import { Live2DModel } from 'pixi-live2d-display';
import * as PIXI from 'pixi.js';
import { live2dModelManager } from '../managers/Live2DModelManager';

// Live2D 模型配置接口
export interface Live2DModelConfig {
  id: string;
  name: string;
  modelPath: string;
  basePath: string;
  version: number;
  motions?: Array<{
    group: string;
    name: string;
    file: string;
    index?: number;
    motionType?: 'motion' | 'expression';
    textMappings?: string[];
  }>;
  expressions?: string[];
  textures?: string[];
  physics?: string;
  pose?: string;
  /** 默认动画配置（从世界书读取） */
  defaultAnimation?: {
    motion?: string;
    expression?: string;
    autoLoop?: boolean;
  };
  /** 文本映射配置（向后兼容，新格式使用 motions 中的 textMappings） */
  textMappings?: {
    motions?: Record<string, string>;
    expressions?: Record<string, string>;
  };
}

/**
 * Pixi Live2D 渲染器类
 * 使用 pixi-live2d-display 加载和渲染 Live2D 模型
 */
export class PixiLive2DRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private app: PIXI.Application | null = null;
  private model: Live2DModel | null = null;
  private isInitialized = false;
  private config: Live2DModelConfig | null = null;

  /**
   * 获取当前显示尺寸（优先 renderer.screen，后备 canvas 尺寸）
   */
  private getDisplaySize(): { width: number; height: number } {
    const screenWidth = this.app?.renderer?.screen?.width;
    const screenHeight = this.app?.renderer?.screen?.height;
    if (screenWidth && screenHeight) {
      return { width: screenWidth, height: screenHeight };
    }
    const canvasWidth = this.canvas?.clientWidth || this.canvas?.offsetWidth || this.canvas?.width || 800;
    const canvasHeight = this.canvas?.clientHeight || this.canvas?.offsetHeight || this.canvas?.height || 600;
    return { width: canvasWidth, height: canvasHeight };
  }

  /**
   * 初始化渲染器
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.isInitialized) return;

    try {
      // 获取 canvas 尺寸（在手机上可能为 0，需要后备值）
      const canvasWidth = canvas.clientWidth || canvas.offsetWidth || 800;
      const canvasHeight = canvas.clientHeight || canvas.offsetHeight || 600;

      console.info('[PixiLive2DRenderer] 开始初始化，canvas:', {
        exists: !!canvas,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
        finalWidth: canvasWidth,
        finalHeight: canvasHeight,
      });

      // 如果 canvas 尺寸为 0，记录警告但继续初始化（使用后备值）
      if (canvas.clientWidth === 0 || canvas.clientHeight === 0) {
        console.warn('[PixiLive2DRenderer] Canvas 尺寸为 0，使用后备值:', {
          width: canvasWidth,
          height: canvasHeight,
      });
      }

      this.canvas = canvas;

      // 创建 Pixi 应用实例（使用后备值确保不为 0）
      this.app = new PIXI.Application({
        view: canvas,
        autoStart: true,
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: 0x000000,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      });

      console.info('[PixiLive2DRenderer] Pixi 应用创建成功', {
        screenWidth: this.app.renderer?.screen?.width,
        screenHeight: this.app.renderer?.screen?.height,
      });

      if (!this.app.renderer?.screen) {
        console.warn('[PixiLive2DRenderer] renderer.screen 不可用，后续将使用 canvas 尺寸作为后备');
      }

      // 监听画布大小变化
      const resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      resizeObserver.observe(canvas);

      this.isInitialized = true;
      console.info('[PixiLive2DRenderer] 渲染器初始化成功');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('[PixiLive2DRenderer] 渲染器初始化失败:', errorMessage);
      if (errorStack) {
        console.error('[PixiLive2DRenderer] 初始化错误堆栈:', errorStack);
      }
      console.error(
        '[PixiLive2DRenderer] 初始化错误详情:',
        JSON.stringify({ message: errorMessage, stack: errorStack }, null, 2),
      );
      throw error;
    }
  }

  /**
   * 加载模型（使用模型管理器缓存）
   */
  async loadModel(config: Live2DModelConfig): Promise<void> {
    if (!this.isInitialized || !this.app) {
      throw new Error('渲染器未初始化');
    }

    try {
      console.info(`[PixiLive2DRenderer] 开始加载模型: "${config.name}"`);

      // 从模型管理器获取或加载模型（会自动使用缓存）
      const model = await live2dModelManager.getOrLoadModel(config);

      // 移除旧模型（但不销毁，因为它可能被缓存）
      if (this.model) {
        this.app.stage.removeChild(this.model as any);
        // 不调用 destroy()，让模型管理器管理生命周期
      }

      this.model = model;
      this.config = config;

      // 将模型添加到舞台
      this.app.stage.addChild(model as any);

      // 设置模型锚点为底部中心，符合 Galgame 风格
      model.anchor.set(0.5, 1.0);

      // 使用可用的显示尺寸（兼容 renderer.screen 未就绪的情况）
      const { width: displayWidth, height: displayHeight } = this.getDisplaySize();
      const baseScale = Math.min(displayWidth / model.width, displayHeight / model.height) * 0.3;
      model.scale.set(baseScale);

      // 默认位置：居中底部
      model.x = displayWidth / 2;
      model.y = displayHeight;

      // 确保模型可见（alpha = 1）
      model.alpha = 1;
      model.visible = true;

      console.info(`[PixiLive2DRenderer] 模型 "${config.name}" 已加载并添加到舞台`);

      // 播放默认动画（如果有）
      if (config.defaultAnimation) {
        if (config.defaultAnimation.motion) {
          // 查找动作（优先使用新格式，如果 motionType 为 motion）
          const motionConfig = config.motions?.find(
            m =>
              (m.name === config.defaultAnimation?.motion || m.file === config.defaultAnimation?.motion) &&
              m.motionType !== 'expression',
          );
          if (motionConfig && motionConfig.index !== undefined) {
            // 使用新格式：直接使用 group 和 index
            // 保留原始 group 名称（包括空字符串），不做转换
            const group = motionConfig.group ?? 'default';
            this.playMotion(group, motionConfig.index, 1); // priority 1 = idle priority
          } else if (motionConfig) {
            // 向后兼容：使用旧的查找方式
            const motionIndex = config.motions?.findIndex(
              m => m.name === config.defaultAnimation?.motion || m.file === config.defaultAnimation?.motion,
            );
            if (motionIndex !== undefined && motionIndex >= 0 && config.motions) {
              const motionGroup = config.motions[motionIndex].group ?? 'default';
              this.playMotion(motionGroup, motionIndex, 1);
            }
          }
        }
        if (config.defaultAnimation.expression) {
          // 查找表情（优先使用新格式，如果 motionType 为 expression）
          const expressionConfig = config.motions?.find(
            m =>
              (m.name === config.defaultAnimation?.expression || m.file === config.defaultAnimation?.expression) &&
              m.motionType === 'expression',
          );
          if (expressionConfig && expressionConfig.index !== undefined) {
            // 使用新格式：直接使用 group 和 index，优先级为 2（normal，不打断动作）
            // 保留原始 group 名称（包括空字符串），不做转换
            const group = expressionConfig.group ?? 'default';
            this.playMotion(group, expressionConfig.index, 2);
          } else {
            // 向后兼容：使用旧的 expression API
            const expressionIndex = config.expressions?.findIndex(
              e => e === config.defaultAnimation?.expression || e.includes(config.defaultAnimation?.expression || ''),
            );
            if (expressionIndex !== undefined && expressionIndex >= 0) {
              this.playExpression(expressionIndex);
            }
          }
        }
      }
    } catch (error) {
      console.error('[PixiLive2DRenderer] 加载模型失败:', error);
      throw new Error(`加载模型失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 播放动作
   * @param group 动作组名
   * @param index 动作索引
   * @param priority 优先级 (1=idle可被打断, 2=normal正常, 3=force强制)
   */
  playMotion(group: string, index: number, priority: number = 2): void {
    if (!this.model) {
      console.warn('[PixiLive2DRenderer] 模型未加载，无法播放动作');
      return;
    }

    try {
      console.info(`[PixiLive2DRenderer] 播放动作: 组="${group}", 索引=${index}, 优先级=${priority}`);

      // pixi-live2d-display 的 motion 方法
      // priority: 1=idle(循环), 2=normal(一次), 3=force(强制打断)
      this.model.motion(group, index, priority);
    } catch (error) {
      console.error('[PixiLive2DRenderer] 播放动作失败:', error);
    }
  }

  /**
   * 播放表情
   */
  playExpression(expressionIndex: number): void {
    if (!this.model) {
      console.warn('[PixiLive2DRenderer] 模型未加载，无法播放表情');
      return;
    }

    try {
      console.info(`[PixiLive2DRenderer] 播放表情: 索引=${expressionIndex}`);

      // pixi-live2d-display 的 expression 方法
      this.model.expression(expressionIndex);
    } catch (error) {
      console.error('[PixiLive2DRenderer] 播放表情失败:', error);
    }
  }

  /**
   * 设置模型位置
   */
  setPosition(x: number, y: number): void {
    if (!this.model || !this.app) {
      return;
    }

    const { width: displayWidth, height: displayHeight } = this.getDisplaySize();

    // x, y 是 0-100 的百分比
    this.model.x = (x / 100) * displayWidth;
    this.model.y = (y / 100) * displayHeight;
  }

  /**
   * 设置模型缩放
   */
  setScale(scale: number): void {
    if (!this.model) {
      return;
    }

    this.model.scale.set(scale);
  }

  /**
   * 获取当前模型
   */
  getModel(): Live2DModel | null {
    return this.model;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 设置模型可见性
   */
  setVisible(visible: boolean): void {
    if (!this.model) {
      return;
    }

    if (visible) {
      this.model.alpha = 1;
      this.model.visible = true;
      console.info('[PixiLive2DRenderer] 模型已设置为可见');
    } else {
      // 立即隐藏模型
      this.model.alpha = 0;
      this.model.visible = false;
      console.info('[PixiLive2DRenderer] 模型已设置为不可见');
    }
  }

  /**
   * 通过文本匹配播放动作
   * @param text 文本关键词
   * @param priority 优先级（可选，默认根据 motionType 自动判断）
   * @returns 是否成功匹配并播放
   */
  playMotionByText(text: string, priority?: number): boolean {
    if (!this.model || !this.config?.motions) {
      return false;
    }

    // 规范化文本（去除特殊符号，转小写，用于匹配）
    const normalizeForMatch = (str: string): string => {
      return str.replace(/[-/\\_.\s]/g, '').toLowerCase();
    };

    const normalizedText = normalizeForMatch(text);

    // 遍历所有 motions，匹配 textMappings
    for (const motion of this.config.motions) {
      if (motion.textMappings && motion.textMappings.length > 0) {
        // 使用模糊匹配：检查是否有任何 textMapping 与输入文本匹配
        const matched = motion.textMappings.some(mapping => {
          const normalizedMapping = normalizeForMatch(mapping);
          return (
            normalizedText === normalizedMapping ||
            normalizedText.includes(normalizedMapping) ||
            normalizedMapping.includes(normalizedText)
          );
        });

        if (matched) {
          // 根据 motionType 自动调整优先级
          // 表情和动作都使用 priority=2（normal），确保不会互相打断，可以顺序播放
          let finalPriority = priority;
          if (finalPriority === undefined) {
            finalPriority = 2; // 统一使用 priority=2，让表情和动作可以顺序播放而不是互相打断
          }

          // 如果有 index，直接使用 group 和 index 调用
          if (motion.index !== undefined) {
            console.info(
              `[PixiLive2DRenderer] 文本匹配播放: "${motion.name}" (group="${motion.group}", index=${motion.index}, type=${motion.motionType}, text="${text}")`,
            );
            // 使用 playMotion 方法统一调用，确保日志和错误处理一致
            this.playMotion(motion.group, motion.index, finalPriority);
            return true;
          }
        }
      }
    }

    return false;
  }

  /**
   * 卸载模型
   */
  unloadModel(): void {
    if (this.model && this.app) {
      this.app.stage.removeChild(this.model as any);
      this.model.destroy();
      this.model = null;
    }
    this.config = null;
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.unloadModel();

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true, baseTexture: true });
      this.app = null;
    }

    this.canvas = null;
    this.isInitialized = false;
  }

  /**
   * 调整画布大小
   */
  resize(width?: number, height?: number): void {
    if (!this.canvas || !this.app) return;

    const fallback = this.getDisplaySize();
    const displayWidth = width || this.canvas.clientWidth || fallback.width;
    const displayHeight = height || this.canvas.clientHeight || fallback.height;

    this.app.renderer.resize(displayWidth, displayHeight);

    // 画布大小改变后，不需要重新调整模型
    // 位置和缩放由 setPosition 和 setScale 方法控制
    console.info('[PixiLive2DRenderer] 画布大小已调整:', { displayWidth, displayHeight });
  }
}
