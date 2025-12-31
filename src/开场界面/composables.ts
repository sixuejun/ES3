/**
 * 开场界面组合式函数
 */
import { klona } from 'klona';
import toastr from 'toastr';
import type { PartialDeep } from 'type-fest';
import { computed, ref } from 'vue';
import {
  COMMON_EXPRESSION_FILES,
  COMMON_MOTION_FILES,
  MODEL_CONFIG_FILES,
  MODEL_PATHS,
  MOTION_PATHS,
  PARTICLE_CONFIG,
  WORLDBOOK_NAME,
} from './data';
import type { ImportedModel, Opening, PageType, ParsedFileUrl, VirtualModelFiles } from './types';
import { storeFile } from './utils/indexedDB';

// ==================== 页面导航 ====================

/**
 * 页面导航组合式函数
 */
export function usePageNavigation() {
  const currentPage = ref<PageType>('main-menu');

  function showPage(page: PageType) {
    currentPage.value = page;
  }

  return { currentPage, showPage };
}

// ==================== 角色展示 ====================

/**
 * 角色展示组合式函数
 */
export function useCharacterDisplay<T>(characters: T[]) {
  const currentIndex = ref(0);
  const currentItem = computed(() => characters[currentIndex.value]);

  function prev() {
    currentIndex.value = currentIndex.value === 0 ? characters.length - 1 : currentIndex.value - 1;
  }

  function next() {
    currentIndex.value = currentIndex.value === characters.length - 1 ? 0 : currentIndex.value + 1;
  }

  function goTo(index: number) {
    if (index >= 0 && index < characters.length) {
      currentIndex.value = index;
    }
  }

  return { currentIndex, currentItem, prev, next, goTo };
}

// ==================== 粒子效果 ====================

/**
 * 创建粒子效果
 */
export function createParticles(container: HTMLElement | null | undefined) {
  if (!container) return;

  const { count, minDuration, maxDuration, maxDelay } = PARTICLE_CONFIG;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.top = `${Math.random() * 100}%`;
    particle.style.animationDelay = `${Math.random() * maxDelay}s`;
    particle.style.animationDuration = `${minDuration + Math.random() * (maxDuration - minDuration)}s`;
    container.appendChild(particle);
  }
}

// ==================== 开场选择 ====================

/**
 * 跳转到指定的 swipe
 */
async function switchFirstMessage(swipeId: number) {
  try {
    if (
      typeof (window as any).SillyTavern !== 'undefined' &&
      (window as any).SillyTavern.chat &&
      (window as any).SillyTavern.chat[0]
    ) {
      const firstMessage = (window as any).SillyTavern.chat[0];
      if (firstMessage.swipe_id !== undefined && firstMessage.swipe_id !== swipeId) {
        if (firstMessage.swipes && firstMessage.swipes[swipeId]) {
          firstMessage.swipe_id = swipeId;
          firstMessage.mes = firstMessage.swipes[swipeId];
          await (window as any).SillyTavern.saveChat();
          await (window as any).SillyTavern.reloadCurrentChat();
          console.info(`已跳转到 swipe ${swipeId}`);
        } else {
          console.warn(`swipe ${swipeId} 不存在`);
          toastr.warning(`swipe ${swipeId} 不存在`);
        }
      }
    }
  } catch (error) {
    console.error('跳转 swipe 失败:', error);
    toastr.error('跳转失败');
    throw error;
  }
}

/**
 * 选择开场并发送消息
 */
export async function selectOpening(opening: Opening) {
  try {
    // 根据 opening.id 决定行为
    if (opening.id === '02') {
      // id02: 弹窗显示施工中消息
      toastr.warning('🚧还没做完，前方施工中🚧');
      return;
    }

    // id01, id03, id04: 跳转到对应的 swipe
    const swipeIdMap: Record<string, number> = {
      '01': 1, // id01 -> swipe2
      '03': 2, // id03 -> swipe3
      '04': 3, // id04 -> swipe4
    };

    const swipeId = swipeIdMap[opening.id];
    if (swipeId) {
      await switchFirstMessage(swipeId);
      toastr.success(`已选择开场：${opening.title}`);
    } else {
      // 如果没有匹配的 swipe，使用原来的逻辑
      await createChatMessages([{ role: 'system', message: opening.message }], { refresh: 'all' });
      await triggerSlash('/trigger');
      toastr.success(`已选择开场：${opening.title}`);
    }
  } catch (error) {
    console.error('选择开场失败:', error);
    toastr.error('选择开场失败');
    throw error;
  }
}

// ==================== 模型导入 ====================

/**
 * 模型导入组合式函数
 */
export function useModelImport() {
  const importedModels = ref<ImportedModel[]>([]);
  const urlInput = ref('');

  /**
   * 从URL导入模型
   */
  async function importFromUrl() {
    const url = urlInput.value.trim();
    if (!url) {
      toastr.warning('请输入URL');
      return;
    }

    try {
      toastr.info('正在从URL导入...');
      await processUrlImport(url, importedModels);
      urlInput.value = '';
      toastr.success('导入成功');
    } catch (error) {
      console.error('URL导入失败:', error);
      toastr.error('URL导入失败');
    }
  }

  /**
   * 处理本地文件选择
   */
  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files || files.length === 0) return;

    try {
      toastr.info('正在处理文件...');
      await processLocalFiles(Array.from(files), importedModels);
      toastr.success('文件处理成功');
      input.value = '';
    } catch (error) {
      console.error('文件处理失败:', error);
      toastr.error('文件处理失败');
    }
  }

  /**
   * 移除已导入的模型
   */
  function removeModel(index: number) {
    importedModels.value.splice(index, 1);
    toastr.info('已移除模型');
  }

  return { importedModels, urlInput, importFromUrl, handleFileSelect, removeModel };
}

// ==================== URL 导入处理 ====================

/**
 * 处理URL导入，支持 GitHub 仓库
 */
