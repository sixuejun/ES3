<template>
  <div
    ref="containerRef"
    class="relative w-full overflow-hidden select-none"
    :style="containerStyle"
    style="background: transparent"
  >
    <!-- 背景 -->
    <div
      class="absolute inset-0 bg-center bg-no-repeat"
      :style="{
        backgroundImage: backgroundImage ? `url('${backgroundImage}')` : undefined,
        backgroundColor: 'transparent',
        backgroundSize: backgroundImage ? 'cover' : undefined,
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        objectFit: 'cover',
      }"
    />

    <!-- 绿色清新滤镜叠加 -->
    <div class="bg-primary/5 absolute inset-0" />

    <!-- 角色立绘 -->
    <CharacterSprite
      :scale="spriteSettings.scale"
      :position-x="spriteSettings.positionX"
      :position-y="spriteSettings.positionY"
      :sprite-type="currentSpriteType"
      :image-url="currentImageUrl"
      :live2d-model-id="currentLive2dModelId"
      :live2d-models="live2dModels"
      :motion="currentDialogue?.motion"
      :expression="currentDialogue?.expression"
    />

    <!-- CG图片（CG模式） -->
    <div
      v-if="currentDialogue?.isCG && currentDialogue.cgImageUrl"
      class="absolute inset-0 z-5 bg-cover bg-center"
      :style="{
        backgroundImage: `url('${currentDialogue.cgImageUrl}')`,
      }"
    />

    <!-- 左上角角色按钮 -->
    <div class="absolute top-4 left-4 z-50 flex flex-col items-start gap-2">
      <!-- 角色按钮 -->
      <button
        :class="[
          'bg-card/80 text-foreground flex items-center gap-2 rounded-full p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-card',
          characterMenuExpanded ? 'pr-4' : '',
        ]"
        aria-label="角色"
        @click.stop="handleCharacterClick"
      >
        <!-- 小人图标 SVG -->
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span v-if="characterMenuExpanded" class="animate-in fade-in slide-in-from-left-2 text-sm duration-200"
          >角色</span
        >
      </button>

      <!-- 展开的输入按钮 -->
      <button
        v-if="characterMenuExpanded"
        class="bg-card/80 text-foreground animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-full p-2 pr-4 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-card"
        style="animation-delay: 50ms"
        aria-label="输入"
        @click.stop="handleInputClick"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
          />
        </svg>
        <span class="text-sm">输入</span>
      </button>
    </div>

    <!-- 右上角菜单按钮 -->
    <div class="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
      <!-- 齿轮按钮 -->
      <button
        :class="[
          'bg-card/80 text-foreground flex items-center gap-2 rounded-full p-2 shadow-lg backdrop-blur-sm transition-all hover:bg-card',
          menuExpanded ? 'pr-4' : '',
        ]"
        aria-label="设置"
        @click="handleSettingsClick"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span v-if="menuExpanded" class="animate-in fade-in slide-in-from-left-2 text-sm duration-200">设置</span>
      </button>

      <!-- 展开的全屏按钮 -->
      <button
        v-if="menuExpanded"
        class="bg-card/80 text-foreground animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-full p-2 pr-4 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-card"
        :aria-label="isFullscreen ? '退出全屏' : '全屏'"
        @click="toggleFullscreen"
      >
        <svg v-if="isFullscreen" class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25"
          />
        </svg>
        <svg v-else class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
          />
        </svg>
        <span class="text-sm">{{ isFullscreen ? '退出全屏' : '全屏' }}</span>
      </button>

      <!-- 历史按钮 -->
      <button
        v-if="menuExpanded"
        class="bg-card/80 text-foreground animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-full p-2 pr-4 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-card"
        style="animation-delay: 50ms"
        aria-label="历史"
        @click="handleHistory"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <span class="text-sm">历史</span>
      </button>
    </div>

    <!-- 点击区域 -->
    <div class="absolute inset-0 z-10 cursor-pointer" @click="handleClick" />

    <!-- 点击其他区域收起菜单 -->
    <div
      v-if="menuExpanded || characterMenuExpanded"
      class="absolute inset-0 z-40"
      @click="
        menuExpanded = false;
        characterMenuExpanded = false;
      "
    />

    <!-- 黑屏转场 -->
    <div
      :class="[
        'absolute inset-0 z-30 flex items-center justify-center bg-black transition-opacity duration-1000',
        blackScreen ? 'opacity-100' : 'pointer-events-none opacity-0',
      ]"
      @click="handleBlackScreenClick"
    >
      <p class="animate-in fade-in px-8 text-center text-xl leading-relaxed text-white duration-1000 md:text-2xl">
        {{ blackScreenText }}
      </p>
      <!-- 左右箭头指示区域 -->
      <template v-if="blackScreen">
        <div class="absolute top-1/2 left-6 -translate-y-1/2 text-white/40 transition-colors hover:text-white/60">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </div>
        <div class="absolute top-1/2 right-6 -translate-y-1/2 text-white/40 transition-colors hover:text-white/60">
          <svg class="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </template>
    </div>

    <!-- 选项框 -->
    <ChoiceBox
      v-if="showChoices && currentDialogue?.options"
      :options="currentDialogue.options"
      :custom-style="dialogStyle"
      :on-select="handleChoiceSelect"
      :on-prev="prevDialogue"
      :on-next="() => nextDialogue()"
      :on-save="handleSaveToStory"
    />

    <!-- 对话框 -->
    <DialogBox
      v-if="
        !blackScreen &&
        !showChoices &&
        currentDialogue &&
        currentDialogue.type !== 'blackscreen' &&
        currentDialogue.type !== 'choice' &&
        getDisplayText()
      "
      :character="currentDialogue.character || ''"
      :text="getDisplayText()"
      :is-last-dialogue="currentDialogIndex >= dialogues.length - 1"
      :is-first-dialogue="currentDialogIndex === 0"
      :on-prev="prevDialogue"
      :on-next="nextDialogue"
      :dialog-key="currentDialogIndex"
      :custom-style="dialogStyle"
      :is-loading="isStreaming && streamingMessageId === currentDialogue.message_id"
      :streaming-text="isStreaming && streamingMessageId === currentDialogue.message_id ? streamingText : undefined"
      :is-through="currentDialogue.isThrough"
      :is-editable="currentDialogue.isEditable"
      :message-id="currentDialogue.message_id"
      :on-edit="handleEditUserMessage"
      :on-delete="handleDeleteUserMessage"
    />

    <!-- 设置面板 -->
    <SettingsPanel
      v-if="showSettings"
      :on-close="() => (showSettings = false)"
      :sprite-settings="spriteSettings"
      :on-sprite-settings-change="s => (spriteSettings = s)"
      :auto-play="autoPlay"
      :on-auto-play-change="v => (autoPlay = v)"
      :auto-play-speed="autoPlaySpeed"
      :on-auto-play-speed-change="v => (autoPlaySpeed = v)"
      :dialog-style="previewStyle"
      :on-dialog-style-change="s => (previewStyle = s)"
      :on-save-style="handleSaveStyle"
      :current-applied-style="dialogStyle"
      :custom-mode-enabled="customModeEnabled"
      :on-custom-mode-change="v => (customModeEnabled = v)"
    />

    <!-- 角色状态栏 -->
    <CharacterStatusPanel
      :show="showCharacterPanel"
      :message-id="currentDialogue?.message_id"
      :status-block="currentDialogue?.statusBlock"
      :on-close="() => (showCharacterPanel = false)"
    />

    <!-- 历史对话框 -->
    <div
      v-if="showHistoryDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showHistoryDialog = false"
    >
      <div
        class="bg-card/95 text-foreground relative max-h-[85vh] w-[90%] max-w-3xl rounded-lg shadow-2xl backdrop-blur-md"
      >
        <!-- 标题栏 -->
        <div class="border-border/30 flex items-center justify-between border-b px-6 py-3">
          <h2 class="text-lg font-medium">对话历史</h2>
          <button
            class="hover:bg-muted rounded-full p-1 transition-colors"
            aria-label="关闭"
            @click="showHistoryDialog = false"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- 历史消息列表 -->
        <div class="history-scroll-container max-h-[calc(85vh-100px)] overflow-y-auto px-6 py-2">
          <div v-if="historyMessages.length === 0" class="text-muted-foreground py-12 text-center text-sm">
            暂无历史消息
          </div>
          <template v-for="(msg, msgIndex) in historyMessages" :key="msg.id">
            <template v-for="(item, itemIndex) in msg.items" :key="`${msg.id}-${itemIndex}`">
              <div
                class="history-message-item group relative cursor-pointer rounded px-3 py-2 transition-all"
                @click="jumpToHistoryMessage(msg.id)"
              >
                <!-- 角色对话 -->
                <div
                  v-if="item.type === 'character' || item.type === 'user'"
                  class="leading-relaxed"
                  :style="{
                    color: dialogStyle.colors.dialogText,
                    fontSize: `${dialogStyle.fontSize}px`,
                  }"
                >
                  <span class="font-medium">{{ item.character }}：</span>
                  <span v-html="formatUserText(item.text)"></span>
                </div>
                <!-- 旁白 -->
                <div
                  v-else-if="item.type === 'narration'"
                  class="ml-6 leading-relaxed italic"
                  :style="{
                    color: dialogStyle.colors.narrationText,
                    fontSize: `${dialogStyle.fontSize}px`,
                  }"
                >
                  {{ item.text }}
                </div>
                <!-- 黑屏文字 -->
                <div
                  v-else-if="item.type === 'blacktext'"
                  class="ml-6 leading-relaxed italic opacity-70"
                  :style="{
                    color: dialogStyle.colors.narrationText,
                    fontSize: `${dialogStyle.fontSize}px`,
                  }"
                >
                  {{ item.text }}
                </div>
                <!-- 选项（以用户发言格式显示） -->
                <div
                  v-else-if="item.type === 'choice'"
                  class="leading-relaxed"
                  :style="{
                    color: dialogStyle.colors.dialogText,
                    fontSize: `${dialogStyle.fontSize}px`,
                  }"
                >
                  <span class="font-medium">你：</span>
                  <span>{{ item.text }}</span>
                </div>
                <!-- 分隔线（只在hover时显示） -->
                <div
                  v-if="itemIndex < msg.items.length - 1 || msgIndex < historyMessages.length - 1"
                  class="bg-border/30 absolute right-3 bottom-0 left-3 h-px opacity-0 transition-opacity group-hover:opacity-100"
                ></div>
              </div>
            </template>
          </template>
        </div>
      </div>
    </div>

    <!-- 输入框（屏幕中央） -->
    <div
      v-if="showInputBox"
      class="absolute inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
      @click="() => (showInputBox = false)"
    >
      <div
        class="relative mx-4 w-full max-w-lg p-4"
        :style="{
          backgroundColor:
            dialogStyle.boxShape === 'pill' ? 'rgba(255, 255, 255, 0.85)' : dialogStyle.colors.boxBackground,
          borderRadius: '16px',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: dialogStyle.colors.boxBorder,
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          backdropFilter: dialogStyle.boxShape === 'pill' ? 'blur(12px)' : undefined,
        }"
        @click.stop
      >
        <!-- 关闭按钮 -->
        <button
          class="absolute top-2 right-2 rounded-full p-1 transition-colors hover:bg-black/5"
          @click="() => (showInputBox = false)"
        >
          <svg class="text-muted-foreground h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <!-- 角色名标签 -->
        <div
          class="mb-3 inline-block px-3 py-1 text-sm font-medium"
          :style="{
            backgroundColor: dialogStyle.colors.nameBackground,
            color: dialogStyle.colors.nameText,
            borderRadius: '6px',
          }"
        >
          你
        </div>

        <!-- 输入区域 -->
        <div class="flex items-center gap-3">
          <input
            ref="inputRef"
            v-model="inputText"
            type="text"
            placeholder="输入你想说的话..."
            class="flex-1 bg-transparent text-base outline-none"
            :style="{ color: dialogStyle.colors.dialogText }"
            @keydown.enter="handleSendInput"
            @keydown.escape="() => (showInputBox = false)"
          />
          <!-- 保存按钮 -->
          <button
            v-if="inputText.trim()"
            class="p-1 transition-colors hover:opacity-80"
            :style="{ color: dialogStyle.colors.nameText }"
            aria-label="保存到正文"
            title="保存到正文（不发送）"
            @click.stop="handleSaveInput"
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
          <!-- 发送按钮 -->
          <button
            v-if="inputText.trim()"
            class="p-1 transition-colors hover:opacity-80"
            :style="{ color: dialogStyle.colors.nameText }"
            aria-label="发送"
            @click.stop="handleSendInput"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import type { ChoiceOption, DialogBoxStyle, DialogueItem } from '../types/galgame';
