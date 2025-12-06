/**
 * 开场界面静态数据
 */
import type { Character, Opening } from './types';

/** 默认开场数据 - 可根据需要修改 */
export const DEFAULT_OPENINGS: Opening[] = [
  {
    id: 'spring',
    title: '春之邂逅',
    description: '樱花飘落的季节，命运的相遇悄然开始...',
    image: '', // TODO: 填入图片URL
    message: '樱花飘落的季节，我在樱花树下与你相遇...',
  },
  {
    id: 'summer',
    title: '夏之约定',
    description: '蝉鸣声中，许下永不忘记的誓言...',
    image: '', // TODO: 填入图片URL
    message: '夏日的午后，我们许下了永不忘记的约定...',
  },
  {
    id: 'autumn',
    title: '秋之离别',
    description: '红叶纷飞，不舍的泪水模糊了视线...',
    image: '', // TODO: 填入图片URL
    message: '秋天的风带走了你，却带不走我的思念...',
  },
  {
    id: 'winter',
    title: '冬之重逢',
    description: '白雪皑皑，终于再次见到思念的人...',
    image: '', // TODO: 填入图片URL
    message: '雪花飘落，我们终于在冬天再次相遇...',
  },
];

/** 默认角色数据 - 可根据需要修改 */
export const DEFAULT_CHARACTERS: Character[] = [
  {
    name: '樱井 美月',
    role: '女主角',
    desc: '温柔善良的少女，拥有感知星光的神秘能力。在一次偶然中与命运相遇，开启了一段跨越时空的旅程。',
    image: '', // TODO: 填入图片URL
    colorClass: '',
  },
  {
    name: '星野 苍',
    role: '男主角',
    desc: '神秘的转学生，似乎隐藏着不为人知的过去。冷淡的外表下，有着温暖的内心。',
    image: '', // TODO: 填入图片URL
    colorClass: 'blue',
  },
  {
    name: '日向 心',
    role: '好友',
    desc: '美月的青梅竹马，活泼开朗的性格总能带给周围人欢笑。暗中守护着美月。',
    image: '', // TODO: 填入图片URL
    colorClass: 'orange',
  },
  {
    name: '月见 透',
    role: '神秘人物',
    desc: '在关键时刻出现的神秘人物，似乎知道所有事情的真相。身份成谜。',
    image: '', // TODO: 填入图片URL
    colorClass: 'gray',
  },
];

/** 世界书名称 */
export const WORLDBOOK_NAME = '开场界面-模型数据';

/** 常见的动作文件名模式（用于URL导入时探测） */
export const COMMON_MOTION_FILES = [
  '01_Idle_M.motion3.json',
  '02_Look right_M.motion3.json',
  '03_Look righ wait_M.motion3.json',
  '04_Sigh_M.motion3.json',
  '05_Shake head slow_M.motion3.json',
  '06_Get startled and laugh_M.motion3.json',
];

/** 常见的表情文件名模式（用于URL导入时探测） */
export const COMMON_EXPRESSION_FILES = [
  '101_Cross arms_E.motion3.json',
  '102_Angry_E.motion3.json',
  '103_Smeil_E.motion3.json',
  '104_Grin_E.motion3.json',
  '105_Confused_E.motion3.json',
  '105_Shy_E.motion3.json',
  '106_Serious_E.motion3.json',
  '107_Cry_E.motion3.json',
  '108_Normal_E.motion3.json',
  '109_awkward_E.motion3.json',
  '110_speechless_E.motion3.json',
  '111_Gentle_E.motion3.json',
];

/** 可能的模型文件夹路径 */
export const MODEL_PATHS = ['models/', 'model/', ''];

/** 可能的动作文件夹路径 */
export const MOTION_PATHS = ['motions/', 'Motions/', 'motions/Motions/', ''];

/** 支持的模型配置文件名称 */
export const MODEL_CONFIG_FILES = ['model3.json', 'model.json'];

/** 粒子效果配置 */
export const PARTICLE_CONFIG = {
  count: 20,
  minDuration: 5,
  maxDuration: 10,
  maxDelay: 5,
};
