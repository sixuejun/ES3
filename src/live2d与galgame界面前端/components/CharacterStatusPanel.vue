<template>
  <div
    v-if="show"
    class="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click="onClose"
  >
    <div class="bg-card max-h-[85vh] w-[90%] max-w-md overflow-hidden rounded-xl shadow-2xl" @click.stop>
      <!-- 头部 -->
      <div class="border-gray-200 flex items-center justify-between border-b px-4 py-3">
        <h2 class="text-foreground text-lg font-semibold">角色状态</h2>
        <button class="hover:bg-muted rounded-full p-1 transition-colors" aria-label="关闭状态栏" @click="onClose">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="max-h-[calc(85vh-60px)] overflow-y-auto p-4">
        <div class="space-y-4">
          <!-- Tab 切换 - 导航栏样式，左右分栏 -->
          <div class="flex border-b border-gray-200">
            <button
              v-for="tab in tabs"
              :key="tab.id"
              :class="[
                'flex-1 px-4 py-3 text-sm font-medium transition-all relative',
                activeTab === tab.id ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              ]"
              @click="activeTab = tab.id"
            >
              {{ tab.name }}
              <!-- 选中时的绿色粗横线 -->
              <div
                v-if="activeTab === tab.id"
                class="absolute bottom-0 left-0 right-0 h-1 bg-primary"
                style="height: 3px"
              />
            </button>
          </div>

          <!-- 角色属性标签页 -->
          <div v-if="activeTab === 'status'" class="animate-in fade-in space-y-4 duration-200">
            <!-- 信息栏 -->
            <div class="status-info-bar">
              <div class="info-item">
                <span>🕒</span>
                <span>{{ statusData.时间 || '未知' }}</span>
              </div>
              <div class="info-item">
                <span>📍</span>
                <span>{{ statusData.地点 || '未知' }}</span>
              </div>
            </div>

            <!-- 数值网格 -->
            <div v-if="Object.keys(statusValues).length > 0" class="status-values-grid">
              <div v-for="(value, key) in statusValues" :key="key" class="value-card">
                <div class="value-name">{{ key }}</div>
                <div class="value-number">{{ value }}</div>
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

          <!-- 小剧场标签页 -->
          <div v-if="activeTab === 'theater'" class="animate-in fade-in space-y-4 duration-200">
            <div class="theater-title">🌿 · 小剧场 · 🌿</div>
            <div ref="theaterContainer" class="theater-bubbles-container"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import _ from 'lodash';
import { nextTick, onMounted, ref, watch } from 'vue';
import type { StatusBlockData } from '../lib/messageParser';

interface Props {
  show: boolean;
  messageId?: number;
  statusBlock?: StatusBlockData;
  onClose: () => void;
}

const props = defineProps<Props>();

const activeTab = ref<'status' | 'theater'>('status');
const theaterExpanded = ref(false);
const theaterContainer = ref<HTMLDivElement | null>(null);
const theaterRendered = ref(false);
const isLoading = ref(false);

// Tab列表
const tabs: Array<{ id: 'status' | 'theater'; name: string }> = [
  { id: 'status', name: '角色属性' },
  { id: 'theater', name: '小剧场' },
] as const;

// 状态数据
const statusData = ref<StatusBlockData & { 时间?: string; [key: string]: any }>({
  地点: '',
  关系: '',
  心情: '',
  吐槽: '',
  待办: '',
  小剧场: '',
});

// 数值属性（从MVU中提取）
const statusValues = ref<Record<string, string | number>>({});

// MVU 工具函数：等待初始化并获取数据
async function getMvuStatData(): Promise<any | null> {
  try {
    // 等待MVU初始化
    if (typeof window !== 'undefined' && (window as any).waitGlobalInitialized) {
      await (window as any).waitGlobalInitialized('Mvu');
    }

    // 获取MVU数据
    if (typeof window !== 'undefined' && (window as any).Mvu) {
      const mvuData = (window as any).Mvu.getMvuData({
        type: 'message',
        message_id: props.messageId || 'latest',
      });

      if (mvuData?.stat_data) {
        return mvuData.stat_data;
      }
    }
  } catch (error) {
    console.warn('获取MVU数据失败:', error);
  }
  return null;
}