async function processUrlImport(inputUrl: string, importedModels: ReturnType<typeof ref<ImportedModel[]>>) {
  // 规范化URL
  const baseUrl = normalizeUrl(inputUrl);
  console.info('解析基础URL:', baseUrl);

  // 查找模型配置文件（支持 model3.json 和 model.json）
  let modelJsonUrl = '';
  let modelName = '';
  let isModel3Format = true;

  // 尝试自动查找
  for (const path of MODEL_PATHS) {
    const result = await tryFindModelJson(baseUrl, path);
    if (result) {
      modelJsonUrl = result.url;
      modelName = result.name;
      isModel3Format = result.isModel3;
      break;
    }
  }

  // 如果未找到，提示用户输入
  if (!modelJsonUrl) {
    const result = await promptForModelJsonUrl(baseUrl);
    if (!result) throw new Error('用户取消了输入');
    modelJsonUrl = result.url;
    modelName = result.name;
    isModel3Format = modelJsonUrl.includes('model3.json');
  }

  // 加载并解析模型配置文件
  console.info(`加载模型配置文件: ${modelJsonUrl}`);
  const modelJson = await fetchJson(modelJsonUrl);
  const modelDir = modelJsonUrl.substring(0, modelJsonUrl.lastIndexOf('/') + 1);

  // 从 JSON 文件提取模型名
  if (!modelName || modelName === 'model') {
    modelName =
      extractModelNameFromJson(modelJson) ||
      modelJsonUrl
        .split('/')
        .pop()
        ?.replace(/\.(model3|model)\.json$/, '') ||
      'unknown';
  }

  console.info('模型名称:', modelName);
  console.info('模型目录:', modelDir);
  console.info('模型格式:', isModel3Format ? 'model3.json (新格式)' : 'model.json (旧格式)');

  // 收集所有文件URL
  const fileUrls = await collectFileUrls(modelJsonUrl, modelJson, modelDir, modelName, isModel3Format);
  console.info('找到的文件:', fileUrls);

  // 下载文件并创建虚拟文件结构
  const virtualFiles = await downloadFilesToVirtual(fileUrls);

  // 创建世界书条目
  if (virtualFiles.model3 || virtualFiles.moc3) {
    await createWorldbookEntriesForModel(modelName, virtualFiles);

    const importedModel: ImportedModel = {
      name: modelName,
      files: [
        ...virtualFiles.textures.map(t => ({ type: 'texture' as const, url: t.url, filename: t.file.name })),
        ...(virtualFiles.moc3
          ? [{ type: 'moc3' as const, url: virtualFiles.moc3.url, filename: virtualFiles.moc3.file.name }]
          : []),
        ...(virtualFiles.model3
          ? [{ type: 'model3' as const, url: virtualFiles.model3.url, filename: virtualFiles.model3.file.name }]
          : []),
        ...(virtualFiles.cdi3
          ? [{ type: 'cdi3' as const, url: virtualFiles.cdi3.url, filename: virtualFiles.cdi3.file.name }]
          : []),
      ],
      motions: virtualFiles.motions.map(m => ({ name: m.name, url: m.url, type: m.type })),
    };

    importedModels.value.push(importedModel);

    // 保存模型数据到变量，供其他界面使用
    // 本地文件需要使用特殊的 basePath 标识（使用 indexeddb:// 协议标识）
    await saveModelToVariables(importedModel, modelDir);

    toastr.success(`成功导入模型: ${modelName}`);
  } else {
    throw new Error('未找到有效的模型文件（model3.json 或 moc3）');
  }
}

/**
 * 规范化URL，支持 GitHub Pages、GitHub Raw URL 和 GitHub 仓库 URL
 */
function normalizeUrl(url: string): string {
  let baseUrl = url.trim();
  if (!baseUrl.endsWith('/')) baseUrl += '/';

  try {
    const urlObj = new URL(baseUrl);

    // 处理 GitHub 仓库 URL (github.com)，转换为 GitHub Pages URL
    if (urlObj.hostname === 'github.com') {
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length >= 2) {
        // github.com/username/repo
        const [username, repo, ...restPath] = pathParts;
        // 假设使用 GitHub Pages，通常仓库名就是 Pages 路径
        // 如果仓库有 gh-pages 分支或设置了自定义域名，使用用户名.github.io/仓库名
        if (restPath.length === 0 || restPath[0] === 'tree' || restPath[0] === 'blob') {
          // 如果是仓库根目录或文件浏览器，转换为 Pages URL
          const filePath = restPath.length > 2 ? restPath.slice(2).join('/') + '/' : '';
          // 移除文件名部分（如果是文件 URL）
          const cleanPath = filePath.replace(/[^/]+\.(json|moc3|png)$/, '');
          return `https://${username}.github.io/${repo}/${cleanPath}`;
        }
      }
    }

    // 处理 GitHub Raw URL，转换为 GitHub Pages URL
    if (urlObj.hostname === 'raw.githubusercontent.com') {
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length >= 3) {
        // raw.githubusercontent.com/username/repo/branch/path
        const [username, repo, _branch, ...restPath] = pathParts;
        if (restPath.length > 0) {
          // 如果是文件 URL，提取目录
          const isFile = baseUrl.includes('.json') || baseUrl.includes('.moc3') || baseUrl.includes('.png');
          if (isFile) {
            restPath.pop();
          }
          const path = restPath.length > 0 ? restPath.join('/') + '/' : '';
          return `https://${username}.github.io/${repo}/${path}`;
        } else {
          return `https://${username}.github.io/${repo}/`;
        }
      }
    }

    // 如果是文件URL，提取目录部分
    if (baseUrl.includes('.json') || baseUrl.includes('.moc3') || baseUrl.includes('.png')) {
      const pathParts = urlObj.pathname.split('/').filter(p => p);
      if (pathParts.length > 0) {
        pathParts.pop();
        baseUrl = `${urlObj.origin}/${pathParts.join('/')}/`;
      }
    }
  } catch (error) {
    console.warn('URL 规范化失败，使用原始 URL:', error);
  }

  return baseUrl;
}

/**
 * 尝试查找模型配置文件（支持 model3.json 和 model.json）
 */
async function tryFindModelJson(
  baseUrl: string,
  path: string,
): Promise<{ url: string; name: string; isModel3: boolean } | null> {
  try {
    // 从URL路径提取模型名
    const urlPath = new URL(baseUrl).pathname;
    const pathParts = urlPath.split('/').filter(p => p && p !== 'models' && p !== 'model');
    if (pathParts.length > 0) {
      const modelName = pathParts[pathParts.length - 1].replace(/\/$/, '');
      // 优先查找 model3.json（新格式）
      for (const configFile of MODEL_CONFIG_FILES) {
        const testUrl = `${baseUrl}${path}${modelName}.${configFile}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          return { url: testUrl, name: modelName, isModel3: configFile === 'model3.json' };
        }
      }
    }

    // 尝试常见文件名
    for (const name of ['model', 'character', 'live2d']) {
      for (const configFile of MODEL_CONFIG_FILES) {
        const testUrl = `${baseUrl}${path}${name}.${configFile}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          return { url: testUrl, name, isModel3: configFile === 'model3.json' };
        }
      }
    }
  } catch {
    // 忽略错误，继续尝试
  }
  return null;
}

