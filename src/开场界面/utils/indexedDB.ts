/**
 * IndexedDB 工具模块
 * 用于存储和读取 Live2D 模型文件
 */

const DB_NAME = 'live2d-models-db';
const DB_VERSION = 1;
const STORE_NAME = 'model-files';

interface StoredFileRecord {
  id: string;
  modelName: string;
  filename: string;
  data: ArrayBuffer;
  type: string;
  size: number;
  lastModified: number;
}

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
 * 生成文件 ID（基于模型名和文件名）
 */
export function generateFileId(modelName: string, filename: string): string {
  return `${modelName}::${filename}`;
}

/**
 * 存储文件到 IndexedDB
 */
export async function storeFile(modelName: string, filename: string, file: File): Promise<string> {
  const db = await openDB();
  const fileId = generateFileId(modelName, filename);

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);

    // 读取文件为 ArrayBuffer
    const reader = new FileReader();
    reader.onload = () => {
      const fileData = {
        id: fileId,
        modelName,
        filename,
        data: reader.result as ArrayBuffer,
        type: file.type,
        size: file.size,
        lastModified: file.lastModified,
      };

      const request = store.put(fileData);
      request.onsuccess = () => {
        console.info(`[IndexedDB] 已存储文件: ${filename} (${(file.size / 1024).toFixed(2)}KB)`);
        resolve(fileId);
      };
      request.onerror = () => reject(request.error);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
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
 * 删除文件
 */
export async function deleteFile(fileId: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(fileId);

    request.onsuccess = () => {
      console.info(`[IndexedDB] 已删除文件: ${fileId}`);
      resolve();
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 删除模型的所有文件
 */
export async function deleteModelFiles(modelName: string): Promise<void> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allFiles = request.result;
      const modelFiles = allFiles.filter(f => f.modelName === modelName);

      if (modelFiles.length === 0) {
        resolve();
        return;
      }

      let deleteCount = 0;
      const totalCount = modelFiles.length;

      modelFiles.forEach(fileData => {
        const deleteRequest = store.delete(fileData.id);
        deleteRequest.onsuccess = () => {
          deleteCount++;
          if (deleteCount === totalCount) {
            console.info(`[IndexedDB] 已删除模型 "${modelName}" 的所有文件 (${totalCount} 个)`);
            resolve();
          }
        };
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 获取所有存储的模型名称
 */
export async function getAllModelNames(): Promise<string[]> {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const allFiles = request.result;
      const modelNames = new Set<string>();
      allFiles.forEach((fileData: any) => {
        modelNames.add(fileData.modelName);
      });
      resolve(Array.from(modelNames));
    };
    request.onerror = () => reject(request.error);
  });
}

/**
 * 计算文件总大小
 */
function calculateTotalSize(files: StoredFileRecord[]): number {
  return files.reduce((total, file) => {
    if (typeof file.size === 'number') {
      return total + file.size;
    }
    const bufferSize = file.data instanceof ArrayBuffer ? file.data.byteLength : 0;
    return total + bufferSize;
  }, 0);
}

/**
 * 清空 IndexedDB 中的所有文件
 */
export async function clearAllFiles(): Promise<{ clearedCount: number; clearedSize: number }> {
  const db = await openDB();

  // 先获取全部文件用于统计
  const allFiles = await new Promise<StoredFileRecord[]>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve((request.result || []) as StoredFileRecord[]);
    request.onerror = () => reject(request.error);
  });

  const clearedSize = calculateTotalSize(allFiles);

  // 再执行清理
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });

  console.info(
    `[IndexedDB] 已清理所有模型缓存 (${allFiles.length} 个文件，约 ${(clearedSize / 1024 / 1024).toFixed(2)} MB)`,
  );

  return {
    clearedCount: allFiles.length,
    clearedSize,
  };
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
