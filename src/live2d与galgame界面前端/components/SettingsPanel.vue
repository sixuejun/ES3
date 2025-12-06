<template>
  <div
    class="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
  >
    <div class="relative w-[90%] max-w-lg max-h-[85vh] bg-card rounded-xl shadow-2xl overflow-hidden">
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-border">
        <h2 class="text-lg font-semibold text-foreground">设置</h2>
        <button @click="onClose" class="p-1 rounded-full hover:bg-muted transition-colors" aria-label="关闭设置">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- 内容 -->
      <div class="p-4 overflow-y-auto max-h-[calc(85vh-120px)]">
        <div class="space-y-6">
          <!-- 立绘设置 -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-foreground">立绘设置</h3>
            <div class="space-y-3">
              <div class="space-y-2">
                <label class="text-xs text-muted-foreground"
                  >大小 ({{ Math.round(spriteSettings.scale * 100) }}%)</label
                >
                <input
                  type="range"
                  :value="spriteSettings.scale"
                  @input="
                    e =>
                      updateSpriteSettings({
                        ...spriteSettings,
                        scale: parseFloat((e.target as HTMLInputElement).value),
                      })
                  "
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  class="w-full"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs text-muted-foreground">水平位置 ({{ spriteSettings.positionX }}%)</label>
                <input
                  type="range"
                  :value="spriteSettings.positionX"
                  @input="
                    e =>
                      updateSpriteSettings({
                        ...spriteSettings,
                        positionX: parseInt((e.target as HTMLInputElement).value),
                      })
                  "
                  min="0"
                  max="100"
                  step="1"
                  class="w-full"
                />
              </div>
              <div class="space-y-2">
                <label class="text-xs text-muted-foreground">垂直位置 ({{ spriteSettings.positionY }}%)</label>
                <input
                  type="range"
                  :value="spriteSettings.positionY"
                  @input="
                    e =>
                      updateSpriteSettings({
                        ...spriteSettings,
                        positionY: parseInt((e.target as HTMLInputElement).value),
                      })
                  "
                  min="0"
                  max="100"
                  step="1"
                  class="w-full"
                />
              </div>
            </div>
          </div>

          <!-- 播放设置 -->
          <div class="space-y-4">
            <h3 class="text-sm font-medium text-foreground">播放设置</h3>
            <div class="flex items-center justify-between">
              <label class="text-xs text-muted-foreground">自动播放</label>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="autoPlay"
                  @change="e => onAutoPlayChange((e.target as HTMLInputElement).checked)"
                  class="sr-only peer"
                />
                <div
                  class="w-8 h-[1.15rem] bg-input rounded-full peer peer-checked:bg-primary transition-colors relative"
                >
                  <div
                    class="absolute top-0 left-0 w-4 h-4 bg-background rounded-full transition-transform peer-checked:translate-x-[calc(100%-2px)]"
                  />
                </div>
              </label>
            </div>
            <div v-if="autoPlay" class="space-y-2 animate-in fade-in duration-200">
              <label class="text-xs text-muted-foreground">播放速度 ({{ autoPlaySpeed / 1000 }}秒)</label>
              <input
                type="range"
                :value="autoPlaySpeed"
                @input="e => onAutoPlaySpeedChange(parseInt((e.target as HTMLInputElement).value))"
                min="1000"
                max="8000"
                step="500"
                class="w-full"
              />
            </div>
          </div>

          <!-- 自定义对话框 -->
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-medium text-foreground">自定义对话框</h3>
              <label class="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  :checked="customModeEnabled"
                  @change="e => handleEnableCustomMode((e.target as HTMLInputElement).checked)"
                  class="sr-only peer"
                />
                <div
                  class="w-8 h-[1.15rem] bg-input rounded-full peer peer-checked:bg-primary transition-colors relative"
                >
                  <div
                    class="absolute top-0 left-0 w-4 h-4 bg-background rounded-full transition-transform peer-checked:translate-x-[calc(100%-2px)]"
                  />
                </div>
              </label>
            </div>

            <div v-if="customModeEnabled" class="space-y-4 animate-in fade-in duration-200">
              <!-- 实时预览与保存按钮 -->
              <div class="p-3 bg-muted/30 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs text-muted-foreground">实时预览</span>
                  <button
                    :disabled="!hasChanges"
                    :class="[
                      'h-7 px-3 text-xs rounded-md border transition-colors gap-1 flex items-center',
                      hasChanges
                        ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90'
                        : 'bg-background border-gray-200 opacity-50 cursor-not-allowed',
                    ]"
                    @click="onSaveStyle"
                  >
                    <svg v-if="hasChanges" class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <svg v-else class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    @click="activeTab = 'shapes'"
                    :class="[
                      'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all',
                      activeTab === 'shapes'
                        ? 'bg-background text-foreground shadow-sm border-input'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                  >
                    形状预设
                  </button>
                  <button
                    @click="activeTab = 'colors'"
                    :class="[
                      'inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-all',
                      activeTab === 'colors'
                        ? 'bg-background text-foreground shadow-sm border-input'
                        : 'text-muted-foreground hover:text-foreground',
                    ]"
                  >
                    颜色调整
                  </button>
                </div>

                <!-- 形状预设标签页 -->
                <div v-if="activeTab === 'shapes'" class="space-y-4">
                  <!-- 文本框形状 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">文本框形状</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in boxShapePresets"
                        :key="preset.id"
                        @click="updateShape('boxShape', preset.id)"
                        :class="[
                          'p-2 text-[10px] rounded-lg border transition-all',
                          dialogStyle.boxShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 背景图案 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">背景图案</label>
                    <div class="grid grid-cols-6 gap-2">
                      <button
                        v-for="preset in backgroundPatternPresets"
                        :key="preset.id"
                        @click="updateShape('backgroundPattern', preset.id)"
                        :class="[
                          'p-2 text-[10px] rounded-lg border transition-all',
                          dialogStyle.backgroundPattern === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 边框粗细 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">边框粗细</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in borderWidthPresets"
                        :key="preset.id"
                        @click="updateShape('borderWidth', preset.id)"
                        :class="[
                          'p-2 text-[10px] rounded-lg border transition-all',
                          dialogStyle.borderWidth === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 角色名形状 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">角色名形状</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in nameShapePresets"
                        :key="preset.id"
                        @click="updateShape('nameShape', preset.id)"
                        :class="[
                          'p-2 text-[10px] rounded-lg border transition-all',
                          dialogStyle.nameShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 箭头按钮形状 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">箭头按钮形状</label>
                    <div class="grid grid-cols-6 gap-2">
                      <button
                        v-for="preset in arrowShapePresets"
                        :key="preset.id"
                        @click="updateShape('arrowShape', preset.id)"
                        :class="[
                          'p-2 text-[10px] rounded-lg border transition-all',
                          dialogStyle.arrowShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 呼吸指示器形状 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">呼吸指示器</label>
                    <div class="grid grid-cols-5 gap-2">
                      <button
                        v-for="preset in indicatorShapePresets"
                        :key="preset.id"
                        @click="updateShape('indicatorShape', preset.id)"
                        :class="[
                          'p-2 text-[10px] rounded-lg border transition-all',
                          dialogStyle.indicatorShape === preset.id
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border hover:border-primary/50',
                        ]"
                      >
                        {{ preset.name }}
                      </button>
                    </div>
                  </div>

                  <!-- 字体大小 -->
                  <div class="space-y-2">
                    <label class="text-xs text-muted-foreground">字体大小 ({{ dialogStyle.fontSize }}px)</label>
                    <input
                      type="range"
                      :value="dialogStyle.fontSize"
                      @input="
                        e =>
                          onDialogStyleChange({
                            ...dialogStyle,
                            fontSize: parseInt((e.target as HTMLInputElement).value),
                          })
                      "
                      min="12"
                      max="24"
                      step="1"
                      class="w-full"
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

interface Props {
  onClose: () => void;
  spriteSettings: {
    scale: number;
    positionX: number;
    positionY: number;
  };
  onSpriteSettingsChange: (settings: { scale: number; positionX: number; positionY: number }) => void;
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

const hasChanges = computed(() => {
  return JSON.stringify(props.dialogStyle) !== JSON.stringify(props.currentAppliedStyle);
});

function updateSpriteSettings(settings: { scale: number; positionX: number; positionY: number }) {
  props.onSpriteSettingsChange(settings);
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
