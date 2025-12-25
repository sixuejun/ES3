/**
 * 世界书条目格式工具
 * 用于创建便于解析的世界书条目，使用 JSON 格式存储映射关系
 */

import type { PartialDeep } from 'type-fest';
// 世界书类型在全局声明，这里用 any 以避免解析路径问题
type WorldbookEntry = any;

/**
 * Motion 配置接口
 */
export interface Live2DMotionConfig {
  name: string;
  file: string;
  group: string;
  index: number;
  motionType: 'motion' | 'expression';
  textMappings?: string[];
}

/**
 * 模型资源世界书条目 JSON 格式
 */
export interface ModelResourceWorldbookData {
  type: 'live2d_model';
  modelName: string;
  files: {
    model3?: string;
    moc3?: string;
    textures: string[];
    cdi3?: string;
    physics3?: string;
  };
  motions: Live2DMotionConfig[];
  defaultAnimation?: {
    expression?: string;
    motion?: string;
    autoLoop?: boolean;
  };
  // 为了向后兼容，保留旧的格式字段（如果存在）
  expressions?: Array<{ name: string; file: string }>;
  textMappings?: {
    expression?: Record<string, string>; // { "happy.exp3.json": "你好呀" }
    motion?: Record<string, string>; // { "idle.motion3.json": "待机" }
  };
}

/**
 * 立绘资源世界书条目 JSON 格式
 */
export interface SpriteResourceWorldbookData {
  type: 'sprite';
  characterName?: string;
  sprites: Array<{
    name: string;
    file: string;
    textMappings?: string[]; // 触发文本列表
  }>;
}

/**
 * 背景资源世界书条目 JSON 格式
 */
export interface BackgroundResourceWorldbookData {
  type: 'background';
  backgrounds: Array<{
    name: string;
    file: string;
    textMappings?: string[]; // 触发文本列表
  }>;
}

/**
 * CG资源世界书条目 JSON 格式
 */
export interface CGResourceWorldbookData {
  type: 'cg';
  cgs: Array<{
    name: string;
    file: string;
    textMappings?: string[]; // 触发文本列表
  }>;
}

/**
 * 创建模型资源世界书条目（使用 JSON 格式）
 */
export function createModelResourceWorldbookEntry(
  modelName: string,
  data: ModelResourceWorldbookData,
): PartialDeep<WorldbookEntry> {
  const neverMatchKey = `__MODEL_RESOURCE_${modelName}_${Date.now()}__`;

  return {
    name: `[模型资源] ${modelName}`,
    enabled: true,
    strategy: {
      type: 'selective',
      keys: [neverMatchKey],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order: 0,
    },
    content: `\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`,
    probability: 100,
    recursion: {
      prevent_incoming: true,
      prevent_outgoing: true,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
  };
}

/**
 * 创建立绘资源世界书条目（使用 JSON 格式）
 */
export function createSpriteResourceWorldbookEntry(
  characterName: string,
  data: SpriteResourceWorldbookData,
): PartialDeep<WorldbookEntry> {
  const entryName = characterName ? `[立绘资源] ${characterName}` : '[立绘资源]';
  const keys = characterName ? [characterName, `${characterName}的立绘`] : ['立绘', '角色立绘'];

  return {
    name: entryName,
    enabled: true,
    strategy: {
      type: 'selective',
      keys,
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order: 1,
    },
    content: `\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`,
    probability: 100,
    recursion: {
      prevent_incoming: false,
      prevent_outgoing: false,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
  };
}

/**
 * 创建背景资源世界书条目（使用 JSON 格式）
 */
export function createBackgroundResourceWorldbookEntry(
  data: BackgroundResourceWorldbookData,
): PartialDeep<WorldbookEntry> {
  // 收集所有文本映射作为触发关键字
  const keys: string[] = ['背景', '场景'];
  for (const bg of data.backgrounds) {
    if (bg.textMappings) {
      keys.push(...bg.textMappings);
    }
    keys.push(bg.name);
  }

  return {
    name: '[背景资源]',
    enabled: true,
    strategy: {
      type: 'selective',
      keys: [...new Set(keys)],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order: 2,
    },
    content: `\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`,
    probability: 100,
    recursion: {
      prevent_incoming: false,
      prevent_outgoing: false,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
  };
}

/**
 * 创建CG资源世界书条目（使用 JSON 格式）
 */
export function createCGResourceWorldbookEntry(data: CGResourceWorldbookData): PartialDeep<WorldbookEntry> {
  // 收集所有文本映射作为触发关键字
  const keys: string[] = ['CG', 'cg'];
  for (const cg of data.cgs) {
    if (cg.textMappings) {
      keys.push(...cg.textMappings);
    }
    keys.push(cg.name);
  }

  return {
    name: '[CG资源]',
    enabled: true,
    strategy: {
      type: 'selective',
      keys: [...new Set(keys)],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order: 3,
    },
    content: `\`\`\`json
${JSON.stringify(data, null, 2)}
\`\`\`
`,
    probability: 100,
    recursion: {
      prevent_incoming: false,
      prevent_outgoing: false,
      delay_until: null,
    },
    effect: {
      sticky: null,
      cooldown: null,
      delay: null,
    },
  };
}

/**
 * 从世界书条目中解析 JSON 数据
 */
export function parseWorldbookJsonData(content: string): any {
  // 尝试从 markdown 代码块中提取 JSON
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1]);
    } catch (error) {
      console.warn('解析世界书 JSON 数据失败:', error);
    }
  }

  // 去除 UTF-8 BOM
  const trimmed = content.replace(/^\uFEFF/, '').trim();

  // 跳过 YAML 前言（--- ... ---）
  if (trimmed.startsWith('---')) {
    const parts = trimmed.split('---');
    if (parts.length >= 3) {
      const afterFrontMatter = parts.slice(2).join('---').trim();
      return parseWorldbookJsonData(afterFrontMatter); // 递归尝试解析后续部分
    }
  }

  // 只有在看起来是 JSON 时才尝试解析，避免 YAML/文本报错
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
    return null;
  }

  // 如果没有代码块，尝试直接解析整个内容
  try {
    return JSON.parse(trimmed);
  } catch (error) {
    console.warn('解析世界书 JSON 数据失败:', error);
    return null;
  }
}
