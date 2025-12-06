<template>
  <div
    class="absolute inset-0 z-25 flex items-center justify-center bg-black/30 backdrop-blur-sm"
    @click="handleBackgroundClick"
  >
    <div class="flex w-full max-w-md flex-col gap-3 px-6" @click.stop>
      <button
        v-for="(option, index) in options"
        :key="option.id"
        class="w-full p-4 text-left transition-all hover:scale-[1.02] active:scale-[0.98]"
        :style="{
          backgroundColor: isPillShape ? 'rgba(255, 255, 255, 0.7)' : dialogStyle.colors.boxBackground,
          borderRadius: boxShape.borderRadius,
          borderTopWidth: borderWidthPreset.width,
          borderLeftWidth: borderWidthPreset.width,
          borderRightWidth: borderWidthPreset.width,
          borderBottomWidth: borderWidthPreset.width,
          borderStyle: 'solid',
          borderColor: dialogStyle.colors.boxBorder,
          boxShadow: boxShape.shadow,
          color: dialogStyle.colors.dialogText,
          fontSize: `${dialogStyle.fontSize}px`,
          backdropFilter: isPillShape ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: isPillShape ? 'blur(12px)' : undefined,
        }"
        @click="() => handleOptionClick(option.id)"
      >
        {{ option.text }}
      </button>

      <!-- 自由输入选项 -->
      <div
        :class="['w-full p-4 transition-all cursor-pointer', selectedCustom ? 'ring-2 ring-primary' : '']"
        :style="{
          backgroundColor: isPillShape ? 'rgba(255, 255, 255, 0.7)' : dialogStyle.colors.boxBackground,
          borderRadius: boxShape.borderRadius,
          borderTopWidth: borderWidthPreset.width,
          borderLeftWidth: borderWidthPreset.width,
          borderRightWidth: borderWidthPreset.width,
          borderBottomWidth: borderWidthPreset.width,
          borderStyle: 'solid',
          borderColor: dialogStyle.colors.boxBorder,
          boxShadow: boxShape.shadow,
          fontSize: `${dialogStyle.fontSize}px`,
          backdropFilter: isPillShape ? 'blur(12px)' : undefined,
          WebkitBackdropFilter: isPillShape ? 'blur(12px)' : undefined,
        }"
        @click="handleCustomClick"
      >
        <div v-if="!isInputting" class="flex items-center gap-2" :style="{ color: dialogStyle.colors.narrationText }">
          <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
            />
          </svg>
          <span>自由输入...</span>
        </div>
        <div v-else class="flex items-center gap-2">
          <input
            ref="inputRef"
            v-model="inputText"
            type="text"
            placeholder="输入你想说的话..."
            class="flex-1 bg-transparent outline-none"
            :style="{ color: dialogStyle.colors.dialogText }"
            @click.stop
            @keydown.enter="handleInputConfirm"
            autofocus
          />
          <!-- 回车图标（保存输入/确认选项） -->
          <svg
            v-if="inputText.trim()"
            class="h-5 w-5 transition-colors cursor-pointer"
            :style="{ color: selectedCustom ? dialogStyle.colors.nameText : dialogStyle.colors.narrationText }"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            @click.stop="handleInputConfirm"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <!-- 保存按钮 -->
          <button
            v-if="inputText.trim()"
            class="p-1 transition-colors hover:opacity-80"
            :style="{ color: dialogStyle.colors.nameText }"
            aria-label="保存到正文"
            title="保存到正文（不发送）"
            @click.stop="handleSave"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';
import type { ChoiceOption, DialogBoxStyle } from '../types/galgame';
import { borderWidthPresets, boxShapePresets, defaultDialogStyle } from '../types/galgame';

interface Props {
  options: ChoiceOption[];
  customStyle?: DialogBoxStyle;
  onSelect: (id: string, customText?: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onSave?: (text: string) => void; // 保存到正文但不发送
}

const props = defineProps<Props>();

const isInputting = ref(false);
const inputText = ref('');
const selectedCustom = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

function handleOptionClick(id: string) {
  if (selectedCustom.value) {
    selectedCustom.value = false;
  }
  props.onSelect(id);
}

function handleCustomClick() {
  if (!isInputting.value) {
    isInputting.value = true;
    nextTick(() => {
      inputRef.value?.focus();
    });
  } else if (inputText.value.trim() && !selectedCustom.value) {
    selectedCustom.value = true;
  } else if (selectedCustom.value) {
    props.onSelect('custom', inputText.value);
  }
}

function handleInputConfirm() {
  if (inputText.value.trim()) {
    if (!selectedCustom.value) {
      selectedCustom.value = true;
    } else {
      props.onSelect('custom', inputText.value);
    }
  }
}

function handleSave() {
  if (inputText.value.trim() && props.onSave) {
    props.onSave(inputText.value.trim());
    // 保存后清空输入
    inputText.value = '';
    isInputting.value = false;
    selectedCustom.value = false;
  }
}

watch(
  () => props.options,
  () => {
    // 重置输入状态当选项变化时
    isInputting.value = false;
    inputText.value = '';
    selectedCustom.value = false;
  },
);

const dialogStyle = computed(() => props.customStyle || defaultDialogStyle);
const boxShape = computed(() => boxShapePresets.find(p => p.id === dialogStyle.value.boxShape) || boxShapePresets[0]);
const borderWidthPreset = computed(
  () => borderWidthPresets.find(p => p.id === dialogStyle.value.borderWidth) || borderWidthPresets[1],
);
const isPillShape = computed(() => dialogStyle.value.boxShape === 'pill');

function handleBackgroundClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const halfWidth = rect.width / 2;

  if (clickX < halfWidth) {
    // 点击左半屏，返回上一条
    props.onPrev?.();
  } else {
    // 点击右半屏，继续下一条
    props.onNext?.();
  }
}
</script>

<style scoped></style>
