/**
 * 消息解析器
 * 用于解析酒馆消息中的特殊格式块，如 [[character||...]]、[[narration||...]] 等
 */

export interface StatusBlockData {
  地点?: string;
  关系?: string;
  心情?: string;
  吐槽?: string;
  待办?: string;
  小剧场?: string;
  [key: string]: any;
}

export interface MessageBlock {
  type: 'character' | 'narration' | 'blacktext' | 'user' | 'choice';
  character?: string;
  scene?: string;
  motion?: string;
  expression?: string;
  text?: string;
  message?: string;
  isThrough?: boolean;
  isCG?: boolean;
  choices?: string[]; // 旧格式：[[choice||选项1||选项2||选项3]]
  choiceText?: string; // 新格式：选项文本 [[choice||选项1||角色名||台词]]
  choiceCharacter?: string; // 新格式：角色名
  choiceResponse?: string; // 新格式：台词
}

/**
 * 解析消息中的 StatusBlock 格式
 * 格式: <StatusBlock>...</StatusBlock>
 */
export function parseStatusBlock(message: string): StatusBlockData | null {
  const statusBlockRegex = /<StatusBlock>([\s\S]*?)<\/StatusBlock>/i;
  const match = message.match(statusBlockRegex);

  if (!match) {
    return null;
  }

  const content = match[1].trim();
  const statusData: StatusBlockData = {};

  // 解析字段：字段名: 值
  const fieldRegex = /(\S+?):\s*(.+?)(?=\n\S+?:|\n*$)/g;
  let fieldMatch;

  while ((fieldMatch = fieldRegex.exec(content)) !== null) {
    const key = fieldMatch[1].trim();
    const value = fieldMatch[2].trim();
    statusData[key] = value;
  }

  // 如果没有解析到字段，尝试按行解析
  if (Object.keys(statusData).length === 0) {
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();
        if (key && value) {
          statusData[key] = value;
        }
      }
    }
  }

  return Object.keys(statusData).length > 0 ? statusData : null;
}

/**
 * 解析消息中的各种格式块
 * 支持的格式：
 * - [[character||角色名||场景||动作||表情||台词]]
 * - [[character||角色名||CG场景||台词]]
 * - [[narration||场景||旁白内容]]
 * - [[blacktext||黑屏文字]]
 * - [[user||场景||用户消息]]
 * - [[choice||选项1||选项2||选项3]]
 */
export function parseMessageBlocks(message: string): MessageBlock[] {
  const blocks: MessageBlock[] = [];

  // 匹配 [[type||...]] 格式
  const blockRegex = /\[\[(\w+)\|\|([^\]]*)\]\]/g;
  let match;

  while ((match = blockRegex.exec(message)) !== null) {
    const type = match[1] as MessageBlock['type'];
    const content = match[2];

    if (type === 'character') {
      // [[character||角色名||场景||动作||表情||台词]]
      // 或 [[character||角色名||CG场景||台词]]
      const parts = content.split('||').map(p => p.trim());

      if (parts.length >= 2) {
        const block: MessageBlock = {
          type: 'character',
          character: parts[0],
        };

        if (parts.length === 2) {
          // 只有角色名和台词
          block.text = parts[1];
        } else if (parts.length === 3) {
          // 角色名、场景、台词（CG模式）
          block.scene = parts[1];
          block.text = parts[2];
          block.isCG = true;
        } else if (parts.length >= 4) {
          // 完整格式：角色名、场景、动作、表情、台词
          block.scene = parts[1];
          block.motion = parts[2];
          block.expression = parts[3];
          block.text = parts.slice(4).join('||') || '';

          // 如果没有动作和表情，进入CG模式
          if (!block.motion && !block.expression) {
            block.isCG = true;
          }
        }

        // 检查是否是 through 消息
        if (block.text && block.text.includes('*through*')) {
          block.isThrough = true;
          block.text = block.text.replace(/\*through\*/g, '').trim();
        }

        blocks.push(block);
      }
    } else if (type === 'narration') {
      // [[narration||场景||旁白内容]]
      const parts = content.split('||').map(p => p.trim());
      blocks.push({
        type: 'narration',
        scene: parts[0],
        message: parts.slice(1).join('||') || parts[0],
      });
    } else if (type === 'blacktext') {
      // [[blacktext||黑屏文字]]
      blocks.push({
        type: 'blacktext',
        message: content,
      });
    } else if (type === 'user') {
      // [[user||场景||用户消息]]
      const parts = content.split('||').map(p => p.trim());
      blocks.push({
        type: 'user',
        scene: parts[0],
        message: parts.slice(1).join('||') || parts[0],
      });
    } else if (type === 'choice') {
      const parts = content
        .split('||')
        .map(c => c.trim())
        .filter(c => c);

      if (parts.length >= 3) {
        // 新格式：[[choice||选项1||角色名||台词]]
        // 选项的数目表示顺序（选项1、选项2、选项3等）
        blocks.push({
          type: 'choice',
          choiceText: parts[0], // 选项文本
          choiceCharacter: parts[1], // 角色名
          choiceResponse: parts.slice(2).join('||') || '', // 台词（可能包含||分隔符）
        });
      } else if (parts.length > 0) {
        // 旧格式：[[choice||选项1||选项2||选项3]]（演出后的真选项框）
        blocks.push({
          type: 'choice',
          choices: parts,
        });
      }
    }
  }

  return blocks;
}

/**
 * 检查角色是否有对应的动作和表情文件
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
    const hasMotion = model.motions?.some((m: any) => {
      const motionName = typeof m === 'string' ? m : m.name || m.file;
      return motionName === motion || motionName === `${motion}.motion3.json`;
    });
    if (!hasMotion) {
      return false;
    }
  }

  // 检查是否有表情
  if (expression) {
    const hasExpression = model.expressions?.some((e: any) => {
      const exprName = typeof e === 'string' ? e : e.name || e.file;
      return exprName === expression || exprName === `${expression}.exp3.json`;
    });
    if (!hasExpression) {
      return false;
    }
  }

  return true;
}
