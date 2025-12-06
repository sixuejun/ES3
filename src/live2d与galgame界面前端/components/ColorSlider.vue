<template>
  <div class="space-y-1.5">
    <div class="flex items-center justify-between">
      <label class="text-muted-foreground text-xs">{{ label }}</label>
      <div class="flex items-center gap-2">
        <input
          v-model="hexInput"
          type="text"
          class="bg-background text-foreground w-20 rounded border px-2 py-0.5 font-mono text-xs"
          placeholder="#000000"
          @input="handleHexInput"
          @blur="handleHexBlur"
        />
        <div class="border-border h-6 w-6 rounded border shadow-sm" :style="{ backgroundColor: value }" />
      </div>
    </div>

    <div v-for="slider in sliders" :key="slider.key" class="flex items-center gap-2">
      <span class="text-muted-foreground w-5 text-[10px]">{{ slider.label }}</span>
      <div
        :ref="el => (trackRefs[slider.key] = el as HTMLDivElement | null)"
        class="relative flex h-6 flex-1 cursor-pointer touch-none items-center"
        @pointerdown="e => handlePointerDown(e, slider)"
        @pointermove="e => handlePointerMove(e, slider)"
        @pointerup="e => handlePointerUp(e, slider)"
      >
        <div class="absolute inset-y-2 right-0 left-0 rounded-full" :style="{ background: slider.gradient }" />
        <div
          class="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white shadow-md"
          :style="{
            left: `calc(${((slider.currentValue - slider.min) / (slider.max - slider.min)) * 100}% - 8px)`,
            background: slider.thumbColor,
          }"
        />
      </div>
      <span class="text-muted-foreground w-9 text-right text-[10px]">{{ slider.displayValue }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

interface Props {
  label: string;
  value: string;
  showAlpha?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  showAlpha: true,
});

const emit = defineEmits<{
  'update:value': [value: string];
}>();

// HSL 转换函数
function hexToHsl(hex: string): { h: number; s: number; l: number; a: number } {
  let r = 0,
    g = 0,
    b = 0,
    a = 1;

  if (hex.startsWith('rgba')) {
    const match = hex.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      r = Number.parseInt(match[1]) / 255;
      g = Number.parseInt(match[2]) / 255;
      b = Number.parseInt(match[3]) / 255;
      a = match[4] ? Number.parseFloat(match[4]) : 1;
    }
  } else if (hex.startsWith('rgb')) {
    const match = hex.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (match) {
      r = Number.parseInt(match[1]) / 255;
      g = Number.parseInt(match[2]) / 255;
      b = Number.parseInt(match[3]) / 255;
    }
  } else if (hex.startsWith('#')) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    if (result) {
      r = Number.parseInt(result[1], 16) / 255;
      g = Number.parseInt(result[2], 16) / 255;
      b = Number.parseInt(result[3], 16) / 255;
      a = result[4] ? Number.parseInt(result[4], 16) / 255 : 1;
    }
  }

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a };
}

function hslToRgba(h: number, s: number, l: number, a: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const r = Math.round(255 * f(0));
  const g = Math.round(255 * f(8));
  const b = Math.round(255 * f(4));
  return a < 1
    ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
    : `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

function rgbaToHex(rgba: string): string {
  if (rgba.startsWith('#')) return rgba.slice(0, 7).toUpperCase();
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (match) {
    const r = Number.parseInt(match[1]).toString(16).padStart(2, '0');
    const g = Number.parseInt(match[2]).toString(16).padStart(2, '0');
    const b = Number.parseInt(match[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`.toUpperCase();
  }
  return '#000000';
}

const hsl = computed(() => hexToHsl(props.value));
const hexDisplay = computed(() => rgbaToHex(props.value));
const hexInput = ref(hexDisplay.value);
const localHsl = ref(hsl.value);
const isDraggingRef = ref(false);
const trackRefs: Record<string, HTMLDivElement | null> = {};
const draggingSlider = ref<string | null>(null);
const globalMoveHandler = ref<((e: PointerEvent) => void) | null>(null);
const globalUpHandler = ref<(() => void) | null>(null);

// 当外部值变化且不在拖动时，自动同步滑块位置
watch(
  () => props.value,
  () => {
    if (!isDraggingRef.value) {
      const newHsl = hexToHsl(props.value);
      localHsl.value = newHsl;
      hexInput.value = hexDisplay.value;
    }
  },
);

