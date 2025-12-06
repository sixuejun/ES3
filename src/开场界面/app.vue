<template>
  <div class="opening-interface-wrapper">
    <div class="opening-interface">
    <!-- 背景 -->
    <div class="background"></div>
    <div class="overlay"></div>

    <!-- 粒子效果 -->
    <div ref="particlesRef" class="particles"></div>

    <!-- 主菜单 -->
    <div v-show="currentPage === 'main-menu'" class="page main-menu">
      <div class="title-section">
        <h1>星之轨迹</h1>
        <p class="subtitle">Starlight Trail</p>
        <p class="tagline">— 一段跨越时空的浪漫物语 —</p>
      </div>

      <div class="menu-buttons">
        <button class="bubble-btn bubble-btn-lg" @click="showPage('start-game')">
          <IconPlay />
          开始游戏
        </button>
        <button class="bubble-btn bubble-btn-lg" @click="showPage('settings')">
          <IconSettings />
          游戏设置
        </button>
        <button class="bubble-btn bubble-btn-lg" @click="showPage('character-intro')">
          <IconUsers />
          角色介绍
        </button>
      </div>

      <div class="footer">
        <p>© 2025 Per Aspera Ad Astra. By sixue</p>
      </div>
    </div>

    <!-- 开始游戏页面 -->
    <div v-show="currentPage === 'start-game'" class="page start-game">
      <PageHeader title="选择开场" @back="showPage('main-menu')">
        <IconStar />
      </PageHeader>

      <div class="openings-grid">
        <div v-for="opening in openings" :key="opening.id" class="opening-card" @click="handleSelectOpening(opening)">
          <div class="image-wrapper">
            <img :src="opening.image || ''" :alt="opening.title" />
          </div>
          <div class="content">
            <h3>{{ opening.title }}</h3>
            <p>{{ opening.description }}</p>
          </div>
          <div class="hover-icon">
            <IconStar class="icon-sm" />
          </div>
        </div>
      </div>

      <p class="hint-text">选择一个开场，开启你的专属故事</p>
    </div>

    <!-- 设置页面 -->
    <div v-show="currentPage === 'settings'" class="page settings">
      <PageHeader title="游戏设置" @back="showPage('main-menu')" />

      <div class="settings-content">
        <!-- URL导入 -->
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <IconLink />
            </div>
            <div>
              <h3>URL 导入</h3>
              <p class="desc">从网络地址导入模型文件（支持 GitHub 仓库，自动解析文件结构）</p>
            </div>
          </div>
          <div class="url-input-group">
            <input
              v-model="urlInput"
              type="url"
              placeholder="输入模型 URL 或 GitHub 仓库地址，例如：https://sixuejun.github.io/live2d-models/chengbeiji/"
              @keyup.enter="importFromUrl"
            />
            <button class="bubble-btn bubble-btn-sm" @click="importFromUrl">导入</button>
          </div>
        </div>

        <!-- 本地文件导入 -->
        <div class="settings-card">
          <div class="settings-card-header">
            <div class="settings-card-icon">
              <IconUpload />
            </div>
            <div>
              <h3>本地文件导入</h3>
              <p class="desc">从本地选择模型文件</p>
            </div>
          </div>
          <input
            ref="fileInputRef"
            type="file"
            class="hidden-input"
            accept=".png,.moc3,.model3.json,.cdi3.json,.motion3.json"
            multiple
            @change="handleFileSelect"
          />
          <button class="bubble-btn full-width-btn" @click="fileInputRef?.click()">
            <IconUpload />
            选择本地文件
          </button>
        </div>

        <!-- 已导入配置列表 -->
        <div v-if="importedModels.length > 0" class="settings-card">
          <h3 style="margin-bottom: 16px; color: var(--foreground)">已导入的模型</h3>
          <div class="config-list">
            <div v-for="(model, index) in importedModels" :key="index" class="config-item">
              <div class="config-item-left">
                <IconUpload class="icon-sm" />
                <span class="config-item-name">{{ model.name }}</span>
              </div>
              <div class="config-item-right">
                <IconCheck class="icon-sm check-icon" />
                <button class="remove-btn" @click="removeModel(index)">
                  <IconClose class="icon-sm" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 角色介绍页面 -->
    <div v-show="currentPage === 'character-intro'" class="page character-intro">
      <PageHeader title="角色介绍" @back="showPage('main-menu')" />

      <div class="character-display">
        <button class="bubble-btn bubble-btn-round nav-btn" @click="prevCharacter">
          <IconChevronLeft class="icon-lg" />
        </button>

        <div :class="['character-card', currentCharacter.colorClass]">
          <div class="character-card-inner">
            <div class="character-image">
              <img :src="currentCharacter.image || ''" :alt="currentCharacter.name" />
            </div>
            <div class="character-info">
              <span class="character-role">{{ currentCharacter.role }}</span>
              <h3 class="character-name">{{ currentCharacter.name }}</h3>
              <p class="character-desc">{{ currentCharacter.desc }}</p>
              <div class="character-dots">
                <button
                  v-for="(_, index) in characters"
                  :key="index"
                  :class="['dot', { active: index === currentCharacterIndex }]"
                  @click="goToCharacter(index)"
                ></button>
              </div>
            </div>
          </div>
        </div>

        <button class="bubble-btn bubble-btn-round nav-btn" @click="nextCharacter">
          <IconChevronRight class="icon-lg" />
        </button>
      </div>

      <p class="hint-text">点击左右按钮或底部指示器切换角色</p>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import { createParticles, selectOpening, useCharacterDisplay, useModelImport, usePageNavigation } from './composables';
import { DEFAULT_CHARACTERS, DEFAULT_OPENINGS } from './data';
import type { Opening } from './types';
import { adjustIframeHeight } from './utils/iframeHeight';

// 组件
import { PageHeader } from './components';
import {
  IconCheck,
  IconChevronLeft,
  IconChevronRight,
  IconClose,
  IconLink,
  IconPlay,
  IconSettings,
  IconStar,
  IconUpload,
  IconUsers,
} from './icons';

// ==================== 状态管理 ====================

// 页面导航
const { currentPage, showPage } = usePageNavigation();

// 数据
const openings = ref(DEFAULT_OPENINGS);
const characters = ref(DEFAULT_CHARACTERS);

// 角色展示
const {
  currentIndex: currentCharacterIndex,
  currentItem: currentCharacter,
  prev: prevCharacter,
  next: nextCharacter,
  goTo: goToCharacter,
} = useCharacterDisplay(characters.value);

// 模型导入
const { importedModels, urlInput, importFromUrl, handleFileSelect, removeModel } = useModelImport();

// DOM 引用
const particlesRef = ref<HTMLElement>();
const fileInputRef = ref<HTMLInputElement>();

// ==================== 事件处理 ====================

async function handleSelectOpening(opening: Opening) {
  await selectOpening(opening);
}

// ==================== 生命周期 ====================

onMounted(() => {
  nextTick(() => {
    createParticles(particlesRef.value);
    // 初始高度调整
    adjustIframeHeight();
  });
});

// 监听页面切换，调整高度
watch(currentPage, () => {
  nextTick(() => {
    adjustIframeHeight();
  });
});
</script>

<style lang="scss" scoped>
// 样式已在 index.scss 中定义
</style>
