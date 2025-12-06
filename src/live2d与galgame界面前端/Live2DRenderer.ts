/**
 * Live2D模型渲染器
 * 使用动态加载方式加载 pixi-live2d-display
 *
 * 优势：
 * - 避免编译时依赖冲突
 * - Live2D Cubism Core 会自动从 CDN 加载
 * - 运行时按需加载，减少初始包体积
 * - 支持从 IndexedDB 加载本地文件
 */

import { getIndexedDbFileUrl } from './utils/indexedDB';

// Live2D 模型配置接口
export interface Live2DModelConfig {
  id: string;
  name: string;
  modelPath: string;
  basePath: string;
  version: number;
  motions: Array<{ group: string; name: string; file: string }>;
  expressions: string[];
  textures: string[];
  physics?: string;
  pose?: string;
  /** 本地文件的 fileId 映射（仅用于 IndexedDB 存储的文件） */
  _fileIds?: Record<string, string>;
}

// 声明全局类型
declare global {
  interface Window {
    PIXI: typeof import('pixi.js');
    Live2DModel: any;
  }
}

// 动态加载脚本
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    // 检查是否已加载
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`加载脚本失败: ${src}`));
    document.head.appendChild(script);
  });
}

// 初始化 Live2D 依赖
let live2dInitPromise: Promise<void> | null = null;

async function initLive2DDependencies(): Promise<void> {
  if (live2dInitPromise) return live2dInitPromise;

  live2dInitPromise = (async () => {
    try {
      // 加载 pixi.js v6（兼容 pixi-live2d-display）
      await loadScript('https://cdn.jsdelivr.net/npm/pixi.js@6.5.10/dist/browser/pixi.min.js');

      // 加载 pixi-live2d-display
      await loadScript('https://cdn.jsdelivr.net/npm/pixi-live2d-display@0.4.0/dist/index.min.js');

      // 注册 Live2D ticker
      if (window.PIXI && window.Live2DModel) {
        window.Live2DModel.registerTicker(window.PIXI.Ticker.shared);
        console.info('Live2D 依赖加载成功');
      } else {
        throw new Error('Live2D 依赖加载失败');
      }
    } catch (error) {
      live2dInitPromise = null;
      throw error;
    }
  })();

  return live2dInitPromise;
}

export class Live2DRenderer {
  private app: any = null;
  private currentModel: any = null;
  private modelConfig: Live2DModelConfig | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private isInitialized = false;

