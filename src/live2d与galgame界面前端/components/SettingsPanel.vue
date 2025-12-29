<template>
  <div
    class="animate-in fade-in absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm duration-200"
  >
    <div class="bg-card relative max-h-[85vh] w-[90%] max-w-lg overflow-hidden rounded-2xl shadow-2xl">
      <!-- 头部 -->
      <div class="border-border flex items-center justify-between border-b p-4">
        <h2 class="text-foreground text-lg font-semibold">设置</h2>
        <button class="hover:bg-muted rounded-full p-1 transition-colors" aria-label="关闭设置" @click="onClose">
          <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="settings-scroll-container max-h-[calc(85vh-120px)] overflow-y-auto p-4">
        <div class="space-y-6">
          <!-- 用户称呼设置 -->
          <div class="space-y-4">
            <h3 class="text-foreground text-sm font-medium">用户称呼</h3>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs">你想让我称呼你为……？</label>
                <input
                  type="text"
                  :value="userDisplayName"
                  placeholder="请输入你的称呼"
                  class="border-border bg-background text-foreground w-full rounded-lg border px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-primary focus:ring-primary focus:ring-1 focus:outline-none"
                  @input="e => updateUserDisplayName((e.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </div>

          <!-- 立绘设置（静态图片） -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-foreground text-sm font-medium">立绘设置</h3>
                <p class="text-muted-foreground text-xs">调整静态立绘图片的显示效果</p>
              </div>
              <div class="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded transition-colors',
                    spritePositionMode === 'left'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="spritePositionMode = 'left'"
                >
                  左
                </button>
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded transition-colors',
                    spritePositionMode === 'single'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="spritePositionMode = 'single'"
                >
                  默认
                </button>
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded transition-colors',
                    spritePositionMode === 'right'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="spritePositionMode = 'right'"
                >
                  右
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs"
                  >大小 ({{ Math.round(currentSpriteSettings.scale * 100) }}%)</label
                >
                <input
                  type="range"
                  :value="currentSpriteSettings.scale"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  class="w-full"
                  @input="
                    e =>
                      updateSpriteSettings({
                        ...props.spriteSettings,
                        [spritePositionMode]: {
                          ...currentSpriteSettings,
                          scale: parseFloat((e.target as HTMLInputElement).value),
                        },
                      })
                  "
                />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs"
                  >水平位置 ({{ currentSpriteSettings.positionX }}%)</label
                >
                <input
                  type="range"
                  :value="currentSpriteSettings.positionX"
                  min="0"
                  max="100"
                  step="1"
                  class="w-full"
                  @input="
                    e =>
                      updateSpriteSettings({
                        ...props.spriteSettings,
                        [spritePositionMode]: {
                          ...currentSpriteSettings,
                          positionX: parseInt((e.target as HTMLInputElement).value),
                        },
                      })
                  "
                />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs"
                  >垂直位置 ({{ currentSpriteSettings.positionY }}%)</label
                >
                <input
                  type="range"
                  :value="currentSpriteSettings.positionY"
                  min="0"
                  max="200"
                  step="1"
                  class="w-full"
                  @input="
                    e =>
                      updateSpriteSettings({
                        ...props.spriteSettings,
                        [spritePositionMode]: {
                          ...currentSpriteSettings,
                          positionY: parseInt((e.target as HTMLInputElement).value),
                        },
                      })
                  "
                />
              </div>
            </div>
          </div>

          <!-- Live2D 模型设置 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <h3 class="text-foreground text-sm font-medium">Live2D 模型设置</h3>
                <p class="text-muted-foreground text-xs">调整 Live2D 动态模型的显示效果</p>
              </div>
              <div class="flex items-center gap-1 rounded-lg border border-border bg-background p-1">
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded transition-colors',
                    live2dPositionMode === 'left'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="live2dPositionMode = 'left'"
                >
                  左
                </button>
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded transition-colors',
                    live2dPositionMode === 'single'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="live2dPositionMode = 'single'"
                >
                  默认
                </button>
                <button
                  :class="[
                    'px-2 py-1 text-xs rounded transition-colors',
                    live2dPositionMode === 'right'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  ]"
                  @click="live2dPositionMode = 'right'"
                >
                  右
                </button>
              </div>
            </div>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs"
                  >大小 ({{ Math.round(currentLive2dSettings.scale * 100) }}%)</label
                >
                <input
                  type="range"
                  :value="currentLive2dSettings.scale"
                  min="0"
                  max="2"
                  step="0.05"
                  class="w-full"
                  @input="
                    e =>
                      updateLive2dSettings({
                        ...props.live2dSettings,
                        [live2dPositionMode]: {
                          ...currentLive2dSettings,
                          scale: parseFloat((e.target as HTMLInputElement).value),
                        },
                      })
                  "
                />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs"
                  >水平位置 ({{ currentLive2dSettings.positionX }}%)</label
                >
                <input
                  type="range"
                  :value="currentLive2dSettings.positionX"
                  min="0"
                  max="100"
                  step="1"
                  class="w-full"
                  @input="
                    e =>
                      updateLive2dSettings({
                        ...props.live2dSettings,
                        [live2dPositionMode]: {
                          ...currentLive2dSettings,
                          positionX: parseInt((e.target as HTMLInputElement).value),
                        },
                      })
                  "
                />
              </div>
              <div class="space-y-2">
                <label class="text-muted-foreground text-xs"
                  >垂直位置 ({{ currentLive2dSettings.positionY }}%)</label
                >
                <input
                  type="range"
                  :value="currentLive2dSettings.positionY"
                  min="0"
                  max="150"
                  step="1"
                  class="w-full"
                  @input="
                    e =>
                      updateLive2dSettings({
                        ...props.live2dSettings,
                        [live2dPositionMode]: {
                          ...currentLive2dSettings,
                          positionY: parseInt((e.target as HTMLInputElement).value),
                        },
                      })
                  "
                />
              </div>
            </div>
          </div>

          <!-- 播放设置 -->
          <div class="space-y-4">
            <h3 class="text-foreground text-sm font-medium">播放设置</h3>
            <div class="flex items-center justify-between">
              <label class="text-muted-foreground text-xs">自动播放</label>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  :checked="autoPlay"
                  class="peer sr-only"
                  @change="e => onAutoPlayChange((e.target as HTMLInputElement).checked)"
                />
                <div
                  class="bg-input peer relative h-[1.15rem] w-8 rounded-full transition-colors peer-checked:bg-primary"
                >
                  <div
                    class="bg-background absolute top-0 left-0 h-4 w-4 rounded-full transition-transform peer-checked:translate-x-[calc(100%-2px)]"
                  />
                </div>
              </label>
            </div>
            <div v-if="autoPlay" class="animate-in fade-in space-y-2 duration-200">
              <label class="text-muted-foreground text-xs">播放速度 ({{ autoPlaySpeed / 1000 }}秒)</label>
              <input
                type="range"
                :value="autoPlaySpeed"
                min="1000"
                max="8000"
                step="500"
                class="w-full"
                @input="e => onAutoPlaySpeedChange(parseInt((e.target as HTMLInputElement).value))"
              />
            </div>
          </div>

          <!-- 自定义对话框 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-foreground text-sm font-medium">自定义对话框</h3>
              <label class="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  :checked="customModeEnabled"
                  class="peer sr-only"
                  @change="e => handleEnableCustomMode((e.target as HTMLInputElement).checked)"
                />
                <div
                  class="bg-input peer relative h-[1.15rem] w-8 rounded-full transition-colors peer-checked:bg-primary"
                >
                  <div
                    class="bg-background absolute top-0 left-0 h-4 w-4 rounded-full transition-transform peer-checked:translate-x-[calc(100%-2px)]"
                  />
                </div>
              </label>
            </div>

            <div v-if="customModeEnabled" class="animate-in fade-in space-y-4 duration-200">
              <!-- 实时预览与保存按钮 -->
              <div class="bg-muted/30 rounded-lg p-3">
                <div class="mb-2 flex items-center justify-between">
                  <span class="text-muted-foreground text-xs">实时预览</span>
                  <button
                    :disabled="!hasChanges"
                    :class="[
                      'flex h-7 items-center gap-1 rounded-md border px-3 text-xs transition-colors',
                      hasChanges
                        ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                        : 'bg-background cursor-not-allowed border-gray-200 opacity-50',
                    ]"
                    @click="onSaveStyle"
                  >
                    <svg v-if="hasChanges" class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <svg v-else class="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                    </svg>
                    {{ hasChanges ? '保存应用' : '已保存' }}
                  </button>
                </div>
                <div class="px-6">
                  <DialogPreview :style="dialogStyle" />
                </div>
              </div>

              <!-- 标签页 -->
              <div class="space-y-4">
                <div
                  class="bg-muted text-muted-foreground inline-flex h-9 w-full items-center justify-center rounded-lg p-[3px]"
                >
                  <button
                    :class="[
                      'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all',
                      activeTab === 'shapes'
                        ? 'bg-background text-foreground border-input shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                    @click="activeTab = 'shapes'"
                  >
                    形状预设
                  </button>
                  <button
                    :class="[
                      'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all',
                      activeTab === 'colors'
                        ? 'bg-background text-foreground border-input shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                    @click="activeTab = 'colors'"
                  >
                    颜色调整
                  </button>
                </div>

                <!-- 形状预设标签页 -->
                <div v-if="activeTab === 'shapes'" class="space-y-4">
                  <!-- 文本框形状 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">文本框形状</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in boxShapePresets"
                        :key="preset.id"
                        :class="[
                          'rounded-lg border p-2 text-[10px] transition-all',
                          dialogStyle.boxShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                        @click="updateShape('boxShape', preset.id)"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 背景图案 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">背景图案</label>
                    <div class="grid grid-cols-6 gap-2">
                      <button
                        v-for="preset in backgroundPatternPresets"
                        :key="preset.id"
                        :class="[
                          'rounded-lg border p-2 text-[10px] transition-all',
                          dialogStyle.backgroundPattern === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                        @click="updateShape('backgroundPattern', preset.id)"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 边框粗细 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">边框粗细</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in borderWidthPresets"
                        :key="preset.id"
                        :class="[
                          'rounded-lg border p-2 text-[10px] transition-all',
                          dialogStyle.borderWidth === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                        @click="updateShape('borderWidth', preset.id)"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 角色名形状 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">角色名形状</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in nameShapePresets"
                        :key="preset.id"
                        :class="[
                          'rounded-lg border p-2 text-[10px] transition-all',
                          dialogStyle.nameShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                        @click="updateShape('nameShape', preset.id)"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 箭头按钮形状 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">箭头按钮形状</label>
                    <div class="grid grid-cols-6 gap-2">
                      <button
                        v-for="preset in arrowShapePresets"
                        :key="preset.id"
                        :class="[
                          'rounded-lg border p-2 text-[10px] transition-all',
                          dialogStyle.arrowShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                        @click="updateShape('arrowShape', preset.id)"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 呼吸指示器形状 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">呼吸指示器</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in indicatorShapePresets"
                        :key="preset.id"
                        :class="[
                          'rounded-lg border p-2 text-[10px] transition-all',
                          dialogStyle.indicatorShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                        @click="updateShape('indicatorShape', preset.id)"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 字体大小 -->
                  <div class="space-y-2">
                    <label class="text-muted-foreground text-xs">字体大小 ({{ dialogStyle.fontSize }}px)</label>
                    <input
                      type="range"
                      :value="dialogStyle.fontSize"
                      min="12"
                      max="24"
                      step="1"
                      class="w-full"
                      @input="
                        e =>
                          onDialogStyleChange({
                            ...dialogStyle,
                            fontSize: parseInt((e.target as HTMLInputElement).value),
                          })
                      "
                    />
                  </div>
                </div>

                <!-- 颜色调整标签页 -->
                <div v-if="activeTab === 'colors'" class="space-y-4">
                  <ColorSlider
                    label="文本框背景"
                    :value="dialogStyle.colors.boxBackground"
                    @update:value="v => updateColor('boxBackground', v)"
                  />
                  <ColorSlider
                    label="文本框边框"
                    :value="dialogStyle.colors.boxBorder"
                    @update:value="v => updateColor('boxBorder', v)"
                  />
                  <ColorSlider
                    label="角色名背景"
                    :value="dialogStyle.colors.nameBackground"
                    @update:value="v => updateColor('nameBackground', v)"
                  />
                  <ColorSlider
                    label="角色名文字"
                    :value="dialogStyle.colors.nameText"
                    :show-alpha="false"
                    @update:value="v => updateColor('nameText', v)"
                  />
                  <ColorSlider
                    label="对话文字"
                    :value="dialogStyle.colors.dialogText"
                    :show-alpha="false"
                    @update:value="v => updateColor('dialogText', v)"
                  />
                  <ColorSlider
                    label="旁白文字"
                    :value="dialogStyle.colors.narrationText"
                    :show-alpha="false"
                    @update:value="v => updateColor('narrationText', v)"
                  />
                  <ColorSlider
                    label="箭头背景"
                    :value="dialogStyle.colors.arrowBackground"
                    @update:value="v => updateColor('arrowBackground', v)"
                  />
                  <ColorSlider
                    label="箭头图标"
                    :value="dialogStyle.colors.arrowIcon"
                    :show-alpha="false"
                    @update:value="v => updateColor('arrowIcon', v)"
                  />
                  <ColorSlider
                    label="指示器颜色"
                    :value="dialogStyle.colors.indicatorColor"
                    @update:value="v => updateColor('indicatorColor', v)"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { DialogBoxStyle } from '../types/galgame';
