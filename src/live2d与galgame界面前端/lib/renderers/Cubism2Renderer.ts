/**
 * Cubism 2.1 渲染器
 * 用于渲染旧版 Live2D 模型（.moc 文件）
 * 基于 l2d2-demo-master 项目改造
 */

import * as PIXI from 'pixi.js';

// Cubism 2.1 模型配置接口
export interface Cubism2ModelConfig {
  modelId: string;
  basePath: string;
  modelFile: string;
  textures: string[];
  motions?: { [group: string]: { file: string; fadeIn?: number; fadeOut?: number }[] };
  expressions?: { name: string; file: string }[];
  physics?: string;
  pose?: string;
  hitAreas?: { name: string; id: string }[];
  textMappings?: {
    motions?: { [file: string]: string };
    expressions?: { [name: string]: string };
  };
}

// 基础模型设置 JSON
interface ModelSettingJson {
  model: string;
  textures: string[];
  motions?: { [group: string]: { file: string; fade_in?: number; fade_out?: number; sound?: string }[] };
  expressions?: { name: string; file: string }[];
  physics?: string;
  pose?: string;
  hit_areas?: { name: string; id: string }[];
  layout?: {
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    center_x?: number;
    center_y?: number;
    top?: number;
    bottom?: number;
    left?: number;
    right?: number;
  };
  init_param?: { id: string; value: number }[];
  init_parts_visible?: { id: string; value: number }[];
}

export class Cubism2Renderer {
  private app: PIXI.Application | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private model: any = null; // LAppModel 实例
  private modelConfig: Cubism2ModelConfig | null = null;
  private ready = false;
  private priorityDefault = 1;
  private priorityForce = 3;

  constructor() {
    console.info('[Cubism2Renderer] 创建 Cubism 2.1 渲染器');
  }

  /**
   * 初始化渲染器
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;

    // 等待 Live2D SDK 加载
    if (typeof (window as any).Live2D === 'undefined') {
      console.error('[Cubism2Renderer] Live2D SDK 未加载');
      throw new Error('Live2D SDK 未加载，请确保已引入 live2d.min.js');
    }

    // 初始化 Pixi.js
    this.app = new PIXI.Application();
    await this.app.init({
      canvas: this.canvas,
      width: this.canvas.width || 800,
      height: this.canvas.height || 600,
      backgroundColor: 0x000000,
      backgroundAlpha: 0,
      antialias: true,
    });

    console.info('[Cubism2Renderer] Pixi.js 初始化完成');
    this.ready = true;
  }

  /**
   * 检查渲染器是否就绪
   */
  isReady(): boolean {
    return this.ready && this.app !== null;
  }

  /**
   * 加载模型
   */
  async loadModel(config: Cubism2ModelConfig): Promise<void> {
    if (!this.isReady() || !this.app) {
      throw new Error('渲染器未初始化');
    }

    console.info(`[Cubism2Renderer] 开始加载 Cubism 2.1 模型: ${config.modelId}`);
    this.modelConfig = config;

    // 构建模型设置 JSON
    const modelSetting: ModelSettingJson = {
      model: config.modelFile,
      textures: config.textures,
      motions: config.motions,
      expressions: config.expressions,
      physics: config.physics,
      pose: config.pose,
      hit_areas: config.hitAreas,
    };

    try {
      // 创建 Live2D Sprite（需要加载 Cubism 2.1 库）
      await this.createLive2DModel(modelSetting, config.basePath);
      console.info(`[Cubism2Renderer] 模型加载成功: ${config.modelId}`);
    } catch (error) {
      console.error('[Cubism2Renderer] 模型加载失败:', error);
      throw error;
    }
  }

  /**
   * 创建 Live2D 模型实例
   */
  private async createLive2DModel(modelSetting: ModelSettingJson, basePath: string): Promise<void> {
    // 这里需要实现 LAppModel 的创建逻辑
    // 由于 l2d2-demo-master 的代码比较复杂，我们需要将其适配到当前项目

    // 暂时抛出错误，提示用户需要完整实现
    throw new Error('Cubism 2.1 渲染器功能正在开发中，请使用 Cubism 3/4 模型');
  }

  /**
   * 播放动作
   */
  playMotion(group: string, index: number, priority: number = 2): void {
    if (!this.model) {
      console.warn('[Cubism2Renderer] 模型未加载，无法播放动作');
      return;
    }

    console.info(`[Cubism2Renderer] 播放动作: group="${group}", index=${index}, priority=${priority}`);
    // TODO: 实现动作播放
  }

  /**
   * 通过文本匹配播放动作
   */
  playMotionByText(text: string): boolean {
    if (!this.model || !this.modelConfig) {
      return false;
    }

    // 通过 textMappings 匹配动作
    if (this.modelConfig.textMappings?.motions) {
      for (const [file, mappingText] of Object.entries(this.modelConfig.textMappings.motions)) {
        if (mappingText === text || String(mappingText).toLowerCase() === text.toLowerCase()) {
          console.info(`[Cubism2Renderer] 通过 textMappings 匹配到动作: ${text} -> ${file}`);
          // TODO: 根据文件名找到 group 和 index，然后播放
          return true;
        }
      }
    }

    return false;
  }

  /**
   * 设置表情
   */
  setExpression(expressionName: string): void {
    if (!this.model) {
      console.warn('[Cubism2Renderer] 模型未加载，无法设置表情');
      return;
    }

    console.info(`[Cubism2Renderer] 设置表情: ${expressionName}`);
    // TODO: 实现表情设置
  }

  /**
   * 更新模型位置和缩放
   */
  updateTransform(scale: number, x: number, y: number): void {
    if (!this.model) {
      return;
    }

    // TODO: 更新模型变换
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    if (this.model) {
      // TODO: 销毁模型
      this.model = null;
    }

    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }

    this.ready = false;
    this.canvas = null;
    this.modelConfig = null;

    console.info('[Cubism2Renderer] 渲染器已销毁');
  }
}

