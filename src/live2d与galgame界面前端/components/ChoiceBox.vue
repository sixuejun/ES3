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
          <!-- 发送按钮 -->
          <button
            v-if="inputText.trim()"
            class="p-1 transition-colors hover:opacity-80"
            :style="{ color: dialogStyle.colors.nameText }"
            aria-label="发送"
            @click.stop="handleInputConfirm"
          >
            <svg
              class="h-5 w-5"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
            >
              <path
                d="M1023.200312 43.682936L877.057399 920.640375c-1.899258 10.995705-8.096837 19.592347-18.292854 25.689965-5.29793 2.898868-11.295588 4.598204-17.693089 4.598204-4.19836 0-8.796564-0.99961-13.69465-2.898868l-236.707536-96.762202c-12.994924-5.29793-27.889106-1.499414-36.785631 9.296368l-123.251855 150.341273c-6.897306 8.796564-16.293635 13.094885-27.989066 13.094885-4.898087 0-9.096447-0.799688-12.695041-2.299102-7.197189-2.698946-12.994924-6.997267-17.393206-13.394768-4.398282-6.29754-6.697384-13.194846-6.697384-20.891839V811.083171c0-14.794221 5.098009-28.988676 14.394377-40.484186l478.912925-587.070676-602.864506 521.796174c-4.598204 3.898477-10.995705 4.998048-16.493557 2.698945L23.390863 619.358063C9.296369 614.060133 1.599375 603.664194 0.599766 587.870363c-0.799688-15.194065 5.29793-26.489652 18.292854-33.786802L968.921515 5.997657c5.797735-3.498633 11.795392-5.098009 18.292854-5.098008 7.696993 0 14.594299 2.199141 20.691918 6.397501 12.695041 8.996486 17.593128 21.291683 15.294025 36.385786z"
              ></path>
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
  } else if (inputText.value.trim()) {
    // 直接发送，不需要先选中再点击
    props.onSelect('custom', inputText.value);
  }
}

function handleInputConfirm() {
  if (inputText.value.trim()) {
    // 直接发送，不需要先选中再点击
    props.onSelect('custom', inputText.value);
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
    // 选项演出单元：只支持左半屏回溯，选择前无法前进
    props.onPrev?.();
  }
  // 右半屏点击不做任何操作，强制用户做出选择
}
</script>

<style scoped></style>