import { defaultDialogStyle } from '../types/galgame';
import {
  hasMotionAndExpression,
  loadWorldbookResources,
  parseMessageBlocks,
  parseStatusBlock,
} from '../utils/messageParser';
import CharacterSprite from './CharacterSprite.vue';
import CharacterStatusPanel from './CharacterStatusPanel.vue';
import ChoiceBox from './ChoiceBox.vue';
import DialogBox from './DialogBox.vue';
import SettingsPanel from './SettingsPanel.vue';

// 常量：localStorage 键名
const STORAGE_KEYS = {
  DIALOG_STYLE: 'galgame_dialog_style',
  SPRITE_SETTINGS: 'galgame_sprite_settings',
} as const;

const containerRef = ref<HTMLDivElement | null>(null);
const autoPlayTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

// 对话数据 - 使用 shallowRef 优化性能（数组元素变化时需要整体替换）
const dialogues = shallowRef<DialogueItem[]>([]);
const currentDialogIndex = ref(0);
const currentDialogue = computed(() => dialogues.value[currentDialogIndex.value] || null);

// UI 状态
const showSettings = ref(false);
const isFullscreen = ref(false);
const autoPlay = ref(false);
const autoPlaySpeed = ref(3000);
const menuExpanded = ref(false);
const characterMenuExpanded = ref(false);
const showCharacterPanel = ref(false);
const blackScreen = ref(false);
const blackScreenText = ref('');
const showChoices = ref(false);
const customModeEnabled = ref(false);
const showInputBox = ref(false);
const inputText = ref('');
const inputRef = ref<HTMLInputElement | null>(null);

// 流式界面状态
const isStreaming = ref(false);
const streamingText = ref('');
const streamingMessageId = ref<number | null>(null);

// 样式设置 - 从 localStorage 加载
const spriteSettings = ref(
  loadFromStorage(STORAGE_KEYS.SPRITE_SETTINGS, {
    scale: 1,
    positionX: 50,
    positionY: 50,
  }),
);
const dialogStyle = ref<DialogBoxStyle>(loadFromStorage(STORAGE_KEYS.DIALOG_STYLE, defaultDialogStyle));
const previewStyle = ref<DialogBoxStyle>({ ...dialogStyle.value });

// Live2D 模型数据 - 使用 shallowRef（模型配置不需要深层响应式）
const live2dModels = shallowRef<any[]>([]);

// 工具函数：从 localStorage 加载数据
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      return JSON.parse(stored) as T;
    }
  } catch (e) {
    console.warn(`从 localStorage 加载 ${key} 失败:`, e);
  }
  return defaultValue;
}

// 工具函数：保存数据到 localStorage
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.warn(`保存到 localStorage ${key} 失败:`, e);
  }
}

// 监听样式变化并保存到 localStorage
watch(
  dialogStyle,
  newStyle => {
    saveToStorage(STORAGE_KEYS.DIALOG_STYLE, newStyle);
  },
  { deep: true },
);

watch(
  spriteSettings,
  newSettings => {
    saveToStorage(STORAGE_KEYS.SPRITE_SETTINGS, newSettings);
  },
  { deep: true },
);

// 容器样式 - 横屏显示，等比例缩放（适配iframe）
// 遵循前端界面规则：使用 width 和 aspect-ratio，禁止使用 vh 等受宿主高度影响的单位
const containerStyle = computed(() => {
  const isPortrait = window.innerHeight > window.innerWidth;
  const isFullscreenMode = !!document.fullscreenElement;
  const targetAspectRatio = 16 / 9;

  if (isPortrait && isFullscreenMode) {
    // 全屏且竖屏时，旋转90度显示横屏
    // 在全屏模式下，以屏幕高度作为容器宽度，保持16:9比例
    // 使用 width 和 aspect-ratio 来定义尺寸（符合iframe适配要求）
    const screenHeight = window.innerHeight; // 竖屏时的高度，旋转后作为宽度

    return {
      width: `${screenHeight}px`,
      aspectRatio: '16 / 9',
      transform: 'rotate(90deg)',
      transformOrigin: 'center center',
      position: 'absolute' as const,
      left: '50%',
      top: '50%',
      marginLeft: `-${screenHeight / 2}px`,
      marginTop: `-${screenHeight / targetAspectRatio / 2}px`,
      background: 'transparent',
    };
  }

  // 横屏或非全屏竖屏时正常显示（使用 width 和 aspect-ratio）
  // 不需要额外的缩放计算，让 CSS 自动处理
  return {
    width: '100%',
    aspectRatio: '16 / 9',
    margin: '0 auto',
    background: 'transparent',
  };
});

