import { defineStore } from 'pinia';
import { ref } from 'vue';

/**
 * 预发送文本项
 */
export interface PendingTextItem {
  id: string; // 唯一ID
  text: string; // 文本内容
  timestamp: string; // 时间戳
  source: 'phone' | 'input'; // 来源：phone=PhonePanel输入，input=GalgamePlayer输入
  unitId?: string; // 关联的演出单元ID（如果有）
  contact?: string; // 联系人名称（仅 phone 来源有）
}

/**
 * 预发送文本 Store
 *
 * 用于存储 PhonePanel 和 GalgamePlayer "输入"功能输入的文本
 */
export const usePendingTextStore = defineStore('pendingText', () => {
  // 预发送文本列表
  const pendingTexts = ref<PendingTextItem[]>([]);

  /**
   * 添加预发送文本
   */
  function addPendingText(item: Omit<PendingTextItem, 'id'>): string {
    const id = `${item.source}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newItem: PendingTextItem = { ...item, id };
    pendingTexts.value.push(newItem);

    console.info('[PendingTextStore] 添加预发送文本:', {
      id,
      text: item.text,
      source: item.source,
      unitId: item.unitId,
      contact: item.contact,
    });
    console.info(
      '[PendingTextStore] 当前预发送文本列表:',
      pendingTexts.value.map(t => ({
        id: t.id,
        text: t.text,
        source: t.source,
      })),
    );

    return id;
  }

  /**
   * 添加 PhonePanel 文本
   */
  function addPhoneText(text: string, contact: string, timestamp: string): string {
    return addPendingText({
      text,
      timestamp,
      source: 'phone',
      contact,
    });
  }

  /**
   * 添加 GalgamePlayer 输入文本
   */
  function addInputText(text: string, timestamp: string, unitId?: string): string {
    return addPendingText({
      text,
      timestamp,
      source: 'input',
      unitId,
    });
  }

  /**
   * 通过 ID 清除预发送文本
   */
  function clearById(id: string) {
    const index = pendingTexts.value.findIndex(t => t.id === id);
    if (index !== -1) {
      const removed = pendingTexts.value.splice(index, 1)[0];
      console.info('[PendingTextStore] 清除预发送文本 (by ID):', {
        id,
        text: removed.text,
        source: removed.source,
      });
      console.info(
        '[PendingTextStore] 剩余预发送文本列表:',
        pendingTexts.value.map(t => ({
          id: t.id,
          text: t.text,
          source: t.source,
        })),
      );
    }
  }

  /**
   * 通过演出单元 ID 清除预发送文本
   */
  function clearByUnitId(unitId: string) {
    const itemsToRemove = pendingTexts.value.filter(t => t.unitId === unitId);
    pendingTexts.value = pendingTexts.value.filter(t => t.unitId !== unitId);

    if (itemsToRemove.length > 0) {
      console.info('[PendingTextStore] 清除预发送文本 (by unitId):', {
        unitId,
        removedCount: itemsToRemove.length,
        removedTexts: itemsToRemove.map(t => t.text),
      });
      console.info(
        '[PendingTextStore] 剩余预发送文本列表:',
        pendingTexts.value.map(t => ({
          id: t.id,
          text: t.text,
          source: t.source,
        })),
      );
    }
  }

  /**
   * 通过联系人清除 PhonePanel 预发送文本
   */
  function clearByContact(contact: string) {
    const itemsToRemove = pendingTexts.value.filter(t => t.source === 'phone' && t.contact === contact);
    pendingTexts.value = pendingTexts.value.filter(t => !(t.source === 'phone' && t.contact === contact));

    if (itemsToRemove.length > 0) {
      console.info('[PendingTextStore] 清除预发送文本 (by contact):', {
        contact,
        removedCount: itemsToRemove.length,
        removedTexts: itemsToRemove.map(t => t.text),
      });
      console.info(
        '[PendingTextStore] 剩余预发送文本列表:',
        pendingTexts.value.map(t => ({
          id: t.id,
          text: t.text,
          source: t.source,
        })),
      );
    }
  }

  /**
   * 清除所有预发送文本
   */
  function clearAll() {
    const count = pendingTexts.value.length;
    const allTexts = pendingTexts.value.map(t => ({ text: t.text, source: t.source }));
    pendingTexts.value = [];

    console.info('[PendingTextStore] 清除所有预发送文本:', {
      clearedCount: count,
      clearedTexts: allTexts,
    });
  }

  /**
   * 获取所有预发送文本
   */
  function getAllPendingText(): PendingTextItem[] {
    console.info('[PendingTextStore] 获取所有预发送文本:', {
      count: pendingTexts.value.length,
      texts: pendingTexts.value.map(t => ({
        text: t.text,
        source: t.source,
        contact: t.contact,
        unitId: t.unitId,
      })),
    });
    return [...pendingTexts.value];
  }

  /**
   * 获取 PhonePanel 预发送文本（按联系人分组）
   */
  function getPhoneTexts(contact?: string): PendingTextItem[] {
    const filtered = contact
      ? pendingTexts.value.filter(t => t.source === 'phone' && t.contact === contact)
      : pendingTexts.value.filter(t => t.source === 'phone');

    console.info('[PendingTextStore] 获取 PhonePanel 预发送文本:', {
      contact,
      count: filtered.length,
      texts: filtered.map(t => t.text),
    });

    return filtered;
  }

  /**
   * 获取 GalgamePlayer 输入预发送文本
   */
  function getInputTexts(): PendingTextItem[] {
    const filtered = pendingTexts.value.filter(t => t.source === 'input');

    console.info('[PendingTextStore] 获取 GalgamePlayer 输入预发送文本:', {
      count: filtered.length,
      texts: filtered.map(t => ({ text: t.text, unitId: t.unitId })),
    });

    return filtered;
  }

  /**
   * 更新预发送文本内容（用于编辑同步）
   */
  function updateText(id: string, newText: string) {
    const item = pendingTexts.value.find(t => t.id === id);
    if (item) {
      const oldText = item.text;
      item.text = newText;
      console.info('[PendingTextStore] 更新预发送文本:', {
        id,
        oldText,
        newText,
        source: item.source,
      });
    }
  }

  /**
   * 通过演出单元 ID 更新预发送文本内容
   */
  function updateTextByUnitId(unitId: string, newText: string) {
    const item = pendingTexts.value.find(t => t.unitId === unitId);
    if (item) {
      const oldText = item.text;
      item.text = newText;
      console.info('[PendingTextStore] 更新预发送文本 (by unitId):', {
        unitId,
        oldText,
        newText,
        source: item.source,
      });
    }
  }

  return {
    pendingTexts,
    addPendingText,
    addPhoneText,
    addInputText,
    clearById,
    clearByUnitId,
    clearByContact,
    clearAll,
    getAllPendingText,
    getPhoneTexts,
    getInputTexts,
    updateText,
    updateTextByUnitId,
  };
});