import {
  arrowShapePresets,
  backgroundPatternPresets,
  borderWidthPresets,
  boxShapePresets,
  indicatorShapePresets,
  nameShapePresets,
} from '../types/galgame';
import ColorSlider from './ColorSlider.vue';
import DialogPreview from './DialogPreview.vue';

type PositionMode = 'left' | 'right' | 'single';
interface CharacterSettings {
  left: { scale: number; positionX: number; positionY: number };
  right: { scale: number; positionX: number; positionY: number };
  single: { scale: number; positionX: number; positionY: number };
}

interface Props {
  onClose: () => void;
  userDisplayName: string;
  onUserDisplayNameChange: (name: string) => void;
  spriteSettings: CharacterSettings;
  onSpriteSettingsChange: (settings: CharacterSettings) => void;
  live2dSettings: CharacterSettings;
  onLive2dSettingsChange: (settings: CharacterSettings) => void;
  autoPlay: boolean;
  onAutoPlayChange: (autoPlay: boolean) => void;
  autoPlaySpeed: number;
  onAutoPlaySpeedChange: (speed: number) => void;
  dialogStyle: DialogBoxStyle;
  onDialogStyleChange: (style: DialogBoxStyle) => void;
  onSaveStyle: () => void;
  currentAppliedStyle: DialogBoxStyle;
  customModeEnabled: boolean;
  onCustomModeChange: (enabled: boolean) => void;
}

