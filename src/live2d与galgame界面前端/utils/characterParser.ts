/**
 * 角色解析工具 - 简化版
 * 自动管理角色在场状态和位置
 */

export interface CharacterDisplayConfig {
  name: string;
  type: 'live2d' | 'image' | 'none';
  modelId?: string;
  imageUrl?: string;
  position: 'left' | 'right';
  positionX: number; // 百分比
  positionY: number; // 百分比
  scale: number;
  motion?: string;
  expression?: string;
  visible: boolean;
}

/**
 * 角色在场状态管理器
 */
export class CharacterStateManager {
  private onStageCharacters: string[] = []; // 当前在场的角色名列表（最多2个）
  private lastSpeaker: string | null = null; // 上一个发言的角色

  /**
   * 处理新的对话，返回当前应该显示的角色配置
   * @param characterName - 当前对话的角色名
   * @param isExit - 是否是离场标记
   * @returns 当前应该显示的角色配置数组（0-2个）
   */
  processDialogue(characterName: string | undefined, isExit: boolean = false): string[] {
    // 处理离场
    if (isExit && characterName) {
      this.removeCharacter(characterName);
      return [...this.onStageCharacters];
    }

    // 如果没有角色名，返回当前在场的角色
    if (!characterName) {
      return [...this.onStageCharacters];
    }

    // 如果角色已经在场，只更新发言者
    if (this.onStageCharacters.includes(characterName)) {
      this.lastSpeaker = characterName;
      return [...this.onStageCharacters];
    }

    // 新角色登场
    this.addCharacter(characterName);
    this.lastSpeaker = characterName;
    return [...this.onStageCharacters];
  }

  /**
   * 添加角色到场景
   * 优先使用双角色模式：自动分配左边和右边的位置
   */
  private addCharacter(name: string): void {
    // 如果已经在场，不重复添加
    if (this.onStageCharacters.includes(name)) {
      return;
    }

    // 优先使用双角色模式：
    // - 如果已有2个角色，移除最早的那个（左边的角色）
    // - 新角色添加到右边
    if (this.onStageCharacters.length >= 2) {
      this.onStageCharacters.shift(); // 移除左边的角色
    }

    this.onStageCharacters.push(name); // 新角色添加到右边
  }

  /**
   * 移除角色
   */
  private removeCharacter(name: string): void {
    const index = this.onStageCharacters.indexOf(name);
    if (index !== -1) {
      this.onStageCharacters.splice(index, 1);
    }

    // 如果移除的是上一个发言者，清空发言者
    if (this.lastSpeaker === name) {
      this.lastSpeaker = null;
    }
  }

  /**
   * 获取角色的位置（left/right）
   * 优先使用双角色模式：第一个角色在左边，第二个角色在右边
   */
  getCharacterPosition(name: string): 'left' | 'right' {
    const index = this.onStageCharacters.indexOf(name);

    if (index === -1) {
      return 'left'; // 默认左侧
    }

    // 优先使用双角色模式：
    // - 第一个角色（index 0）在左边
    // - 第二个角色（index 1）在右边
    // - 即使只有1个角色，也放在左边，为右边预留位置
    return index === 0 ? 'left' : 'right';
  }

  /**
   * 获取当前在场角色数量
   */
  getOnStageCount(): number {
    return this.onStageCharacters.length;
  }

  /**
   * 清空所有在场角色（用于场景切换等）
   */
  clearAll(): void {
    this.onStageCharacters = [];
    this.lastSpeaker = null;
  }

  /**
   * 获取当前在场的角色列表
   */
  getOnStageCharacters(): string[] {
    return [...this.onStageCharacters];
  }
}

/**
 * 创建角色显示配置
 * 优先使用双角色模式：单角色时也放在左边（30%），为右边（70%）预留位置
 */
export interface CharacterSettings {
  left: { scale: number; positionX: number; positionY: number };
  right: { scale: number; positionX: number; positionY: number };
  single: { scale: number; positionX: number; positionY: number };
}

export function createCharacterConfig(
  name: string,
  position: 'left' | 'right',
  totalCount: number,
  settings?: CharacterSettings,
  isSprite: boolean = false,
): CharacterDisplayConfig {
  // 如果没有提供设置，使用默认值
  if (!settings) {
    const positionX = position === 'left' ? 30 : 70;
    const scale = totalCount === 1 ? 1.0 : 0.85;
    return {
      name,
      type: 'none',
      position,
      positionX,
      positionY: 50,
      scale,
      visible: true,
    };
  }

  // 根据位置和角色数量选择对应的设置
  const mode: 'left' | 'right' | 'single' = totalCount === 1 ? 'single' : position;
  const config = settings[mode];

  return {
    name,
    type: 'none', // 需要后续根据资源设置
    position,
    positionX: config.positionX,
    positionY: config.positionY,
    scale: config.scale,
    visible: true,
  };
}

/**
 * 检测对话中是否包含离场标记
 * 支持两种格式：
 * - [[character||角色名：{{角色名}}||离场]]
 * - [[character||角色名：角色名||离场]]
 * @param text - 对话文本
 * @returns 离场的角色名，如果没有则返回 null
 */
export function detectCharacterExit(text: string): string | null {
  // 先尝试匹配 {{角色名}} 格式
  let match = text.match(/\[\[character\|\|角色名[：:]\s*\{\{([^}]+)\}\}\s*\|\|离场\]\]/);
  if (match) {
    return match[1];
  }
  
  // 再尝试匹配直接角色名格式（角色名：角色名）
  // 注意：这个正则会匹配到角色名和离场之间的所有内容，需要提取角色名部分
  match = text.match(/\[\[character\|\|角色名[：:]\s*([^|]+?)\s*\|\|离场\]\]/);
  if (match) {
    // 提取角色名（去除可能的空格）
    const characterName = match[1].trim();
    return characterName || null;
  }
  
  return null;
}