// 背景图片
const backgroundImage = computed(() => {
  const dialogue = currentDialogue.value;
  // 优先使用从世界书匹配到的场景图片URL
  if (dialogue?.sceneImageUrl) {
    return dialogue.sceneImageUrl;
  }
  // 其次使用scene（可能是URL或文本描述）
  if (dialogue?.scene) {
    // 如果scene看起来像URL，直接使用
    if (dialogue.scene.match(/^https?:\/\//) || dialogue.scene.match(/^\//)) {
      return dialogue.scene;
    }
  }
  // 否则使用默认背景
  return null;
});

// 当前立绘配置
const currentSpriteType = computed<'live2d' | 'image' | 'none'>(() => {
  const dialogue = currentDialogue.value;
  if (dialogue?.sprite?.type) {
    return dialogue.sprite.type;
  }
  // CG模式不显示立绘
  if (dialogue?.isCG || dialogue?.type === 'cg') {
    return 'none';
  }
  // 默认：如果有角色名且匹配到 Live2D 模型，使用 Live2D；否则使用图片
  if (dialogue?.character) {
    const hasLive2d = live2dModels.value.some(m => m.name === dialogue.character);
    return hasLive2d ? 'live2d' : 'image';
  }
  return 'image';
});

const currentImageUrl = computed(() => {
  const dialogue = currentDialogue.value;
  return dialogue?.sprite?.imageUrl || '/placeholder-user.jpg';
});

const currentLive2dModelId = computed(() => {
  const dialogue = currentDialogue.value;
  if (dialogue?.sprite?.live2dModelId) {
    return dialogue.sprite.live2dModelId;
  }
  // 自动匹配：根据角色名查找模型
  if (dialogue?.character) {
    const model = live2dModels.value.find(m => m.name === dialogue.character);
    return model?.id;
  }
  return undefined;
});

// 用户消息编辑状态（内存中）
const userMessageEdits = ref<Map<number, { text?: string; deleted?: boolean }>>(new Map());

// 从酒馆读取对话数据
async function loadDialoguesFromTavern() {
  try {
    const messages = getChatMessages('0-{{lastMessageId}}');
    const newDialogues: DialogueItem[] = [];
    let lastScene: string | undefined; // 用于场景继承
    let lastSceneImageUrl: string | undefined; // 上一次解析到的背景图，用于避免重复场景闪动
    let lastSpriteState: DialogueItem['sprite'] | undefined; // 上一次角色立绘/Live2D 状态
    let lastMotion: string | undefined; // 上一次 Live2D 动作
    let lastExpression: string | undefined; // 上一次 Live2D 表情

    // 继承背景，避免同一场景切换时闪动
    const inheritSceneAndBackground = (dialogue: DialogueItem) => {
      if (!dialogue.scene && lastScene) {
        dialogue.scene = lastScene;
      }
      if (
        !dialogue.sceneImageUrl &&
        lastSceneImageUrl &&
        (!dialogue.scene || (lastScene && dialogue.scene === lastScene))
      ) {
        dialogue.sceneImageUrl = lastSceneImageUrl;
      }
    };

    // 继承角色立绘/Live2D 状态（仅非黑屏时需要显示）
    const inheritSpriteState = (dialogue: DialogueItem) => {
      if (dialogue.type === 'blackscreen') return;
      if (lastSpriteState) {
        dialogue.sprite = { ...lastSpriteState };
      }
      if (!dialogue.motion && lastMotion) {
        dialogue.motion = lastMotion;
      }
      if (!dialogue.expression && lastExpression) {
        dialogue.expression = lastExpression;
      }
    };

    // 更新场景状态（背景沿用同一份引用可减少闪动）
    const updateSceneState = (dialogue: DialogueItem) => {
      if (dialogue.type === 'blackscreen') return;
      if (dialogue.scene) {
        lastScene = dialogue.scene;
      }
      if (dialogue.sceneImageUrl) {
        lastSceneImageUrl = dialogue.sceneImageUrl;
      }
    };

    // 仅在新角色块出现时更新立绘/Live2D 状态
    const updateSpriteStateFromCharacter = (dialogue: DialogueItem) => {
      lastSpriteState = dialogue.sprite ? { ...dialogue.sprite } : undefined;
      lastMotion = dialogue.motion;
      lastExpression = dialogue.expression;
    };

    // 处理每条消息
    for (const msg of messages) {
      const messageText = msg.message || '';

      // 解析消息块（传入上一行的场景用于继承）
      const blocks = await parseMessageBlocks(messageText, lastScene);

      // 如果没有解析到块，不显示该消息（它很可能不属于我们的剧情文本）
      // StatusBlock 位于 <content> 之外，只用于状态栏显示，不创建对话项
      if (blocks.length === 0) {
        continue;
      }

      // 解析StatusBlock（用于状态栏显示，不作为对话项）
      const statusBlock = parseStatusBlock(messageText);

      // 收集新格式的选项块（[[choice||选项1||角色名||台词]]）
      const newFormatChoiceBlocks: Array<{
        choiceText: string;
        choiceCharacter: string;
        choiceResponse: string;
      }> = [];
      const oldFormatChoiceBlocks: Array<{ choices: string[] }> = [];

      // 先遍历所有块，收集选项块
      for (const block of blocks) {
        if (block.type === 'choice') {
          if (block.choiceText && block.choiceCharacter && block.choiceResponse) {
            // 新格式
            newFormatChoiceBlocks.push({
              choiceText: block.choiceText,
              choiceCharacter: block.choiceCharacter,
              choiceResponse: block.choiceResponse,
            });
          } else if (block.choices && block.choices.length > 0) {
            // 旧格式
            oldFormatChoiceBlocks.push({ choices: block.choices });
          }
        }
      }

      // 处理每个解析到的块
      for (const block of blocks) {
        if (block.type === 'character') {
          const motionToUse = block.motionFile || block.motion;
          const expressionToUse = block.expressionFile || block.expression;

          // 检查是否有motion和expression
          const hasMotionExpr = hasMotionAndExpression(
            block.character || '',
            motionToUse,
            expressionToUse,
            live2dModels.value,
          );

          // 如果是CG模式或没有motion/expression，进入CG模式
          const isCGMode = block.isCG || !hasMotionExpr;
          const live2dModel = live2dModels.value.find(m => m.name === block.character);

          const dialogue: DialogueItem = {
            character: block.character,
            text: block.text || '',
            message_id: msg.message_id,
            role: 'assistant',
            type: isCGMode ? 'cg' : undefined,
            scene: block.scene,
            sceneImageUrl: block.sceneImageUrl, // 从世界书匹配到的背景图片URL
            motion: motionToUse,
            expression: expressionToUse,
            // 不再设置 isThrough，因为只有*星号包裹*的部分应该是灰色，不是整行
            isCG: isCGMode,
            cgImageUrl: isCGMode ? block.cgImageUrl || block.scene : undefined, // 优先使用从世界书匹配到的CG URL
            statusBlock,
            sprite: isCGMode
              ? { type: 'none' } // CG模式不显示立绘
              : {
                  type: live2dModel ? 'live2d' : 'image',
                  live2dModelId: live2dModel?.id,
                  imageUrl: block.spriteImageUrl || msg.extra?.sprite_image || undefined,
                },
          };

          inheritSceneAndBackground(dialogue);
          newDialogues.push(dialogue);
          updateSceneState(dialogue);
          updateSpriteStateFromCharacter(dialogue);
        } else if (block.type === 'narration') {
          const dialogue: DialogueItem = {
            character: '',
            text: block.message || '',
            type: 'narration',
            message_id: msg.message_id,
            role: 'system',
            scene: block.scene,
            sceneImageUrl: block.sceneImageUrl, // 从世界书匹配到的背景图片URL
            statusBlock,
          };

          inheritSceneAndBackground(dialogue);
          inheritSpriteState(dialogue);
          newDialogues.push(dialogue);
          updateSceneState(dialogue);
        } else if (block.type === 'blacktext') {
          newDialogues.push({
            character: '',
            text: block.message || '',
            type: 'blackscreen',
            message_id: msg.message_id,
            role: 'system',
            statusBlock,
          });
        } else if (block.type === 'user') {
          const dialogue: DialogueItem = {
            character: '你',
            text: block.message || '',
            type: 'user',
            message_id: msg.message_id,
            role: 'user',
            scene: block.scene,
            sceneImageUrl: block.sceneImageUrl, // 从世界书匹配到的背景图片URL
            isEditable: true,
            // 不再设置 isThrough，因为只有*星号包裹*的部分应该是灰色，不是整行
            statusBlock,
          };

          inheritSceneAndBackground(dialogue);
          inheritSpriteState(dialogue);
          // 应用编辑（如果有）
          const edit = userMessageEdits.value.get(msg.message_id);
          if (edit) {
            if (edit.deleted) {
              dialogue.isDeleted = true;
            } else if (edit.text !== undefined) {
              dialogue.editedText = edit.text;
              dialogue.text = edit.text;
            }
          }

          newDialogues.push(dialogue);
          updateSceneState(dialogue);
        } else if (block.type === 'choice') {
          // 跳过，稍后统一处理
        }
      }

      // 处理选项块：区分两种格式
      if (newFormatChoiceBlocks.length > 0) {
        // 格式1：带角色回复的选项（继续剧情演出）
        // 收集所有选项到一个 choice 对话中
        const choiceDialogue: DialogueItem = {
          character: '',
          text: '',
          type: 'choice',
          message_id: msg.message_id,
          role: 'system',
          options: newFormatChoiceBlocks.map((choiceBlock, index) => ({
            id: `choice_${index}`,
            text: choiceBlock.choiceText,
            character: choiceBlock.choiceCharacter,
            response: choiceBlock.choiceResponse,
          })),
          statusBlock,
        };

        inheritSceneAndBackground(choiceDialogue);
        inheritSpriteState(choiceDialogue);
        newDialogues.push(choiceDialogue);
        updateSceneState(choiceDialogue);
      } else if (oldFormatChoiceBlocks.length > 0) {
        // 格式2：纯选项列表（触发AI生成）
        // 合并所有选项块
        const allChoices: string[] = [];
        for (const choiceBlock of oldFormatChoiceBlocks) {
          allChoices.push(...choiceBlock.choices);
        }
        const choiceDialogue: DialogueItem = {
          character: '',
          text: '',
          type: 'choice',
          message_id: msg.message_id,
          role: 'system',
          options: allChoices.map((choice, index) => ({
            id: `choice_${index}`,
            text: choice,
          })),
          statusBlock,
        };

        inheritSceneAndBackground(choiceDialogue);
        inheritSpriteState(choiceDialogue);
        newDialogues.push(choiceDialogue);
        updateSceneState(choiceDialogue);
      }
    }

    // 过滤已删除的消息
    const filteredDialogues = newDialogues.filter(d => !d.isDeleted);
    dialogues.value = filteredDialogues;

    // 如果有新对话，自动跳转到最新
    if (filteredDialogues.length > 0 && currentDialogIndex.value < filteredDialogues.length - 1) {
      currentDialogIndex.value = filteredDialogues.length - 1;
    }

    console.info(`加载了 ${dialogues.value.length} 条对话`);

    // 如果没有对话数据，使用测试数据
    if (dialogues.value.length === 0) {
      loadTestDialogues();
    }
  } catch (error) {
    console.error('加载对话数据失败:', error);
    // 使用测试数据
    loadTestDialogues();
  }
}

// 加载测试对话数据
function loadTestDialogues() {
  console.info('使用测试对话数据');
  dialogues.value = [
    {
      character: '小雪',
      text: '你好啊，欢迎来到这个 Galgame 风格的对话界面！',
      type: undefined,
      scene: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop',
      sprite: { type: 'image' as const, imageUrl: '/placeholder-user.jpg' },
    },
    {
      character: '小雪',
      text: '这是一个支持多种演出效果的界面，包括角色对话、旁白、黑屏转场和选项选择。',
      isThrough: false,
    },
    {
      character: '',
      text: '这是一段旁白文字，用于描述场景或补充说明。旁白会以斜体居中显示。',
      type: 'narration' as const,
    },
    {
      character: '小雪',
      text: '*through* 这是一段内心独白，使用了 through 格式，会以浅灰色斜体显示。',
      isThrough: true,
    },
    {
      character: '',
      text: '时间悄然流逝...',
      type: 'blackscreen' as const,
    },
    {
      character: '小雪',
      text: '你可以通过点击右上角的齿轮图标打开设置面板，自定义对话框的样式和颜色。',
    },
    {
      character: '小雪',
      text: '现在，请选择你想要做的事情：',
    },
    {
      character: '',
      text: '',
      type: 'choice' as const,
      options: [
        { id: 'opt1', text: '查看设置选项' },
        { id: 'opt2', text: '继续对话' },
        { id: 'opt3', text: '了解更多功能' },
      ],
    },
    {
      character: '小雪',
      text: '感谢你的选择！这个界面还支持 Live2D 模型显示，不过需要先在角色卡变量中配置模型。',
    },
    {
      character: '小雪',
      text: '你还可以点击左上角的角色按钮，查看角色状态栏和小剧场。',
    },
    {
      character: '',
      text: '测试对话到此结束。在实际使用时，对话数据会从酒馆消息中自动读取。',
      type: 'narration' as const,
    },
  ];
}

// 加载 Live2D 模型配置
async function loadLive2dModels() {
  try {
    const modelsMap = new Map<string, any>();

    // 1. 先从角色卡变量读取基础配置
    const variables = getVariables({ type: 'character' }) || {};
    if (variables?.live2d_models && Array.isArray(variables.live2d_models)) {
      for (const model of variables.live2d_models) {
        if (model.name) {
          modelsMap.set(model.name, { ...model });
        }
      }
    }

    // 2. 从世界书读取模型资源，合并 defaultAnimation 等配置
    try {
      const resources = await loadWorldbookResources();
      for (const [modelName, modelData] of resources.models.entries()) {
        const existingModel = modelsMap.get(modelName);
        if (existingModel) {
          // 合并 defaultAnimation 等配置
          if (modelData.defaultAnimation) {
            existingModel.defaultAnimation = modelData.defaultAnimation;
          }
          // 如果世界书中有更新的文件路径，也可以更新
          if (modelData.files) {
            // 更新文件路径（如果世界书中的路径更新）
            if (modelData.files.model3) {
              existingModel.modelPath = modelData.files.model3.split('/').pop() || existingModel.modelPath;
              // 更新 basePath
              const basePath = modelData.files.model3.substring(0, modelData.files.model3.lastIndexOf('/') + 1);
              existingModel.basePath = basePath || existingModel.basePath;
            }
            if (modelData.files.textures) {
              existingModel.textures = modelData.files.textures;
            }
          }
          // 更新 motions 和 expressions（如果世界书中的更完整）
          if (modelData.motions && modelData.motions.length > 0) {
            existingModel.motions = modelData.motions.map(m => ({
              group: m.group || 'idle',
              name: m.name,
              file: m.file,
            }));
          }
          if (modelData.expressions && modelData.expressions.length > 0) {
            existingModel.expressions = modelData.expressions.map(e => e.name || e.file);
          }
        } else {
          // 如果角色卡变量中没有该模型，但世界书中有，创建基础配置
          // 这种情况下通常不会发生，因为模型应该先在角色卡变量中定义
          console.warn(`世界书中找到模型 ${modelName}，但角色卡变量中未找到对应配置`);
        }
      }
    } catch (error) {
      console.warn('从世界书加载模型资源失败:', error);
    }

    live2dModels.value = Array.from(modelsMap.values());
    console.info(`加载了 ${live2dModels.value.length} 个 Live2D 模型配置（已合并世界书资源）`);
  } catch (error) {
    console.error('加载 Live2D 模型配置失败:', error);
  }
}

function nextDialogue(skipBlackscreen = false) {
  if (currentDialogIndex.value < dialogues.value.length - 1) {
    const nextIndex = currentDialogIndex.value + 1;
    currentDialogIndex.value = nextIndex;
    if (skipBlackscreen) {
      blackScreen.value = false;
    }
    showChoices.value = false;
  }
}

function prevDialogue() {
  if (currentDialogIndex.value > 0) {
    currentDialogIndex.value--;
    showChoices.value = false;
  }
}

// 监听当前对话变化，处理黑屏和选项
watch(
  () => [currentDialogIndex.value, currentDialogue.value],
  () => {
    const dialogue = currentDialogue.value;
    if (!dialogue) return;

    // 如果切换到的对话不是正在流式加载的消息，清除流式状态
    if (streamingMessageId.value !== null && dialogue.message_id !== streamingMessageId.value) {
      isStreaming.value = false;
      streamingText.value = '';
      streamingMessageId.value = null;
    }

    if (dialogue.type === 'blackscreen') {
      blackScreenText.value = dialogue.text;
      blackScreen.value = true;
      showChoices.value = false;
    } else if (dialogue.type === 'choice') {
      showChoices.value = true;
      blackScreen.value = false;
    } else {
      blackScreen.value = false;
      showChoices.value = false;
    }
  },
  { immediate: true },
);

// 自动播放逻辑
watch(
  () => [autoPlay.value, autoPlaySpeed.value, currentDialogIndex.value, showChoices.value, currentDialogue.value],
  () => {
    if (autoPlayTimerRef.value) {
      clearTimeout(autoPlayTimerRef.value);
      autoPlayTimerRef.value = null;
    }

    if (autoPlay.value && currentDialogIndex.value < dialogues.value.length - 1 && !showChoices.value) {
      const dialogue = currentDialogue.value;
      const delay = dialogue?.type === 'blackscreen' ? autoPlaySpeed.value + 2000 : autoPlaySpeed.value;
      autoPlayTimerRef.value = setTimeout(() => {
        nextDialogue();
      }, delay);
    }
  },
  { immediate: true },
);

// 全屏切换
async function toggleFullscreen() {
  try {
    if (!document.fullscreenElement && containerRef.value) {
      // 如果是竖屏，请求横屏方向
      if (window.innerHeight > window.innerWidth) {
        // 尝试锁定屏幕方向（需要用户手势触发）
        if (screen.orientation && 'lock' in screen.orientation) {
          try {
            await (screen.orientation as any).lock('landscape');
          } catch (e) {
            console.warn('无法锁定屏幕方向:', e);
          }
        }
      }
      await containerRef.value.requestFullscreen();
      isFullscreen.value = true;
    } else {
      await document.exitFullscreen();
      isFullscreen.value = false;
      // 退出全屏时解锁屏幕方向
      if (screen.orientation && 'unlock' in screen.orientation) {
        try {
          (screen.orientation as any).unlock();
        } catch (e) {
          // 忽略错误
        }
      }
    }
    menuExpanded.value = false;
  } catch (error) {
    console.error('全屏切换失败:', error);
  }
}

// 监听全屏变化和窗口大小变化
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement;
  // 触发容器样式重新计算
  nextTick(() => {
    // 强制更新
  });
};