  /**
   * 初始化渲染器
   */
  async init(canvas: HTMLCanvasElement): Promise<void> {
    if (this.isInitialized) return;

    this.canvas = canvas;

    try {
      // 加载 Live2D 依赖
      await initLive2DDependencies();

      // 创建 PixiJS 应用
      this.app = new window.PIXI.Application({
        view: canvas,
        autoStart: true,
        backgroundAlpha: 0, // 透明背景
        resizeTo: canvas.parentElement || canvas,
        antialias: true,
      });

      this.isInitialized = true;
      console.info('Live2D渲染器初始化成功');
    } catch (error) {
      console.error('Live2D渲染器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 加载模型
   */
  async loadModel(config: Live2DModelConfig): Promise<void> {
    if (!this.isInitialized || !this.app) {
      throw new Error('渲染器未初始化');
    }

    try {
      // 卸载当前模型
      if (this.currentModel) {
        this.unloadModel();
      }

      this.modelConfig = config;

      // 构建完整的模型路径
      let modelUrl = config.modelPath;
      if (!modelUrl.startsWith('http://') && !modelUrl.startsWith('https://')) {
        modelUrl = config.basePath ? `${config.basePath}${modelUrl}` : modelUrl;
      }

      // 检查是否是 IndexedDB 存储的本地文件
      if (modelUrl.startsWith('indexeddb://')) {
        console.info(`[Live2DRenderer] 检测到 IndexedDB 协议，从本地存储加载: ${modelUrl}`);

        // 从 IndexedDB 读取 model3.json 文件
        const blobUrl = await getIndexedDbFileUrl(modelUrl, config._fileIds);
        if (!blobUrl) {
          throw new Error(`无法从 IndexedDB 读取文件: ${modelUrl}`);
        }

        // 读取并修改 model3.json，将相对路径替换为 IndexedDB Blob URL
        try {
          const response = await fetch(blobUrl);
          const modelJson = await response.json();

          // 修改 FileReferences 中的相对路径为 IndexedDB Blob URL
          if (modelJson.FileReferences && config.basePath?.startsWith('indexeddb://') && config._fileIds) {
            const basePath = config.basePath;

            // 处理 MOC 文件路径
            if (modelJson.FileReferences.Moc && typeof modelJson.FileReferences.Moc === 'string') {
              const mocPath = modelJson.FileReferences.Moc;
              if (!mocPath.startsWith('http') && !mocPath.startsWith('blob:')) {
                const indexedDbUrl = `${basePath}${mocPath}`;
                const mocBlobUrl = await getIndexedDbFileUrl(indexedDbUrl, config._fileIds);
                if (mocBlobUrl) {
                  modelJson.FileReferences.Moc = mocBlobUrl;
                  console.info(`[Live2DRenderer] 替换 MOC 路径: ${mocPath} -> IndexedDB Blob URL`);
                }
              }
            }

            // 处理纹理文件路径
            if (Array.isArray(modelJson.FileReferences.Textures)) {
              for (let i = 0; i < modelJson.FileReferences.Textures.length; i++) {
                const texturePath = modelJson.FileReferences.Textures[i];
                if (
                  typeof texturePath === 'string' &&
                  !texturePath.startsWith('http') &&
                  !texturePath.startsWith('blob:')
                ) {
                  const indexedDbUrl = `${basePath}${texturePath}`;
                  const textureBlobUrl = await getIndexedDbFileUrl(indexedDbUrl, config._fileIds);
                  if (textureBlobUrl) {
                    modelJson.FileReferences.Textures[i] = textureBlobUrl;
                    console.info(`[Live2DRenderer] 替换纹理路径: ${texturePath} -> IndexedDB Blob URL`);
                  }
                }
              }
            }

            // 处理物理文件路径
            if (modelJson.FileReferences.Physics && typeof modelJson.FileReferences.Physics === 'string') {
              const physicsPath = modelJson.FileReferences.Physics;
              if (!physicsPath.startsWith('http') && !physicsPath.startsWith('blob:')) {
                const indexedDbUrl = `${basePath}${physicsPath}`;
                const physicsBlobUrl = await getIndexedDbFileUrl(indexedDbUrl, config._fileIds);
                if (physicsBlobUrl) {
                  modelJson.FileReferences.Physics = physicsBlobUrl;
                  console.info(`[Live2DRenderer] 替换物理文件路径: ${physicsPath} -> IndexedDB Blob URL`);
                }
              }
            }

            // 处理显示信息文件路径
            if (modelJson.FileReferences.DisplayInfo && typeof modelJson.FileReferences.DisplayInfo === 'string') {
              const displayPath = modelJson.FileReferences.DisplayInfo;
              if (!displayPath.startsWith('http') && !displayPath.startsWith('blob:')) {
                const indexedDbUrl = `${basePath}${displayPath}`;
                const displayBlobUrl = await getIndexedDbFileUrl(indexedDbUrl, config._fileIds);
                if (displayBlobUrl) {
                  modelJson.FileReferences.DisplayInfo = displayBlobUrl;
                  console.info(`[Live2DRenderer] 替换显示信息文件路径: ${displayPath} -> IndexedDB Blob URL`);
                }
              }
            }

            // 处理 Groups 中的动作文件路径（如果存在）
            if (Array.isArray(modelJson.FileReferences.Groups)) {
              for (const group of modelJson.FileReferences.Groups) {
                if (
                  group.File &&
                  typeof group.File === 'string' &&
                  !group.File.startsWith('http') &&
                  !group.File.startsWith('blob:')
                ) {
                  const indexedDbUrl = `${basePath}${group.File}`;
                  const groupBlobUrl = await getIndexedDbFileUrl(indexedDbUrl, config._fileIds);
                  if (groupBlobUrl) {
                    group.File = groupBlobUrl;
                    console.info(`[Live2DRenderer] 替换动作文件路径: ${group.File} -> IndexedDB Blob URL`);
                  }
                }
                if (Array.isArray(group.Files)) {
                  for (let i = 0; i < group.Files.length; i++) {
                    const filePath = group.Files[i];
                    if (typeof filePath === 'string' && !filePath.startsWith('http') && !filePath.startsWith('blob:')) {
                      const indexedDbUrl = `${basePath}${filePath}`;
                      const fileBlobUrl = await getIndexedDbFileUrl(indexedDbUrl, config._fileIds);
                      if (fileBlobUrl) {
                        group.Files[i] = fileBlobUrl;
                        console.info(`[Live2DRenderer] 替换动作文件路径: ${filePath} -> IndexedDB Blob URL`);
                      }
                    }
                  }
                }
              }
            }

            // 创建修改后的 model3.json 的 Blob URL
            const modifiedJsonBlob = new Blob([JSON.stringify(modelJson)], { type: 'application/json' });
            const modifiedJsonUrl = URL.createObjectURL(modifiedJsonBlob);
            modelUrl = modifiedJsonUrl;
            console.info(`[Live2DRenderer] 已修改 model3.json，使用临时 Blob URL`);
          } else {
            // 如果不需要修改，直接使用原始 Blob URL
            modelUrl = blobUrl;
          }
        } catch (error) {
          console.warn(`[Live2DRenderer] 修改 model3.json 失败，使用原始文件:`, error);
          modelUrl = blobUrl;
        }

        console.info(`[Live2DRenderer] 已从 IndexedDB 加载文件，Blob URL: ${modelUrl.substring(0, 50)}...`);
      }

      console.info(`正在加载模型: ${modelUrl}`);

      // 使用 pixi-live2d-display 加载模型
      const model = await window.Live2DModel.from(modelUrl, {
        requestIdle: false,
      });

      // 设置模型位置和大小
      model.anchor.set(0.5, 0.5);
      model.x = this.app.screen.width / 2;
      model.y = this.app.screen.height / 2;

      // 根据画布大小自动缩放
      const scale = Math.min(
        (this.app.screen.width * 0.8) / model.width,
        (this.app.screen.height * 0.8) / model.height,
        1,
      );
      model.scale.set(scale);

      // 添加到舞台
      this.app.stage.addChild(model);
      this.currentModel = model;

      // 如果有动作，播放第一个空闲动作
      if (config.motions && config.motions.length > 0) {
        const defaultGroup = config.motions[0].group || '';
        model.motion(defaultGroup || '', 0);
      }

      console.info(`模型 "${config.name}" 加载成功`);
    } catch (error) {
      console.error('加载模型失败:', error);
      throw new Error(`加载模型失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 播放动作
   */
  playMotion(group: string, index: number): void {
    if (!this.currentModel) {
      console.warn('没有加载的模型');
      return;
    }

    try {
      this.currentModel.motion(group || '', index);
      console.info(`播放动作: 组="${group}", 索引=${index}`);
    } catch (error) {
      console.error('播放动作失败:', error);
    }
  }

  /**
   * 播放表情
   */
  playExpression(expressionIndex: number): void {
    if (!this.currentModel) {
      console.warn('没有加载的模型');
      return;
    }

    try {
      this.currentModel.expression(expressionIndex);
      console.info(`播放表情: 索引=${expressionIndex}`);
    } catch (error) {
      console.error('播放表情失败:', error);
    }
  }

  /**
   * 设置模型位置
   */
  setPosition(x: number, y: number): void {
    if (this.currentModel) {
      this.currentModel.x = x;
      this.currentModel.y = y;
    }
  }

  /**
   * 设置模型缩放
   */
  setScale(scale: number): void {
    if (this.currentModel) {
      this.currentModel.scale.set(scale);
    }
  }

  /**
   * 获取当前模型
   */
  getModel(): any {
    return this.currentModel;
  }

  /**
   * 检查是否已初始化
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * 卸载模型
   */
  unloadModel(): void {
    if (this.currentModel && this.app) {
      this.app.stage.removeChild(this.currentModel);
      this.currentModel.destroy();
      this.currentModel = null;
      this.modelConfig = null;
    }
  }

  /**
   * 销毁渲染器
   */
  destroy(): void {
    this.unloadModel();

    if (this.app) {
      this.app.destroy(true, {
        children: true,
        texture: true,
        baseTexture: true,
      });
      this.app = null;
    }

    this.isInitialized = false;
  }

  /**
   * 调整画布大小
   */
  resize(width: number, height: number): void {
    if (this.app) {
      this.app.renderer.resize(width, height);

      if (this.currentModel) {
        this.currentModel.x = width / 2;
        this.currentModel.y = height / 2;
      }
    }
  }
}
