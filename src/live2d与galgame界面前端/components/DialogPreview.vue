<template>
  <div class="flex items-center gap-1">
    <div v-if="!isInnerArrow" class="p-1">
      <div
        class="p-1 backdrop-blur-sm shadow"
        :style="{
          backgroundColor: dialogStyle.colors.arrowBackground,
          borderRadius: arrowBorderRadius.value,
        }"
      >
        <svg
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          :style="{ color: dialogStyle.colors.arrowIcon }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
        </svg>
      </div>
    </div>
    <div class="flex-1 p-2 min-h-[60px] relative" :style="boxStyle">
      <div v-if="isInnerArrow" class="absolute left-1 top-1/2 -translate-y-1/2">
        <div
          class="p-1 backdrop-blur-sm shadow"
          :style="{
            backgroundColor: dialogStyle.colors.arrowBackground,
            borderRadius: arrowBorderRadius,
          }"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            :style="{ color: dialogStyle.colors.arrowIcon }"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </div>
      </div>

      <div
        class="h-4 mb-1 flex items-start"
        :style="{
          paddingLeft: isInnerArrow ? '24px' : 0,
          paddingRight: isInnerArrow ? '24px' : 0,
        }"
      >
        <div
          class="px-2 py-0.5 text-[10px] font-medium"
          :style="{
            backgroundColor: dialogStyle.colors.nameBackground,
            color: dialogStyle.colors.nameText,
            borderRadius: nameShape.borderRadius,
            borderBottom: nameShape.style === 'underline' ? `2px solid ${dialogStyle.colors.nameText}` : undefined,
            boxShadow: nameShape.style === 'floating' ? '0 2px 8px rgba(0,0,0,0.1)' : undefined,
          }"
        >
          角色名
        </div>
      </div>

      <p
        class="text-[10px] leading-relaxed"
        :style="{
          color: dialogStyle.colors.dialogText,
          fontSize: `${dialogStyle.fontSize}px`,
          paddingLeft: isInnerArrow ? '24px' : 0,
          paddingRight: isInnerArrow ? '24px' : 0,
        }"
      >
        这是预览文本示例...
      </p>

      <div class="absolute bottom-1.5 right-2">
        <component :is="indicatorComponent" />
      </div>

      <div v-if="isInnerArrow" class="absolute right-1 top-1/2 -translate-y-1/2">
        <div
          class="p-1 backdrop-blur-sm shadow"
          :style="{
            backgroundColor: dialogStyle.colors.arrowBackground,
            borderRadius: arrowBorderRadius,
          }"
        >
          <svg
            class="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            :style="{ color: dialogStyle.colors.arrowIcon }"
          >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </div>
    <div v-if="!isInnerArrow" class="p-1">
      <div
        class="p-1 backdrop-blur-sm shadow"
        :style="{
          backgroundColor: dialogStyle.colors.arrowBackground,
          borderRadius: arrowBorderRadius.value,
        }"
      >
        <svg
          class="w-3 h-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          :style="{ color: dialogStyle.colors.arrowIcon }"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, h, type VNode } from 'vue';
import type { DialogBoxStyle } from '../types/galgame';
import {
  arrowShapePresets,
  backgroundPatternPresets,
  borderWidthPresets,
  boxShapePresets,
  indicatorShapePresets,
  nameShapePresets,
} from '../types/galgame';

// HSL 转换函数（用于预览）
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

interface Props {
  style: DialogBoxStyle;
}

const props = defineProps<Props>();

// 使用 computed 确保响应式更新
const dialogStyle = computed(() => props.style);
const boxShape = computed(() => boxShapePresets.find(p => p.id === dialogStyle.value.boxShape) || boxShapePresets[0]);
const nameShape = computed(
  () => nameShapePresets.find(p => p.id === dialogStyle.value.nameShape) || nameShapePresets[0],
);
const arrowShape = computed(
  () => arrowShapePresets.find(p => p.id === dialogStyle.value.arrowShape) || arrowShapePresets[0],
);
const indicatorShape = computed(
  () => indicatorShapePresets.find(p => p.id === dialogStyle.value.indicatorShape) || indicatorShapePresets[0],
);
const borderWidth = computed(
  () => borderWidthPresets.find(p => p.id === dialogStyle.value.borderWidth) || borderWidthPresets[1],
);
const bgPattern = computed(() => backgroundPatternPresets.find(p => p.id === dialogStyle.value.backgroundPattern));