// 监听窗口大小变化，更新容器样式
const handleResize = () => {
  // 触发响应式更新（containerStyle 是 computed，会自动更新）
  nextTick(() => {
    // 强制触发重新渲染
  });
};

// 事件监听器清理函数集合
const eventCleanups: Array<() => void> = [];

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

  // 初始化时强制触发一次尺寸更新，确保容器样式正确
  nextTick(() => {
    handleResize();
  });

  // 加载数据
  loadLive2dModels();
  loadDialoguesFromTavern();

  // 监听聊天消息变化
  if (typeof eventOn === 'function' && typeof tavern_events !== 'undefined') {
    // 监听新消息
    const messageReceivedCleanup = eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId: number) => {
      await loadDialoguesFromTavern();
      // 自动跳转到最新消息
      if (autoPlay.value) {
        currentDialogIndex.value = dialogues.value.length - 1;
      }
      // 如果收到的消息ID与正在流式加载的消息ID匹配，清除流式状态
      if (streamingMessageId.value === messageId) {
        isStreaming.value = false;
        streamingText.value = '';
        streamingMessageId.value = null;
      }
    });
    if (messageReceivedCleanup) {
      eventCleanups.push(() => messageReceivedCleanup.stop());
    }

    // 监听消息更新
    const messageUpdatedCleanup = eventOn(tavern_events.MESSAGE_UPDATED, async () => {
      await loadDialoguesFromTavern();
      // 如果当前正在流式加载的消息已更新，停止流式状态
      if (streamingMessageId.value !== null) {
        const updatedMessage = dialogues.value.find(d => d.message_id === streamingMessageId.value);
        if (updatedMessage && updatedMessage.text === streamingText.value) {
          isStreaming.value = false;
          streamingText.value = '';
          streamingMessageId.value = null;
        }
      }
    });
    if (messageUpdatedCleanup) {
      eventCleanups.push(() => messageUpdatedCleanup.stop());
    }

    // 监听聊天切换
    const chatChangedCleanup = eventOn(tavern_events.CHAT_CHANGED, () => {
      loadDialoguesFromTavern();
      currentDialogIndex.value = 0;
      isStreaming.value = false;
      streamingText.value = '';
      streamingMessageId.value = null;
    });
    if (chatChangedCleanup) {
      eventCleanups.push(() => chatChangedCleanup.stop());
    }

    // 监听流式token
    const streamTokenCleanup = eventOn(tavern_events.STREAM_TOKEN_RECEIVED, (text: string) => {
      handleStreamToken(text);
    });
    if (streamTokenCleanup) {
      eventCleanups.push(() => streamTokenCleanup.stop());
    }
  }
});

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange);
  window.removeEventListener('resize', handleResize);
  window.removeEventListener('orientationchange', handleResize);
  if (autoPlayTimerRef.value) {
    clearTimeout(autoPlayTimerRef.value);
    autoPlayTimerRef.value = null;
  }
  // 清理所有事件监听器
  eventCleanups.forEach(cleanup => cleanup());
  eventCleanups.length = 0;
});

