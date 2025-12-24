/**
 * Live2D 模型管理器
 * 负责模型的预加载、缓存和复用，避免重复加载
 */

import { Live2DModel } from 'pixi-live2d-display';
import type { Live2DModelConfig } from '../renderers/PixiLive2DRenderer';

interface CachedModel {
  model: Live2DModel;
  config: Live2DModelConfig;
  lastUsed: number;
}

export class Live2DModelManager {
  private static instance: Live2DModelManager | null = null;
  private modelCache: Map<string, CachedModel> = new Map();
  private loadingPromises: Map<string, Promise<Live2DModel>> = new Map();
  private maxCacheSize = 5; // 最多缓存5个模型

  private constructor() {
    console.info('[Live2D管理器] 初始化模型管理器');
  }

  /**
   * 获取单例实例
   */
  static getInstance(): Live2DModelManager {
    if (!Live2DModelManager.instance) {
      Live2DModelManager.instance = new Live2DModelManager();
    }
    return Live2DModelManager.instance;
  }

  /**
   * 预加载模型（不阻塞主流程）
   */
  async preloadModel(config: Live2DModelConfig): Promise<void> {
    const modelId = config.id;

    // 如果已经缓存，更新使用时间
    if (this.modelCache.has(modelId)) {
      const cached = this.modelCache.get(modelId)!;
      cached.lastUsed = Date.now();
      console.info(`[Live2D管理器] 模型 "${config.name}" 已在缓存中`);
      return;
    }

    // 如果正在加载，等待加载完成
    if (this.loadingPromises.has(modelId)) {
      console.info(`[Live2D管理器] 模型 "${config.name}" 正在加载中，等待...`);
      await this.loadingPromises.get(modelId);
      return;
    }

    // 开始加载
    console.info(`[Live2D管理器] 开始预加载模型: "${config.name}"`);
    const loadPromise = this.loadModelInternal(config);
    this.loadingPromises.set(modelId, loadPromise);

    try {
      const model = await loadPromise;

      // 检查缓存大小，必要时清理
      this.cleanupCache();

      // 缓存模型
      this.modelCache.set(modelId, {
        model,
        config,
        lastUsed: Date.now(),
      });

      console.info(`[Live2D管理器] 模型 "${config.name}" 预加载完成并已缓存`);
    } catch (error) {
      console.error(`[Live2D管理器] 模型 "${config.name}" 预加载失败:`, error);
      throw error;
    } finally {
      this.loadingPromises.delete(modelId);
    }
  }

  /**
   * 批量预加载模型
   */
  async preloadModels(configs: Live2DModelConfig[]): Promise<void> {
    console.info(`[Live2D管理器] 开始批量预加载 ${configs.length} 个模型`);

    // 并行加载所有模型（不等待完成，避免阻塞）
    const promises = configs.map(config =>
      this.preloadModel(config).catch(error => {
        console.warn(`[Live2D管理器] 模型 "${config.name}" 预加载失败:`, error);
      }),
    );

    // 不等待所有模型加载完成，立即返回
    // 模型会在后台继续加载
    Promise.all(promises).then(() => {
      console.info(`[Live2D管理器] 所有模型预加载完成`);
    });
  }

  /**
   * 获取缓存的模型（如果存在）
   */
  getCachedModel(modelId: string): Live2DModel | null {
    const cached = this.modelCache.get(modelId);
    if (cached) {
      cached.lastUsed = Date.now();
      console.info(`[Live2D管理器] 从缓存获取模型: ${cached.config.name}`);
      return cached.model;
    }
    return null;
  }

  /**
   * 获取或加载模型
   */
  async getOrLoadModel(config: Live2DModelConfig): Promise<Live2DModel> {
    const modelId = config.id;

    // 1. 尝试从缓存获取
    const cached = this.getCachedModel(modelId);
    if (cached) {
      return cached;
    }

    // 2. 如果正在加载，等待加载完成
    if (this.loadingPromises.has(modelId)) {
      console.info(`[Live2D管理器] 模型 "${config.name}" 正在加载中，等待...`);
      return await this.loadingPromises.get(modelId)!;
    }

    // 3. 开始加载
    console.info(`[Live2D管理器] 模型 "${config.name}" 不在缓存中，开始加载...`);
    await this.preloadModel(config);
    return this.getCachedModel(modelId)!;
  }

  /**
   * 内部加载方法
   */
  private async loadModelInternal(config: Live2DModelConfig): Promise<Live2DModel> {
    try {
      // 构建完整的模型路径
      let modelUrl = config.modelPath;
      if (!modelUrl.startsWith('http://') && !modelUrl.startsWith('https://')) {
        modelUrl = config.basePath ? `${config.basePath}${modelUrl}` : modelUrl;
      }

      console.info(`[Live2D管理器] 加载模型文件: ${modelUrl}`);
      const model = await Live2DModel.from(modelUrl, {
        autoInteract: false,
        autoUpdate: true,
      });

      console.info(`[Live2D管理器] 模型 "${config.name}" 加载成功`);
      return model;
    } catch (error) {
      console.error(`[Live2D管理器] 加载模型 "${config.name}" 失败:`, error);
      throw error;
    }
  }

  /**
   * 清理缓存（移除最久未使用的模型）
   */
  private cleanupCache(): void {
    if (this.modelCache.size < this.maxCacheSize) {
      return;
    }

    console.info(`[Live2D管理器] 缓存已满 (${this.modelCache.size}/${this.maxCacheSize})，开始清理...`);

    // 找到最久未使用的模型
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, cached] of this.modelCache.entries()) {
      if (cached.lastUsed < oldestTime) {
        oldestTime = cached.lastUsed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      const cached = this.modelCache.get(oldestKey)!;
      console.info(`[Live2D管理器] 移除最久未使用的模型: "${cached.config.name}"`);

      // 销毁模型
      try {
        cached.model.destroy();
      } catch (error) {
        console.warn(`[Live2D管理器] 销毁模型失败:`, error);
      }

      this.modelCache.delete(oldestKey);
    }
  }

  /**
   * 清空所有缓存
   */
  clearCache(): void {
    console.info(`[Live2D管理器] 清空所有缓存 (${this.modelCache.size} 个模型)`);

    for (const cached of this.modelCache.values()) {
      try {
        cached.model.destroy();
      } catch (error) {
        console.warn(`[Live2D管理器] 销毁模型 "${cached.config.name}" 失败:`, error);
      }
    }

    this.modelCache.clear();
    this.loadingPromises.clear();
  }

  /**
   * 获取缓存统计信息
   */
  getCacheStats(): {
    cached: number;
    loading: number;
    maxSize: number;
    models: Array<{ id: string; name: string; lastUsed: number }>;
  } {
    return {
      cached: this.modelCache.size,
      loading: this.loadingPromises.size,
      maxSize: this.maxCacheSize,
      models: Array.from(this.modelCache.entries()).map(([id, cached]) => ({
        id,
        name: cached.config.name,
        lastUsed: cached.lastUsed,
      })),
    };
  }

  /**
   * 设置最大缓存大小
   */
  setMaxCacheSize(size: number): void {
    this.maxCacheSize = Math.max(1, size);
    console.info(`[Live2D管理器] 设置最大缓存大小: ${this.maxCacheSize}`);
    this.cleanupCache();
  }
}

// 导出单例实例
export const live2dModelManager = Live2DModelManager.getInstance();
