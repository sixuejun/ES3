/**
 * 消息解析器
 * 用于解析酒馆消息中的特殊格式块，如 [[character||...]]、[[narration||...]] 等
 */

import type {
  BackgroundResourceWorldbookData,
  CGResourceWorldbookData,
  ModelResourceWorldbookData,
  SpriteResourceWorldbookData,
} from '../../开场界面/utils/worldbookFormat';
import { parseWorldbookJsonData } from '../../开场界面/utils/worldbookFormat';
import type { MessageBlock, StatusBlockData } from '../types/message';

/**
 * 世界书资源缓存
 */
interface WorldbookResourceCache {
  models: Map<string, ModelResourceWorldbookData>; // modelName -> 模型数据
  sprites: SpriteResourceWorldbookData | null; // 立绘资源（合并所有立绘到一个对象中，类似背景和CG）
  backgrounds: BackgroundResourceWorldbookData | null;
  cgs: CGResourceWorldbookData | null;
}

let worldbookCache: WorldbookResourceCache | null = null;
let worldbookCacheTimestamp = 0;
let worldbookCacheSource = ''; // 记录缓存来源（角色卡名称）
const WORLDBOOK_NAME = '开场界面-模型数据';
const CACHE_DURATION = 5000; // 缓存5秒

/**
 * 从世界书中加载资源数据
 * 优先使用当前角色卡绑定的世界书
 *
 * @returns 世界书资源缓存
 */
export async function loadWorldbookResources(): Promise<WorldbookResourceCache> {
  const now = Date.now();

  // 获取当前角色卡名称
  let currentCharacterName = '';
  try {
    const rawChar = new RawCharacter(RawCharacter.find({ name: 'current' }));
    currentCharacterName = rawChar.getCardData().name || '';
  } catch (error) {
    console.warn('获取当前角色卡名称失败:', error);
  }

  // 如果缓存存在且未过期，且角色卡名称未变化，直接返回
  if (
    worldbookCache &&
    now - worldbookCacheTimestamp < CACHE_DURATION &&
    worldbookCacheSource === currentCharacterName
  ) {
    return worldbookCache;
  }

  const cache: WorldbookResourceCache = {
    models: new Map(),
    sprites: null,
    backgrounds: null,
    cgs: null,
  };

  // 优先从角色卡绑定的世界书加载
  const worldbookNames: string[] = [];
  try {
    const charWorldbooks = getCharWorldbookNames('current');
    if (charWorldbooks.primary) {
      worldbookNames.push(charWorldbooks.primary);
    }
    worldbookNames.push(...charWorldbooks.additional);
  } catch (error) {
    console.warn('获取角色卡世界书失败:', error);
  }

  // 始终追加默认世界书作为后备（确保模型/资源可用）
  if (!worldbookNames.includes(WORLDBOOK_NAME)) {
    worldbookNames.push(WORLDBOOK_NAME);
  }

  // 从所有世界书中加载资源
  console.info('[世界书加载] 准备加载世界书:', worldbookNames);
  for (const worldbookName of worldbookNames) {
    try {
      // 检查 getWorldbook 函数是否存在
      if (typeof getWorldbook !== 'function') {
        console.warn('[世界书加载] getWorldbook 函数不存在，可能不在酒馆环境中');
        continue;
      }

      const entries = await getWorldbook(worldbookName);
      console.info(`[世界书加载] 从 ${worldbookName} 获取到 ${entries.length} 个条目`);

      for (const entry of entries) {
        if (!entry.enabled) continue;

        const data = parseWorldbookJsonData(entry.content);
        if (!data) {
          console.warn(`[世界书加载] 无法解析条目: ${entry.name}`);
          continue;
        }

        console.info(`[世界书加载] 解析条目: ${entry.name}, type=${data.type}`);

        if (data.type === 'live2d_model') {
          const modelData = data as ModelResourceWorldbookData;
          // 如果已存在同名模型，保留第一个（角色卡绑定的优先）
          if (!cache.models.has(modelData.modelName)) {
            cache.models.set(modelData.modelName, modelData);
          }
        } else if (data.type === 'sprite') {
          // 立绘资源合并（不覆盖），完全和背景、CG一样
          const spriteData = data as SpriteResourceWorldbookData;
          console.info(`[立绘加载] 发现立绘资源条目，包含 ${spriteData.sprites?.length || 0} 个立绘`);
          if (spriteData.sprites && spriteData.sprites.length > 0) {
            // 打印所有立绘的关键词
            for (const sprite of spriteData.sprites) {
              console.info(`[立绘加载] 立绘: ${sprite.name}, textMappings: ${sprite.textMappings?.join(', ')}`);
            }
          }
          if (!cache.sprites) {
            cache.sprites = spriteData;
          } else {
            const existing = cache.sprites;
            const newData = spriteData;
            existing.sprites.push(...newData.sprites);
          }
          console.info('[立绘加载] 合并立绘资源，当前总数:', cache.sprites.sprites.length);
        } else if (data.type === 'background') {
          // 背景资源合并（不覆盖）
          if (!cache.backgrounds) {
            cache.backgrounds = data as BackgroundResourceWorldbookData;
          } else {
            const existing = cache.backgrounds;
            const newData = data as BackgroundResourceWorldbookData;
            existing.backgrounds.push(...newData.backgrounds);
          }
        } else if (data.type === 'cg') {
          // CG资源合并（不覆盖）
          if (!cache.cgs) {
            cache.cgs = data as CGResourceWorldbookData;
          } else {
            const existing = cache.cgs;
            const newData = data as CGResourceWorldbookData;
            existing.cgs.push(...newData.cgs);
          }
        }
      }
    } catch (error) {
      console.warn(`加载世界书 ${worldbookName} 失败:`, error);
    }
  }

  worldbookCache = cache;
  worldbookCacheTimestamp = now;
  worldbookCacheSource = currentCharacterName;

  // 打印最终缓存状态
  console.info('[世界书加载] 加载完成，缓存状态:', {
    模型数量: cache.models.size,
    立绘数量: cache.sprites?.sprites?.length || 0,
    背景数量: cache.backgrounds?.backgrounds?.length || 0,
    CG数量: cache.cgs?.cgs?.length || 0,
  });

  return cache;
}