function handleBlackScreenClick(e: MouseEvent) {
  const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const halfWidth = rect.width / 2;

  if (clickX < halfWidth) {
    if (currentDialogIndex.value > 0) {
      currentDialogIndex.value--;
      blackScreen.value = false;
    }
  } else {
    nextDialogue(true);
  }
}

function handleClick() {
  if (!showSettings.value && !menuExpanded.value && !showChoices.value) {
    if (!blackScreen.value) {
      nextDialogue();
    }
  }
}

/**
 * 裁剪消息文本，在 </content> 标签之前停止
 */
function trimMessageBeforeContentTag(messageText: string): string {
  // 查找 </content> 标签的位置
  const contentEndIndex = messageText.indexOf('</content>');
  if (contentEndIndex !== -1) {
    // 如果在 </content> 之前，返回截取的内容（包含 </content>）
    return messageText.substring(0, contentEndIndex + 10); // 10 是 '</content>' 的长度
  }
  // 如果没有找到 </content>，返回原文本
  return messageText;
}

// 保存到正文但不发送（不刷新界面）
async function handleSaveToStory(text: string) {
  try {
    // 获取当前消息ID
    const currentMessageId = getCurrentMessageId();
    const chat_message = getChatMessages(currentMessageId)[0];

    if (!chat_message) {
      console.warn('无法获取当前消息');
      return;
    }

    // 获取当前场景（从当前对话继承）
    const currentScene = currentDialogue.value?.scene || '{{scene}}';

    // 将文本添加到消息正文中（使用新格式，继承场景）
    const newMessage = chat_message.message + '\n\n[[user||场景：' + currentScene + '||台词：' + text + ']]';

    // 使用 setChatMessages 更新消息（不刷新界面）
    await setChatMessages(
      [
        {
          message_id: currentMessageId,
          message: newMessage,
        },
      ],
      { refresh: 'none' }, // 不刷新界面
    );

    // 在本地对话列表中添加用户消息（不重新加载）
    const newDialogue: DialogueItem = {
      character: '你',
      text,
      type: 'user',
      isEditable: true,
      message_id: getLastMessageId() + 1, // 临时ID
    };

    const newDialogues = [...dialogues.value];
    newDialogues.splice(currentDialogIndex.value + 1, 0, newDialogue);
    dialogues.value = newDialogues;

    // 移动到新插入的对话
    currentDialogIndex.value = currentDialogIndex.value + 1;

    console.info('已保存到正文（不刷新界面）:', text);
  } catch (error) {
    console.error('保存到正文失败:', error);
  }
}

