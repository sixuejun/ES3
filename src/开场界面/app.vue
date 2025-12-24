<template>
  <div class="opening-interface-wrapper">
    <div class="opening-interface" :class="{ 'is-main-menu': currentPage === 'main-menu' }">
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
          <template #left-icon>
            <IconStar />
          </template>
          <template #right-icon>
            <IconStar />
          </template>
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

      <!-- 设置页面（整合了上传向导） -->
      <div v-show="currentPage === 'settings'" class="page settings">
        <ModelUploadWizard @close="showPage('main-menu')" @complete="handleUploadComplete" />
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
import { createParticles, selectOpening, useCharacterDisplay, usePageNavigation } from './composables';
import { DEFAULT_CHARACTERS, DEFAULT_OPENINGS } from './data';
import type { Opening } from './types';
import { adjustIframeHeight } from './utils/iframeHeight';

// 组件
import { IconChevronLeft, IconChevronRight, IconPlay, IconSettings, IconStar, IconUsers } from './assets/icons';
import { ModelUploadWizard, PageHeader } from './components';

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

// DOM 引用
const particlesRef = ref<HTMLElement>();

// ==================== 事件处理 ====================

async function handleSelectOpening(opening: Opening) {
  await selectOpening(opening);
}

function handleUploadComplete() {
  // 上传完成后可以保持在设置页面或返回主菜单
  // 目前保持在设置页面，用户可以继续操作
}

// ==================== 生命周期 ====================

onMounted(() => {
  nextTick(() => {
    createParticles(particlesRef.value);
    // 初始高度调整
    adjustIframeHeight();
  });
});

// 监听页面切换，调整高度和缩放
watch(currentPage, () => {
  nextTick(() => {
    // 重新应用缩放（主菜单需要缩放，其他页面不需要）
    const applyScaleFunc = (window as any).__applyScale;
    if (applyScaleFunc) {
      applyScaleFunc();
    }
    adjustIframeHeight();
  });
});
</script>

<style lang="scss" scoped>
// 样式已在 index.scss 中定义
</style>