// 从MVU变量获取状态数据
async function loadStatusFromMvu(): Promise<boolean> {
  const statData = await getMvuStatData();
  if (!statData) return false;

  // 批量更新状态数据
  const fields = ['时间', '地点', '关系', '心情', '吐槽', '待办', '小剧场'] as const;
  fields.forEach(field => {
    const value = _.get(statData, field);
    if (value !== undefined) {
      statusData.value[field] = String(value);
    }
  });

  return true;
}

// 从StatusBlock解析状态数据
function loadStatusFromBlock() {
  if (props.statusBlock) {
    statusData.value = {
      ...statusData.value,
      ...props.statusBlock,
    };
  }
}

// 从MVU数据中提取数值属性
async function extractStatusValues() {
  const statData = await getMvuStatData();
  if (!statData) return;

  // 尝试从stat_data.角色.角色名中获取属性
  if (statData.角色 && typeof statData.角色 === 'object') {
    const newValues: Record<string, string | number> = {};

    // 遍历角色对象，提取数值属性
    Object.keys(statData.角色).forEach(characterName => {
      const characterData = statData.角色[characterName];
      if (characterData && typeof characterData === 'object') {
        // 提取数值属性（如亲情、爱欲、厌恶、自我等）
        Object.keys(characterData).forEach(attrName => {
          const attrValue = characterData[attrName];
          if (typeof attrValue === 'number' || (typeof attrValue === 'string' && !isNaN(Number(attrValue)))) {
            newValues[attrName] = attrValue;
          }
        });
      }
    });

    statusValues.value = newValues;
  }
}

// 切换小剧场展开/收起
function toggleTheater() {
  theaterExpanded.value = !theaterExpanded.value;
  if (theaterExpanded.value) {
    // 使用nextTick确保DOM已更新
    nextTick(() => {
      if (!theaterRendered.value) {
        renderTheater();
      }
    });
  }
}

// 监听标签页切换，切换到小剧场时自动展开
watch(
  activeTab,
  newTab => {
    if (newTab === 'theater') {
      // 切换到小剧场标签页时，自动展开并渲染
      theaterExpanded.value = true;
      nextTick(() => {
        renderTheater();
      });
    }
  },
  { immediate: true },
);