/**
 * 提示用户输入模型配置文件 URL（支持 model3.json 和 model.json）
 */
async function promptForModelJsonUrl(
  baseUrl: string,
): Promise<{ url: string; name: string; isModel3: boolean } | null> {
  const userInput = prompt(
    '未能自动找到模型配置文件。\n\n请输入以下任意一种：\n\n1. model3.json 或 model.json 的完整URL，例如：\n   https://sixuejun.github.io/live2d-models/chengbeiji/model3.json\n\n2. GitHub 仓库 URL，例如：\n   https://github.com/username/repo\n\n3. 模型文件夹路径（相对于基础URL），例如：\n   chengbeiji/\n\n当前基础 URL: ' +
      baseUrl,
  );

  if (!userInput) return null;

  if (userInput.startsWith('http')) {
    const isModel3 = userInput.includes('model3.json');
    return {
      url: userInput,
      name:
        userInput
          .split('/')
          .pop()
          ?.replace(/\.(model3|model)\.json$/, '') || 'model',
      isModel3,
    };
  }

  const path = userInput.endsWith('/') ? userInput : `${userInput}/`;
  const modelName = path.replace(/\/$/, '').split('/').pop() || 'model';
  let modelJsonUrl = '';
  let isModel3 = true;

  // 尝试查找 model3.json 或 model.json
  for (const configFile of MODEL_CONFIG_FILES) {
    const testUrl = `${baseUrl}${path}${modelName}.${configFile}`;
    const response = await fetch(testUrl, { method: 'HEAD' });
    if (response.ok) {
      modelJsonUrl = testUrl;
      isModel3 = configFile === 'model3.json';
      break;
    }
  }

  // 如果还没找到，尝试常见文件名
  if (!modelJsonUrl) {
    for (const name of [modelName, 'model', 'character']) {
      for (const configFile of MODEL_CONFIG_FILES) {
        const testUrl = `${baseUrl}${path}${name}.${configFile}`;
        const response = await fetch(testUrl, { method: 'HEAD' });
        if (response.ok) {
          modelJsonUrl = testUrl;
          isModel3 = configFile === 'model3.json';
          break;
        }
      }
      if (modelJsonUrl) break;
    }
  }

  if (!modelJsonUrl) {
    throw new Error(`无法找到模型配置文件，请检查路径: ${baseUrl}${path}`);
  }

  return { url: modelJsonUrl, name: modelName, isModel3 };
}

/**
 * 从模型 JSON 文件提取模型名（支持 model3.json 和 model.json）
 */
function extractModelNameFromJson(json: Record<string, unknown>): string | null {
  const refs = json.FileReferences as Record<string, unknown> | undefined;
  if (refs?.Moc) {
    const mocPath = refs.Moc as string;
    // 支持 .moc3 (新格式) 和 .moc (旧格式)
    const match = mocPath.match(/[\\/]([^\\/]+)\.moc3?$/);
    if (match) return match[1];
  }
  return null;
}

/**
 * 获取JSON
 */
async function fetchJson(url: string): Promise<Record<string, unknown>> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`无法加载: ${response.statusText}`);
  return response.json();
}

/**
 * 收集所有文件URL，支持从 model3.json 和 model.json 读取资源路径
 */
async function collectFileUrls(
  modelJsonUrl: string,
  modelJson: Record<string, unknown>,
  modelDir: string,
  modelName: string,
  isModel3: boolean,
): Promise<ParsedFileUrl[]> {
  const fileUrls: ParsedFileUrl[] = [];

  // 添加模型配置文件
  fileUrls.push({
    type: 'model3',
    url: modelJsonUrl,
    filename: modelJsonUrl.split('/').pop() || (isModel3 ? 'model3.json' : 'model.json'),
  });

  // 从 FileReferences 提取文件（支持两种格式）
  const refs = modelJson.FileReferences as Record<string, unknown> | undefined;
  if (refs) {
    // MOC 文件（model3.json 使用 .moc3，model.json 使用 .moc）
    if (refs.Moc) {
      const mocPath = refs.Moc as string;
      fileUrls.push({
        type: 'moc3',
        url: resolveUrl(mocPath, modelDir),
        filename: mocPath.split('/').pop() || (isModel3 ? 'model.moc3' : 'model.moc'),
      });
    }

    // 纹理文件
    if (Array.isArray(refs.Textures)) {
      for (const texturePath of refs.Textures as string[]) {
        fileUrls.push({
          type: 'texture',
          url: resolveUrl(texturePath, modelDir),
          filename: texturePath.split('/').pop() || 'texture.png',
        });
      }
    }

    // 物理文件
    if (refs.Physics) {
      const physicsPath = refs.Physics as string;
      fileUrls.push({
        type: 'physics3',
        url: resolveUrl(physicsPath, modelDir),
        filename: physicsPath.split('/').pop() || (isModel3 ? 'physics3.json' : 'physics.json'),
      });
    }

    // 显示信息文件（model3.json 使用 DisplayInfo，model.json 可能使用其他字段）
    if (refs.DisplayInfo) {
      const displayPath = refs.DisplayInfo as string;
      fileUrls.push({
        type: 'cdi3',
        url: resolveUrl(displayPath, modelDir),
        filename: displayPath.split('/').pop() || 'cdi3.json',
      });
    }
  }

  // 尝试查找 CDI3 文件
  await tryAddOptionalFile(fileUrls, `${modelDir}${modelName}.cdi3.json`, 'cdi3', `${modelName}.cdi3.json`);

  // 尝试从 JSON 文件的 FileReferences 中读取动作文件路径
  await findMotionFilesFromJson(fileUrls, modelJson, modelDir, isModel3);

  // 如果从 JSON 中没找到，再尝试通过常见路径查找
  if (!fileUrls.some(f => f.type === 'motion' || f.type === 'expression')) {
    await findMotionFilesByPath(fileUrls, modelDir, isModel3);
  }

  return fileUrls;
}

/**
 * 解析相对URL为绝对URL，支持 GitHub 路径
 */