const props = defineProps<Props>();

const activeTab = ref<'shapes' | 'colors'>('shapes');

// 位置模式切换器状态
const spritePositionMode = ref<PositionMode>('single');
const live2dPositionMode = ref<PositionMode>('single');

// 获取当前模式的设置，带有防御性检查
const currentSpriteSettings = computed(() => {
  const mode = spritePositionMode.value;
  if (!props.spriteSettings || typeof props.spriteSettings !== 'object') {
    return { scale: 1.0, positionX: 30, positionY: 50 };
  }
  const settings = props.spriteSettings[mode];
  if (!settings || typeof settings !== 'object' || typeof settings.scale !== 'number') {
    // 如果数据格式不正确，返回默认值
    return { scale: 1.0, positionX: 30, positionY: 50 };
  }
  return settings;
});

const currentLive2dSettings = computed(() => {
  const mode = live2dPositionMode.value;
  if (!props.live2dSettings || typeof props.live2dSettings !== 'object') {
    return { scale: 1.0, positionX: 30, positionY: 50 };
  }
  const settings = props.live2dSettings[mode];
  if (!settings || typeof settings !== 'object' || typeof settings.scale !== 'number') {
    // 如果数据格式不正确，返回默认值
    return { scale: 1.0, positionX: 30, positionY: 50 };
  }
  return settings;
});

