/**
 * textMappings 校验工具
 * 用于校验动作配置中的 textMappings 是否能正确匹配到模型文件中的动作
 */

interface MotionConfig {
  group: string;
  name: string;
  file: string;
  index?: number;
  textMappings?: string[];
}

interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  motionName: string;
  textMapping: string;
  reason: string;
}

interface ValidationWarning {
  motionName: string;
  textMapping?: string;
  message: string;
}

/**
 * 校验 textMappings 配置
 * @param motions 动作配置数组
 * @param basePath 模型文件的基础路径
 * @param fileIds 本地文件的 fileId 映射（可选）
 * @returns 校验结果
 */
export async function validateTextMappings(
  motions: MotionConfig[],
  basePath: string,
  fileIds?: Record<string, string>,
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // 用于缓存文件存在性检查结果
  const fileExistenceCache = new Map<string, boolean>();

  // 检查每个 motion 的 textMappings
  for (const motion of motions) {
    if (!motion.textMappings || motion.textMappings.length === 0) {
      continue;
    }

    // 检查动作文件是否存在
    if (motion.file) {
      const fileUrl = motion.file.startsWith('http') ? motion.file : `${basePath}${motion.file}`;

      // 检查文件是否存在（使用缓存避免重复请求）
      if (!fileExistenceCache.has(fileUrl)) {
        const exists = await checkFileExists(fileUrl, fileIds, motion.file);
        fileExistenceCache.set(fileUrl, exists);
      }

      if (!fileExistenceCache.get(fileUrl)) {
        // 文件不存在，记录错误
        for (const textMapping of motion.textMappings) {
          errors.push({
            motionName: motion.name,
            textMapping,
            reason: `动作文件不存在: ${motion.file}`,
          });
        }
        continue;
      }
    }

    // 检查 index 是否有效
    if (motion.index === undefined || motion.index < 0) {
      warnings.push({
        motionName: motion.name,
        message: `动作 "${motion.name}" 没有有效的 index，可能无法正确播放`,
      });
    }

    // 检查 group 是否为空（空字符串是有效的）
    if (motion.group === undefined || motion.group === null) {
      warnings.push({
        motionName: motion.name,
        message: `动作 "${motion.name}" 没有指定 group，默认使用空字符串`,
      });
    }
  }

  // 检查是否有重复的 textMappings
  const textMappingsSet = new Set<string>();
  for (const motion of motions) {
    if (!motion.textMappings) continue;

    for (const textMapping of motion.textMappings) {
      const normalized = normalizeText(textMapping);
      if (textMappingsSet.has(normalized)) {
        warnings.push({
          motionName: motion.name,
          textMapping,
          message: `关键字 "${textMapping}" 被多个动作使用，可能导致匹配冲突`,
        });
      }
      textMappingsSet.add(normalized);
    }
  }

  return {
    success: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * 检查文件是否存在
 * @param fileUrl 文件 URL
 * @param fileIds 本地文件的 fileId 映射
 * @param filename 文件名
 * @returns 文件是否存在
 */
async function checkFileExists(fileUrl: string, fileIds?: Record<string, string>, filename?: string): Promise<boolean> {
  try {
    // 如果是本地文件（IndexedDB），检查 fileId 是否存在
    if (fileUrl.startsWith('indexeddb://') && fileIds && filename) {
      const fileId = fileIds[filename];
      return !!fileId;
    }

    // 如果是 URL 文件，使用 HEAD 请求检查
    if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
      const response = await fetch(fileUrl, { method: 'HEAD' });
      return response.ok;
    }

    // 其他情况（相对路径等），假设文件存在
    return true;
  } catch (error) {
    console.warn(`[validation] 检查文件存在性失败: ${fileUrl}`, error);
    return false;
  }
}

/**
 * 标准化文本（用于比较）
 * @param text 原始文本
 * @returns 标准化后的文本
 */
function normalizeText(text: string): string {
  return text.replace(/[-/\\_.\s]/g, '').toLowerCase();
}

/**
 * 格式化校验结果为可读的文本
 * @param result 校验结果
 * @returns 格式化后的文本
 */
export function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  if (result.success && result.warnings.length === 0) {
    lines.push('✅ 校验通过！所有 textMappings 都能正确匹配到动作文件。');
    return lines.join('\n');
  }

  if (result.errors.length > 0) {
    lines.push(`❌ 发现 ${result.errors.length} 个错误：`);
    lines.push('');
    for (const error of result.errors) {
      lines.push(`  • [${error.motionName}] "${error.textMapping}": ${error.reason}`);
    }
  }

  if (result.warnings.length > 0) {
    if (result.errors.length > 0) {
      lines.push('');
    }
    lines.push(`⚠️  发现 ${result.warnings.length} 个警告：`);
    lines.push('');
    for (const warning of result.warnings) {
      if (warning.textMapping) {
        lines.push(`  • [${warning.motionName}] "${warning.textMapping}": ${warning.message}`);
      } else {
        lines.push(`  • [${warning.motionName}] ${warning.message}`);
      }
    }
  }

  return lines.join('\n');
}

/**
 * 限制并发请求数量的工具函数
 * @param tasks 任务数组
 * @param concurrency 最大并发数
 * @returns Promise 数组的结果
 */
export async function limitConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  const executing: Promise<void>[] = [];

  for (const task of tasks) {
    const promise = task().then(result => {
      results.push(result);
    });

    executing.push(promise);

    if (executing.length >= concurrency) {
      await Promise.race(executing);
      // 移除已完成的 promise
      const index = executing.findIndex(p => p === promise);
      if (index >= 0) {
        executing.splice(index, 1);
      }
    }
  }

  await Promise.all(executing);
  return results;
}
