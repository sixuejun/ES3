/**
 * 开场界面类型定义
 */

/** 页面类型 */
export type PageType = 'main-menu' | 'start-game' | 'settings' | 'character-intro';

/** 开场数据 */
export interface Opening {
  id: string;
  title: string;
  description: string;
  image?: string;
  message: string;
}

/** 角色数据 */
export interface Character {
  name: string;
  role: string;
  desc: string;
  image?: string;
  colorClass: string;
}

/** 已导入的模型 */
export interface ImportedModel {
  name: string;
  files: ModelFile[];
  motions: MotionFile[];
}

/** 模型文件 */
export interface ModelFile {
  type: 'texture' | 'moc3' | 'model3' | 'cdi3';
  url: string;
  filename: string;
  /** 如果是本地文件，存储 IndexedDB 文件 ID */
  fileId?: string;
  /** 是否为本地文件（存储在 IndexedDB 中） */
  isLocal?: boolean;
}

/** 动作/表情文件 */
export interface MotionFile {
  name: string;
  url: string;
  type: 'motion' | 'expression';
  /** 如果是本地文件，存储 IndexedDB 文件 ID */
  fileId?: string;
  /** 是否为本地文件（存储在 IndexedDB 中） */
  isLocal?: boolean;
}

/** 解析到的文件URL信息 */
export interface ParsedFileUrl {
  type: 'texture' | 'moc3' | 'model3' | 'cdi3' | 'physics3' | 'motion' | 'expression';
  url: string;
  filename: string;
  name?: string;
}

/** 虚拟文件（用于内部处理） */
export interface VirtualModelFiles {
  textures: { file: File; url: string }[];
  moc3: { file: File; url: string } | null;
  model3: { file: File; url: string } | null;
  cdi3: { file: File; url: string } | null;
  motions: { file: File; url: string; name: string; type: 'motion' | 'expression' }[];
}
