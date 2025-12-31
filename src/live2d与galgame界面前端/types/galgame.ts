/**
 * Galgame 界面相关的类型定义
 */

/**
 * 演出单元 - 一个完整的演出单元包含：
 * 1. 主对话内容（character/narration/user/blackscreen）
 * 2. 可选的小纸条（noteContent）
 * 3. 可选的选项（options）
 *
 * 每个演出单元有唯一的 unitId，用于索引和导航
 */
export interface DialogueItem {
  // ===== 演出单元标识 =====
  unitId: string; // 演出单元唯一ID，格式：msg_{message_id}_unit_{index}
  unitIndex: number; // 演出单元在当前消息中的序号（从0开始）

  // ===== 主对话内容 =====
  character?: string;
  text: string;
  type?: 'blackscreen' | 'choice' | 'narration' | 'user' | 'cg' | 'marker';

  // ===== 酒馆消息信息 =====
  message_id?: number; // 酒馆消息ID
  role?: 'system' | 'assistant' | 'user'; // 消息角色

  // ===== 视觉效果 =====
  sprite?: {
    type: 'live2d' | 'image' | 'none'; // 立绘类型，none表示CG模式不显示立绘
    live2dModelId?: string; // Live2D 模型ID
    imageUrl?: string; // 图片URL
  };
  scene?: string; // 场景
  sceneImageUrl?: string; // 场景背景图片URL（从世界书匹配）
  motion?: string; // 动作
  expression?: string; // 表情
  isThrough?: boolean; // 是否为through消息（浅灰色斜体）
  isCG?: boolean; // 是否为CG模式
  cgImageUrl?: string; // CG图片URL

  // ===== 附加内容（与主对话绑定展示） =====
  noteContent?: string; // 小纸条内容（与主对话一起显示）
  noteUnitId?: string; // 小纸条绑定的演出单元ID（用于绑定到前面的演出单元）
  notePosition?: { x: number; y: number }; // 小纸条的拖动位置（相对于容器的坐标）
  options?: ChoiceOption[]; // 选项（与主对话一起显示）
  choiceFormat?: 'format1' | 'format2'; // 选项格式标识（格式1：剧情中选项，格式2：剧情末尾选项）
  isChoiceResponse?: boolean; // 是否为选项回复演出单元（演出单元3或4）
  choiceParentId?: string; // 选项父级ID（用于回溯时识别和替换）

  // ===== 状态栏 =====
  statusBlock?: {
    地点?: string;
    关系?: string;
    心情?: string;
    吐槽?: string;
    待办?: string;
    小剧场?: string;
    [key: string]: any;
  } | null;

  // ===== 编辑状态 =====
  isEditable?: boolean; // 是否为可编辑的用户消息
  editedText?: string; // 编辑后的文本（内存中）
  isDeleted?: boolean; // 是否已删除（内存中）

  // ===== 阅读状态 =====
  isRead?: boolean; // 是否已读，默认为 false（未读）

  // ===== 角色在场标记 =====
  isCharacterEntrance?: boolean; // 是否为角色首次出现的单元（用于回顾时分割）
  isCharacterExit?: boolean; // 是否为角色离场的单元（用于回顾时分割）
  isMarker?: boolean; // 是否为 marker 单元（不显示，自动跳过）
}

export interface ChoiceOption {
  id: string;
  text: string;
  character?: string; // 角色名（新格式）
  response?: string; // 台词（新格式）
  onClick?: () => void;
}

export interface BoxShapePreset {
  id: string;
  name: string;
  borderRadius: string;
  borderWidth: string;
  shadow: string;
}

export interface NameShapePreset {
  id: string;
  name: string;
  borderRadius: string;
  style: 'tag' | 'pill' | 'square' | 'underline' | 'floating';
}

export interface ArrowShapePreset {
  id: string;
  name: string;
  type: 'circle' | 'square' | 'pill' | 'minimal' | 'inner-round' | 'inner-square';
  isInner: boolean;
}

export interface IndicatorShapePreset {
  id: string;
  name: string;
  type: 'dots' | 'diamonds' | 'pulse' | 'arrow' | 'none';
}

export interface BackgroundPatternPreset {
  id: string;
  name: string;
  pattern: string;
}

export interface DialogBoxStyle {
  boxShape: string;
  nameShape: string;
  arrowShape: string;
  indicatorShape: string;
  backgroundPattern: string;
  borderWidth: string;
  colors: {
    boxBackground: string;
    boxBorder: string;
    nameBackground: string;
    nameText: string;
    nameBorder: string;
    dialogText: string;
    narrationText: string;
    arrowBackground: string;
    arrowIcon: string;
    indicatorColor: string;
  };
  fontSize: number;
}

