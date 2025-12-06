<template>
  <div ref="containerRef" class="relative w-full overflow-hidden select-none" :style="containerStyle">
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

      <!-- 重演按钮 -->
      <button
        v-if="menuExpanded"
        class="bg-card/80 text-foreground animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-full p-2 pr-4 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-card"
        style="animation-delay: 50ms"
        aria-label="重演"
        @click="handleReplay"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
        <span class="text-sm">重演</span>
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
import { hasMotionAndExpression, parseMessageBlocks, parseStatusBlock } from '../lib/messageParser';
import type { DialogBoxStyle, DialogueItem } from '../types/galgame';
import { defaultDialogStyle } from '../types/galgame';
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
const containerStyle = computed(() => {
  const isPortrait = window.innerHeight > window.innerWidth;
  const isFullscreen = !!document.fullscreenElement;
  const targetAspectRatio = 16 / 9;

  if (isPortrait && isFullscreen) {
    // 全屏且竖屏时，旋转90度
    return {
      width: '100vh',
      height: '100vw',
      transform: 'rotate(90deg) translateY(-100%)',
      transformOrigin: 'top left',
      position: 'absolute',
      top: '100%',
      left: 0,
    };
  } else if (isPortrait) {
    // 竖屏时等比例缩放，保持横屏比例
    // 使用 width 和 aspect-ratio 来让高度根据宽度动态调整（符合前端界面规则）
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 计算缩放比例，确保横屏内容能完整显示
    const requiredHeight = viewportWidth / targetAspectRatio;
    const scale = Math.min(viewportHeight / requiredHeight, 1);

    return {
      width: '100%',
      aspectRatio: '16 / 9',
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
      margin: '0 auto',
      maxWidth: '100%',
    };
  }

  // 横屏时正常显示（使用 width 和 aspect-ratio）
  return {
    width: '100%',
    aspectRatio: '16 / 9',
    maxWidth: '100%',
    margin: '0 auto',
  };
});

