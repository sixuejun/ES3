import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并 CSS 类名的工具函数
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 将颜色转换为带透明度的 RGBA 格式
 * @param borderColor - 原始颜色（支持 hex、rgb、rgba 格式）
 * @param opacity - 透明度（0-1）
 */
export function getBorderColorForPattern(borderColor: string, opacity = 0.08): string {
  if (borderColor.startsWith('rgba')) {
    const match = borderColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
  } else if (borderColor.startsWith('rgb')) {
    const match = borderColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`;
    }
  } else if (borderColor.startsWith('#')) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(borderColor);
    if (result) {
      const r = Number.parseInt(result[1], 16);
      const g = Number.parseInt(result[2], 16);
      const b = Number.parseInt(result[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
  }
  return `rgba(0, 0, 0, ${opacity})`;
}

/**
 * 解析背景图案模板，替换颜色变量
 * @param pattern - 包含 VAR_BORDER_COLOR 占位符的图案字符串
 * @param borderColor - 边框颜色
 */
export function resolvePatternWithColor(pattern: string, borderColor: string): string {
  if (!pattern) return '';
  const patternBorderColor = getBorderColorForPattern(borderColor, 0.08);
  return pattern.replace(/VAR_BORDER_COLOR/g, patternBorderColor);
}