// 裁剪选项文本：只保留被选择的选项，删除未选择的选项块
async function trimChoiceText(messageId: number, selectedText: string): Promise<void> {
  try {
    const messages = getChatMessages(messageId);
    if (messages.length === 0) return;

    const originalMessage = messages[0];
    const messageText = originalMessage.message || '';

    // 查找所有选项块
    const choiceBlockRegex = /\[\[choice\|\|([^\]]+)\]\]/g;
    let match;
    let newMessageText = messageText;
    const allChoiceBlocks: Array<{ block: string; parts: string[] }> = [];

    // 收集所有选项块
    while ((match = choiceBlockRegex.exec(messageText)) !== null) {
      const choiceBlock = match[0];
      const parts = match[1]
        .split('||')
        .map(c => c.trim())
        .filter(c => c);
      allChoiceBlocks.push({ block: choiceBlock, parts });
    }

    // 处理新格式：[[choice||选项1||角色名||台词]]
    const newFormatBlocks = allChoiceBlocks.filter(cb => cb.parts.length >= 3);
    if (newFormatBlocks.length > 0) {
      // 删除所有未选择的选项块，只保留被选择的选项块
      for (const choiceBlock of newFormatBlocks) {
        const choiceText = choiceBlock.parts[0];
        if (choiceText !== selectedText) {
          // 删除未选择的选项块
          newMessageText = newMessageText.replace(choiceBlock.block, '');
          console.info('已删除未选择的选项:', choiceText);
        }
      }
      // 清理多余的空行
      newMessageText = newMessageText.replace(/\n\s*\n/g, '\n').trim();
    } else {
      // 处理旧格式：[[choice||选项1||选项2||选项3]]
      const oldFormatBlocks = allChoiceBlocks.filter(cb => cb.parts.length < 3 && cb.parts.length > 0);
      for (const choiceBlock of oldFormatBlocks) {
        const selectedIndex = choiceBlock.parts.findIndex(c => c === selectedText);
        if (selectedIndex !== -1) {
          // 只保留被选择的选项
          const trimmedChoiceBlock = `[[choice||${selectedText}]]`;
          newMessageText = newMessageText.replace(choiceBlock.block, trimmedChoiceBlock);
          console.info('已裁剪选项文本（旧格式），只保留被选择的选项:', selectedText);
        }
      }
    }

    // 如果消息文本有变化，更新消息（不刷新界面）
    if (newMessageText !== messageText) {
      await setChatMessages(
        [
          {
            message_id: messageId,
            message: newMessageText,
          },
        ],
        { refresh: 'none' }, // 不刷新界面
      );
      console.info('已更新消息文本（不刷新界面）');
    }
  } catch (error) {
    console.error('裁剪选项文本失败:', error);
  }
}

async function handleChoiceSelect(id: string, customText?: string) {
  console.info('选择选项:', id, customText);

  // 获取当前对话的消息ID
  const currentMessageId = currentDialogue.value?.message_id;
  if (currentMessageId === undefined) {
    console.warn('当前对话没有消息ID，无法发送消息');
    nextDialogue();
    return;
  }

  try {
    // 获取最后一条消息的ID
    const lastMessageId = getLastMessageId();

    // 判断是否所有对话演出加载完成
    const isAllDialoguesLoaded = currentDialogIndex.value >= dialogues.value.length - 1;

    // 确定要发送的文本和选项信息
    let messageText = '';
    let selectedOption: ChoiceOption | undefined;

    if (id === 'custom' && customText) {
      // 自定义输入选项
      messageText = customText.trim();
    } else {
      // 查找对应的选项
      selectedOption = currentDialogue.value?.options?.find(opt => opt.id === id);
      messageText = selectedOption?.text || '';
    }

    if (!messageText) {
      console.warn('消息文本为空，取消发送');
      nextDialogue();
      return;
    }

    // 1. 自动识别并裁剪选项文本（只保留被选择的选项，删除其他未选择的选项）
    await trimChoiceText(currentMessageId, messageText);

    // 2. 如果选择了选项且有角色回复，显示角色回复
    if (selectedOption && selectedOption.character && selectedOption.response) {
      // 在当前位置后插入角色回复对话
      const responseDialogue: DialogueItem = {
        character: selectedOption.character,
        text: selectedOption.response,
        type: undefined,
        message_id: currentMessageId, // 使用相同的消息ID
        role: 'assistant',
      };

      // 插入到对话列表
      const newDialogues = [...dialogues.value];
      newDialogues.splice(currentDialogIndex.value + 1, 0, responseDialogue);
      dialogues.value = newDialogues;

      // 移动到角色回复对话
      currentDialogIndex.value = currentDialogIndex.value + 1;
    }

    // 3. 区分演出中和演出后的行为
    if (isAllDialoguesLoaded) {
      // 演出后：真选项框，裁剪当前消息并在 </content> 之前停止，然后删除后续对话并触发 AI 回复
      if (currentMessageId !== undefined) {
        try {
          // 先裁剪当前消息文本（在 </content> 标签之前停止）
          const messages = getChatMessages(currentMessageId);
          if (messages.length > 0) {
            const currentMessage = messages[0];
            const originalText = currentMessage.message || '';
            const trimmedText = trimMessageBeforeContentTag(originalText);

            if (trimmedText !== originalText) {
              await setChatMessages(
                [
                  {
                    message_id: currentMessageId,
                    message: trimmedText,
                  },
                ],
                { refresh: 'none' },
              );
              console.info('已裁剪消息文本（在 </content> 标签之前停止）');
            }
          }
        } catch (error) {
          console.error('裁剪消息文本失败:', error);
        }
      }

      if (currentMessageId !== undefined && currentMessageId < lastMessageId) {
        const messagesToDelete: number[] = [];
        for (let i = currentMessageId + 1; i <= lastMessageId; i++) {
          messagesToDelete.push(i);
        }
        if (messagesToDelete.length > 0) {
          await deleteChatMessages(messagesToDelete, { refresh: 'all' });
          console.info(`已删除 ${messagesToDelete.length} 条后续消息`);
        }
      }

      // 发送用户输入的消息
      await createChatMessages(
        [
          {
            role: 'user',
            message: messageText,
          },
        ],
        { refresh: 'all' },
      );
      console.info('已发送用户消息:', messageText);

      // 准备流式界面：立即开始监听流式token
      const expectedMessageId = getLastMessageId() + 1;
      isStreaming.value = true;
      streamingText.value = '';
      streamingMessageId.value = expectedMessageId;

      // 触发 AI 生成回复
      await triggerSlash('/trigger');
      console.info('已触发 AI 生成');

      // 重新加载对话数据
      await loadDialoguesFromTavern();

      // 跳转到最新对话（如果有新消息）
      nextTick(() => {
        if (dialogues.value.length > 0) {
          const newMessage = dialogues.value.find(d => d.message_id === expectedMessageId);
          if (newMessage) {
            currentDialogIndex.value = dialogues.value.indexOf(newMessage);
          } else {
            currentDialogIndex.value = dialogues.value.length - 1;
          }
        }
      });
    }

    // 演出中：带角色回复的选项（格式1）会继续剧情演出，不触发 AI 回复
    // 如果是自定义输入选项，则裁剪当前消息并在 </content> 之前停止，然后删除后续对话并触发 AI 回复
    if (!isAllDialoguesLoaded && id === 'custom' && customText) {
      // 自定义输入选项：先裁剪当前消息文本（在 </content> 标签之前停止）
      if (currentMessageId !== undefined) {
        try {
          const messages = getChatMessages(currentMessageId);
          if (messages.length > 0) {
            const currentMessage = messages[0];
            const originalText = currentMessage.message || '';
            const trimmedText = trimMessageBeforeContentTag(originalText);

            if (trimmedText !== originalText) {
              await setChatMessages(
                [
                  {
                    message_id: currentMessageId,
                    message: trimmedText,
                  },
                ],
                { refresh: 'none' },
              );
              console.info('已裁剪消息文本（在 </content> 标签之前停止）');
            }
          }
        } catch (error) {
          console.error('裁剪消息文本失败:', error);
        }
      }

      // 然后删除后续对话并触发 AI 回复
      if (currentMessageId !== undefined && currentMessageId < lastMessageId) {
        const messagesToDelete: number[] = [];
        for (let i = currentMessageId + 1; i <= lastMessageId; i++) {
          messagesToDelete.push(i);
        }
        if (messagesToDelete.length > 0) {
          await deleteChatMessages(messagesToDelete, { refresh: 'all' });
          console.info(`已删除 ${messagesToDelete.length} 条后续消息`);
        }
      }

      // 发送用户输入的消息
      await createChatMessages(
        [
          {
            role: 'user',
            message: messageText,
          },
        ],
        { refresh: 'all' },
      );
      console.info('已发送用户消息（自定义输入）:', messageText);

      // 准备流式界面
      const expectedMessageId = getLastMessageId() + 1;
      isStreaming.value = true;
      streamingText.value = '';
      streamingMessageId.value = expectedMessageId;

      // 触发 AI 生成回复
      await triggerSlash('/trigger');
      console.info('已触发 AI 生成（自定义输入）');

      // 重新加载对话数据
      await loadDialoguesFromTavern();

      // 跳转到最新对话
      nextTick(() => {
        if (dialogues.value.length > 0) {
          const newMessage = dialogues.value.find(d => d.message_id === expectedMessageId);
          if (newMessage) {
            currentDialogIndex.value = dialogues.value.indexOf(newMessage);
          } else {
            currentDialogIndex.value = dialogues.value.length - 1;
          }
        }
      });
    } else if (!isAllDialoguesLoaded) {
      // 普通选项：只显示角色回复，不删除后续对话，不触发 AI 回复
      // 继续下一条对话
      nextDialogue();
    }
  } catch (error) {
    console.error('处理选择时出错:', error);
    isStreaming.value = false;
    streamingText.value = '';
    streamingMessageId.value = null;
    nextDialogue();
  }
}

