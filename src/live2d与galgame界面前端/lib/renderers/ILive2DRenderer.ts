/**
 * Live2D 渲染器统一接口
 * 支持 Cubism 2.1、3、4 版本的模型
 */

// 通用模型配置接口
export interface Live2DModelConfig {
  modelId: string;
  basePath: string;
  version?: '2.1' | '3' | '4'; // 模型版本，用于选择渲染器
  
  // Cubism 3/4 (pixi-live2d-display)
  modelFile?: string;
  
  // Cubism 2.1 (l2d2-demo-master)
  model?: string;
  textures?: string[];
  
  // 通用配置
  motions?: any[];
  expressions?: any[];
  textMappings?: {
    motions?: { [key: string]: string };
    expressions?: { [key: string]: string };
  };
  
  // 其他配置
  physics?: string;
  pose?: string;
  hitAreas?: any[];
  layout?: any;
}

// 渲染器接口
export interface ILive2DRenderer {
  /**
   * 初始化渲染器
   * @param canvas - 渲染目标画布
   */
  init(canvas: HTMLCanvasElement): Promise<void>;

  /**
   * 检查渲染器是否就绪
   */
  isReady(): boolean;

  /**
   * 加载模型
   * @param config - 模型配置
   */
  loadModel(config: Live2DModelConfig): Promise<void>;

  /**
   * 播放动作
   * @param group - 动作组名
   * @param index - 动作索引
   * @param priority - 优先级
   */
  playMotion(group: string, index: number, priority?: number): void;

  /**
   * 通过文本匹配播放动作
   * @param text - 匹配文本
   * @returns 是否成功匹配并播放
   */
  playMotionByText(text: string): boolean;

  /**
   * 设置表情
   * @param expressionName - 表情名称
   */
  setExpression(expressionName: string): void;

  /**
   * 更新模型变换（位置、缩放）
   * @param scale - 缩放比例
   * @param x - X 坐标（百分比）
   * @param y - Y 坐标（百分比）
   */
  updateTransform(scale: number, x: number, y: number): void;

  /**
   * 销毁渲染器
   */
  destroy(): void;
}

/**
 * 渲染器工厂
 * 根据模型版本自动选择合适的渲染器
 */
export class Live2DRendererFactory {
  /**
   * 创建渲染器实例
   * @param version - 模型版本（可选，会自动检测）
   */
  static async createRenderer(version?: '2.1' | '3' | '4'): Promise<ILive2DRenderer> {
    // 默认使用 Cubism 3/4 渲染器（pixi-live2d-display）
    if (!version || version === '3' || version === '4') {
      const { PixiLive2DRenderer } = await import('./PixiLive2DRenderer');
      return new PixiLive2DRenderer();
    }

    // 使用 Cubism 2.1 渲染器
    if (version === '2.1') {
      const { Cubism2Renderer } = await import('./Cubism2Renderer');
      return new Cubism2Renderer();
    }

    throw new Error(`不支持的模型版本: ${version}`);
  }

  /**
   * 自动检测模型版本
   * @param config - 模型配置
   */
  static detectVersion(config: Live2DModelConfig): '2.1' | '3' | '4' {
    // 如果明确指定了版本，直接返回
    if (config.version) {
      return config.version;
    }

    // 通过文件扩展名判断
    const modelFile = config.modelFile || config.model || '';

    if (modelFile.endsWith('.model3.json')) {
      return '3';
    }

    if (modelFile.endsWith('.model.json')) {
      return '2.1';
    }

    // 如果有 textures 数组，很可能是 Cubism 2.1
    if (Array.isArray(config.textures)) {
      return '2.1';
    }

    // 默认返回 Cubism 3
    return '3';
  }
}