/**
 * 规范化文本，用于匹配（去除特殊符号，统一大小写等）
 */
function normalizeText(text: string): string {
  return text
    .replace(/[-/\\_.\s]/g, '') // 去除 - / \ _ . 空格
    .toLowerCase();
}

/**
 * 模糊匹配文本（考虑全角半角、特殊符号等）
 */
function fuzzyMatch(source: string, target: string): boolean {
  const normalizedSource = normalizeText(source);
  const normalizedTarget = normalizeText(target);
  return (
    normalizedSource === normalizedTarget ||
    normalizedSource.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedSource)
  );
}

/**
 * 解析键值对格式的文本（支持多种冒号格式）
 * 例如：角色名：程北极、场景：家中、动作：抱胸
 */
function parseKeyValuePairs(text: string): Record<string, string> {
  const result: Record<string, string> = {};

  // 先按 || 分割成多个部分
  const parts = text
    .split('||')
    .map(p => p.trim())
    .filter(p => p);

  // 对每一部分进行键值对解析
  for (const part of parts) {
    // 匹配 "键：值" 或 "键:值" 格式（支持全角、半角冒号，以及冒号前后的空格）
    // 匹配模式：键名（冒号前的内容） + 冒号（全角或半角） + 值（冒号后的所有内容）
    const kvMatch = part.match(/^([^：:]+)[：:]\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();
      if (key && value) {
        result[key] = value;
      }
    }
  }

  return result;
}

/**
 * 根据角色名和文本匹配世界书中的资源
 */