// 获取要显示的文本
function getDisplayText(): string {
  const dialogue = currentDialogue.value;
  if (!dialogue) return '';

  // 确保返回有效文本
  const text = dialogue.text || '';
  if (!text) return '';

  // 如果当前消息正在流式加载
  if (isStreaming.value && streamingMessageId.value === dialogue.message_id) {
    // 只返回消息中已保存的文本（已完成部分），不显示流式中的未完成部分
    return text;
  }

  // 否则返回消息的完整文本
  return text;
}

// 处理流式token
function handleStreamToken(text: string) {
  if (!isStreaming.value || streamingMessageId.value === null) {
    return;
  }

  // 更新流式文本
  streamingText.value = text;
}

// 历史功能：显示对话历史并允许快速跳转
const showHistoryDialog = ref(false);
const historyMessages = ref<
  Array<{
    id: number;
    role: string;
    items: Array<{
      type: 'character' | 'user' | 'narration' | 'blacktext' | 'choice';
      character?: string;
      text: string;
    }>;
  }>
>([]);

async function handleHistory() {
  menuExpanded.value = false;
  showHistoryDialog.value = true;

  try {
    // 获取所有消息
    const lastMessageId = getLastMessageId();
    const messages: Array<{
      id: number;
      role: string;
      items: Array<{
        type: 'character' | 'user' | 'narration' | 'blacktext' | 'choice';
        character?: string;
        text: string;
      }>;
    }> = [];

    for (let i = 0; i <= lastMessageId; i++) {
      try {
        const chatMessages = getChatMessages(i);
        if (chatMessages.length > 0) {
          const msg = chatMessages[0];
          const messageText = msg.message || '';

          // 解析消息块
          const blocks = await parseMessageBlocks(messageText);

          const items: Array<{
            type: 'character' | 'user' | 'narration' | 'blacktext' | 'choice';
            character?: string;
            text: string;
          }> = [];

          for (const block of blocks) {
            if (block.type === 'character' && block.character && block.text) {
              items.push({
                type: 'character',
                character: block.character,
                text: block.text,
              });
            } else if (block.type === 'user') {
              const userText = 'message' in block ? block.message : block.text;
              if (userText) {
                // 保留原始文本（包含 *through* 标记），用于格式化显示
                items.push({
                  type: 'user',
                  character: '你',
                  text: userText,
                });
              }
            } else if (block.type === 'narration') {
              const narrationText = 'message' in block ? block.message : block.text;
              if (narrationText) {
                items.push({
                  type: 'narration',
                  text: narrationText,
                });
              }
            } else if (block.type === 'blacktext') {
              const blackText = 'message' in block ? block.message : block.text;
              if (blackText) {
                items.push({
                  type: 'blacktext',
                  text: blackText,
                });
              }
            } else if (block.type === 'choice' && (block.choiceText || block.text)) {
              items.push({
                type: 'choice',
                text: block.choiceText || block.text || '',
              });
            }
          }

          // 如果没有解析到任何块，使用原始消息文本
          if (items.length === 0) {
            const cleanText = messageText
              .replace(/\[\[[^\]]+\]\]/g, '')
              .replace(/<[^>]+>/g, '')
              .trim();
            if (cleanText) {
              items.push({
                type: msg.role === 'user' ? 'user' : 'character',
                character: msg.role === 'user' ? '你' : 'AI',
                text: cleanText,
              });
            }
          }

          if (items.length > 0) {
            messages.push({
              id: i,
              role: msg.role || 'user',
              items,
            });
          }
        }
      } catch (error) {
        // 忽略单个消息获取失败
        console.warn(`获取消息 ${i} 失败:`, error);
      }
    }

    historyMessages.value = messages.reverse(); // 最新的在前
    console.info(`已加载 ${historyMessages.value.length} 条历史消息`);
  } catch (error) {
    console.error('加载历史消息失败:', error);
  }
}

// 格式化用户文本，处理 *星号包裹* 的内心想法
function formatUserText(text: string): string {
  if (!text) return '';

  // 将 *星号包裹* 的内容转换为斜体灰色（内心想法），左右稍微空出来一点
  // 匹配 *内容* 格式（排除 *through* 标记）
  return text.replace(/\*([^*]+)\*/g, (match, content) => {
    // 如果是 *through* 标记，跳过
    if (content.trim() === 'through') return match;
    // 转换为内心想法格式（斜体灰色，左右留空）
    return ` <span style="color: #9ca3af; font-style: italic;">${content}</span> `;
  });
}

// 跳转到指定的历史消息
async function jumpToHistoryMessage(messageId: number) {
  try {
    // 关闭历史对话框
    showHistoryDialog.value = false;

    // 重新加载对话数据
    await loadDialoguesFromTavern();

    // 找到对应的对话索引
    const dialogueIndex = dialogues.value.findIndex(d => d.message_id === messageId);
    if (dialogueIndex >= 0) {
      currentDialogIndex.value = dialogueIndex;
      console.info(`已跳转到消息 ${messageId}（索引 ${dialogueIndex}）`);
    } else {
      console.warn(`未找到消息 ${messageId} 对应的对话`);
    }
  } catch (error) {
    console.error('跳转到历史消息失败:', error);
  }
}

function handleSaveStyle() {
  dialogStyle.value = { ...previewStyle.value };
}

function handleSettingsClick() {
  if (menuExpanded.value) {
    if (!customModeEnabled.value) {
      previewStyle.value = { ...dialogStyle.value };
    }
    showSettings.value = true;
    menuExpanded.value = false;
  } else {
    menuExpanded.value = true;
  }
}

function handleCharacterClick() {
  // 如果菜单已展开，点击角色按钮打开状态栏
  if (characterMenuExpanded.value) {
    showCharacterPanel.value = true;
    characterMenuExpanded.value = false;
  } else {
    // 否则展开菜单
    characterMenuExpanded.value = true;
  }
}

function handleInputClick() {
  showInputBox.value = true;
  characterMenuExpanded.value = false;
  // 聚焦输入框
  nextTick(() => {
    inputRef.value?.focus();
  });
}

