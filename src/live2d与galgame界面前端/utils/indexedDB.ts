/**
 * IndexedDB 工具模块
 * 用于从 IndexedDB 读取 Live2D 模型文件
 */

const DB_NAME = 'live2d-models-db';
const DB_VERSION = 1;
const STORE_NAME = 'model-files';

/**
 * 打开数据库
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = event => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
  });
}

/**
 * 从 IndexedDB 读取文件
 */
export async function getFile(fileId: string): Promise<File | null> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(fileId);

    request.onsuccess = () => {
      const fileData = request.result;
      if (!fileData) {
        resolve(null);
        return;
      }

      // 将 ArrayBuffer 转换回 File
      const blob = new Blob([fileData.data], { type: fileData.type });
      const file = new File([blob], fileData.filename, {
        type: fileData.type,
        lastModified: fileData.lastModified,
      });

      resolve(file);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 从 IndexedDB 获取文件的 Blob URL
 */
export async function getFileBlobUrl(fileId: string): Promise<string | null> {
  const file = await getFile(fileId);
  if (!file) return null;

  return URL.createObjectURL(file);
}

/**
 * 检查文件是否存在
 */
export async function fileExists(fileId: string): Promise<boolean> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(fileId);

    request.onsuccess = () => {
      resolve(request.result !== undefined);
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 从 indexeddb:// 协议 URL 解析文件 ID
 */
export function parseIndexedDbUrl(url: string): { modelName: string; filename: string } | null {
  // 格式：indexeddb://模型名/文件名
  const match = url.match(/^indexeddb:\/\/([^/]+)\/(.+)$/);
  if (!match) return null;

  return {
    modelName: match[1],
    filename: match[2],
  };
}

/**
 * 生成文件 ID（与开场界面保持一致）
 */
export function generateFileId(modelName: string, filename: string): string {
  return `${modelName}::${filename}`;
}

/**
 * 从 indexeddb:// URL 获取文件的 Blob URL
 */
export async function getIndexedDbFileUrl(
  indexedDbUrl: string,
  fileIds?: Record<string, string>,
): Promise<string | null> {
  const parsed = parseIndexedDbUrl(indexedDbUrl);
  if (!parsed) return null;

  // 如果提供了 fileIds 映射，优先使用
  if (fileIds && fileIds[parsed.filename]) {
    return getFileBlobUrl(fileIds[parsed.filename]);
  }

  // 否则尝试生成 fileId
  const fileId = generateFileId(parsed.modelName, parsed.filename);
  return getFileBlobUrl(fileId);
}