// 背景图片
const backgroundImage = computed(() => {
  const dialogue = currentDialogue.value;
  // 优先使用scene作为背景
  if (dialogue?.scene) {
    return dialogue.scene;
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

    // 处理每条消息
    for (const msg of messages) {
      const messageText = msg.message || '';

      // 解析消息块
      const blocks = parseMessageBlocks(messageText);

      // 解析StatusBlock
      const statusBlock = parseStatusBlock(messageText);

      // 如果没有解析到块，使用默认格式
      if (blocks.length === 0) {
        // 检查是否有StatusBlock
        if (statusBlock) {
          // 如果有StatusBlock但没有其他块，创建一个narration类型的对话
          newDialogues.push({
            character: '',
            text: '',
            type: 'narration',
            message_id: msg.message_id,
            role: msg.role,
            statusBlock,
          });
        } else {
          // 默认格式
          const dialogue: DialogueItem = {
            character: msg.name || (msg.role === 'user' ? '你' : ''),
            text: messageText,
            message_id: msg.message_id,
            role: msg.role,
            isEditable: msg.role === 'user',
            sprite:
              msg.role === 'assistant' && msg.name
                ? {
                    type: live2dModels.value.some(m => m.name === msg.name) ? 'live2d' : 'image',
                    imageUrl: msg.extra?.sprite_image || undefined,
                  }
                : undefined,
          };

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
        }
        continue;
      }

      // 处理每个解析到的块
      for (const block of blocks) {
        if (block.type === 'character') {
          // 检查是否有motion和expression
          const hasMotionExpr = hasMotionAndExpression(
            block.character || '',
            block.motion,
            block.expression,
            live2dModels.value,
          );

          // 如果是CG模式或没有motion/expression，进入CG模式
          const isCGMode = block.isCG || !hasMotionExpr;

          const dialogue: DialogueItem = {
            character: block.character,
            text: block.text || '',
            message_id: msg.message_id,
            role: 'assistant',
            type: isCGMode ? 'cg' : undefined,
            scene: block.scene,
            motion: block.motion,
            expression: block.expression,
            isThrough: block.isThrough,
            isCG: isCGMode,
            cgImageUrl: isCGMode ? block.scene : undefined, // CG图片URL可以从scene中获取
            statusBlock,
            sprite: isCGMode
              ? { type: 'none' } // CG模式不显示立绘
              : {
                  type: live2dModels.value.some(m => m.name === block.character) ? 'live2d' : 'image',
                  imageUrl: msg.extra?.sprite_image || undefined,
                },
          };

          newDialogues.push(dialogue);
        } else if (block.type === 'narration') {
          newDialogues.push({
            character: '',
            text: block.message || '',
            type: 'narration',
            message_id: msg.message_id,
            role: 'system',
            scene: block.scene,
            statusBlock,
          });
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
            isEditable: true,
            statusBlock,
          };

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
        } else if (block.type === 'choice') {
          newDialogues.push({
            character: '',
            text: '',
            type: 'choice',
            message_id: msg.message_id,
            role: 'system',
            options:
              block.choices?.map((choice, index) => ({
                id: `choice_${index}`,
                text: choice,
              })) || [],
            statusBlock,
          });
        }
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
    // 从角色卡变量读取
    const variables = getVariables({ type: 'character' }) || {};
    if (variables?.live2d_models && Array.isArray(variables.live2d_models)) {
      live2dModels.value = variables.live2d_models;
      console.info(`加载了 ${live2dModels.value.length} 个 Live2D 模型配置`);
    }
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
        if (screen.orientation && screen.orientation.lock) {
          try {
            await screen.orientation.lock('landscape');
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
      if (screen.orientation && screen.orientation.unlock) {
        try {
          await screen.orientation.unlock();
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
  // 触发响应式更新
  nextTick(() => {
    // 强制更新
  });
};

// 事件监听器清理函数集合
const eventCleanups: Array<() => void> = [];

onMounted(() => {
  document.addEventListener('fullscreenchange', handleFullscreenChange);
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', handleResize);

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
    if (messageReceivedCleanup) eventCleanups.push(messageReceivedCleanup);

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
    if (messageUpdatedCleanup) eventCleanups.push(messageUpdatedCleanup);

    // 监听聊天切换
    const chatChangedCleanup = eventOn(tavern_events.CHAT_CHANGED, () => {
      loadDialoguesFromTavern();
      currentDialogIndex.value = 0;
      isStreaming.value = false;
      streamingText.value = '';
      streamingMessageId.value = null;
    });
    if (chatChangedCleanup) eventCleanups.push(chatChangedCleanup);

    // 监听流式token
    const streamTokenCleanup = eventOn(tavern_events.STREAM_TOKEN_RECEIVED, (text: string) => {
      handleStreamToken(text);
    });
    if (streamTokenCleanup) eventCleanups.push(streamTokenCleanup);
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

    // 将文本添加到消息正文中
    const newMessage = chat_message.message + '\n\n[[user||{{scene}}||' + text + ']]';

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

async function handleChoiceSelect(id: string, customText?: string) {
  console.log('Selected:', id, customText);

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

    // 确定要发送的文本
    let messageText = '';
    if (id === 'custom' && customText) {
      messageText = customText.trim();
    } else {
      // 查找对应的选项文本
      const option = currentDialogue.value?.options?.find(opt => opt.id === id);
      messageText = option?.text || '';
    }

    if (!messageText) {
      console.warn('消息文本为空，取消发送');
      nextDialogue();
      return;
    }

    // 1. 先裁剪之后的剧情文本（删除当前消息之后的所有消息）
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

    // 2. 发送用户输入的消息
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

    // 4. 准备流式界面：立即开始监听流式token
    const expectedMessageId = getLastMessageId() + 1;
    isStreaming.value = true;
    streamingText.value = '';
    streamingMessageId.value = expectedMessageId;

    // 5. 触发 AI 生成回复
    await triggerSlash('/trigger');
    console.info('已触发 AI 生成');

    // 6. 重新加载对话数据
    await loadDialoguesFromTavern();

    // 6. 跳转到最新对话（如果有新消息）
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
  const text = dialogue.text || dialogue.message || '';
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

// 重演功能：重新解析当前消息并生成对应的剧情演出
async function handleReplay() {
  menuExpanded.value = false;

  const currentMessageId = currentDialogue.value?.message_id;
  if (currentMessageId === undefined) {
    console.warn('当前对话没有消息ID，无法重演');
    return;
  }

  try {
    // 获取当前消息
    const messages = getChatMessages(currentMessageId);
    if (messages.length === 0) {
      console.warn('未找到当前消息');
      return;
    }

    const message = messages[0];
    if (message.role !== 'assistant') {
      console.warn('只能重演AI消息');
      return;
    }

    // 重新加载对话数据，触发重新解析
    await loadDialoguesFromTavern();

    // 确保当前对话索引正确
    const dialogueIndex = dialogues.value.findIndex(d => d.message_id === currentMessageId);
    if (dialogueIndex >= 0) {
      currentDialogIndex.value = dialogueIndex;
    }

    console.info('重演完成');
  } catch (error) {
    console.error('重演时出错:', error);
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
    const input = document.querySelector('.input-box input') as HTMLInputElement;
    input?.focus();
  });
}

// 发送输入（不刷新界面）
async function handleSendInput() {
  if (!inputText.value.trim()) return;

  const text = inputText.value.trim();
  inputText.value = '';
  showInputBox.value = false;

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

  // 发送到酒馆（不刷新界面）
  try {
    // 在发送前应用所有编辑和删除操作
    await applyUserMessageEdits();

    await createChatMessages(
      [
        {
          role: 'user',
          message: text,
        },
      ],
      { refresh: 'none' }, // 不刷新界面
    );
    console.info('已发送用户消息（不刷新界面）:', text);

    // 不重新加载对话，保持界面状态
  } catch (error) {
    console.error('发送消息失败:', error);
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
        const messages = getChatMessages(messageId);
        if (messages.length > 0) {
          const originalMessage = messages[0];
          const messageText = originalMessage.message || '';
          const blocks = parseMessageBlocks(messageText);

          let newMessageText = messageText;
          for (const block of blocks) {
            if (block.type === 'user' && block.message) {
              const oldBlock = `[[user||${block.scene || '{{scene}}'}||${block.message}]]`;
              const newBlock = `[[user||${block.scene || '{{scene}}'}||${edit.text}]]`;
              newMessageText = newMessageText.replace(oldBlock, newBlock);
              break;
            }
          }

          if (newMessageText === messageText) {
            newMessageText = `[[user||{{scene}}||${edit.text}]]`;
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
          console.info('已应用编辑（不刷新界面）:', messageId);
        }
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
      const blocks = parseMessageBlocks(messageText);

      let newMessageText = messageText;
      for (const block of blocks) {
        if (block.type === 'user' && block.message) {
          const oldBlock = `[[user||${block.scene || '{{scene}}'}||${block.message}]]`;
          const newBlock = `[[user||${block.scene || '{{scene}}'}||${newText}]]`;
          newMessageText = newMessageText.replace(oldBlock, newBlock);
          break;
        }
      }

      if (newMessageText === messageText) {
        newMessageText = `[[user||{{scene}}||${newText}]]`;
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
      console.info('已同步编辑到楼层消息（不刷新界面）:', messageId);
    }
  } catch (error) {
    console.error('同步编辑到楼层消息失败:', error);
  }
}
</script>

<style scoped></style>
