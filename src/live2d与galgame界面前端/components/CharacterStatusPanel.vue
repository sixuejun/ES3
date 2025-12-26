<template>
  <div
    v-if="show"
    class="animate-in fade-in absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm duration-200"
    @click="onClose"
  >
    <div class="status-container-wrapper" @click.stop>
      <div class="status-container">
        <!-- 头部 -->
        <div class="status-header">
          <span class="summary-icon">☘️</span>
          <span class="status-title">状态栏</span>
          <button class="status-close" aria-label="关闭状态栏" @click="onClose">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 内容 -->
        <div class="status-main-content">
          <!-- 信息栏 -->
          <div class="status-info-bar">
            <div class="info-item">
              <span>🕒</span>
              <span>{{ mvuData.时间 || '未知' }}</span>
            </div>
            <div class="info-item">
              <span>📍</span>
              <span>{{ statusData.地点 || '未知' }}</span>
            </div>
          </div>

          <!-- 数值网格 -->
          <div class="status-values-grid">
            <div class="value-card">
              <div class="value-name">亲情</div>
              <div class="value-number">{{ mvuData.程北极?.亲情 ?? 0 }}</div>
            </div>
            <div class="value-card">
              <div class="value-name">爱欲</div>
              <div class="value-number">{{ mvuData.程北极?.爱欲 ?? 0 }}</div>
            </div>
            <div class="value-card">
              <div class="value-name">厌恶</div>
              <div class="value-number">{{ mvuData.程北极?.厌恶 ?? 0 }}</div>
            </div>
            <div class="value-card">
              <div class="value-name">自我</div>
              <div class="value-number">{{ mvuData.程北极?.自我 ?? 0 }}</div>
            </div>
          </div>

          <!-- 文本卡片 -->
          <div class="status-text-card">
            <div class="text-card-row">
              <span class="text-card-label">关系</span>
              <span class="text-card-content">{{ statusData.关系 || '暂无' }}</span>
            </div>
            <div class="text-card-row">
              <span class="text-card-label">心情</span>
              <span class="text-card-content">{{ statusData.心情 || '暂无' }}</span>
            </div>
            <div class="text-card-row">
              <span class="text-card-label">吐槽</span>
              <span class="text-card-content">{{ statusData.吐槽 || '暂无' }}</span>
            </div>
            <div class="text-card-row">
              <span class="text-card-label">待办</span>
              <span class="text-card-content">{{ statusData.待办 || '暂无' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, watch, ref } from 'vue';
import type { StatusBlockData } from '../types/message';

interface Props {
  show: boolean;
  messageId?: number;
  statusBlock?: StatusBlockData | null;
  onClose: () => void;
}

const props = defineProps<Props>();

// MVU 变量数据
const mvuData = ref<{
  时间?: string;
  程北极?: {
    亲情?: number;
    爱欲?: number;
    厌恶?: number;
    自我?: number;
  };
}>({});

// 从消息楼层变量获取 MVU 数据
function loadMvuData() {
  if (props.messageId === undefined) {
    mvuData.value = {};
    return;
  }

  try {
    // 获取消息楼层变量
    const variables = getVariables({
      type: 'message',
      message_id: props.messageId,
    });

    // 提取 stat_data
    const statData = variables?.stat_data || {};
    mvuData.value = {
      时间: statData.时间 || '未知',
      程北极: {
        亲情: statData.程北极?.亲情 ?? 0,
        爱欲: statData.程北极?.爱欲 ?? 0,
        厌恶: statData.程北极?.厌恶 ?? 0,
        自我: statData.程北极?.自我 ?? 0,
      },
    };
  } catch (error) {
    console.warn('获取 MVU 数据失败:', error);
    mvuData.value = {};
  }
}

// 监听 messageId 变化，重新加载 MVU 数据
watch(
  () => props.messageId,
  () => {
    if (props.show) {
      loadMvuData();
    }
  },
  { immediate: true },
);

// 监听面板显示状态，显示时加载数据
watch(
  () => props.show,
  show => {
    if (show) {
      loadMvuData();
    }
  },
);

// 从 StatusBlock 获取的数据（地点、关系、心情、吐槽、待办）
const statusData = computed(() => {
  const data: StatusBlockData = {
    地点: '',
    关系: '',
    心情: '',
    吐槽: '',
    待办: '',
  };

  // 从 StatusBlock 获取
  if (props.statusBlock) {
    if (props.statusBlock.地点) data.地点 = props.statusBlock.地点;
    if (props.statusBlock.关系) data.关系 = props.statusBlock.关系;
    if (props.statusBlock.心情) data.心情 = props.statusBlock.心情;
    if (props.statusBlock.吐槽) data.吐槽 = props.statusBlock.吐槽;
    if (props.statusBlock.待办) data.待办 = props.statusBlock.待办;
  }

  return data;
});
</script>

<style scoped>
.status-container-wrapper {
  width: 90%;
  max-width: 32rem; /* max-w-lg */
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  font-size: 14px;
}

.status-container {
  background:
    linear-gradient(rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.3)),
    url('https://pic.imgdd.cc/item/691e765bc828c4c6def97018.jpg') center center / cover no-repeat;
  background-color: #f4f8f2;
  border: 1px solid #d1e5d9;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(168, 216, 195, 0.2);
  transition: all 0.3s ease-in-out;
  max-height: 85vh;
  overflow-y: auto;
  /* 隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.status-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.status-header {
  display: flex;
  align-items: center;
  padding: 12px 20px;
  color: #5a6e65;
  font-weight: 600;
  background-color: rgba(231, 244, 238, 0.87);
  border-bottom: 1px solid #d1e5d9;
  position: relative;
}

.summary-icon {
  margin-right: 10px;
  font-size: 1.2em;
  color: #a8d8c3;
}

.status-title {
  flex: 1;
}

.status-close {
  background: transparent;
  border: none;
  color: #5a6e65;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
  opacity: 0.7;
}

.status-close:hover {
  opacity: 1;
}

.status-main-content {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-info-bar {
  display: flex;
  justify-content: space-between;
  background: rgba(224, 242, 233, 0.8);
  padding: 10px 15px;
  border-radius: 10px;
  color: #5a6e65;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-values-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.value-card {
  background: rgba(255, 255, 255, 0.85);
  padding: 12px;
  border-radius: 8px;
  border: 1px solid #d1e5d9;
  text-align: center;
}

.value-name {
  font-weight: 600;
  color: #5a6e65;
}

.value-number {
  font-size: 1.5em;
  color: #a8d8c3;
  font-weight: bold;
}

.status-text-card {
  background: rgba(255, 255, 255, 0.85);
  padding: 15px;
  border-radius: 10px;
  border: 1px solid #d1e5d9;
}

.text-card-row {
  margin-bottom: 8px;
}

.text-card-row:last-child {
  margin-bottom: 0;
}

.text-card-label {
  font-weight: 600;
  color: #5a6e65;
  margin-right: 8px;
  display: inline-block;
  background-color: rgba(224, 242, 233, 0.9);
  padding: 2px 8px;
  border-radius: 12px;
}

.text-card-content {
  color: #788a82;
  white-space: pre-wrap;
}

@media (max-width: 600px) {
  .status-info-bar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}
</style>