function resolveUrl(path: string, baseDir: string): string {
  // 如果已经是绝对 URL，直接返回
  if (path.startsWith('http')) return path;

  try {
    // 处理相对路径
    const baseUrlObj = new URL(baseDir);
    const resolvedUrl = new URL(path, baseDir);

    // 确保 GitHub Pages URL 格式正确
    if (baseUrlObj.hostname.endsWith('.github.io')) {
      // GitHub Pages 路径处理
      return resolvedUrl.href;
    }

    return resolvedUrl.href;
  } catch (error) {
    console.warn('URL 解析失败，使用拼接方式:', error);
    // 降级：简单拼接
    if (baseDir.endsWith('/')) {
      return path.startsWith('/') ? baseDir.slice(0, -1) + path : baseDir + path;
    }
    return path.startsWith('/') ? baseDir + path : baseDir + '/' + path;
  }
}

/**
 * 尝试添加可选文件
 */
async function tryAddOptionalFile(
  fileUrls: ParsedFileUrl[],
  url: string,
  type: ParsedFileUrl['type'],
  filename: string,
) {
  if (fileUrls.some(f => f.type === type)) return;

  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      fileUrls.push({ type, url, filename });
    }
  } catch {
    // 忽略
  }
}

/**
 * 从 JSON 文件的 FileReferences 中读取动作和表情文件路径
 */
async function findMotionFilesFromJson(
  fileUrls: ParsedFileUrl[],
  modelJson: Record<string, unknown>,
  modelDir: string,
  isModel3: boolean,
) {
  const refs = modelJson.FileReferences as Record<string, unknown> | undefined;
  if (!refs) return;

  // model3.json 格式包含 Groups（动作组）
  if (isModel3 && refs.Groups && Array.isArray(refs.Groups)) {
    const groups = refs.Groups as Array<Record<string, unknown>>;
    for (const group of groups) {
      const groupName = (group.Name as string) || '';
      const isExpression = /expression|表情/i.test(groupName) || /_E\.|\.E\./i.test(groupName);
      const isMotion = /motion|动作/i.test(groupName) || /_M\.|\.M\./i.test(groupName);

      // 处理 Files 数组（多个文件）
      if (Array.isArray(group.Files)) {
        for (const file of group.Files as string[]) {
          await addMotionFile(fileUrls, file, modelDir, isExpression, isMotion);
        }
      }
      // 处理 File 字符串（单个文件）
      else if (group.File && typeof group.File === 'string') {
        await addMotionFile(fileUrls, group.File as string, modelDir, isExpression, isMotion);
      }
    }
  }

  // 尝试从 model.json 的旧格式中读取（如果有 Motions 字段）
  if (!isModel3 && refs.Motions && Array.isArray(refs.Motions)) {
    const motions = refs.Motions as Array<Record<string, unknown>>;
    for (const motion of motions) {
      if (Array.isArray(motion.Files)) {
        for (const file of motion.Files as string[]) {
          await addMotionFile(fileUrls, file, modelDir, false, true);
        }
      } else if (motion.File && typeof motion.File === 'string') {
        await addMotionFile(fileUrls, motion.File as string, modelDir, false, true);
      }
    }
  }
}

/**
 * 添加动作文件到列表
 */
async function addMotionFile(
  fileUrls: ParsedFileUrl[],
  filePath: string,
  modelDir: string,
  isExpression: boolean,
  isMotion: boolean,
) {
  if (!filePath || typeof filePath !== 'string') return;

  // 根据文件名判断类型（如果未明确指定）
  const filename = filePath.split('/').pop() || '';
  const isExpr = isExpression || /_E\.|\.E\.|expression/i.test(filename);
  const isMot = isMotion || /_M\.|\.M\.|motion/i.test(filename) || (!isExpr && /\.motion/i.test(filename));

  const url = resolveUrl(filePath, modelDir);

  // 验证文件是否存在
  try {
    const response = await fetch(url, { method: 'HEAD' });
    if (response.ok) {
      fileUrls.push({
        type: isExpr ? 'expression' : 'motion',
        url,
        filename,
        name: extractMotionNameFromPath(filename),
      });
    }
  } catch {
    // 继续，不中断流程
  }
}

/**
 * 通过常见路径查找动作和表情文件
 */
async function findMotionFilesByPath(fileUrls: ParsedFileUrl[], modelDir: string, isModel3: boolean) {
  const foundUrls = new Set<string>();
  const motionExt = isModel3 ? '.motion3.json' : '.motion.json';

  for (const motionPath of MOTION_PATHS) {
    // 先检测是否存在 motions 文件夹
    const testFile = COMMON_MOTION_FILES[0].replace('.motion3.json', motionExt);
    const testUrl = `${modelDir}${motionPath}${testFile}`;

    try {
      const testResponse = await fetch(testUrl, { method: 'HEAD' });
      if (!testResponse.ok) continue;
    } catch {
      continue;
    }

    // 找到 motions 文件夹，加载动作文件
    for (const motionFile of COMMON_MOTION_FILES) {
      const fileWithExt = motionFile.replace('.motion3.json', motionExt);
      const url = `${modelDir}${motionPath}${fileWithExt}`;
      if (foundUrls.has(url)) continue;

      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          foundUrls.add(url);
          fileUrls.push({
            type: 'motion',
            url,
            filename: fileWithExt,
            name: extractMotionName(fileWithExt, '_M'),
          });
        }
      } catch {
        // 继续
      }
    }

    // 加载表情文件
    for (const exprFile of COMMON_EXPRESSION_FILES) {
      const fileWithExt = exprFile.replace('.motion3.json', motionExt);
      const url = `${modelDir}${motionPath}${fileWithExt}`;
      if (foundUrls.has(url)) continue;

      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          foundUrls.add(url);
          fileUrls.push({
            type: 'expression',
            url,
            filename: fileWithExt,
            name: extractMotionName(fileWithExt, '_E'),
          });
        }
      } catch {
        // 继续
      }
    }

    break; // 找到 motions 文件夹后跳出
  }
}

/**
 * 提取动作/表情名称（从文件路径）
 */
function extractMotionNameFromPath(filename: string): string {
  return filename
    .replace(/^\d+_/, '')
    .replace(/\.motion3?\.json$/i, '')
    .replace(/_M$/i, '')
    .replace(/_E$/i, '')
    .replace(/_motion$/i, '')
    .replace(/_expression$/i, '');
}

/**
 * 提取动作/表情名称
 */
function extractMotionName(filename: string, suffix: string): string {
  return filename
    .replace(/^\d+_/, '')
    .replace(new RegExp(`${suffix}\\.motion3?\\.json$`, 'i'), '')
    .replace(/\.motion3?\.json$/i, '');
}

