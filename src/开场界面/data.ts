/**
 * 开场界面静态数据
 */
import type { Character, Opening } from './types';

/** 默认开场数据 - 可根据需要修改 */
export const DEFAULT_OPENINGS: Opening[] = [
  {
    id: '01',
    title: '雨声淅淅',
    description: '下雨天，哥在等<user>放学...',
    image: 'https://pic1.imgdb.cn/item/6938291300233646958dead1.png', // TODO: 填入图片URL
    message: ` `,
  },
  {
    id: '02',
    title: '葬礼',
    description: '养母死后，在葬礼上的重逢',
    image: 'https://pic1.imgdb.cn/item/693828f100233646958deab2.png', // TODO: 填入图片URL
    message: `🚧还没做完，前方施工中🚧`,
  },
  {
    id: '03',
    title: '病热潮',
    description: '哥发烧了，来对他做点什么吧？',
    image: 'https://pic1.imgdb.cn/item/6938293600233646958deb09.png', // TODO: 填入图片URL
    message: ` `,
  },
  {
    id: '04',
    title: '偷窥',
    description: '这是什么？哥的日记？偷看一下。',
    image: 'https://pic1.imgdb.cn/item/693828fe00233646958deab8.png', // TODO: 填入图片URL
    message: ` `,
  },
];

/** 默认角色数据 - 可根据需要修改 */
export const DEFAULT_CHARACTERS: Character[] = [
  {
    name: '程北极',
    role: '男主角',
    desc: '程家养子，<user>名义上的哥哥',
    image: 'https://iili.io/f1w9qVR.jpg', // TODO: 填入图片URL
    colorClass: 'blue',
  },
  {
    name: '许桥雨',
    role: '<user>的同学',
    desc: '和<user>同班，性格温柔随和，学习努力。',
    image: 'https://iili.io/f1w9nKN.jpg', // TODO: 填入图片URL
    colorClass: '',
  },
  {
    name: '林风',
    role: '程北极的同学',
    desc: '外向开朗,家境优渥所以不在乎学习,一个不爱读书、向往外面世界的“坏学生”。',
    image: 'https://iili.io/f1w9olI.jpg', // TODO: 填入图片URL
    colorClass: 'orange',
  },
  {
    name: '陈曦',
    role: '<user>的同学',
    desc: '和{{user}}同班，性格腼腆谨慎，艺术生兼文艺委员。',
    image: 'https://iili.io/f1w9xSt.jpg', // TODO: 填入图片URL
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