// 发送输入（不刷新界面）
async function handleSendInput() {
  if (!inputText.value.trim()) return;

  const text = inputText.value.trim();
  inputText.value = '';
  showInputBox.value = false;

  // 判断是否所有对话演出加载完成
  const isAllDialoguesLoaded = currentDialogIndex.value >= dialogues.value.length - 1;
  const currentMessageId = currentDialogue.value?.message_id;
  const lastMessageId = getLastMessageId();

  // 如果演出中（还有后续对话），先裁剪之后的剧情文本（在 </content> 标签之前停止）
  if (!isAllDialoguesLoaded && currentMessageId !== undefined) {
    try {
      // 获取当前消息的完整文本
      const messages = getChatMessages(currentMessageId);
      if (messages.length > 0) {
        const currentMessage = messages[0];
        const originalText = currentMessage.message || '';

        // 裁剪消息文本（在 </content> 标签之前停止）
        const trimmedText = trimMessageBeforeContentTag(originalText);

        // 如果有裁剪（文本发生变化），更新消息
        if (trimmedText !== originalText) {
          await setChatMessages(
            [
              {
                message_id: currentMessageId,
                message: trimmedText,
              },
            ],
            { refresh: 'none' }, // 不刷新界面
          );
          console.info('已裁剪消息文本（在 </content> 标签之前停止）');
        }
      }

      // 删除当前消息之后的所有消息
      if (currentMessageId < lastMessageId) {
        const messagesToDelete: number[] = [];
        for (let i = currentMessageId + 1; i <= lastMessageId; i++) {
          messagesToDelete.push(i);
        }
        if (messagesToDelete.length > 0) {
          await deleteChatMessages(messagesToDelete, { refresh: 'all' });
          console.info(`已删除 ${messagesToDelete.length} 条后续消息`);
        }
      }
    } catch (error) {
      console.error('裁剪和删除后续消息失败:', error);
    }
  }

  // 在当前位置后插入用户对话
  const newDialogue: DialogueItem = {
    character: '你',
    text,
    type: 'user',
    isEditable: true,
    message_id: getLastMessageId() + 1, // 临时ID，实际会从酒馆获取
  };

  // 插入到对话列表
  const newDialogues = [...dialogues.value];
  newDialogues.splice(currentDialogIndex.value + 1, 0, newDialogue);
  dialogues.value = newDialogues;

  // 移动到新插入的对话
  currentDialogIndex.value = currentDialogIndex.value + 1;

  // 发送到酒馆并触发 AI 回复
  try {
    // 在发送前应用所有编辑和删除操作
    await applyUserMessageEdits();

    // 获取当前场景（从当前对话继承）
    const currentScene = currentDialogue.value?.scene || '{{scene}}';

    // 使用新格式格式化用户消息
    const formattedMessage = `[[user||场景：${currentScene}||台词：${text}]]`;

    await createChatMessages(
      [
        {
          role: 'user',
          message: formattedMessage,
        },
      ],
      { refresh: 'all' }, // 刷新界面以触发 AI 回复
    );
    console.info('已发送用户消息:', text);

    // 准备流式界面：立即开始监听流式token
    const expectedMessageId = getLastMessageId() + 1;
    isStreaming.value = true;
    streamingText.value = '';
    streamingMessageId.value = expectedMessageId;

    // 触发 AI 生成回复
    await triggerSlash('/trigger');
    console.info('已触发 AI 生成');

    // 重新加载对话数据
    await loadDialoguesFromTavern();

    // 跳转到最新对话（如果有新消息）
    nextTick(() => {
      if (dialogues.value.length > 0) {
        const newMessage = dialogues.value.find(d => d.message_id === expectedMessageId);
        if (newMessage) {
          currentDialogIndex.value = dialogues.value.indexOf(newMessage);
        } else {
          currentDialogIndex.value = dialogues.value.length - 1;
        }
      }
    });
  } catch (error) {
    console.error('发送消息失败:', error);
    isStreaming.value = false;
    streamingText.value = '';
    streamingMessageId.value = null;
  }
}

// 保存输入到正文（不发送）
async function handleSaveInput() {
  if (!inputText.value.trim()) return;

  const text = inputText.value.trim();
  inputText.value = '';
  showInputBox.value = false;

  // 保存到当前消息的正文中
  await handleSaveToStory(text);
}

// 编辑用户消息（立即同步到楼层消息文本，不刷新界面）
async function handleEditUserMessage(messageId: number, newText: string) {
  try {
    // 立即同步到楼层消息文本（不刷新界面）
    await syncEditToMessage(messageId, newText);

    // 同时存储在内存中，用于后续发送时应用
    userMessageEdits.value.set(messageId, { text: newText });

    // 更新本地对话列表中的显示（仅用于UI显示）
    const dialogueIndex = dialogues.value.findIndex(d => d.message_id === messageId);
    if (dialogueIndex !== -1) {
      const newDialogues = [...dialogues.value];
      newDialogues[dialogueIndex] = {
        ...newDialogues[dialogueIndex],
        text: newText,
      };
      dialogues.value = newDialogues;
    }

    console.info('已同步编辑到楼层消息（不刷新界面）:', messageId, newText);
  } catch (error) {
    console.error('编辑用户消息失败:', error);
  }
}

// 删除用户消息
async function handleDeleteUserMessage(messageId: number) {
  try {
    // 只存储在内存中，不立即删除酒馆消息
    userMessageEdits.value.set(messageId, { deleted: true });

    // 从本地对话列表中移除（仅用于UI显示）
    const dialogueIndex = dialogues.value.findIndex(d => d.message_id === messageId);
    if (dialogueIndex !== -1) {
      const newDialogues = [...dialogues.value];
      newDialogues.splice(dialogueIndex, 1);
      dialogues.value = newDialogues;
      // 调整当前索引
      if (currentDialogIndex.value >= newDialogues.length) {
        currentDialogIndex.value = Math.max(0, newDialogues.length - 1);
      }
    }

    console.info('已暂存删除（内存中）:', messageId);
  } catch (error) {
    console.error('删除用户消息失败:', error);
  }
}

// 在发送消息前应用所有编辑和删除操作（不刷新界面）
async function applyUserMessageEdits() {
  if (userMessageEdits.value.size === 0) return;

  try {
    // 应用所有编辑
    for (const [messageId, edit] of userMessageEdits.value.entries()) {
      if (edit.deleted) {
        // 删除消息（不刷新界面）
        await deleteChatMessages([messageId], { refresh: 'none' });
        console.info('已应用删除（不刷新界面）:', messageId);
      } else if (edit.text) {
        // 编辑消息（不刷新界面）
        // 使用相同的逻辑同步编辑
        await syncEditToMessage(messageId, edit.text);
        console.info('已应用编辑（不刷新界面）:', messageId);
      }
    }

    // 清空编辑记录
    userMessageEdits.value.clear();

    // 不重新加载对话，保持界面状态
  } catch (error) {
    console.error('应用用户消息编辑失败:', error);
  }
}

// 立即同步编辑到楼层消息文本（不刷新界面）
async function syncEditToMessage(messageId: number, newText: string) {
  try {
    const messages = getChatMessages(messageId);
    if (messages.length > 0) {
      const originalMessage = messages[0];
      const messageText = originalMessage.message || '';

      // 提取 <content> 标签中的内容
      const contentMatch = messageText.match(/<content>([\s\S]*?)<\/content>/i);
      const contentText = contentMatch ? contentMatch[1] : messageText;

      // 匹配所有 [[user||...]] 格式的块（使用非贪婪匹配，确保能匹配到完整的块）
      const userBlockRegex = /\[\[user\|\|([^\]]+)\]\]/g;
      let match;
      let newMessageText = messageText;
      let foundMatch = false;

      // 查找并替换第一个 user 块
      while ((match = userBlockRegex.exec(contentText)) !== null) {
        const content = match[1];
        // 解析键值对
        const kvPairs: Record<string, string> = {};
        const parts = content
          .split('||')
          .map(p => p.trim())
          .filter(p => p);
        for (const part of parts) {
          const kvMatch = part.match(/^([^：:]+)[：:]\s*(.+)$/);
          if (kvMatch) {
            const key = kvMatch[1].trim();
            const value = kvMatch[2].trim();
            if (key && value) {
              kvPairs[key] = value;
            }
          }
        }

        // 如果找到了 user 块（有场景或台词字段），替换它
        if (
          kvPairs['场景'] ||
          kvPairs['scene'] ||
          kvPairs['台词'] ||
          kvPairs['用户消息'] ||
          kvPairs['消息'] ||
          kvPairs['text']
        ) {
          const scene = kvPairs['场景'] || kvPairs['scene'] || '{{scene}}';
          const oldBlock = match[0];
          // 使用用户编辑后的文本（可能包含*星号包裹*和【】包裹的内容）
          const newBlock = `[[user||场景：${scene}||台词：${newText}]]`;

          // 如果在 <content> 标签内，需要替换 contentText 中的内容
          if (contentMatch) {
            const newContentText = contentText.replace(oldBlock, newBlock);
            newMessageText = messageText.replace(contentMatch[0], `<content>${newContentText}</content>`);
          } else {
            newMessageText = messageText.replace(oldBlock, newBlock);
          }
          foundMatch = true;
          break;
        }
      }

      // 如果没有找到匹配的块，在 <content> 标签内添加新格式
      if (!foundMatch) {
        if (contentMatch) {
          const newContentText = contentText + `\n[[user||场景：{{scene}}||台词：${newText}]]`;
          newMessageText = messageText.replace(contentMatch[0], `<content>${newContentText}</content>`);
        } else {
          newMessageText = messageText + `\n[[user||场景：{{scene}}||台词：${newText}]]`;
        }
      }

      await setChatMessages(
        [
          {
            message_id: messageId,
            message: newMessageText,
          },
        ],
        { refresh: 'none' }, // 不刷新界面
      );
      console.info('已同步编辑到楼层消息（不刷新界面）:', messageId, newText);
    }
  } catch (error) {
    console.error('同步编辑到楼层消息失败:', error);
  }
}
</script>

<style scoped>
/* 历史对话框滚动容器 - 隐藏滚动条但保持滚动功能 */
.history-scroll-container {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.history-scroll-container::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

/* 历史消息项样式 */
.history-message-item {
  position: relative;
  margin-bottom: 0;
}

.history-message-item:hover {
  background-color: rgba(0, 0, 0, 0.04);
}
</style>