/**
 * 下载文件并创建虚拟文件结构
 */
async function downloadFilesToVirtual(fileUrls: ParsedFileUrl[]): Promise<VirtualModelFiles> {
  const virtualFiles: VirtualModelFiles = {
    textures: [],
    moc3: null,
    model3: null,
    cdi3: null,
    motions: [],
  };

  for (const fileInfo of fileUrls) {
    try {
      const response = await fetch(fileInfo.url);
      if (!response.ok) {
        console.warn(`无法下载文件: ${fileInfo.url}`);
        continue;
      }

      const blob = await response.blob();
      const file = new File([blob], fileInfo.filename, { type: blob.type });

      switch (fileInfo.type) {
        case 'texture':
          virtualFiles.textures.push({ file, url: fileInfo.url });
          break;
        case 'moc3':
          virtualFiles.moc3 = { file, url: fileInfo.url };
          break;
        case 'model3':
          virtualFiles.model3 = { file, url: fileInfo.url };
          break;
        case 'cdi3':
          virtualFiles.cdi3 = { file, url: fileInfo.url };
          break;
        case 'motion':
        case 'expression':
          virtualFiles.motions.push({
            file,
            url: fileInfo.url,
            name: fileInfo.name || fileInfo.filename.replace(/\.motion3\.json$/, ''),
            type: fileInfo.type,
          });
          break;
      }
    } catch (error) {
      console.warn(`下载文件失败 ${fileInfo.url}:`, error);
    }
  }

  return virtualFiles;
}

// ==================== 本地文件处理 ====================

/**
 * 处理本地文件
 */
async function processLocalFiles(files: File[], importedModels: ReturnType<typeof ref<ImportedModel[]>>) {
  // 识别模型名称
  const modelNames = await extractModelNamesFromFiles(files);
  const defaultModelName = modelNames.size > 0 ? Array.from(modelNames)[0] : 'unknown_model';

  // 分类文件
  const modelFiles = classifyFiles(files, defaultModelName);

  // 处理每个模型
  for (const [modelName, fileSet] of Object.entries(modelFiles)) {
    if (fileSet.model3 || fileSet.moc3) {
      await createWorldbookEntriesForModel(modelName, fileSet);

      // 将所有文件存储到 IndexedDB
      const storedFiles: Array<{ type: 'texture' | 'moc3' | 'model3' | 'cdi3'; fileId: string; filename: string }> = [];

      // 存储纹理文件
      for (const texture of fileSet.textures) {
        try {
          const fileId = await storeFile(modelName, texture.file.name, texture.file);
          storedFiles.push({ type: 'texture', fileId, filename: texture.file.name });
        } catch (error) {
          console.error(`[开场界面] 存储纹理文件失败: ${texture.file.name}`, error);
        }
      }

      // 存储 moc3 文件
      if (fileSet.moc3) {
        try {
          const fileId = await storeFile(modelName, fileSet.moc3.file.name, fileSet.moc3.file);
          storedFiles.push({ type: 'moc3', fileId, filename: fileSet.moc3.file.name });
        } catch (error) {
          console.error(`[开场界面] 存储 moc3 文件失败: ${fileSet.moc3.file.name}`, error);
        }
      }

      // 存储 model3 文件
      if (fileSet.model3) {
        try {
          const fileId = await storeFile(modelName, fileSet.model3.file.name, fileSet.model3.file);
          storedFiles.push({ type: 'model3', fileId, filename: fileSet.model3.file.name });
        } catch (error) {
          console.error(`[开场界面] 存储 model3 文件失败: ${fileSet.model3.file.name}`, error);
        }
      }

      // 存储 cdi3 文件
      if (fileSet.cdi3) {
        try {
          const fileId = await storeFile(modelName, fileSet.cdi3.file.name, fileSet.cdi3.file);
          storedFiles.push({ type: 'cdi3', fileId, filename: fileSet.cdi3.file.name });
        } catch (error) {
          console.error(`[开场界面] 存储 cdi3 文件失败: ${fileSet.cdi3.file.name}`, error);
        }
      }

      // 存储动作和表情文件
      const storedMotions: Array<{ name: string; fileId: string; type: 'motion' | 'expression' }> = [];
      for (const motion of fileSet.motions) {
        try {
          const fileId = await storeFile(modelName, motion.file.name, motion.file);
          storedMotions.push({ name: motion.name, fileId, type: motion.type });
        } catch (error) {
          console.error(`[开场界面] 存储动作文件失败: ${motion.file.name}`, error);
        }
      }

      // 创建导入模型对象（使用 fileId 而不是 blob URL）
      const importedModel: ImportedModel = {
        name: modelName,
        files: storedFiles.map(f => ({
          type: f.type,
          url: '', // 本地文件不使用 URL，使用 fileId
          filename: f.filename,
          fileId: f.fileId,
          isLocal: true,
        })),
        motions: storedMotions.map(m => ({
          name: m.name,
          url: '', // 本地文件不使用 URL，使用 fileId
          type: m.type,
          fileId: m.fileId,
          isLocal: true,
        })),
      };

      importedModels.value.push(importedModel);

      // 保存模型数据到变量，供其他界面使用
      // 本地文件需要使用特殊的 basePath 标识（使用 indexeddb:// 协议标识）
      await saveModelToVariables(importedModel, `indexeddb://${modelName}/`);

      toastr.success(`成功导入并保存模型: ${modelName}`);
    }
  }
}

/**
 * 从文件中提取模型名称
 */
async function extractModelNamesFromFiles(files: File[]): Promise<Set<string>> {
  const modelNames = new Set<string>();

  for (const file of files) {
    const filename = file.name;
    const nameWithoutExt = filename.replace(/\.[^.]*$/, '');

    if (filename.endsWith('.model3.json')) {
      try {
        const json = JSON.parse(await file.text());
        if (json.FileReferences?.Moc) {
          const mocName = (json.FileReferences.Moc as string)
            .replace(/.*[\\/]([^\\/]+)\.moc3/, '$1')
            .replace(/.*[\\/]([^\\/]+)$/, '$1');
          if (mocName) modelNames.add(mocName);
        }
        if (modelNames.size === 0) {
          modelNames.add(nameWithoutExt.replace(/\.model3$/, ''));
        }
      } catch {
        modelNames.add(nameWithoutExt.replace(/\.model3$/, ''));
      }
    } else if (filename.endsWith('.moc3')) {
      modelNames.add(nameWithoutExt);
    }
  }

  return modelNames;
}