const isInnerArrow = computed(() => arrowShape.value.isInner);
const isMinimalArrow = computed(() => arrowShape.value.type === 'minimal');
const isPillShape = computed(() => dialogStyle.value.boxShape === 'pill');

const arrowBorderRadius = computed(() => {
  if (arrowShape.value.type === 'square' || arrowShape.value.type === 'inner-square') return '4px';
  if (arrowShape.value.type === 'pill') return '12px';
  return '9999px';
});

const getPatternStyle = computed((): Record<string, string> => {
  if (!bgPattern.value?.pattern) return {};

  const borderColorForPattern = dialogStyle.value.colors.boxBorder.replace(/[\d.]+\)$/, '0.08)');
  const patternWithColor = bgPattern.value.pattern.replace(/VAR_BORDER_COLOR/g, borderColorForPattern);

  let backgroundSize = '20px 20px';
  if (bgPattern.value.id === 'dots') backgroundSize = '16px 16px';
  if (bgPattern.value.id === 'diamonds') backgroundSize = '16px 16px';
  if (bgPattern.value.id === 'stripes') backgroundSize = '28px 28px';

  return {
    backgroundImage: patternWithColor,
    backgroundSize,
  };
});

const boxStyle = computed((): Record<string, string> => {
  return {
    backgroundColor: isPillShape.value ? 'rgba(255,255,255,0.7)' : dialogStyle.value.colors.boxBackground,
    borderRadius: boxShape.value.borderRadius,
    borderTopWidth: borderWidth.value.width,
    borderLeftWidth: borderWidth.value.width,
    borderRightWidth: borderWidth.value.width,
    borderBottomWidth: borderWidth.value.width,
    borderStyle: 'solid',
    borderColor: dialogStyle.value.colors.boxBorder,
    boxShadow: boxShape.value.shadow,
    ...(isPillShape.value ? { backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } : {}),
    ...getPatternStyle.value,
  };
});

const indicatorComponent = computed((): VNode | null => {
  const { type } = indicatorShape.value;
  const color = dialogStyle.value.colors.indicatorColor;

  if (type === 'none') return null;

  if (type === 'dots') {
    return h(
      'div',
      { class: 'flex gap-0.5 items-center' },
      [0, 1, 2].map(i =>
        h('span', {
          key: i,
          class: 'w-1 h-1 rounded-full',
          style: { backgroundColor: color, opacity: i === 2 ? 1 : 0.4 },
        }),
      ),
    );
  }

  if (type === 'diamonds') {
    return h(
      'div',
      { class: 'flex gap-0.5 items-center' },
      [0, 1, 2].map(i =>
        h('span', {
          key: i,
          style: {
            width: '8px',
            height: '8px',
            backgroundColor: color,
            opacity: i === 2 ? 1 : 0.3 + i * 0.15,
            transform: 'rotate(45deg)',
            display: 'inline-block',
          },
        }),
      ),
    );
  }

  if (type === 'pulse') {
    return h('div', { class: 'relative w-2 h-2' }, [
      h('span', {
        class: 'absolute inset-0 rounded-full',
        style: { backgroundColor: color },
      }),
    ]);
  }

  if (type === 'arrow') {
    return h(
      'svg',
      {
        class: 'w-3 h-3',
        style: { color },
        fill: 'none',
        stroke: 'currentColor',
        viewBox: '0 0 24 24',
      },
      [
        h('path', {
          'stroke-linecap': 'round',
          'stroke-linejoin': 'round',
          'stroke-width': '2',
          d: 'M9 5l7 7-7 7',
        }),
      ],
    );
  }

  return null;
});
</script>

<style scoped></style>