export const backgroundPatternPresets: BackgroundPatternPreset[] = [
  { id: 'none', name: '无', pattern: '' },
  {
    id: 'grid',
    name: '方格',
    pattern:
      'linear-gradient(to right, VAR_BORDER_COLOR 1px, transparent 1px), linear-gradient(to bottom, VAR_BORDER_COLOR 1px, transparent 1px)',
  },
  { id: 'dots', name: '圆点', pattern: 'radial-gradient(circle, VAR_BORDER_COLOR 1px, transparent 1px)' },
  {
    id: 'diamonds',
    name: '菱形',
    pattern:
      'linear-gradient(45deg, VAR_BORDER_COLOR 25%, transparent 25%), linear-gradient(-45deg, VAR_BORDER_COLOR 25%, transparent 25%), linear-gradient(45deg, transparent 75%, VAR_BORDER_COLOR 75%), linear-gradient(-45deg, transparent 75%, VAR_BORDER_COLOR 75%)',
  },
  {
    id: 'stripes',
    name: '条纹',
    pattern:
      'repeating-linear-gradient(45deg, transparent, transparent 10px, VAR_BORDER_COLOR 10px, VAR_BORDER_COLOR 20px)',
  },
  {
    id: 'gradient-soft',
    name: '柔光渐变',
    pattern: 'linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, VAR_BORDER_COLOR 100%)',
  },
];

export const boxShapePresets: BoxShapePreset[] = [
  { id: 'rounded', name: '圆角', borderRadius: '12px', borderWidth: '1px', shadow: '0 4px 20px rgba(0,0,0,0.08)' },
  { id: 'pill', name: '毛玻璃', borderRadius: '24px', borderWidth: '1px', shadow: '0 4px 24px rgba(0,0,0,0.1)' },
  { id: 'sharp', name: '直角', borderRadius: '0px', borderWidth: '2px', shadow: '4px 4px 0 rgba(0,0,0,0.1)' },
  { id: 'soft', name: '柔和', borderRadius: '16px', borderWidth: '0px', shadow: '0 8px 32px rgba(0,0,0,0.12)' },
  { id: 'frame', name: '画框', borderRadius: '4px', borderWidth: '3px', shadow: 'inset 0 0 0 1px rgba(0,0,0,0.05)' },
];

export const borderWidthPresets = [
  { id: 'none', name: '无', width: '0px' },
  { id: 'thin', name: '细', width: '1px' },
  { id: 'medium', name: '中', width: '2px' },
  { id: 'thick', name: '粗', width: '3px' },
  { id: 'bold', name: '加粗', width: '4px' },
];

export const nameShapePresets: NameShapePreset[] = [
  { id: 'tag', name: '标签', borderRadius: '6px 6px 0 0', style: 'tag' },
  { id: 'pill', name: '胶囊', borderRadius: '999px', style: 'pill' },
  { id: 'square', name: '方形', borderRadius: '0px', style: 'square' },
  { id: 'underline', name: '下划线', borderRadius: '0px', style: 'underline' },
  { id: 'floating', name: '悬浮', borderRadius: '8px', style: 'floating' },
];

export const arrowShapePresets: ArrowShapePreset[] = [
  { id: 'circle', name: '圆形', type: 'circle', isInner: false },
  { id: 'square', name: '方形', type: 'square', isInner: false },
  { id: 'pill', name: '胶囊', type: 'pill', isInner: false },
  { id: 'minimal', name: '极简', type: 'minimal', isInner: false },
  { id: 'inner-round', name: '内嵌圆', type: 'inner-round', isInner: true },
  { id: 'inner-square', name: '内嵌方', type: 'inner-square', isInner: true },
];

export const indicatorShapePresets: IndicatorShapePreset[] = [
  { id: 'dots', name: '呼吸点', type: 'dots' },
  { id: 'diamonds', name: '菱形', type: 'diamonds' },
  { id: 'pulse', name: '脉冲', type: 'pulse' },
  { id: 'arrow', name: '箭头', type: 'arrow' },
  { id: 'none', name: '无', type: 'none' },
];

export const defaultDialogStyle: DialogBoxStyle = {
  boxShape: 'rounded',
  nameShape: 'tag',
  arrowShape: 'circle',
  indicatorShape: 'dots',
  backgroundPattern: 'none',
  borderWidth: 'thin',
  colors: {
    boxBackground: 'rgba(255, 255, 255, 0.9)',
    boxBorder: 'rgba(16, 185, 129, 0.3)',
    nameBackground: 'rgba(236, 253, 245, 0.9)',
    nameText: '#059669',
    nameBorder: 'rgba(16, 185, 129, 0.3)',
    dialogText: '#374151',
    narrationText: '#6b7280',
    arrowBackground: 'rgba(255, 255, 255, 0.85)',
    arrowIcon: '#10b981',
    indicatorColor: '#10b981',
  },
  fontSize: 16,
};