/**
 * 智能识别动作/表情文件类型
 */
function detectMotionType(filename: string): 'motion' | 'expression' {
  const name = filename.toLowerCase();

  // 表情标识
  const expressionPatterns = [
    /_e\./i, // _E.
    /\.e\./i, // .E.
    /expression/i, // expression
    /表情/i, // 表情（中文）
    /exp/i, // exp
    /f\d+/i, // f01, f02 (常见表情命名)
    /^expr/i, // expr开头
  ];

  // 动作标识
  const motionPatterns = [
    /_m\./i, // _M.
    /\.m\./i, // .M.
    /motion/i, // motion
    /动作/i, // 动作（中文）
    /mot/i, // mot
    /idle/i, // idle（待机动作）
    /tap/i, // tap（点击动作）
    /touch/i, // touch
  ];

  // 优先检查表情标识（因为有些文件名可能同时包含motion）
  for (const pattern of expressionPatterns) {
    if (pattern.test(name)) {
      return 'expression';
    }
  }

  // 检查动作标识
  for (const pattern of motionPatterns) {
    if (pattern.test(name)) {
      return 'motion';
    }
  }

  // 默认返回动作
  return 'motion';
}

/**
 * 分类文件（导出供外部使用）
 */
export function classifyFiles(files: File[], defaultModelName: string): Record<string, VirtualModelFiles> {
  const modelFiles: Record<string, VirtualModelFiles> = {};

  for (const file of files) {
    const filename = file.name.toLowerCase();
    const modelName = defaultModelName;

    if (!modelFiles[modelName]) {
      modelFiles[modelName] = {
        textures: [],
        moc3: null,
        model3: null,
        cdi3: null,
        moc: null,
        model: null,
        physics: null,
        motions: [],
      };
    }

    const url = URL.createObjectURL(file);

    if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      modelFiles[modelName].textures.push({ file, url });
    } else if (filename.endsWith('.moc3')) {
      modelFiles[modelName].moc3 = { file, url };
    } else if (filename.endsWith('.moc') && !filename.endsWith('.moc3')) {
      modelFiles[modelName].moc = { file, url };
    } else if (filename.endsWith('.model3.json')) {
      modelFiles[modelName].model3 = { file, url };
    } else if (filename.endsWith('.model.json')) {
      modelFiles[modelName].model = { file, url };
    } else if (filename.endsWith('.cdi3.json')) {
      modelFiles[modelName].cdi3 = { file, url };
    } else if (filename.endsWith('.physics3.json') || filename.endsWith('.physics.json')) {
      modelFiles[modelName].physics = { file, url };
    } else if (filename.endsWith('.motion3.json') || filename.endsWith('.motion.json')) {
      const motionType = detectMotionType(file.name);
      const motionName = extractMotionNameFromFile(file.name);

      modelFiles[modelName].motions.push({
        file,
        url,
        name: motionName,
        type: motionType,
      });
    }
  }

  return modelFiles;
}

/**
 * 从文件名提取动作名称
 */
function extractMotionNameFromFile(filename: string): string {
  let name = filename
    .replace(/\.motion3\.json$/i, '')
    .replace(/^\d+_/, '')
    .replace(/_m$/i, '')
    .replace(/_e$/i, '')
    .replace(/_motion$/i, '')
    .replace(/_expression$/i, '');

  if (!name || /^\d+$/.test(name)) {
    name = filename.replace(/\.motion3\.json$/i, '').replace(/.*[\\/]/, '');
  }

  return name;
}

// ==================== 世界书操作 ====================

/**
 * 为模型创建世界书条目
 * 在角色卡绑定的世界书中创建条目（优先使用角色卡绑定的世界书）
 */
export async function createWorldbookEntriesForModel(modelName: string, files: VirtualModelFiles) {
  try {
    // 获取角色卡绑定的世界书
    let targetWorldbookName: string | null = null;
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      // 优先使用 primary 世界书，如果没有则使用第一个 additional
      targetWorldbookName = charWorldbooks.primary || charWorldbooks.additional[0] || null;
    } catch (error) {
      console.warn('获取角色卡世界书失败，使用默认世界书:', error);
    }

    // 如果没有角色卡世界书，使用默认世界书
    if (!targetWorldbookName) {
      targetWorldbookName = WORLDBOOK_NAME;
    }

    // 确保世界书存在
    try {
      await getWorldbook(targetWorldbookName);
    } catch {
      // 如果世界书不存在，尝试创建
      try {
        await createWorldbook(targetWorldbookName, []);
      } catch (createError) {
        // 如果是角色卡世界书且创建失败，可能需要先绑定世界书
        console.warn(`创建世界书 ${targetWorldbookName} 失败:`, createError);
        // 回退到默认世界书
        if (targetWorldbookName !== WORLDBOOK_NAME) {
          targetWorldbookName = WORLDBOOK_NAME;
          try {
            await getWorldbook(WORLDBOOK_NAME);
          } catch {
            await createWorldbook(WORLDBOOK_NAME, []);
          }
        } else {
          throw createError;
        }
      }
    }

    const entries: PartialDeep<WorldbookEntry>[] = [];

    // 1. 创建模型文件条目（绿灯，永不会触发）
    entries.push(createModelFilesEntry(modelName, files));

    // 2. 创建动作和表情条目
    const motionsEntry = createMotionsEntry(modelName, files.motions);
    if (motionsEntry) entries.push(motionsEntry);

    await createWorldbookEntries(targetWorldbookName, entries);
    console.info(`已为模型 ${modelName} 在世界书 ${targetWorldbookName} 中创建条目`);
  } catch (error) {
    console.error('创建世界书条目失败:', error);
    throw error;
  }
}

/**
 * 创建模型文件条目
 */
