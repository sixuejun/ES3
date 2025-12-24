/**
 * 消息解析相关的类型定义
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
  type: 'character' | 'narration' | 'blacktext' | 'user' | 'choice' | 'note';
  character?: string;
  scene?: string;
  motion?: string;
  expression?: string;
  text?: string;
  message?: string;
  isThrough?: boolean;
  isCG?: boolean;
  choices?: string[]; // 旧格式：[[choice||选项1||选项2||选项3]]
  choiceText?: string; // 新格式（已废弃）：选项文本 [[choice||选项1||角色名||台词]]
  choiceCharacter?: string; // 新格式（已废弃）：角色名
  choiceResponse?: string; // 新格式（已废弃）：台词
  options?: Array<{
    // 新格式：多个选项
    id: string;
    text: string;
    character?: string;
    response?: string;
  }>;
  // 从世界书中解析到的资源文件路径
  sceneImageUrl?: string; // 背景图片URL
  cgImageUrl?: string; // CG图片URL
  spriteImageUrl?: string; // 立绘图片URL
  motionFile?: string; // 动作文件
  expressionFile?: string; // 表情文件
  // 小纸条内容
  noteContent?: string;
  noteUnitId?: string; // 小纸条绑定的演出单元ID
  choiceFormat?: 'format1' | 'format2'; // 选项格式标识
}

/**
 * Live2D Motion 配置接口
 */
export interface Live2DMotion {
  name: string;
  file: string;
  group: string;
  index: number;
  motionType: 'motion' | 'expression';
  textMappings?: string[];
}