const sliders = computed(() => {
  const result = [
    {
      key: 'h',
      label: 'H',
      min: 0,
      max: 360,
      currentValue: localHsl.value.h,
      gradient: 'linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)',
      step: 1,
      thumbColor: `hsl(${localHsl.value.h}, 100%, 50%)`,
      displayValue: `${Math.round(localHsl.value.h)}°`,
    },
    {
      key: 's',
      label: 'S',
      min: 0,
      max: 100,
      currentValue: localHsl.value.s,
      gradient: `linear-gradient(to right, hsl(${localHsl.value.h}, 0%, ${localHsl.value.l}%), hsl(${localHsl.value.h}, 100%, ${localHsl.value.l}%))`,
      step: 1,
      thumbColor: hslToRgba(localHsl.value.h, localHsl.value.s, localHsl.value.l, 1),
      displayValue: `${Math.round(localHsl.value.s)}%`,
    },
    {
      key: 'l',
      label: 'L',
      min: 0,
      max: 100,
      currentValue: localHsl.value.l,
      gradient: `linear-gradient(to right, #000, hsl(${localHsl.value.h}, ${localHsl.value.s}%, 50%), #fff)`,
      step: 1,
      thumbColor: hslToRgba(localHsl.value.h, localHsl.value.s, localHsl.value.l, 1),
      displayValue: `${Math.round(localHsl.value.l)}%`,
    },
  ];

  if (props.showAlpha) {
    result.push({
      key: 'a',
      label: 'A',
      min: 0,
      max: 1,
      currentValue: localHsl.value.a,
      gradient: `linear-gradient(to right, transparent, ${hslToRgba(localHsl.value.h, localHsl.value.s, localHsl.value.l, 1)})`,
      step: 0.01,
      thumbColor: hslToRgba(localHsl.value.h, localHsl.value.s, localHsl.value.l, localHsl.value.a),
      displayValue: `${Math.round(localHsl.value.a * 100)}%`,
    });
  }

  return result;
});

// 更新本地HSL值（拖动时实时更新预览，但不提交最终值）
function updateLocalValue(e: PointerEvent, slider: (typeof sliders.value)[0]) {
  const track = trackRefs[slider.key];
  if (!track) return;
  const rect = track.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const ratio = x / rect.width;
  const val = slider.min + ratio * (slider.max - slider.min);
  const finalVal = slider.step < 1 ? Math.round(val * 100) / 100 : Math.round(val);

  // 更新本地状态（实时更新滑块位置）
  localHsl.value = { ...localHsl.value, [slider.key]: finalVal };

  // 实时触发预览更新（拖动时实时更新预览，但不提交最终值）
  const newValue = hslToRgba(localHsl.value.h, localHsl.value.s, localHsl.value.l, localHsl.value.a);
  emit('update:value', newValue);
}

// 最终提交值（拖动结束时）
function commitChange() {
  if (isDraggingRef.value) {
    // 最终提交当前值（确保值已同步）
    const finalValue = hslToRgba(localHsl.value.h, localHsl.value.s, localHsl.value.l, localHsl.value.a);
    emit('update:value', finalValue);
    isDraggingRef.value = false;
  }
}

function handlePointerDown(e: PointerEvent, slider: (typeof sliders.value)[0]) {
  isDraggingRef.value = true;
  draggingSlider.value = slider.key;

  // 使用 setPointerCapture 确保拖动时不会丢失焦点
  (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

  // 初始化更新
  updateLocalValue(e, slider);

  // 添加全局事件监听以确保拖动时能继续响应
  const handleGlobalMove = (ev: PointerEvent) => {
    if (draggingSlider.value === slider.key && isDraggingRef.value) {
      updateLocalValue(ev, slider);
    }
  };

  const handleGlobalUp = () => {
    if (draggingSlider.value === slider.key) {
      commitChange();
      draggingSlider.value = null;

      // 清理事件监听
      if (globalMoveHandler.value) {
        document.removeEventListener('pointermove', globalMoveHandler.value);
      }
      if (globalUpHandler.value) {
        document.removeEventListener('pointerup', globalUpHandler.value);
      }

      // 释放指针捕获
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    }
  };

  globalMoveHandler.value = handleGlobalMove;
  globalUpHandler.value = handleGlobalUp;

  document.addEventListener('pointermove', handleGlobalMove);
  document.addEventListener('pointerup', handleGlobalUp);
}

function handlePointerMove(e: PointerEvent, slider: (typeof sliders.value)[0]) {
  if (draggingSlider.value === slider.key && isDraggingRef.value) {
    updateLocalValue(e, slider);
  }
}

function handlePointerUp(e: PointerEvent, slider: (typeof sliders.value)[0]) {
  if (draggingSlider.value === slider.key) {
    commitChange();
    draggingSlider.value = null;

    // 释放指针捕获
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }
}

function handleHexInput(e: Event) {
  const input = (e.target as HTMLInputElement).value.toUpperCase();
  hexInput.value = input;
  if (/^#[0-9A-F]{6}$/.test(input)) {
    const newHsl = hexToHsl(input);
    newHsl.a = localHsl.value.a;
    localHsl.value = newHsl;
    emit('update:value', hslToRgba(newHsl.h, newHsl.s, newHsl.l, newHsl.a));
  }
}

function handleHexBlur() {
  hexInput.value = rgbaToHex(props.value);
}
</script>

<style scoped>
input[type='text'] {
  font-family: monospace;
}
</style>