function createModelFilesEntry(modelName: string, files: VirtualModelFiles): PartialDeep<WorldbookEntry> {
  const neverMatchKey = `__MODEL_FILE_${modelName}_${Date.now()}__`;

  return {
    name: `[模型文件] ${modelName}`,
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
    content: `## ${modelName} 模型文件

这些是Live2D模型文件，仅用于存储，不应在对话中触发。

### 纹理文件
${files.textures.map(t => `- ${t.file.name}: ${t.url}`).join('\n')}

### 模型文件
${files.moc3 ? `- ${files.moc3.file.name}: ${files.moc3.url}` : ''}
${files.model3 ? `- ${files.model3.file.name}: ${files.model3.url}` : ''}
${files.cdi3 ? `- ${files.cdi3.file.name}: ${files.cdi3.url}` : ''}
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
 * 创建动作和表情条目
 */
function createMotionsEntry(
  modelName: string,
  motions: VirtualModelFiles['motions'],
): PartialDeep<WorldbookEntry> | null {
  const motionsList = motions.filter(m => m.type === 'motion');
  const expressionsList = motions.filter(m => m.type === 'expression');

  if (motionsList.length === 0 && expressionsList.length === 0) return null;

  return {
    name: `[动作表情] ${modelName}`,
    enabled: true,
    strategy: {
      type: 'selective',
      keys: [modelName, `${modelName}的动作`, `${modelName}的表情`],
      keys_secondary: { logic: 'and_any', keys: [] },
      scan_depth: 'same_as_global',
    },
    position: {
      type: 'after_character_definition',
      role: 'system',
      depth: 0,
      order: 1,
    },
    content: `## ${modelName} 的动作和表情

### 可用动作
${motionsList.map(m => `- **${m.name}**: 动作文件位于 ${m.url}`).join('\n')}

### 可用表情
${expressionsList.map(e => `- **${e.name}**: 表情文件位于 ${e.url}`).join('\n')}

当需要${modelName}做动作或改变表情时，请参考上述列表。
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

// ==================== 模型数据保存到变量 ====================

/**
 * Live2D 模型配置接口（与 live2d与galgame前端界面 兼容）
 */
interface Live2DModelConfig {
  id: string;
  name: string;
  modelPath: string;
  basePath: string;
  version: number;
  motions: Array<{ group: string; name: string; file: string }>;
  expressions: string[];
  textures: string[];
  physics?: string;
  pose?: string;
  /** 本地文件的 fileId 映射（仅用于 IndexedDB 存储的文件） */
  _fileIds?: Record<string, string>;
}

/**
 * 从 URL 中提取 basePath（目录部分）
 */
function extractBasePathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const lastSlashIndex = pathname.lastIndexOf('/');
    if (lastSlashIndex >= 0) {
      return `${urlObj.origin}${pathname.substring(0, lastSlashIndex + 1)}`;
    }
    return `${urlObj.origin}/`;
  } catch {
    // 如果不是有效的 URL，返回空字符串
    return '';
  }
}

/**
 * 将 ImportedModel 转换为 Live2DModelConfig 格式
 */
function convertToLive2DConfig(model: ImportedModel, baseDir?: string): Live2DModelConfig | null {
  // 检查是否是本地文件（存储在 IndexedDB）
  const isLocalFile = model.files.some(f => f.isLocal) || model.motions.some(m => m.isLocal);

  // 检测模型版本和文件类型
  let modelFile: VirtualModelFile | undefined;
  let detectedVersion = 3; // 默认版本 3

  // 优先使用 model3.json (Cubism 3/4)
  modelFile = model.files.find(f => f.type === 'model3');
  if (modelFile) {
    detectedVersion = 3;
  } else {
    // 尝试使用 model.json (Cubism 2.1)
    modelFile = model.files.find(f => f.type === 'model');
    if (modelFile) {
      detectedVersion = 2;
    } else {
      // 尝试使用 moc3 (Cubism 3/4)
      modelFile = model.files.find(f => f.type === 'moc3');
      if (modelFile) {
        detectedVersion = 3;
      } else {
        // 尝试使用 moc (Cubism 2.1)
        modelFile = model.files.find(f => f.type === 'moc');
        if (modelFile) {
          detectedVersion = 2;
        }
      }
    }
  }

  if (!modelFile) {
    console.warn(`[开场界面] 模型 ${model.name} 没有找到模型文件`);
    return null;
  }

  // 如果只有 moc/moc3 文件，创建虚拟的配置文件路径
  const modelPath =
    modelFile.type === 'moc' || modelFile.type === 'moc3'
      ? detectedVersion === 2
        ? 'model.model.json'
        : 'model.model3.json'
      : modelFile.filename;

  let basePath: string;

  if (isLocalFile && modelFile.fileId) {
    // 本地文件：使用 indexeddb:// 协议标识
    basePath = `indexeddb://${model.name}/`;
  } else {
    // URL 文件：从 URL 中提取目录部分
    basePath = baseDir || extractBasePathFromUrl(modelFile.url);
  }

  // 如果只有 moc/moc3 文件，返回基础配置
  if (modelFile.type === 'moc' || modelFile.type === 'moc3') {
    return {
      id: model.name.toLowerCase().replace(/\s+/g, '_'),
      name: model.name,
      modelPath,
      basePath,
      version: detectedVersion,
      motions: [],
      expressions: [],
      textures: model.files.filter(f => f.type === 'texture').map(f => f.filename),
      // 如果是本地文件，添加 fileIds 映射
      ...(isLocalFile && { _fileIds: Object.fromEntries(model.files.map(f => [f.filename, f.fileId || ''])) }),
    };
  }

  // 有完整的 model.json 或 model3.json 文件
  const modelPath_final = modelFile.filename;
  let basePath_final: string;

  if (isLocalFile && modelFile.fileId) {
    // 本地文件：使用 indexeddb:// 协议标识
    basePath_final = `indexeddb://${model.name}/`;
  } else {
    // URL 文件：从 URL 中提取目录部分
    basePath_final = baseDir || extractBasePathFromUrl(modelFile.url);
  }

  // 提取纹理文件名
  const textures = model.files.filter(f => f.type === 'texture').map(f => f.filename);

  // 将 motions 转换为期望的格式
  const motions: Array<{ group: string; name: string; file: string }> = [];
  const expressions: string[] = [];

  for (const motion of model.motions) {
    if (motion.type === 'motion') {
      let fileReference: string;

      if (motion.isLocal && motion.fileId) {
        // 本地文件：需要从文件中提取实际文件名
        // 由于我们在存储时使用的是原始文件名，这里需要使用一个占位符格式
        // 实际加载时，会通过 fileId 从 IndexedDB 读取文件
        // 格式：indexeddb:fileId 或直接使用 fileId 作为文件引用
        // 为了兼容性，我们使用相对路径格式，但在 _fileIds 中存储映射
        const filename = motion.url || motion.name + (detectedVersion === 2 ? '.motion.json' : '.motion3.json');
        fileReference =
          filename.split('/').pop() || motion.name + (detectedVersion === 2 ? '.motion.json' : '.motion3.json');
      } else {
        // URL 文件：提取文件名或相对路径
        const filename = motion.url.includes('/')
          ? motion.url.substring(motion.url.lastIndexOf('/') + 1)
          : motion.name + (detectedVersion === 2 ? '.motion.json' : '.motion3.json');

        // 尝试从 URL 提取相对路径
        let relativePath = filename;
        if (motion.url && motion.url.startsWith(basePath_final)) {
          relativePath = motion.url.substring(basePath_final.length);
        }
        fileReference = relativePath;
      }

      motions.push({
        group: 'default', // 默认分组，可以根据文件名进一步分类
        name: motion.name,
        file: fileReference,
      });
    } else if (motion.type === 'expression') {
      // 表情只需要名称
      expressions.push(motion.name);
    }
  }

  // 查找物理文件和姿势文件（如果存在）
  const physicsFile = model.files.find(f => f.type === 'cdi3' || f.type === 'physics');
  const physics = physicsFile ? physicsFile.filename : undefined;

  const config: Live2DModelConfig & { _fileIds?: Record<string, string> } = {
    id: model.name.toLowerCase().replace(/\s+/g, '_'),
    name: model.name,
    modelPath: modelPath_final,
    basePath: basePath_final,
    version: detectedVersion, // 使用检测到的版本
    motions,
    expressions,
    textures,
    physics,
  };

  // 如果是本地文件，添加 fileIds 映射（用于从 IndexedDB 读取）
  if (isLocalFile) {
    const fileIds: Record<string, string> = {};
    model.files.forEach(f => {
      if (f.fileId) {
        fileIds[f.filename] = f.fileId;
      }
    });
    model.motions.forEach(m => {
      if (m.fileId) {
        const filename = m.url.split('/').pop() || m.name + '.motion3.json';
        fileIds[filename] = m.fileId;
      }
    });
    config._fileIds = fileIds;
  }

  return config;
}

