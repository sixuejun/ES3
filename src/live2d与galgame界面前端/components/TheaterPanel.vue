<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <div
      class="bg-card/95 text-foreground relative max-h-[85vh] w-[90%] max-w-2xl rounded-lg shadow-2xl backdrop-blur-md"
    >
      <!-- 标题栏 -->
      <div class="border-border/30 flex items-center justify-between border-b px-6 py-3">
        <h2 class="text-lg font-medium">🌿 · 小剧场 · 🌿</h2>
        <button class="hover:bg-muted rounded-full p-1 transition-colors" aria-label="关闭" @click="handleClose">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容区域 -->
      <div class="theater-content max-h-[calc(85vh-100px)] overflow-y-auto px-6 py-4">
        <div ref="theaterContainer" class="theater-bubbles-container space-y-3"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';
import type { StatusBlockData } from '../types/message';

interface Props {
  show: boolean;
  messageId?: number;
  statusBlock?: StatusBlockData | null;
  onClose: () => void;
}

const props = defineProps<Props>();

const theaterContainer = ref<HTMLDivElement | null>(null);
const theaterRendered = ref(false);

function handleClose() {
  props.onClose();
}

// 渲染小剧场
function renderTheater() {
  if (!theaterContainer.value) {
    return;
  }

  const container = theaterContainer.value;
  const theaterContent = props.statusBlock?.小剧场 || '';

  // 清空容器
  container.innerHTML = '';

  if (!theaterContent || theaterContent.trim() === '') {
    const emptyMsg = document.createElement('div');
    emptyMsg.textContent = '暂无小剧场内容';
    emptyMsg.style.textAlign = 'center';
    emptyMsg.style.color = '#788a82';
    emptyMsg.style.padding = '20px';
    container.appendChild(emptyMsg);
    theaterRendered.value = true;
    return;
  }

  // 匹配 【发言人（可含括号描述）: 内容】 ，支持中英文冒号
  const matches = [...theaterContent.matchAll(/【([^：:]+)[：:](.*?)】/g)];

  if (matches.length === 0) {
    // 如果没有匹配到，显示原始文本
    const textDiv = document.createElement('div');
    textDiv.textContent = theaterContent;
    textDiv.style.whiteSpace = 'pre-wrap';
    textDiv.style.color = '#333';
    textDiv.style.padding = '12px';
    container.appendChild(textDiv);
    theaterRendered.value = true;
    return;
  }

  // 获取第一个发言人作为主视角
  const firstSpeaker = matches[0]?.[1]?.trim() || '';
  const mainCharacterName = firstSpeaker.split('（')[0].split('(')[0].trim();

  matches.forEach(match => {
    const fullSpeaker = match[1]?.trim();
    const content = match[2]?.trim() || '';
    const speakerName = fullSpeaker.split('（')[0].split('(')[0].trim();
    const isMainCharacter = speakerName === mainCharacterName;

    // 创建气泡容器
    const bubble = document.createElement('div');
    bubble.className = 'theater-bubble';
    bubble.style.display = 'flex';
    bubble.style.justifyContent = isMainCharacter ? 'flex-end' : 'flex-start';
    bubble.style.marginBottom = '12px';

    // 创建气泡内容
    const bubbleContent = document.createElement('div');
    bubbleContent.style.maxWidth = '70%';
    bubbleContent.style.padding = '10px 14px';
    bubbleContent.style.borderRadius = '12px';
    bubbleContent.style.background = isMainCharacter ? '#e0f2fe' : '#f3f4f6';
    bubbleContent.style.color = '#1f2937';
    bubbleContent.style.fontSize = '14px';
    bubbleContent.style.lineHeight = '1.5';
    bubbleContent.style.wordBreak = 'break-word';
    bubbleContent.textContent = content;

    // 创建发言人标签
    const speakerLabel = document.createElement('div');
    speakerLabel.style.fontSize = '12px';
    speakerLabel.style.color = '#6b7280';
    speakerLabel.style.marginBottom = '4px';
    speakerLabel.style.textAlign = isMainCharacter ? 'right' : 'left';
    speakerLabel.textContent = fullSpeaker;

    // 组装气泡
    const bubbleWrapper = document.createElement('div');
    bubbleWrapper.style.width = '100%';
    bubbleWrapper.appendChild(speakerLabel);
    bubbleWrapper.appendChild(bubbleContent);
    bubble.appendChild(bubbleWrapper);

    container.appendChild(bubble);
  });

  theaterRendered.value = true;
}

// 监听 show 和 statusBlock 变化
watch(
  () => [props.show, props.statusBlock],
  async () => {
    if (props.show) {
      await nextTick();
      if (!theaterRendered.value) {
        renderTheater();
      }
    } else {
      theaterRendered.value = false;
    }
  },
  { immediate: true },
);
</script>

<style scoped>
.theater-content {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.theater-content::-webkit-scrollbar {
  width: 6px;
}

.theater-content::-webkit-scrollbar-track {
  background: transparent;
}

.theater-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.theater-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