const hasChanges = computed(() => {
  return JSON.stringify(props.dialogStyle) !== JSON.stringify(props.currentAppliedStyle);
});

function updateUserDisplayName(name: string) {
  props.onUserDisplayNameChange(name);
}

function updateSpriteSettings(settings: CharacterSettings) {
  props.onSpriteSettingsChange(settings);
}

function updateLive2dSettings(settings: CharacterSettings) {
  props.onLive2dSettingsChange(settings);
}

function updateShape(key: keyof DialogBoxStyle, value: string) {
  props.onDialogStyleChange({ ...props.dialogStyle, [key]: value });
}

function updateColor(key: keyof DialogBoxStyle['colors'], value: string) {
  props.onDialogStyleChange({
    ...props.dialogStyle,
    colors: { ...props.dialogStyle.colors, [key]: value },
  });
}

function handleEnableCustomMode(enabled: boolean) {
  props.onCustomModeChange(enabled);
  if (enabled) {
    // 同步当前正文样式到预览
    props.onDialogStyleChange(props.currentAppliedStyle);
  }
}
</script>

<style scoped>
/* 设置滚动容器 - 隐藏滚动条但保持滚动功能 */
.settings-scroll-container {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.settings-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

input[type='range'] {
  -webkit-appearance: none;
  appearance: none;
  height: 6px;
  background: var(--muted);
  border-radius: 9999px;
  outline: none;
}

input[type='range']::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--primary);
  border-radius: 9999px;
  cursor: pointer;
}

input[type='range']::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--primary);
  border-radius: 9999px;
  cursor: pointer;
  border: none;
}
</style>