/**
 * 保存模型数据到变量，供其他界面使用
 */
async function saveModelToVariables(model: ImportedModel, baseDir?: string) {
  try {
    // 转换为 Live2D 配置格式
    const live2dConfig = convertToLive2DConfig(model, baseDir);
    if (!live2dConfig) {
      console.warn(`[开场界面] 无法转换模型 ${model.name} 为 Live2D 配置格式`);
      return;
    }

    // 获取现有的模型列表
    const variables = getVariables({ type: 'character' }) || {};
    const existingModels = (variables.live2d_models as Live2DModelConfig[]) || [];

    // 检查是否已存在同名模型，如果存在则更新，否则添加
    const existingIndex = existingModels.findIndex(m => m.id === live2dConfig.id);
    if (existingIndex >= 0) {
      existingModels[existingIndex] = live2dConfig;
      console.info(`[开场界面] 更新模型配置: ${live2dConfig.name}`);
    } else {
      existingModels.push(live2dConfig);
      console.info(`[开场界面] 添加新模型配置: ${live2dConfig.name}`);
    }

    // 保存到角色卡变量
    const updatedVariables = {
      ...variables,
      live2d_models: existingModels,
    };
    replaceVariables(klona(updatedVariables), { type: 'character' });

    console.info(`[开场界面] 模型配置已保存到角色卡变量，共 ${existingModels.length} 个模型`);
  } catch (error) {
    console.error('[开场界面] 保存模型配置到变量失败:', error);
    toastr.warning('模型配置保存失败，但模型已成功导入');
  }
}

/**
 * 解析 model3.json 文件，提取 motions 数组及其索引
 * 同时提取动作的 name（从文件名中提取）
 */
export async function parseModel3Motions(model3File: File): Promise<
  Array<{
    motions: Array<{
      file: string;
      name: string;
      index: number;
      fadeInTime?: number;
      fadeOutTime?: number;
    }>;
    group: string; // model3.json 中 Motions 对象的 key
  }>
> {
  try {
    const content = await model3File.text();
    const model3Json = JSON.parse(content);

    const result: Array<{
      motions: Array<{
        file: string;
        name: string;
        index: number;
        fadeInTime?: number;
        fadeOutTime?: number;
      }>;
      group: string;
    }> = [];

    // 解析 FileReferences.Motions
    if (model3Json.FileReferences?.Motions) {
      for (const [group, motionsArray] of Object.entries(model3Json.FileReferences.Motions)) {
        if (Array.isArray(motionsArray)) {
          const motions = motionsArray.map((motion: any, index: number) => {
            const file = motion.File || motion.file;
            const name = extractMotionName(file, '');

            return {
              file,
              name,
              index,
              fadeInTime: motion.FadeInTime || motion.fadeInTime,
              fadeOutTime: motion.FadeOutTime || motion.fadeOutTime,
            };
          });

          result.push({
            motions,
            group, // 保留原始 group 名称（包括空字符串）
          });
        }
      }
    }

    console.info('[parseModel3Motions] 解析结果:', result);
    return result;
  } catch (error) {
    console.error('[parseModel3Motions] 解析失败:', error);
    throw new Error('无法解析 model3.json 文件');
  }
}

/**
 * 解析 model.json 文件（Cubism 2.1），提取 motions 数组及其索引
 */
export async function parseModelMotions(modelFile: File): Promise<
  Array<{
    motions: Array<{
      file: string;
      name: string;
      index: number;
      fadeIn?: number;
      fadeOut?: number;
    }>;
    group: string;
  }>
> {
  try {
    const content = await modelFile.text();
    const modelJson = JSON.parse(content);

    const result: Array<{
      motions: Array<{
        file: string;
        name: string;
        index: number;
        fadeIn?: number;
        fadeOut?: number;
      }>;
      group: string;
    }> = [];

    // 解析 motions（Cubism 2.1 格式）
    if (modelJson.motions) {
      for (const [group, motionsArray] of Object.entries(modelJson.motions)) {
        if (Array.isArray(motionsArray)) {
          const motions = motionsArray.map((motion: any, index: number) => {
            const file = motion.file || motion.File;
            const name = extractMotionName(file, '');

            return {
              file,
              name,
              index,
              fadeIn: motion.fade_in || motion.fadeIn,
              fadeOut: motion.fade_out || motion.fadeOut,
            };
          });

          result.push({
            motions,
            group,
          });
        }
      }
    }

    console.info('[parseModelMotions] 解析结果:', result);
    return result;
  } catch (error) {
    console.error('[parseModelMotions] 解析失败:', error);
    throw new Error('无法解析 model.json 文件');
  }
}
