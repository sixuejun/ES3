<template>
  <div v-if="content" ref="noteCardRef" class="note-card" :style="cardStyle" @mousedown="handleMouseDown">
    <!-- 关闭按钮 -->
    <button class="note-close-btn" aria-label="关闭" @click.stop="handleClose">
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M9 3L3 9M3 3L9 9"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <!-- 纸张边缘的浅绿装饰边 -->
    <div class="note-border" />

    <!-- 顶部装饰 - 少女风格的圆点 -->
    <div class="note-dots">
      <div class="note-dot" />
      <div class="note-dot" />
      <div class="note-dot" />
    </div>

    <!-- 横线背景 - 日记本效果 -->
    <div class="note-lines">
      <div v-for="i in 8" :key="i" class="note-line" />
    </div>

    <!-- 左侧装订线效果 -->
    <div class="note-binding" />

    <!-- 内容区域 -->
    <div class="note-content">
      <div class="note-text">{{ content }}</div>
    </div>

    <!-- 右下角小装饰 - 可爱的小花 -->
    <div class="note-flower">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="10" cy="10" r="2" fill="currentColor" />
        <circle cx="10" cy="5" r="2.5" fill="currentColor" />
        <circle cx="15" cy="10" r="2.5" fill="currentColor" />
        <circle cx="10" cy="15" r="2.5" fill="currentColor" />
        <circle cx="5" cy="10" r="2.5" fill="currentColor" />
      </svg>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

interface Props {
  content?: string;
  noteUnitId?: string;
  initialPosition?: { x: number; y: number };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  close: [];
  positionChange: [unitId: string, position: { x: number; y: number }];
}>();

const noteCardRef = ref<HTMLDivElement | null>(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const position = ref({ x: 0, y: 0 });

// 从 localStorage 加载保存的位置，或使用初始位置
onMounted(() => {
  if (props.noteUnitId) {
    const storageKey = `note_position_${props.noteUnitId}`;
    const savedPosition = localStorage.getItem(storageKey);
    if (savedPosition) {
      try {
        position.value = JSON.parse(savedPosition);
      } catch (e) {
        console.warn('Failed to parse saved note position:', e);
      }
    } else if (props.initialPosition) {
      position.value = props.initialPosition;
    }
  } else if (props.initialPosition) {
    position.value = props.initialPosition;
  }
});

// 监听 initialPosition 变化
watch(
  () => props.initialPosition,
  newPosition => {
    if (newPosition && !isDragging.value) {
      position.value = newPosition;
    }
  },
);

// 计算卡片样式（包含位置）
const cardStyle = computed(() => ({
  transform: `translate(${position.value.x}px, ${position.value.y}px)`,
  cursor: isDragging.value ? 'grabbing' : 'grab',
}));

function handleMouseDown(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.note-close-btn')) {
    return;
  }

  isDragging.value = true;
  const rect = noteCardRef.value?.getBoundingClientRect();
  if (rect) {
    dragOffset.value = {
      x: e.clientX - rect.left - position.value.x,
      y: e.clientY - rect.top - position.value.y,
    };
  }

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  e.preventDefault();
}

function handleMouseMove(e: MouseEvent) {
  if (!isDragging.value || !noteCardRef.value) return;

  // 获取父容器（GalgamePlayer 的容器）
  const container = noteCardRef.value.closest('.relative') || document.body;
  const containerRect = container.getBoundingClientRect();
  const cardRect = noteCardRef.value.getBoundingClientRect();

  // 计算新位置（相对于容器的位置）
  const newX = e.clientX - containerRect.left - dragOffset.value.x;
  const newY = e.clientY - containerRect.top - dragOffset.value.y;

  // 限制在容器内（允许部分超出，但尽量保持在可见区域）
  const maxX = Math.max(0, containerRect.width - cardRect.width);
  const maxY = Math.max(0, containerRect.height - cardRect.height);

  position.value = {
    x: Math.max(-cardRect.width * 0.5, Math.min(newX, maxX + cardRect.width * 0.5)),
    y: Math.max(-cardRect.height * 0.5, Math.min(newY, maxY + cardRect.height * 0.5)),
  };
}

function handleMouseUp() {
  isDragging.value = false;
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);

  // 保存位置
  if (props.noteUnitId) {
    emit('positionChange', props.noteUnitId, position.value);
  }
}

function handleClose() {
  emit('close');
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
});
</script>

<style scoped>
.note-card {
  position: relative;
  width: 100%;
  max-width: 280px;
  aspect-ratio: 1;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  user-select: none;
  transition: box-shadow 0.2s;
}

.note-card:hover {
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
}

.note-close-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 20;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid rgba(16, 185, 129, 0.2);
  border-radius: 50%;
  color: #10b981;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.7;
}

.note-close-btn:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 1);
  border-color: rgba(16, 185, 129, 0.4);
  transform: scale(1.1);
}

.note-border {
  position: absolute;
  inset: 0;
  border: 2px solid rgba(16, 185, 129, 0.15);
  border-radius: 12px;
  pointer-events: none;
}

.note-dots {
  position: absolute;
  top: 12px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  pointer-events: none;
  z-index: 10;
}

.note-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(16, 185, 129, 0.3);
}

.note-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  margin-top: 48px;
  z-index: 1;
}

.note-line {
  height: 32px;
  border-bottom: 1px solid rgba(16, 185, 129, 0.08);
}

.note-binding {
  position: absolute;
  left: 16px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    to bottom,
    transparent,
    rgba(16, 185, 129, 0.2) 20%,
    rgba(16, 185, 129, 0.2) 80%,
    transparent
  );
  pointer-events: none;
  z-index: 2;
}

.note-content {
  position: relative;
  z-index: 10;
  height: 100%;
  padding: 48px 24px 24px;
  overflow-y: auto;
}

.note-content::-webkit-scrollbar {
  width: 4px;
}

.note-content::-webkit-scrollbar-thumb {
  background: rgba(16, 185, 129, 0.2);
  border-radius: 2px;
}

.note-text {
  font-size: 14px;
  line-height: 1.6;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.note-flower {
  position: absolute;
  bottom: 12px;
  right: 12px;
  pointer-events: none;
  z-index: 5;
  color: rgba(16, 185, 129, 0.25);
}
</style>