// 渲染小剧场
function renderTheater() {
  if (!theaterContainer.value || !statusData.value.小剧场) {
    return;
  }

  const rawText = statusData.value.小剧场;
  const container = theaterContainer.value;

  // 清空容器
  container.innerHTML = '';

  // 匹配 【发言人（可含括号描述）: 内容】 ，支持中英文冒号
  const matches = [...rawText.matchAll(/【([^：:]+)[：:](.*?)】/g)];

  if (matches.length === 0) {
    // 如果没有匹配到，显示提示
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = '暂无小剧场内容';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.color = '#788a82';
    emptyMsg.style.padding = '20px';
    container.appendChild(emptyMsg);
    theaterRendered.value = true;
    return;
  }

  // 获取当前角色名（用于判断主视角）
  // 可以从当前对话中获取角色名，这里先使用第一个发言人或包含"你"/"我"的作为主视角
  const firstSpeaker = matches[0]?.[1]?.trim() || '';
  const mainCharacterName = firstSpeaker.split('（')[0].split('(')[0]; // 提取角色名（去除括号内容）

  matches.forEach(match => {
    const fullSpeaker = match[1]?.trim(); // 例：程北极（内心OS）
    const content = match[2]?.trim();
    if (!fullSpeaker || !content) return;

    // 判断是否为主视角
    // 参考状态栏的逻辑：判断是否为第一个角色主视角
    // 如果fullSpeaker以主角色名开头，则认为是主视角（左侧）
    const speakerName = fullSpeaker.split('（')[0].split('(')[0];
    const isMain = speakerName === mainCharacterName || fullSpeaker.includes('你') || fullSpeaker.includes('我');
    const bubbleSide = isMain ? 'left' : 'right';

    // 创建外层容器（含发言人名）
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.style.display = 'flex';
    bubbleWrapper.style.flexDirection = 'column';
    bubbleWrapper.style.alignItems = isMain ? 'flex-start' : 'flex-end';

    // 发言人标签
    const speakerLabel = document.createElement('div');
    speakerLabel.textContent = fullSpeaker;
    speakerLabel.style.fontSize = '0.85em';
    speakerLabel.style.color = '#788a82';
    speakerLabel.style.margin = isMain ? '0 0 4px 8px' : '0 8px 4px 0';

    // 对话气泡
    const bubble = document.createElement('div');
    bubble.classList.add('bubble', bubbleSide);
    bubble.textContent = content;

    // 组合
    bubbleWrapper.appendChild(speakerLabel);
    bubbleWrapper.appendChild(bubble);
    container.appendChild(bubbleWrapper);
  });

  theaterRendered.value = true;
}

// 加载状态数据
async function loadStatusData() {
  if (isLoading.value) return;
  isLoading.value = true;

  try {
    // 重置状态
    statusValues.value = {};
    theaterRendered.value = false;

    // 优先从MVU获取
    const mvuLoaded = await loadStatusFromMvu();

    // 提取数值属性（复用已获取的MVU数据）
    await extractStatusValues();

    // 如果MVU没有数据，则从StatusBlock解析
    if (!mvuLoaded) {
      loadStatusFromBlock();
    }
  } finally {
    isLoading.value = false;
  }
}

// 监听props变化
watch(
  () => [props.show, props.messageId, props.statusBlock],
  () => {
    if (props.show) {
      loadStatusData();
    }
  },
  { immediate: true },
);

onMounted(() => {
  if (props.show) {
    loadStatusData();
  }
});
</script>

<style scoped>
/* 移除旧的样式，使用Tailwind CSS类 */

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

.theater-title {
  text-align: center;
  font-weight: 600;
  color: #5a6e65;
  padding-bottom: 10px;
  border-bottom: 1px dashed #d1e5d9;
  margin-bottom: 15px;
  cursor: pointer;
  transition: color 0.2s;
}

.theater-title:hover {
  color: #a8d8c3;
}

.theater-bubbles-container {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 5px;
}

.bubble {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
  position: relative;
  line-height: 1.5;
  white-space: pre-wrap;
}

.bubble::before {
  content: '';
  position: absolute;
  bottom: 0;
  width: 0;
  height: 0;
  border: 10px solid transparent;
}

.bubble.left {
  background-color: rgba(224, 242, 233, 0.9);
  color: #5a6e65;
  border-bottom-left-radius: 4px;
  align-self: flex-start;
}

.bubble.left::before {
  left: -10px;
  border-right-color: rgba(224, 242, 233, 0.9);
  border-left: 0;
}

.bubble.right {
  background-color: rgba(255, 255, 255, 0.85);
  color: #788a82;
  border: 1px solid #d1e5d9;
  border-bottom-right-radius: 4px;
  align-self: flex-end;
}

.bubble.right::before {
  right: -10px;
  border-left-color: #d1e5d9;
  border-right: 0;
}

.bubble.right::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -8px;
  width: 0;
  height: 0;
  border: 10px solid transparent;
  border-left-color: rgba(255, 255, 255, 0.85);
  border-right: 0;
}

@media (max-width: 600px) {
  .status-info-bar {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }

  .bubble {
    max-width: 90%;
  }
}
</style>