async function matchWorldbookResources(
  characterName: string | undefined,
  sceneText: string | undefined,
  motionText: string | undefined,
  expressionText: string | undefined,
  cgSceneText: string | undefined,
): Promise<{
  sceneImageUrl?: string;
  cgImageUrl?: string;
  spriteImageUrl?: string;
  motionFile?: string;
  expressionFile?: string;
}> {
  const result: {
    sceneImageUrl?: string;
    cgImageUrl?: string;
    spriteImageUrl?: string;
    motionFile?: string;
    expressionFile?: string;
  } = {};

  try {
    const resources = await loadWorldbookResources();

    // 匹配背景
    if (sceneText && resources.backgrounds) {
      for (const bg of resources.backgrounds.backgrounds) {
        // 匹配场景文本（不包括台词部分）
        const matchText = sceneText;
        if (fuzzyMatch(bg.name, matchText) || bg.textMappings?.some(mapping => fuzzyMatch(mapping, matchText))) {
          result.sceneImageUrl = bg.file;
          break;
        }
      }
    }

    // 匹配CG
    if (cgSceneText && resources.cgs) {
      for (const cg of resources.cgs.cgs) {
        const matchText = cgSceneText;
        if (fuzzyMatch(cg.name, matchText) || cg.textMappings?.some(mapping => fuzzyMatch(mapping, matchText))) {
          result.cgImageUrl = cg.file;
          break;
        }
      }
    }

    // 匹配立绘：完全和背景、CG一样的实现方式
    if (characterName && resources.sprites) {
      const matchText = characterName;
      console.info(
        '[立绘匹配] 开始匹配立绘，角色名:',
        characterName,
        '可用立绘数量:',
        resources.sprites.sprites.length,
        '立绘列表:',
        resources.sprites.sprites.map(s => ({ name: s.name, textMappings: s.textMappings })),
      );
      for (const sprite of resources.sprites.sprites) {
        // 匹配顺序：先匹配 textMappings，再匹配 name（和背景、CG完全一致）
        // 注意：这里使用 || 运算符，所以先检查 textMappings，如果匹配就返回 true
        const textMappingMatch = sprite.textMappings?.some(mapping => {
          const match = fuzzyMatch(mapping, matchText);
          console.info('[立绘匹配] 检查 textMapping:', {
            mapping,
            matchText,
            result: match,
          });
          return match;
        });
        const nameMatch = fuzzyMatch(sprite.name, matchText);
        console.info('[立绘匹配] 检查立绘:', {
          spriteName: sprite.name,
          textMappingMatch,
          nameMatch,
        });
        if (textMappingMatch || nameMatch) {
          result.spriteImageUrl = sprite.file;
          console.info(
            '[立绘匹配] 匹配成功! sprite:',
            sprite.name,
            'textMappings匹配:',
            textMappingMatch,
            'name匹配:',
            nameMatch,
            'URL:',
            sprite.file,
          );
          break;
        }
      }
      if (!result.spriteImageUrl) {
        console.warn('[立绘匹配] 未找到匹配的立绘，角色名:', characterName);
      }
    } else if (characterName && !resources.sprites) {
      console.warn('[立绘匹配] 世界书中没有立绘资源数据，角色名:', characterName);
    }

    // 匹配Live2D模型和动作表情：通过textMappings匹配character块中除了台词之外的所有文本
    // 收集所有需要匹配的文本（角色名、场景、动作、表情）
    const modelMatchTexts: string[] = [];
    if (characterName) modelMatchTexts.push(characterName);
    if (sceneText) modelMatchTexts.push(sceneText);
    if (motionText) modelMatchTexts.push(motionText);
    if (expressionText) modelMatchTexts.push(expressionText);

    // 遍历所有模型资源，通过modelName或textMappings匹配
    let matchedModelData: ModelResourceWorldbookData | null = null;
    for (const [modelName, modelData] of resources.models.entries()) {
      // 检查modelName是否匹配任何关键词
      if (modelMatchTexts.some(text => fuzzyMatch(modelName, text))) {
        matchedModelData = modelData;
        break;
      }
    }

    if (matchedModelData) {
      // 匹配动作（优先使用新格式：每个 motion 的 textMappings 数组）
      if (motionText) {
        let matchedMotion = false;

        // 优先使用新格式：遍历 motions 数组，检查每个 motion 的 textMappings
        if (matchedModelData.motions && matchedModelData.motions.length > 0) {
          for (const motion of matchedModelData.motions) {
            // 只匹配 motionType 为 'motion' 的（不包括 expression）
            if (motion.motionType === 'motion' && motion.textMappings && motion.textMappings.length > 0) {
              const matched = motion.textMappings.some(mapping => fuzzyMatch(mapping, motionText));
              if (matched) {
                result.motionFile = motion.file;
                matchedMotion = true;
                console.info('[世界书匹配] 通过新格式 textMappings 匹配到动作:', {
                  motionName: motion.name,
                  motionFile: motion.file,
                  matchedText: motionText,
                });
                break;
              }
            }
          }
        }

        // 如果没有通过新格式匹配到，尝试旧格式（向后兼容）
        if (!matchedMotion && matchedModelData.textMappings?.motion) {
          for (const [file, mappingText] of Object.entries(matchedModelData.textMappings.motion)) {
            if (fuzzyMatch(mappingText, motionText)) {
              // 找到匹配的映射，查找对应的动作文件
              const motion = (matchedModelData.motions || []).find(m => m.file === file || m.name === file);
              if (motion) {
                result.motionFile = motion.file;
                matchedMotion = true;
                break;
              }
            }
          }
        }

        // 如果还没有匹配到，通过文件名匹配
        if (!matchedMotion) {
          for (const motion of matchedModelData.motions || []) {
            if (
              motion.motionType === 'motion' &&
              (fuzzyMatch(motion.name, motionText) || fuzzyMatch(motion.file, motionText))
            ) {
              result.motionFile = motion.file;
              break;
            }
          }
        }
      }

      // 匹配表情（优先使用新格式：每个 motion 的 textMappings 数组）
      if (expressionText) {
        let matchedExpression = false;

        // 优先使用新格式：遍历 motions 数组，检查每个 motion 的 textMappings
        if (matchedModelData.motions && matchedModelData.motions.length > 0) {
          for (const motion of matchedModelData.motions) {
            // 只匹配 motionType 为 'expression' 的
            if (motion.motionType === 'expression' && motion.textMappings && motion.textMappings.length > 0) {
              const matched = motion.textMappings.some(mapping => fuzzyMatch(mapping, expressionText));
              if (matched) {
                result.expressionFile = motion.file;
                matchedExpression = true;
                console.info('[世界书匹配] 通过新格式 textMappings 匹配到表情:', {
                  motionName: motion.name,
                  motionFile: motion.file,
                  matchedText: expressionText,
                });
                break;
              }
            }
          }
        }

        // 如果没有通过新格式匹配到，尝试旧格式（向后兼容）
        if (!matchedExpression && matchedModelData.textMappings?.expression) {
          for (const [file, mappingText] of Object.entries(matchedModelData.textMappings.expression)) {
            if (fuzzyMatch(mappingText, expressionText)) {
              // 找到匹配的映射，查找对应的表情文件
              const expression = (matchedModelData.expressions || []).find(e => e.file === file || e.name === file);
              if (expression) {
                result.expressionFile = expression.file;
                matchedExpression = true;
                break;
              }
            }
          }
        }

        // 如果还没有匹配到，通过文件名匹配（向后兼容旧格式）
        if (!matchedExpression) {
          // 先尝试从 motions 数组中匹配（新格式）
          for (const motion of matchedModelData.motions || []) {
            if (
              motion.motionType === 'expression' &&
              (fuzzyMatch(motion.name, expressionText) || fuzzyMatch(motion.file, expressionText))
            ) {
              result.expressionFile = motion.file;
              matchedExpression = true;
              break;
            }
          }
          // 如果还没匹配到，尝试旧格式的 expressions 数组
          if (!matchedExpression && matchedModelData.expressions) {
            for (const expression of matchedModelData.expressions) {
              const exprName = typeof expression === 'string' ? expression : expression.name || expression.file;
              const exprFile = typeof expression === 'string' ? expression : expression.file;
              if (fuzzyMatch(exprName, expressionText) || fuzzyMatch(exprFile, expressionText)) {
                result.expressionFile = exprFile;
                break;
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.warn('匹配世界书资源失败:', error);
  }

  return result;
}

/**
 * 解析消息中的 StatusBlock 格式
 * 格式: <StatusBlock>...</StatusBlock>
 * 支持多行值（如待办事项）
 */
export function parseStatusBlock(message: string): StatusBlockData | null {
  const statusBlockRegex = /<StatusBlock>([\s\S]*?)<\/StatusBlock>/i;
  const match = message.match(statusBlockRegex);

  if (!match) {
    return null;
  }

  const content = match[1].trim();
  const statusData: StatusBlockData = {};

  // 先移除 <skit> 标签及其内容，避免干扰解析
  const contentWithoutSkit = content.replace(/<skit>[\s\S]*?<\/skit>/gi, '');

  // 按行解析，支持多行值
  const lines = contentWithoutSkit.split('\n');
  let currentKey: string | null = null;
  let currentValue: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // 检查是否是新的字段（以冒号结尾）
    const colonMatch = trimmedLine.match(/^([^：:]+)[：:]\s*(.*)$/);
    if (colonMatch) {
      // 保存上一个字段的值
      if (currentKey) {
        const finalValue = currentValue.join('\n').trim();
        if (finalValue) {
          statusData[currentKey] = finalValue;
        }
      }

      // 开始新字段
      currentKey = colonMatch[1].trim();
      const valuePart = colonMatch[2].trim();
      currentValue = valuePart ? [valuePart] : [];
    } else if (currentKey && trimmedLine) {
      // 继续累积多行值（忽略空行）
      currentValue.push(trimmedLine);
    }
  }

  // 保存最后一个字段的值
  if (currentKey) {
    statusData[currentKey] = currentValue.join('\n').trim();
  }

  return Object.keys(statusData).length > 0 ? statusData : null;
}

/**
 * 工具函数：判断角色名是否是用户角色
 * 统一处理 <user>、{{user}}、user、用户、你 等标识符
 * 如果提供了 userDisplayName，也会检查是否匹配
 */
function isUserCharacter(characterName: string | undefined, userDisplayName?: string): boolean {
  if (!characterName) return false;
  const normalized = characterName.trim().toLowerCase();

  // 检查默认的用户标识符
  const isDefaultUser =
    normalized === '<user>' ||
    normalized === '{{user}}' ||
    normalized === 'user' ||
    normalized === '用户' ||
    normalized === '你' ||
    normalized === '玩家';

  if (isDefaultUser) return true;

  // 如果提供了 userDisplayName，检查是否匹配（不区分大小写）
  if (userDisplayName && userDisplayName.trim()) {
    const normalizedUserDisplayName = userDisplayName.trim().toLowerCase();
    return normalized === normalizedUserDisplayName;
  }

  return false;
}

/**
 * 解析消息中的各种格式块
 * 支持的格式（新格式，键值对）：
 * - [[character||角色名：程北极||场景：家中||动作：抱胸||表情：生气||台词：你怎么这样！]]
 * - [[character||角色名：||CG场景：||台词：]]
 * - [[narration||场景：||旁白：]]
 * - [[blacktext||黑屏文字：]]
 * - [[user||场景：||台词：]]
 * - [[choice||选项1：去食堂||角色名：程北极||台词：好的，我们一起去吧！]] - 继续剧情演出
 * - [[choice||选项1：去食堂||选项2：去图书馆||选项3：回宿舍]] - 触发AI生成
 *
 * 智能识别：支持中文英文全角半角冒号，识别关键字（角色名、场景等）
 * 只解析 <content>...</content> 标签中的内容
 */
export async function parseMessageBlocks(
  message: string,
  lastScene?: string,
  userDisplayName?: string,
): Promise<MessageBlock[]> {
  const blocks: MessageBlock[] = [];
  let currentScene = lastScene; // 当前场景，用于继承

  // 提取 <content>...</content> 标签中的内容
  const contentMatch = message.match(/<content>([\s\S]*?)<\/content>/i);
  const contentText = contentMatch ? contentMatch[1] : message;

  // 第一步：找出所有块（包括 [[...]] 和小纸条）的位置
  interface BlockPosition {
    type: 'format' | 'note';
    start: number;
    end: number;
    match?: RegExpExecArray;
    noteContent?: string;
  }

  const blockPositions: BlockPosition[] = [];

  // 找出所有 [[type||...]] 格式块的位置
  const blockRegex = /\[\[(\w+)\|\|([^\]]*)\]\]/g;
  let match;

  while ((match = blockRegex.exec(contentText)) !== null) {
    blockPositions.push({
      type: 'format',
      start: match.index,
      end: match.index + match[0].length,
      match: match,
    });
  }

  // 找出所有小纸条块的位置
  const lines = contentText.split('\n');
  let currentPos = 0;
  let noteLines: string[] = [];
  let noteStartPos = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const lineStartPos = currentPos;
    const lineEndPos = currentPos + line.length;

    // 检查是否以 > 开头
    if (trimmedLine.startsWith('> ')) {
      if (noteLines.length === 0) {
        noteStartPos = lineStartPos;
      }
      // 移除 > 前缀，保留后续内容
      const noteLine = trimmedLine.substring(2);
      noteLines.push(noteLine);
    } else if (noteLines.length > 0 && trimmedLine === '') {
      // 空行继续保留在块中（用于保持格式）
      noteLines.push('');
    } else if (noteLines.length > 0 && !trimmedLine.startsWith('> ')) {
      // 遇到非 > 开头的非空行，结束当前块
      const noteContent = noteLines.join('\n').trim();
      if (noteContent) {
        blockPositions.push({
          type: 'note',
          start: noteStartPos,
          end: lineStartPos,
          noteContent: noteContent,
        });
      }
      noteLines = [];
      noteStartPos = -1;
    }

    currentPos = lineEndPos + 1; // +1 是换行符
  }

  // 处理最后一个小纸条块（如果存在）
  if (noteLines.length > 0) {
    const noteContent = noteLines.join('\n').trim();
    if (noteContent) {
      blockPositions.push({
        type: 'note',
        start: noteStartPos,
        end: currentPos,
        noteContent: noteContent,
      });
    }
  }

  // 按照在文本中的出现顺序排序
  blockPositions.sort((a, b) => a.start - b.start);

  // 第二步：按顺序处理所有块
  for (const blockPos of blockPositions) {
    if (blockPos.type === 'note') {
      // 处理小纸条块
      blocks.push({
        type: 'note',
        noteContent: blockPos.noteContent!,
      });
      continue;
    }

    // 处理格式块
    match = blockPos.match!;
    const type = match[1] as MessageBlock['type'];
    const content = match[2];

    if (type === 'character') {
      // 解析键值对格式
      const kvPairs = parseKeyValuePairs(content);

      // 检查角色名是否为用户角色（<user>、{{user}}、user、用户、你），如果是则转换为 user 类型
      const characterName = kvPairs['角色名'] || kvPairs['character'] || '';
      if (isUserCharacter(characterName, userDisplayName)) {
        // 转换为 user 类型
        const scene = kvPairs['场景'] || kvPairs['scene'] || currentScene;
        let messageText = kvPairs['台词'] || kvPairs['台词内容'] || kvPairs['text'] || content;

        // 处理用户输入中的特殊格式：
        // *星号包裹* 表示内心想法（保留原格式，用于显示时格式化）
        // 【】包裹 表示旁白（需要单独解析）
        const narrationRegex = /【([^】]+)】/g;

        // 检查是否有旁白（【】包裹的内容）
        const narrationMatches: string[] = [];
        let narrationMatch;
        while ((narrationMatch = narrationRegex.exec(messageText)) !== null) {
          narrationMatches.push(narrationMatch[1]);
        }

        // 移除旁白部分，保留其他内容
        messageText = messageText.replace(narrationRegex, '').trim();

        // 更新当前场景
        if (scene) {
          currentScene = scene;
        }

        // 如果有旁白，先创建旁白块
        for (const narrationText of narrationMatches) {
          const narrationBlock: MessageBlock = {
            type: 'narration',
            scene,
            message: narrationText,
          };

          // 匹配背景资源
          if (scene) {
            const resources = await matchWorldbookResources(undefined, scene, undefined, undefined, undefined);
            if (resources.sceneImageUrl) {
              narrationBlock.sceneImageUrl = resources.sceneImageUrl;
            }
          }

          blocks.push(narrationBlock);
        }

        // 创建用户消息块
        const block: MessageBlock = {
          type: 'user',
          scene,
          message: messageText,
        };

        // 匹配背景资源
        if (scene) {
          const resources = await matchWorldbookResources(undefined, scene, undefined, undefined, undefined);
          if (resources.sceneImageUrl) {
            block.sceneImageUrl = resources.sceneImageUrl;
          }
        }

        blocks.push(block);
        continue;
      }

      const block: MessageBlock = {
        type: 'character',
      };

      // 新格式：[[character||角色名：程北极||场景：家中||动作：抱胸||表情：生气||台词：你怎么这样！]]
      // 注意：角色名可以是 <user>、{{user}} 或任何其他名字，都当作普通角色名处理
      block.character = characterName;

      // 检查是否是离场指令：[[character||角色名：{{角色名}}||离场]]
      const shouldExit =
        kvPairs['离场'] !== undefined ||
        kvPairs['exit'] !== undefined ||
        kvPairs['动作'] === '离场' ||
        kvPairs['motion'] === 'exit' ||
        kvPairs['表情'] === '离场' ||
        kvPairs['expression'] === 'exit';

      if (shouldExit) {
        // 标记为离场，离场单元不包含台词，作为独立的分割标记
        block.shouldExit = true;
        block.text = ''; // 离场单元不显示台词
        blocks.push(block);
        continue;
      }

      // 检查是否有CG场景（只有明确指定CG场景时才进入CG模式）
      const cgScene = kvPairs['CG场景'] || kvPairs['cg场景'] || kvPairs['CG'] || kvPairs['cg'];
      if (cgScene) {
        // CG模式：使用CG场景，不显示立绘和模型
        block.scene = cgScene;
        block.text = kvPairs['台词'] || kvPairs['text'] || '';
        block.isCG = true;
      } else {
        // 普通模式：使用场景、动作、表情，可以显示立绘和模型
        block.scene = kvPairs['场景'] || kvPairs['scene'] || currentScene;
        block.motion = kvPairs['动作'] || kvPairs['motion'] || '';
        block.expression = kvPairs['表情'] || kvPairs['expression'] || '';
        block.text = kvPairs['台词'] || kvPairs['text'] || '';
        block.isCG = false; // 明确设置为 false，表示普通模式
      }

      // 如果没有解析到场景，使用继承的场景
      if (!block.scene && currentScene) {
        block.scene = currentScene;
      }

      // 更新当前场景
      if (block.scene) {
        currentScene = block.scene;
      }

      // 不再设置 isThrough，因为只有*星号包裹*的部分应该是灰色，不是整行
      // 保留 *星号包裹* 的原始格式，用于显示时格式化

      // 匹配世界书资源
      console.info('[消息解析] 开始匹配世界书资源:', {
        character: block.character,
        scene: block.isCG ? undefined : block.scene,
        motion: block.motion,
        expression: block.expression,
        cgScene: block.isCG ? block.scene : undefined,
        isCGMode: block.isCG,
      });
      const resources = await matchWorldbookResources(
        block.character,
        block.isCG ? undefined : block.scene, // CG模式时场景文本用于匹配CG，否则用于匹配背景
        block.motion,
        block.expression,
        block.isCG ? block.scene : undefined, // CG模式时场景文本用于匹配CG
      );
      console.info('[消息解析] 匹配到的资源:', resources);
      Object.assign(block, resources);

      blocks.push(block);
    } else if (type === 'narration') {
      // 新格式：[[narration||场景：||旁白：]]
      const kvPairs = parseKeyValuePairs(content);

      const scene = kvPairs['场景'] || kvPairs['scene'] || currentScene;
      const messageText = kvPairs['旁白'] || kvPairs['旁白内容'] || kvPairs['text'] || kvPairs['内容'] || content;

      // 更新当前场景
      if (scene) {
        currentScene = scene;
      }

      const block: MessageBlock = {
        type: 'narration',
        scene,
        message: messageText,
      };

      // 匹配背景资源
      if (scene) {
        const resources = await matchWorldbookResources(undefined, scene, undefined, undefined, undefined);
        if (resources.sceneImageUrl) {
          block.sceneImageUrl = resources.sceneImageUrl;
        }
      }

      blocks.push(block);
    } else if (type === 'blacktext') {
      // 新格式：[[blacktext||黑屏文字：]]
      const kvPairs = parseKeyValuePairs(content);
      const messageText = kvPairs['黑屏文字'] || kvPairs['text'] || kvPairs['文字'] || content;

      blocks.push({
        type: 'blacktext',
        message: messageText,
      });
    } else if (type === 'user') {
      // 新格式：[[user||场景：||台词：]]
      const kvPairs = parseKeyValuePairs(content);

      const scene = kvPairs['场景'] || kvPairs['scene'] || currentScene;
      let messageText = kvPairs['台词'] || kvPairs['用户消息'] || kvPairs['消息'] || kvPairs['text'] || content;

      // 处理用户输入中的特殊格式：
      // *星号包裹* 表示内心想法（保留原格式，用于显示时格式化）
      // 【】包裹 表示旁白（需要单独解析）
      const narrationRegex = /【([^】]+)】/g;

      // 检查是否有旁白（【】包裹的内容）
      const narrationMatches: string[] = [];
      let narrationMatch;
      while ((narrationMatch = narrationRegex.exec(messageText)) !== null) {
        narrationMatches.push(narrationMatch[1]);
      }

      // 移除旁白部分，保留其他内容
      messageText = messageText.replace(narrationRegex, '').trim();

      // 保留 *星号包裹* 的原始格式，不转换为 *through*（用于显示时格式化）

      // 更新当前场景
      if (scene) {
        currentScene = scene;
      }

      // 如果有旁白，先创建旁白块
      for (const narrationText of narrationMatches) {
        const narrationBlock: MessageBlock = {
          type: 'narration',
          scene,
          message: narrationText,
        };

        // 匹配背景资源
        if (scene) {
          const resources = await matchWorldbookResources(undefined, scene, undefined, undefined, undefined);
          if (resources.sceneImageUrl) {
            narrationBlock.sceneImageUrl = resources.sceneImageUrl;
          }
        }

        blocks.push(narrationBlock);
      }

      // 创建用户消息块
      // 注意：不再设置 isThrough，因为只有*星号包裹*的部分应该是灰色，不是整行
      const block: MessageBlock = {
        type: 'user',
        scene,
        message: messageText,
      };

      // 匹配背景资源
      if (scene) {
        const resources = await matchWorldbookResources(undefined, scene, undefined, undefined, undefined);
        if (resources.sceneImageUrl) {
          block.sceneImageUrl = resources.sceneImageUrl;
        }
      }

      blocks.push(block);
    } else if (type === 'choice') {
      // 支持两种格式：
      // 格式1（带角色回复）：每个 [[choice||...]] 块代表一个独立选项
      //   [[choice||选项1：{{选项内容}}||角色名：{{角色名}}||台词：{{台词}}]]
      //   [[choice||选项2：{{选项内容}}||角色名：{{角色名}}||台词：{{台词}}]]
      //   多个连续的此类块会在后续阶段合并到一个选择界面
      //
      // 格式2（触发AI）：一个 [[choice||...]] 块包含多个选项
      //   [[choice||选项1：{{选项1}}||选项2：{{选项2}}||选项3：{{选项3}}]]
      const kvPairs = parseKeyValuePairs(content);

      // 检查是否有角色名或台词字段（格式1）
      const hasCharacterOrResponse =
        kvPairs['角色名'] ||
        kvPairs['character'] ||
        kvPairs['台词'] ||
        kvPairs['response'] ||
        kvPairs['text'] ||
        kvPairs['旁白'] ||
        kvPairs['narration'];

      // 查找所有选项键（选项X，X可以是任意数字）
      const optionKeys: string[] = [];
      for (const key in kvPairs) {
        // 匹配 "选项X" 或 "选项X：" 格式（X可以是任意数字）
        if (key.match(/^选项\d+：?$/)) {
          const optionNum = key.replace(/^选项(\d+)：?$/, '$1');
          optionKeys.push(optionNum);
        }
      }
      // 按数字排序
      optionKeys.sort((a, b) => parseInt(a) - parseInt(b));

      if (optionKeys.length === 1 && hasCharacterOrResponse) {
        // 格式1：单个选项 + 角色回复
        // 这是一个独立的选项块，会在后续阶段与其他选项块合并
        const optionKey = `选项${optionKeys[0]}`;
        const optionText = kvPairs[optionKey] || kvPairs[`${optionKey}：`];

        if (optionText) {
          blocks.push({
            type: 'choice',
            choiceFormat: 'format1',
            options: [
              {
                id: `choice_0`,
                text: optionText,
                character: kvPairs['角色名'] || kvPairs['character'],
                response:
                  kvPairs['台词'] || kvPairs['response'] || kvPairs['text'] || kvPairs['旁白'] || kvPairs['narration'],
              },
            ],
          });
        }
      } else if (optionKeys.length > 1) {
        // 格式2：多个选项在一个块中（触发AI）
        const choices: string[] = [];
        for (const optionNum of optionKeys) {
          const optionKey = `选项${optionNum}`;
          const optionText = kvPairs[optionKey] || kvPairs[`${optionKey}：`];
          if (optionText) {
            choices.push(optionText);
          }
        }

        if (choices.length > 0) {
          blocks.push({
            type: 'choice',
            choiceFormat: 'format2',
            choices: choices,
          });
        }
      }
    }
  }

  return blocks;
}

/**
 * 检查角色是否有对应的动作和表情文件
 * 支持通过文件名或文本描述（通过textMappings）匹配
 */
export function hasMotionAndExpression(
  characterName: string,
  motion?: string,
  expression?: string,
  live2dModels?: any[],
): boolean {
  if (!characterName || !live2dModels || live2dModels.length === 0) {
    return false;
  }

  const model = live2dModels.find(m => m.name === characterName);
  if (!model) {
    return false;
  }

  // 检查是否有动作
  if (motion) {
    let hasMotion = false;

    // 先检查是否是文件名（直接匹配）
    hasMotion = model.motions?.some((m: any) => {
      const motionName = typeof m === 'string' ? m : m.name || m.file;
      return motionName === motion || motionName === `${motion}.motion3.json`;
    });

    // 如果不是文件名，尝试通过textMappings匹配文本描述
    if (!hasMotion && model.textMappings?.motion) {
      for (const [file, mappingText] of Object.entries(model.textMappings.motion)) {
        // 使用模糊匹配
        const normalizedMotion = normalizeText(motion);
        const normalizedMapping = normalizeText(String(mappingText));
        if (
          normalizedMotion === normalizedMapping ||
          normalizedMotion.includes(normalizedMapping) ||
          normalizedMapping.includes(normalizedMotion)
        ) {
          // 检查该文件是否在motions中
          hasMotion = model.motions?.some((m: any) => {
            const motionFile = typeof m === 'string' ? m : m.file;
            return motionFile === file || motionFile === `${file}.motion3.json`;
          });
          if (hasMotion) break;
        }
      }
    }

    if (!hasMotion) {
      return false;
    }
  }

  // 检查是否有表情
  if (expression) {
    let hasExpression = false;

    // 先检查是否是文件名（直接匹配）
    hasExpression = model.expressions?.some((e: any) => {
      const exprName = typeof e === 'string' ? e : e.name || e.file;
      return exprName === expression || exprName === `${expression}.exp3.json`;
    });

    // 如果不是文件名，尝试通过textMappings匹配文本描述
    if (!hasExpression && model.textMappings?.expression) {
      for (const [file, mappingText] of Object.entries(model.textMappings.expression)) {
        // 使用模糊匹配
        const normalizedExpression = normalizeText(expression);
        const normalizedMapping = normalizeText(String(mappingText));
        if (
          normalizedExpression === normalizedMapping ||
          normalizedExpression.includes(normalizedMapping) ||
          normalizedMapping.includes(normalizedExpression)
        ) {
          // 检查该文件是否在expressions中
          hasExpression = model.expressions?.some((e: any) => {
            const exprFile = typeof e === 'string' ? e : e.file;
            return exprFile === file || exprFile === `${file}.exp3.json`;
          });
          if (hasExpression) break;
        }
      }
    }

    if (!hasExpression) {
      return false;
    }
  }

  return true;
}
