<template>
  <div
    v-if="show"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    @click.self="handleClose"
  >
    <!-- 浅绿色系窗口 -->
    <div
      class="theater-window relative max-h-[85vh] w-[90%] max-w-md overflow-hidden rounded-xl shadow-2xl"
      :class="{ 'theater-window-fullscreen': isFullscreen }"
    >
      <!-- 标题栏 - 浅绿色渐变 -->
      <div class="title-bar">
        <div class="title-group">
          <div class="icon-charm"></div>
          <span>{{ currentContact ? `与${currentContact}的聊天` : theaterTitle }}</span>
        </div>
        <div class="win-controls">
          <button class="win-btn btn-close" aria-label="关闭" @click="handleClose">
            <svg
              t="1766144599366"
              class="icon"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              p-id="4447"
              width="12"
              height="12"
            >
              <path
                d="M886.784 746.496q29.696 30.72 43.52 56.32t-4.608 58.368q-4.096 6.144-11.264 14.848t-14.848 16.896-15.36 14.848-12.8 9.728q-25.6 15.36-60.416 8.192t-62.464-34.816l-43.008-43.008-57.344-57.344-67.584-67.584-73.728-73.728-131.072 131.072q-60.416 60.416-98.304 99.328-38.912 38.912-77.312 48.128t-68.096-17.408l-7.168-7.168-11.264-11.264-11.264-11.264q-6.144-6.144-7.168-8.192-11.264-14.336-13.312-29.184t2.56-29.184 13.824-27.648 20.48-24.576q9.216-8.192 32.768-30.72l55.296-57.344q33.792-32.768 75.264-73.728t86.528-86.016q-49.152-49.152-93.696-93.184t-79.872-78.848-57.856-56.832-27.648-27.136q-26.624-26.624-27.136-52.736t17.92-52.736q8.192-10.24 23.552-24.064t21.504-17.92q30.72-20.48 55.296-17.92t49.152 28.16l31.744 31.744q23.552 23.552 58.368 57.344t78.336 76.288 90.624 88.576q38.912-38.912 76.288-75.776t69.632-69.12 58.368-57.856 43.52-43.008q24.576-23.552 53.248-31.232t55.296 12.8q1.024 1.024 6.656 5.12t11.264 9.216 10.752 9.728 7.168 5.632q27.648 26.624 27.136 57.856t-27.136 57.856q-18.432 18.432-45.568 46.08t-60.416 60.416-70.144 69.632l-77.824 77.824q37.888 36.864 74.24 72.192t67.584 66.048 56.32 56.32 41.472 41.984z"
                p-id="4448"
                fill="currentColor"
              ></path>
            </svg>
          </button>
        </div>
      </div>

      <!-- 菜单栏 -->
      <div class="menu-bar">
        <span class="menu-item" @click="showContacts = !showContacts">
          {{ showContacts ? '隐藏联系人' : '查看联系人' }}
          <span v-if="unreadContacts.size > 0" class="menu-item-badge"></span>
        </span>
        <span class="menu-item" @click="handleScreenshot">记录</span>
        <span class="menu-item" @click="showSettings = !showSettings">设置</span>
      </div>

      <!-- 主体内容区域 -->
      <div class="panel-body relative flex">
        <!-- 联系人列表（左侧） -->
        <div v-if="showContacts" class="contacts-sidebar">
          <div class="contacts-header">联系人</div>
          <div class="contacts-list">
            <div
              v-for="contact in contacts"
              :key="contact"
              class="contact-item"
              :class="{ active: currentContact === contact, 'has-unread': unreadContacts.has(contact) }"
              @click="selectContact(contact)"
            >
              <div class="contact-avatar">
                {{ contact.charAt(0) }}
                <div v-if="unreadContacts.has(contact)" class="avatar-unread-dot"></div>
              </div>
              <div class="contact-info">
                <div class="contact-name">{{ contact }}</div>
              </div>
              <div v-if="unreadContacts.has(contact)" class="contact-badge"></div>
            </div>
          </div>
        </div>

        <!-- 聊天区域（右侧/全屏） -->
        <div class="chat-area" :class="{ 'w-full': !showContacts, 'w-2/3': showContacts }">
          <div class="display-wrapper">
            <!-- 背景图片 -->
            <div
              class="bg-image"
              :style="{
                backgroundImage: backgroundUrl
                  ? `url('${backgroundUrl}')`
                  : `url('https://files.catbox.moe/2td8l0.jpg')`,
              }"
            ></div>
            <div class="watermark-xi">小</div>
            <div ref="scrollContainer" class="scroll-container" @scroll="handleScroll">
              <!-- 刷新指示器 -->
              <div v-if="isRefreshing" class="refresh-indicator">
                <div class="refresh-spinner"></div>
                <span>加载历史记录...</span>
              </div>
              <!-- 消息气泡 -->
              <div ref="chatLog" class="chat-log">
                <template v-for="(message, index) in displayMessages" :key="index">
                  <!-- 消息容器（包含名字和气泡，但不共享背景） -->
                  <div class="message-container" :class="message.isUser ? 'message-right' : 'message-left'">
                    <!-- 发言者标签（独立于气泡，单独一行） -->
                    <div
                      v-if="!message.hideLabel"
                      class="speaker-label"
                      :class="message.isUser ? 'text-right' : 'text-left'"
                    >
                      {{ message.speaker }}
                    </div>
                    <!-- 气泡内容（独立容器，只有气泡有背景） -->
                    <div
                      class="bubble"
                      :class="message.isUser ? 'bubble-right' : 'bubble-left'"
                      :data-owner="message.speaker"
                      v-html="formatMessageContent(message.content)"
                    ></div>
                    <!-- 时间戳 -->
                    <div
                      v-if="message.timestamp"
                      class="timestamp"
                      :class="message.isUser ? 'text-right' : 'text-left'"
                    >
                      {{ message.timestamp }}
                    </div>
                  </div>
                </template>

                <!-- 打字光标（仅在打字时显示） -->
                <div v-if="isTyping" class="typing-cursor">
                  <span class="cursor"></span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入栏 -->
          <div class="cmd-bar">
            <input
              v-model="inputText"
              type="text"
              class="cmd-input"
              :disabled="isTyping || isLoading"
              placeholder="输入消息..."
              @keydown.enter="handleSendMessage"
            />
            <button
              class="cmd-send-btn"
              :disabled="isTyping || isLoading || !inputText.trim() || !currentContact"
              @click="handleSendMessage"
            >
              <svg
                t="1766144631220"
                class="icon"
                viewBox="0 0 1024 1024"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
                p-id="5495"
                width="16"
                height="16"
              >
                <path
                  d="M1023.200312 43.682936L877.057399 920.640375c-1.899258 10.995705-8.096837 19.592347-18.292854 25.689965-5.29793 2.898868-11.295588 4.598204-17.693089 4.598204-4.19836 0-8.796564-0.99961-13.69465-2.898868l-236.707536-96.762202c-12.994924-5.29793-27.889106-1.499414-36.785631 9.296368l-123.251855 150.341273c-6.897306 8.796564-16.293635 13.094885-27.989066 13.094885-4.898087 0-9.096447-0.799688-12.695041-2.299102-7.197189-2.698946-12.994924-6.997267-17.393206-13.394768-4.398282-6.29754-6.697384-13.194846-6.697384-20.891839V811.083171c0-14.794221 5.098009-28.988676 14.394377-40.484186l478.912925-587.070676-602.864506 521.796174c-4.598204 3.898477-10.995705 4.998048-16.493557 2.698945L23.390863 619.358063C9.296369 614.060133 1.599375 603.664194 0.599766 587.870363c-0.799688-15.194065 5.29793-26.489652 18.292854-33.786802L968.921515 5.997657c5.797735-3.498633 11.795392-5.098009 18.292854-5.098008 7.696993 0 14.594299 2.199141 20.691918 6.397501 12.695041 8.996486 17.593128 21.291683 15.294025 36.385786z"
                  p-id="5496"
                  fill="currentColor"
                ></path>
              </svg>
            </button>
          </div>

          <!-- 状态栏 -->
          <div class="status-bar">
            <button class="jade-btn" @click="autoPlay">▶ 自动播放</button>
            <button class="jade-btn" @click="playStep">⏯ 继续</button>
            <button class="jade-btn jade-btn-red" @click="reset">↺ 重置</button>
          </div>
        </div>
      </div>

      <!-- 设置面板（弹出） -->
      <div v-if="showSettings" class="settings-overlay" @click="showSettings = false">
        <div class="settings-panel" @click.stop>
          <div class="settings-header">
            <h3>设置</h3>
            <button class="settings-close" @click="showSettings = false">×</button>
          </div>
          <div class="settings-body">
            <div class="settings-item">
              <label>聊天背景图片URL</label>
              <input
                v-model="backgroundUrlInput"
                type="text"
                class="settings-input"
                placeholder="输入图片URL或留空使用默认"
                @blur="saveSettings"
              />
              <button class="settings-btn" @click="clearBgImageUrl">清除</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import type { StatusBlockData } from '../types/message';

interface PhoneMessage {
  speaker: string; // 发言者
  content: string; // 内容
  timestamp?: string; // 时间戳
  isUser: boolean; // 是否是用户消息
  hideLabel?: boolean; // 是否隐藏发言者标签（连续发言）
}

interface Props {
  show: boolean;
  messageId?: number;
  statusBlock?: StatusBlockData | null;
  onClose: () => void;
}

const props = defineProps<Props>();

// UI 状态
const currentContact = ref<string | null>(null); // 当前选中的联系人
const showContacts = ref(false); // 是否显示联系人列表
const showSettings = ref(false); // 是否显示设置面板
const isFullscreen = ref(false); // 是否全屏
const backgroundUrl = ref(''); // 背景图片 URL
const backgroundUrlInput = ref(''); // 背景图片输入框

// 消息状态
const displayMessages = ref<PhoneMessage[]>([]); // 当前显示的消息列表
const pendingMessages = ref<Map<string, PhoneMessage[]>>(new Map()); // 待发送的消息（按联系人分组）
const allMessages = ref<Map<string, PhoneMessage[]>>(new Map()); // 所有消息（按联系人分组）
const contacts = ref<string[]>([]); // 联系人列表
const unreadContacts = ref<Set<string>>(new Set()); // 未读联系人集合

// 小剧场状态
const theaterTitle = ref('手机 · Phone'); // 小剧场标题（主题名）
const theaterMessages = ref<PhoneMessage[]>([]); // 小剧场消息列表
const currentTheaterIndex = ref(0); // 当前播放的小剧场消息索引
const isTyping = ref(false); // 是否正在打字
const isAutoPlaying = ref(false); // 是否自动播放
const autoPlayTimer = ref<number | null>(null); // 自动播放计时器

// 输入状态
const inputText = ref(''); // 输入框文本
const isLoading = ref(false); // 是否加载中

// 历史记录状态
const isRefreshing = ref(false); // 是否正在刷新
const hasLoadedHistory = ref<Set<string>>(new Set()); // 已加载历史记录的联系人集合

// DOM 引用
const scrollContainer = ref<HTMLDivElement | null>(null);
const chatLog = ref<HTMLDivElement | null>(null);

// 从 localStorage 加载设置
onMounted(() => {
  const savedBgUrl = localStorage.getItem('phone-panel-bg-url');
  if (savedBgUrl) {
    backgroundUrl.value = savedBgUrl;
    backgroundUrlInput.value = savedBgUrl;
  }

  // 检测是否全屏
  const handleFullscreenChange = () => {
    isFullscreen.value = !!document.fullscreenElement;
  };
  document.addEventListener('fullscreenchange', handleFullscreenChange);

  // 定时检查未读消息
  const checkUnreadInterval = setInterval(() => {
    checkUnreadMessages();
  }, 2000);

  // 清理
  onUnmounted(() => {
    document.removeEventListener('fullscreenchange', handleFullscreenChange);
    clearInterval(checkUnreadInterval);
    if (autoPlayTimer.value) {
      clearTimeout(autoPlayTimer.value);
    }
  });
});

// 保存设置
function saveSettings() {
  backgroundUrl.value = backgroundUrlInput.value;
  localStorage.setItem('phone-panel-bg-url', backgroundUrlInput.value);
  showSettings.value = false;
  console.info('[PhonePanel] 背景图片已保存:', backgroundUrlInput.value);
}

// 清除背景图片URL
function clearBgImageUrl() {
  backgroundUrlInput.value = '';
  backgroundUrl.value = '';
  try {
    localStorage.removeItem('phone-panel-bg-url');
  } catch (e) {
    console.warn('清除背景图片URL失败:', e);
  }
  showSettings.value = false;
}

// 关闭面板
function handleClose() {
  // 如果有自动播放，停止
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
  isAutoPlaying.value = false;
  props.onClose();
}

// 从消息中解析 StatusBlock 并提取小剧场
function parseSkitFromStatusBlock(messageText: string): { title: string; content: string } | null {
  // 先查找 StatusBlock
  const statusBlockMatch = messageText.match(/<StatusBlock>([\s\S]*?)<\/StatusBlock>/i);
  if (!statusBlockMatch) return null;

  const statusBlockContent = statusBlockMatch[1];

  // 在 StatusBlock 内查找 <skit> 标签
  // 格式：<skit>主题名：内容</skit> 或 <skit>内容</skit>
  const skitMatch = statusBlockContent.match(/<skit>\s*([\s\S]*?)<\/skit>/i);
  if (!skitMatch) return null;

  const skitContent = skitMatch[1].trim();
  if (!skitContent) return null;

  // 尝试解析主题名：内容格式
  const titleContentMatch = skitContent.match(/^([^：:\n]+?)[：:]\s*(.+)$/s);
  if (titleContentMatch) {
    // 有主题名
    const title = titleContentMatch[1].trim();
    const content = titleContentMatch[2].trim();
    return { title, content };
  } else {
    // 没有主题名，整个内容就是小剧场内容
    return { title: '', content: skitContent };
  }
}

// 解析小剧场内容
function parseTheaterContent(content: string): PhoneMessage[] {
  const messages: PhoneMessage[] = [];
  // 匹配 【发言人：内容】 或 【发言人: 内容】
  const regex = /【([^：:]+)[：:](.*?)】/g;
  let match;

  // 获取用户显示名称（从 localStorage 读取）
  let userDisplayName = '';
  try {
    const stored = localStorage.getItem('galgame_user_display_name');
    if (stored) {
      userDisplayName = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[PhonePanel] 从 localStorage 读取 userDisplayName 失败:', error);
  }

  // 判断是否是用户角色的辅助函数（与 messageParser.ts 中的逻辑保持一致）
  function isUserCharacter(characterName: string | undefined): boolean {
    if (!characterName) return false;
    const normalized = characterName.trim().toLowerCase();

    // 检查默认的用户标识符
    const isDefaultUser =
      normalized === '<user>' ||
      normalized === '{{user}}' ||
      normalized === 'user' ||
      normalized === '用户' ||
      normalized === '你' ||
      normalized === '玩家';

    if (isDefaultUser) return true;

    // 如果提供了 userDisplayName，检查是否匹配（不区分大小写）
    if (userDisplayName && userDisplayName.trim()) {
      const normalizedUserDisplayName = userDisplayName.trim().toLowerCase();
      return normalized === normalizedUserDisplayName;
    }

    return false;
  }

  while ((match = regex.exec(content)) !== null) {
    const fullSpeaker = match[1]?.trim() || '';
    const messageContent = match[2]?.trim() || '';

    // 移除括号内的描述，获取纯粹的发言者名称
    const speakerName = fullSpeaker.split('（')[0].split('(')[0].trim();

    // 判断是否是用户消息（使用统一的判断逻辑）
    const isUser = isUserCharacter(speakerName) || isUserCharacter(fullSpeaker);

    messages.push({
      speaker: fullSpeaker,
      content: messageContent,
      isUser,
      hideLabel: false,
    });

    // 自动添加到联系人列表（排除 user）
    if (!isUser && !contacts.value.includes(speakerName)) {
      contacts.value.push(speakerName);
      console.info('[PhonePanel] 新增联系人:', speakerName);
    }
  }

  // 处理连续发言标签隐藏
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].speaker === messages[i - 1].speaker) {
      messages[i].hideLabel = true;
    }
  }

  return messages;
}

// 解析 phone 标签内容
function parsePhoneContent(content: string): { contact: string; messages: PhoneMessage[] } | null {
  // 格式1: <phone>\n与{{联系人}}的聊天：消息内容|时间\n</phone>
  // 格式2: <phone>{{联系人}}：消息内容|时间</phone>
  const phoneRegex = /<phone>([\s\S]*?)<\/phone>/gi;
  const match = phoneRegex.exec(content);

  if (!match) return null;

  const phoneContent = match[1].trim();

  // 解析联系人和消息
  // 格式: 与{{联系人}}的聊天：消息内容|时间
  // 或: {{联系人}}：消息内容|时间
  const contactMatch = phoneContent.match(/(?:与)?([^：:的聊天]+)(?:的聊天)?[：:](.*?)(?:\|(.+))?$/);

  if (!contactMatch) return null;

  const contact = contactMatch[1].trim();
  const messageContent = contactMatch[2].trim();
  const timestamp = contactMatch[3]?.trim();

  // 获取用户显示名称（从 localStorage 读取）
  let userDisplayName = '';
  try {
    const stored = localStorage.getItem('galgame_user_display_name');
    if (stored) {
      userDisplayName = JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[PhonePanel] 从 localStorage 读取 userDisplayName 失败:', error);
  }

  // 判断是否是用户角色的辅助函数（与 messageParser.ts 中的逻辑保持一致）
  function isUserCharacter(characterName: string | undefined): boolean {
    if (!characterName) return false;
    const normalized = characterName.trim().toLowerCase();

    // 检查默认的用户标识符
    const isDefaultUser =
      normalized === '<user>' ||
      normalized === '{{user}}' ||
      normalized === 'user' ||
      normalized === '用户' ||
      normalized === '你' ||
      normalized === '玩家';

    if (isDefaultUser) return true;

    // 如果提供了 userDisplayName，检查是否匹配（不区分大小写）
    if (userDisplayName && userDisplayName.trim()) {
      const normalizedUserDisplayName = userDisplayName.trim().toLowerCase();
      return normalized === normalizedUserDisplayName;
    }

    return false;
  }

  const isUser = isUserCharacter(contact);

  return {
    contact: isUser ? '' : contact,
    messages: [
      {
        speaker: contact,
        content: messageContent,
        timestamp,
        isUser,
        hideLabel: false,
      },
    ],
  };
}

// 格式化消息内容（处理括号内文本）
function formatMessageContent(content: string): string {
  // 将括号内的文本（如 （内心OS））转换为特殊样式
  return content.replace(
    /[（(]([^）)]+)[）)]/g,
    "<span style=\"font-family: 'KaiTi', '楷体', serif; font-size: 0.9em; color: #888; margin: 0 2px;\">（$1）</span>",
  );
}

// 选择联系人
function selectContact(contact: string) {
  currentContact.value = contact;

  // 加载该联系人的消息
  const messages = allMessages.value.get(contact) || [];
  displayMessages.value = [...messages];

  // 清除未读标记
  unreadContacts.value.delete(contact);

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });

  // 如果还没有加载历史记录，尝试加载
  if (!hasLoadedHistory.value.has(contact)) {
    loadHistoryMessages(contact);
  }
}

// 获取联系人的最后一条消息
function getLastMessage(contact: string): string {
  const messages = allMessages.value.get(contact) || [];
  if (messages.length === 0) return '暂无消息';
  const lastMsg = messages[messages.length - 1];
  return lastMsg.content.length > 20 ? lastMsg.content.substring(0, 20) + '...' : lastMsg.content;
}

// 发送消息
function handleSendMessage() {
  if (!inputText.value.trim() || !currentContact.value) return;

  const message: PhoneMessage = {
    speaker: '你',
    content: inputText.value.trim(),
    isUser: true,
    hideLabel: false,
    timestamp: getCurrentTime(),
  };

  // 添加到待发送列表
  const pending = pendingMessages.value.get(currentContact.value) || [];
  pending.push(message);
  pendingMessages.value.set(currentContact.value, pending);

  // 添加到当前联系人的消息列表
  const messages = allMessages.value.get(currentContact.value) || [];
  messages.push(message);
  allMessages.value.set(currentContact.value, messages);

  // 更新显示
  displayMessages.value.push(message);

  // 清空输入框
  inputText.value = '';

  // 滚动到底部
  nextTick(() => {
    scrollToBottom();
  });

  console.info('[PhonePanel] 消息已预存:', message);
}

// 获取当前时间
function getCurrentTime(): string {
  // 尝试从 MVU 变量获取时间
  try {
    if (typeof Mvu !== 'undefined' && (Mvu as any).get) {
      const mvuTime = (Mvu as any).get('时间');
      if (mvuTime) {
        // 解析格式：'2012/4/22 - 周三 - 上午 - 10:22 - 阴雨'
        const match = mvuTime.match(/(\d{4})\/(\d{1,2})\/(\d{1,2}).*?(\d{1,2}):(\d{2})/);
        if (match) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')} ${match[4].padStart(2, '0')}:${match[5]}`;
        }
      }
    }
  } catch (error) {
    console.warn('[PhonePanel] 获取 MVU 时间失败:', error);
  }

  // 使用系统时间
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

// 滚动到底部
function scrollToBottom() {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
  }
}

// 处理滚动事件（上滑刷新）
function handleScroll() {
  if (!scrollContainer.value || !currentContact.value) return;

  // 检测是否滚动到顶部
  if (
    scrollContainer.value.scrollTop === 0 &&
    !isRefreshing.value &&
    !hasLoadedHistory.value.has(currentContact.value)
  ) {
    isRefreshing.value = true;
    loadHistoryMessages(currentContact.value);
  }
}

// 加载历史聊天记录
async function loadHistoryMessages(contact: string) {
  try {
    console.info('[PhonePanel] 开始加载历史记录:', contact);

    // 从世界书中读取聊天记录
    const entryName = `[与${contact}的聊天记录]`;

    // 获取当前角色卡的世界书
    const worldbookNames: string[] = [];
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      if (charWorldbooks.primary) {
        worldbookNames.push(charWorldbooks.primary);
      }
      worldbookNames.push(...charWorldbooks.additional);
    } catch (error) {
      console.warn('[PhonePanel] 获取角色卡世界书失败:', error);
    }

    if (worldbookNames.length === 0) {
      console.warn('[PhonePanel] 没有可用的世界书');
      isRefreshing.value = false;
      return;
    }

    // 从所有世界书中查找聊天记录条目
    let historyContent = '';
    for (const worldbookName of worldbookNames) {
      try {
        const entries = await getWorldbook(worldbookName);
        const entry = entries.find((e: any) => e.enabled && e.name === entryName);
        if (entry) {
          historyContent = entry.content;
          console.info('[PhonePanel] 找到历史记录条目:', entryName, '内容长度:', historyContent.length);
          break;
        }
      } catch (error) {
        console.warn('[PhonePanel] 读取世界书失败:', worldbookName, error);
      }
    }

    if (!historyContent) {
      console.info('[PhonePanel] 没有找到历史记录条目:', entryName);
      hasLoadedHistory.value.add(contact);
      isRefreshing.value = false;
      return;
    }

    // 解析历史记录
    // 格式: {{联系人}}：消息内容|时间 或 {{user}}：消息内容|时间
    const historyMessages: PhoneMessage[] = [];
    const lines = historyContent.split('\n').filter(line => line.trim());

    // 获取用户显示名称（从 localStorage 读取）
    let userDisplayName = '';
    try {
      const stored = localStorage.getItem('galgame_user_display_name');
      if (stored) {
        userDisplayName = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('[PhonePanel] 从 localStorage 读取 userDisplayName 失败:', error);
    }

    // 判断是否是用户角色的辅助函数（与 messageParser.ts 中的逻辑保持一致）
    function isUserCharacter(characterName: string | undefined): boolean {
      if (!characterName) return false;
      const normalized = characterName.trim().toLowerCase();

      // 检查默认的用户标识符
      const isDefaultUser =
        normalized === '<user>' ||
        normalized === '{{user}}' ||
        normalized === 'user' ||
        normalized === '用户' ||
        normalized === '你' ||
        normalized === '玩家';

      if (isDefaultUser) return true;

      // 如果提供了 userDisplayName，检查是否匹配（不区分大小写）
      if (userDisplayName && userDisplayName.trim()) {
        const normalizedUserDisplayName = userDisplayName.trim().toLowerCase();
        return normalized === normalizedUserDisplayName;
      }

      return false;
    }

    for (const line of lines) {
      const match = line.match(/^([^：:]+)[：:](.*?)(?:\|(.+))?$/);
      if (match) {
        const speaker = match[1].trim();
        const content = match[2].trim();
        const timestamp = match[3]?.trim();
        const isUser = isUserCharacter(speaker);

        historyMessages.push({
          speaker,
          content,
          timestamp,
          isUser,
          hideLabel: false,
        });
      }
    }

    // 处理连续发言标签隐藏
    for (let i = 1; i < historyMessages.length; i++) {
      if (historyMessages[i].speaker === historyMessages[i - 1].speaker) {
        historyMessages[i].hideLabel = true;
      }
    }

    // 插入到消息列表顶部
    const messages = allMessages.value.get(contact) || [];
    allMessages.value.set(contact, [...historyMessages, ...messages]);

    // 如果当前选中的是这个联系人，更新显示
    if (currentContact.value === contact) {
      const oldScrollHeight = scrollContainer.value?.scrollHeight || 0;
      displayMessages.value = [...historyMessages, ...displayMessages.value];

      // 保持滚动位置
      nextTick(() => {
        if (scrollContainer.value) {
          const newScrollHeight = scrollContainer.value.scrollHeight;
          scrollContainer.value.scrollTop = newScrollHeight - oldScrollHeight;
        }
      });
    }

    hasLoadedHistory.value.add(contact);
    console.info('[PhonePanel] 历史记录加载完成，消息数:', historyMessages.length);
  } catch (error) {
    console.error('[PhonePanel] 加载历史记录失败:', error);
  } finally {
    isRefreshing.value = false;
  }
}

// 检查未读消息
async function checkUnreadMessages() {
  try {
    // 在第0层时（lastMessageId < 0），不检测历史记录，直接返回
    const lastMessageId = typeof getLastMessageId === 'function' ? getLastMessageId() : -1;
    if (lastMessageId < 0) {
      // 第0层时 getChatMessages 错误是正常的，不检测历史记录
      return;
    }

    // 从最新的几条消息中查找 phone 标签
    // 获取最后 5 条消息（从 lastMessageId - 4 到 lastMessageId）
    const chatMessages: any[] = [];
    try {
      const startId = Math.max(0, lastMessageId - 4);
      const endId = lastMessageId;
      for (let i = endId; i >= startId; i--) {
        const messages = getChatMessages(i);
        if (messages.length > 0) {
          chatMessages.unshift(...messages);
        }
      }
    } catch (error) {
      console.warn('[PhonePanel] 获取消息失败:', error);
      return;
    }
    const recentMessages = chatMessages.slice(-5);

    for (const msg of recentMessages) {
      const phoneRegex = /<phone>([\s\S]*?)<\/phone>/gi;
      let match;

      while ((match = phoneRegex.exec(msg.message || '')) !== null) {
        const phoneData = parsePhoneContent(match[0]);
        if (phoneData && phoneData.contact) {
          // 如果不是当前选中的联系人，标记为未读
          if (phoneData.contact !== currentContact.value) {
            unreadContacts.value.add(phoneData.contact);

            // 添加到联系人列表
            if (!contacts.value.includes(phoneData.contact)) {
              contacts.value.push(phoneData.contact);
            }

            // 保存消息
            const messages = allMessages.value.get(phoneData.contact) || [];
            messages.push(...phoneData.messages);
            allMessages.value.set(phoneData.contact, messages);

            // 保存到世界书
            saveMessageToWorldbook(phoneData.contact, phoneData.messages);
          }
        }
      }
    }
  } catch (error) {
    console.error('[PhonePanel] 检查未读消息失败:', error);
  }
}

// 保存消息到世界书
async function saveMessageToWorldbook(contact: string, messages: PhoneMessage[]) {
  try {
    const entryName = `[与${contact}的聊天记录]`;

    // 获取当前角色卡的世界书
    const worldbookNames: string[] = [];
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      if (charWorldbooks.primary) {
        worldbookNames.push(charWorldbooks.primary);
      }
      worldbookNames.push(...charWorldbooks.additional);
    } catch (error) {
      console.warn('[PhonePanel] 获取角色卡世界书失败:', error);
    }

    if (worldbookNames.length === 0) {
      console.warn('[PhonePanel] 没有可用的世界书');
      return;
    }

    const worldbookName = worldbookNames[0]; // 使用第一个世界书

    // 查找或创建条目
    const entries = await getWorldbook(worldbookName);
    const entry = entries.find((e: any) => e.name === entryName);

    // 格式化消息
    const formattedMessages = messages
      .map(msg => `${msg.speaker}：${msg.content}${msg.timestamp ? `|${msg.timestamp}` : ''}`)
      .join('\n');

    if (entry) {
      // 更新现有条目
      entry.content += '\n' + formattedMessages;
      await replaceWorldbook(worldbookName, [entry]);
      console.info('[PhonePanel] 消息已保存到世界书:', entryName);
    } else {
      // 创建新条目
      const newEntry: any = {
        name: entryName,
        content: formattedMessages,
        enabled: true,
        keys: [contact],
        priority: 100,
      };
      // 使用 addWorldbookEntries 而非 addWorldbookEntry
      await replaceWorldbook(worldbookName, [newEntry]);
      console.info('[PhonePanel] 新建世界书条目并保存消息:', entryName);
    }
  } catch (error) {
    console.error('[PhonePanel] 保存消息到世界书失败:', error);
  }
}

// 播放控制 - 自动播放
function autoPlay() {
  if (theaterMessages.value.length === 0) return;
  if (currentTheaterIndex.value >= theaterMessages.value.length) {
    console.info('[PhonePanel] 小剧场播放完毕');
    return;
  }

  isAutoPlaying.value = true;
  playNextTheaterMessage(true);
}

// 播放控制 - 单步播放
function playStep() {
  if (theaterMessages.value.length === 0) return;
  if (currentTheaterIndex.value >= theaterMessages.value.length) {
    console.info('[PhonePanel] 小剧场播放完毕');
    return;
  }

  isAutoPlaying.value = false;
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
  playNextTheaterMessage(false);
}

// 播放控制 - 重置
function reset() {
  isAutoPlaying.value = false;
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
  currentTheaterIndex.value = 0;
  displayMessages.value = [];
  console.info('[PhonePanel] 小剧场已重置');
}

// 播放下一条小剧场消息
function playNextTheaterMessage(isAuto: boolean) {
  if (currentTheaterIndex.value >= theaterMessages.value.length) {
    isAutoPlaying.value = false;
    return;
  }

  const message = theaterMessages.value[currentTheaterIndex.value];
  currentTheaterIndex.value++;

  // 打字机效果
  isTyping.value = true;
  const speed = message.content.length > 50 ? 30 : 50;

  displayMessages.value.push({ ...message, content: '' });
  const messageIndex = displayMessages.value.length - 1;

  let charIndex = 0;
  const typingInterval = setInterval(() => {
    if (charIndex < message.content.length) {
      displayMessages.value[messageIndex].content += message.content[charIndex];
      charIndex++;
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      isTyping.value = false;

      // 如果是自动播放，继续播放下一条
      if (isAuto && isAutoPlaying.value) {
        autoPlayTimer.value = window.setTimeout(() => {
          playNextTheaterMessage(true);
        }, 800);
      }
    }
  }, speed);
}

// 动态加载 html2canvas
async function loadHtml2Canvas(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (typeof (window as any).html2canvas !== 'undefined') {
      resolve((window as any).html2canvas);
      return;
    }

    const script = document.createElement('script');
    // 使用最新版本的 html2canvas（支持更多 CSS 特性）
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => {
      if (typeof (window as any).html2canvas !== 'undefined') {
        resolve((window as any).html2canvas);
      } else {
        reject(new Error('html2canvas 加载失败'));
      }
    };
    script.onerror = () => reject(new Error('html2canvas 脚本加载失败'));
    document.head.appendChild(script);
  });
}

// 截屏功能（参考模板的实现）
async function handleScreenshot() {
  try {
    // 动态加载 html2canvas
    const html2canvas = await loadHtml2Canvas();

    // 移除打字光标
    isTyping.value = false;

    await nextTick();

    // 参考模板：截取整个 display-wrapper（包含背景、水印等）
    const targetElement = scrollContainer.value?.parentElement; // display-wrapper
    if (!targetElement) {
      console.warn('[PhonePanel] 找不到截图目标元素');
      return;
    }

    // 参考模板的截图配置
    // 使用 onclone 回调在克隆 DOM 后替换 oklch 变量为 rgb 值
    const canvas = await html2canvas(targetElement, {
      backgroundColor: '#fdfdfb',
      scale: 2,
      useCORS: true,
      allowTaint: false,
      logging: false,
      onclone: (clonedDoc: Document, _element: HTMLElement) => {
        // 在克隆的文档中，替换所有 oklch CSS 变量为 rgb 值
        const style = clonedDoc.createElement('style');
        style.textContent = `
          /* 临时覆盖 oklch 变量为 rgb 值（html2canvas 兼容性处理） */
          :root {
            --background: rgb(247, 250, 252) !important;
            --foreground: rgb(51, 65, 85) !important;
            --card: rgb(253, 253, 253) !important;
            --card-foreground: rgb(51, 65, 85) !important;
            --popover: rgb(253, 253, 253) !important;
            --popover-foreground: rgb(51, 65, 85) !important;
            --primary: rgb(76, 175, 80) !important;
            --primary-foreground: rgb(253, 253, 253) !important;
            --secondary: rgb(235, 245, 240) !important;
            --secondary-foreground: rgb(89, 110, 100) !important;
            --muted: rgb(240, 245, 243) !important;
            --muted-foreground: rgb(128, 140, 135) !important;
            --accent: rgb(200, 230, 200) !important;
            --accent-foreground: rgb(51, 65, 85) !important;
            --destructive: rgb(220, 80, 80) !important;
            --destructive-foreground: rgb(220, 80, 80) !important;
            --border: rgb(217, 230, 225) !important;
            --input: rgb(230, 240, 235) !important;
            --ring: rgb(76, 175, 80) !important;
            --color-background: rgb(247, 250, 252) !important;
            --color-foreground: rgb(51, 65, 85) !important;
            --color-card: rgb(253, 253, 253) !important;
            --color-card-foreground: rgb(51, 65, 85) !important;
            --color-popover: rgb(253, 253, 253) !important;
            --color-popover-foreground: rgb(51, 65, 85) !important;
            --color-primary: rgb(76, 175, 80) !important;
            --color-primary-foreground: rgb(253, 253, 253) !important;
            --color-secondary: rgb(235, 245, 240) !important;
            --color-secondary-foreground: rgb(89, 110, 100) !important;
            --color-muted: rgb(240, 245, 243) !important;
            --color-muted-foreground: rgb(128, 140, 135) !important;
            --color-accent: rgb(200, 230, 200) !important;
            --color-accent-foreground: rgb(51, 65, 85) !important;
            --color-destructive: rgb(220, 80, 80) !important;
            --color-destructive-foreground: rgb(220, 80, 80) !important;
            --color-border: rgb(217, 230, 225) !important;
            --color-input: rgb(230, 240, 235) !important;
            --color-ring: rgb(76, 175, 80) !important;
          }
          /* 展开滚动容器，显示所有对话内容（参考模板的截图功能） */
          .scroll-container {
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            position: relative !important;
          }
          .chat-log {
            height: auto !important;
            max-height: none !important;
          }
          .display-wrapper {
            height: auto !important;
            min-height: auto !important;
            overflow: visible !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      },
    });

    // 下载图片
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    link.download = `小剧场_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();

    console.info('[PhonePanel] 截屏完成');
  } catch (error) {
    console.error('[PhonePanel] 截屏失败:', error);
    if (typeof toastr !== 'undefined') {
      toastr.error('截屏失败，请检查控制台日志');
    }
  }
}

// 加载小剧场文本（从 StatusBlock 解析）
async function loadTheaterText(): Promise<void> {
  theaterTitle.value = '手机 · Phone';
  theaterMessages.value = [];
  contacts.value = [];
  currentTheaterIndex.value = 0;
  clearTimers();

  try {
    // 从当前消息的 StatusBlock 中解析小剧场
    let skitData: { title: string; content: string } | null = null;

    if (props.messageId !== undefined) {
      const messages = getChatMessages(props.messageId);
      if (messages.length > 0) {
        const messageText = messages[0].message || '';
        skitData = parseSkitFromStatusBlock(messageText);
      }
    }

    // 如果当前消息没有，尝试从最近的几条消息中查找
    if (!skitData) {
      try {
        // 从当前消息开始，向前查找最多10条消息
        const startId =
          props.messageId !== undefined
            ? props.messageId
            : typeof getLastMessageId === 'function'
              ? getLastMessageId()
              : null;
        if (startId !== null) {
          for (let i = startId; i >= Math.max(0, startId - 10); i--) {
            const messages = getChatMessages(i);
            if (messages.length > 0) {
              const messageText = messages[0].message || '';
              skitData = parseSkitFromStatusBlock(messageText);
              if (skitData) break;
            }
          }
        }
      } catch (e) {
        console.warn('查找小剧场失败:', e);
      }
    }

    // 如果从消息文本中没有找到，尝试从 props.statusBlock 中获取（备用）
    if (!skitData && props.statusBlock?.小剧场) {
      // 从 statusBlock.小剧场 中解析（可能已经是解析后的内容）
      const theaterContent = props.statusBlock.小剧场;
      // 尝试解析主题名：内容格式
      const titleContentMatch = theaterContent.match(/^([^：:\n]+?)[：:]\s*(.+)$/s);
      if (titleContentMatch) {
        skitData = {
          title: titleContentMatch[1].trim(),
          content: titleContentMatch[2].trim(),
        };
      } else {
        skitData = {
          title: '',
          content: theaterContent,
        };
      }
    }

    if (skitData && skitData.content) {
      // 设置标题
      theaterTitle.value = skitData.title || '手机 · Phone';

      // 解析内容
      theaterMessages.value = parseTheaterContent(skitData.content);
      console.info('[PhonePanel] 小剧场消息解析完成，消息数:', theaterMessages.value.length);

      // 如果有联系人，默认选中第一个
      if (contacts.value.length > 0 && !currentContact.value) {
        selectContact(contacts.value[0]);
      }

      // 自动展开联系人列表
      if (unreadContacts.value.size > 0) {
        showContacts.value = true;
      }
    } else {
      // 没有小剧场内容，保持默认标题
      theaterTitle.value = '手机 · Phone';
    }
  } catch (error) {
    console.error('[PhonePanel] 加载小剧场失败:', error);
  }
}

// 清除定时器
function clearTimers() {
  if (autoPlayTimer.value) {
    clearTimeout(autoPlayTimer.value);
    autoPlayTimer.value = null;
  }
  isAutoPlaying.value = false;
  isTyping.value = false;
}

// 监听 show、messageId 和 statusBlock 变化
watch(
  () => [props.show, props.messageId, props.statusBlock],
  async () => {
    if (props.show) {
      await loadTheaterText();
    } else {
      clearTimers();
    }
  },
  { immediate: true },
);

// 监听面板关闭
watch(
  () => props.show,
  newShow => {
    if (!newShow) {
      // 重置状态
      currentTheaterIndex.value = 0;
      isAutoPlaying.value = false;
      isTyping.value = false;
      if (autoPlayTimer.value) {
        clearTimeout(autoPlayTimer.value);
        autoPlayTimer.value = null;
      }
    }
  },
);

// 导出待发送消息（供 GalgamePlayer 调用）
function getPendingMessages(): string {
  const result: string[] = [];

  for (const [contact, messages] of pendingMessages.value.entries()) {
    if (messages.length > 0) {
      const formattedMessages = messages
        .map(msg => `${msg.content}${msg.timestamp ? `|${msg.timestamp}` : ''}`)
        .join('\n');
      result.push(`<phone>\n与${contact}的聊天：${formattedMessages}\n</phone>`);
    }
  }

  // 清空待发送列表
  pendingMessages.value.clear();

  return result.join('\n');
}

// 暴露方法给父组件
defineExpose({
  getPendingMessages,
});
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@300;500;700&family=Zen+Maru+Gothic:wght@400;700&display=swap');

.theater-window {
  width: 90%;
  max-width: 28rem;
  max-height: 85vh;
  background: linear-gradient(to bottom, #fafffe 0%, #f0fdf4 100%);
  border: 2px solid rgba(129, 199, 132, 0.3);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(76, 175, 80, 0.15);
  overflow: hidden;
}

.theater-window-fullscreen {
  width: 90%;
  max-width: 32rem; /* 与角色状态栏保持一致 */
  max-height: none;
  aspect-ratio: 32 / 23; /* 约等于 620/450 的比例，但更小 */
}

.title-bar {
  height: 32px;
  background: linear-gradient(to right, #81c784 0%, #a5d6a7 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  color: #ffffff;
  font-weight: 500;
  font-size: 13px;
  letter-spacing: 2px;
  user-select: none;
  flex-shrink: 0;
  font-family: 'Zen Maru Gothic', sans-serif;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.15);
}

.title-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-charm {
  width: 12px;
  height: 12px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 0 2px #66bb6a inset;
}

.win-controls {
  display: flex;
  gap: 6px;
}

.win-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.4);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  color: #4caf50;
  padding: 0;
}

.win-btn:hover {
  transform: scale(1.1);
  filter: brightness(1.1);
  box-shadow: 0 2px 4px rgba(76, 175, 80, 0.2);
}

.win-btn .icon {
  width: 12px;
  height: 12px;
}

.menu-bar {
  height: 32px;
  background: rgba(232, 245, 233, 0.5);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(129, 199, 132, 0.2);
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 20px;
  font-size: 14px;
  color: #4caf50;
  flex-shrink: 0;
  font-family: 'SimSun', serif;
}

.menu-item {
  position: relative;
  transition: color 0.2s;
  cursor: pointer;
}

.menu-item:hover {
  color: #2e7d32;
}

.menu-item::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 2px;
  background: #66bb6a;
  transition: width 0.3s;
}

.menu-item:hover::after {
  width: 100%;
}

.menu-item-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.contacts-sidebar {
  width: 200px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(20px);
  border-right: 1px solid rgba(129, 199, 132, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.contacts-header {
  padding: 12px;
  border-bottom: 1px solid rgba(129, 199, 132, 0.2);
  font-size: 13px;
  color: #4caf50;
  font-weight: 500;
}

.contacts-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.contacts-list::-webkit-scrollbar {
  width: 4px;
  background: transparent;
}

.contacts-list::-webkit-scrollbar-thumb {
  background: rgba(129, 199, 132, 0.3);
  border-radius: 2px;
}

.contact-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s;
  position: relative;
  margin-bottom: 4px;
}

.contact-item:hover {
  background: rgba(129, 199, 132, 0.15);
}

.contact-item.active {
  background: rgba(129, 199, 132, 0.25);
}

.contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #81c784, #66bb6a);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
  position: relative;
}

.contact-info {
  flex: 1;
  min-width: 0;
}

.contact-name {
  font-size: 13px;
  color: #2e7d32;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.contact-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #f44336;
  border-radius: 50%;
  display: none;
}

.contact-item.has-unread .contact-badge {
  display: block;
}

.avatar-unread-dot {
  position: absolute;
  top: 0;
  right: 0;
  width: 10px;
  height: 10px;
  background: #f44336;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.9);
  z-index: 1;
}

.chat-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
}

.panel-body {
  flex: 1;
  display: flex;
  flex-direction: row;
  min-height: 0;
  overflow: hidden;
}

.display-wrapper {
  flex: 1;
  min-height: 0;
  border: 1px solid rgba(165, 214, 167, 0.3);
  margin: 8px 8px 0 8px;
  position: relative;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(20px);
  overflow: hidden;
  box-shadow: inset 0 0 30px rgba(76, 175, 80, 0.05);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
}

.bg-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('https://files.catbox.moe/2td8l0.jpg');
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover; /* 参考模板：使用 cover 填满整个对话界面 */
  opacity: 0.15; /* 参考模板：使用 0.15 的透明度 */
  filter: sepia(0.4) contrast(0.9); /* 参考模板：使用相同的滤镜效果 */
  z-index: 0;
  mix-blend-mode: multiply;
}

.watermark-xi {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 160px;
  color: #81c784;
  font-weight: normal;
  user-select: none;
  pointer-events: none;
  opacity: 0.04;
  z-index: 1;
  font-family: 'Songti SC', serif;
  writing-mode: vertical-rl;
  text-shadow: none;
  border: 4px double #a5d6a7;
  padding: 20px;
}

.scroll-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow-y: scroll;
  overflow-x: hidden;
  z-index: 5;
  scroll-behavior: smooth;
}

.scroll-container::-webkit-scrollbar {
  width: 6px;
  background: transparent;
}

.scroll-container::-webkit-scrollbar-thumb {
  background: rgba(129, 199, 132, 0.3);
  border-radius: 3px;
}

.scroll-container::-webkit-scrollbar-thumb:hover {
  background: rgba(129, 199, 132, 0.6);
}

.chat-log {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 30px 24px;
}

/* 消息容器（包含名字和气泡，但不共享背景） */
.message-container {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.message-container.message-left {
  align-items: flex-start;
}

.message-container.message-right {
  align-items: flex-end;
}

.speaker-label {
  font-size: 0.75em;
  color: #788a82;
  margin-bottom: 4px;
  padding: 0 8px;
}

.timestamp {
  font-size: 0.75em;
  color: #aaa;
  margin-top: 4px;
  padding: 0 8px;
}

/* 参考界面的气泡样式 */
.bubble {
  max-width: 80%;
  padding: 10px 15px;
  border-radius: 18px;
  position: relative;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.bubble-left {
  background-color: rgba(224, 242, 233, 0.9);
  color: #5a6e65;
  border-bottom-left-radius: 4px;
  align-self: flex-start;
}

.bubble-right {
  background-color: rgba(255, 255, 255, 0.85);
  color: #788a82;
  border: 1px solid #d1e5d9;
  border-bottom-right-radius: 4px;
  align-self: flex-end;
}

.sub-text {
  font-family: 'KaiTi', '楷体', serif;
  font-size: 0.9em;
  color: #66bb6a;
  margin: 0 2px;
}

.cursor {
  display: inline-block;
  width: 6px;
  height: 6px;
  background: #4caf50;
  border-radius: 50%;
  animation: blink 1s infinite;
  margin-left: 4px;
  vertical-align: middle;
}

.cmd-bar {
  height: 48px;
  min-height: 48px;
  background: rgba(232, 245, 233, 0.5);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
  border-top: 1px solid rgba(165, 214, 167, 0.3);
}

.cmd-input {
  flex: 1;
  height: 32px;
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(129, 199, 132, 0.3);
  border-radius: 16px;
  font-family: 'Noto Serif SC', sans-serif;
  font-size: 14px;
  color: #2e7d32;
  padding: 0 12px;
  outline: none;
  transition: all 0.3s;
}

.cmd-input:focus {
  border-color: #66bb6a;
  background: rgba(255, 255, 255, 0.9);
}

.cmd-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.cmd-send-btn {
  padding: 6px 16px;
  height: 32px;
  background: rgba(129, 199, 132, 0.8);
  border: 1px solid rgba(129, 199, 132, 0.5);
  border-radius: 16px;
  color: white;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 40px;
}

.cmd-send-btn:hover:not(:disabled) {
  background: rgba(129, 199, 132, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

.cmd-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.cmd-send-btn .icon {
  width: 16px;
  height: 16px;
}

.status-bar {
  height: 48px;
  min-height: 48px;
  background: rgba(240, 253, 244, 0.8);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 0 10px;
  flex-shrink: 0;
  z-index: 20;
}

.jade-btn {
  padding: 6px 18px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border: 1.5px solid rgba(129, 199, 132, 0.4);
  border-radius: 20px;
  font-family: 'Zen Maru Gothic', sans-serif;
  font-size: 11px;
  color: #4caf50;
  cursor: pointer;
  outline: none;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.jade-btn:hover {
  background: rgba(129, 199, 132, 0.2);
  color: #2e7d32;
  border-color: #66bb6a;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

.jade-btn-red:hover {
  border-color: #81c784;
  color: #43a047;
  background: rgba(165, 214, 167, 0.2);
}

.refresh-indicator {
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(129, 199, 132, 0.3);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2);
  z-index: 10;
  font-size: 12px;
  color: #2e7d32;
}

.refresh-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(129, 199, 132, 0.3);
  border-top-color: #4caf50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.settings-overlay {
  position: absolute;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
}

.settings-panel {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 12px;
  border: 2px solid rgba(129, 199, 132, 0.3);
  box-shadow: 0 10px 40px rgba(76, 175, 80, 0.2);
  width: 90%;
  max-width: 400px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.settings-header {
  background: linear-gradient(to right, #66bb6a 0%, #81c784 100%);
  color: white;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(129, 199, 132, 0.3);
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.settings-close {
  background: transparent;
  border: none;
  color: white;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.2s;
}

.settings-close:hover {
  opacity: 0.8;
}

.settings-body {
  padding: 20px;
  overflow-y: auto;
}

.settings-item {
  margin-bottom: 20px;
}

.settings-item label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #2e7d32;
  font-weight: 500;
}

.settings-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(129, 199, 132, 0.3);
  border-radius: 8px;
  font-size: 14px;
  color: #2e7d32;
  background: rgba(255, 255, 255, 0.8);
  outline: none;
  transition: all 0.3s;
  box-sizing: border-box;
}

.settings-input:focus {
  border-color: #66bb6a;
  background: rgba(255, 255, 255, 1);
}

.settings-btn {
  margin-top: 8px;
  padding: 6px 16px;
  background: rgba(129, 199, 132, 0.8);
  border: 1px solid rgba(129, 199, 132, 0.5);
  border-radius: 8px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: rgba(129, 199, 132, 1);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

@keyframes blink {
  0% {
    opacity: 0.2;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
  100% {
    opacity: 0.2;
    transform: scale(0.8);
  }
}

@media (max-width: 800px) {
  .theater-window:not(.theater-window-fullscreen) {
    width: 95%;
    max-width: 28rem;
  }

  .theater-window {
    max-height: 90vh;
  }

  .theater-window-fullscreen {
    width: 90%;
    max-width: 28rem; /* 在手机上使用更小的尺寸，与角色状态栏保持一致 */
    border-radius: 12px; /* 保留圆角，不完全占满屏幕 */
    max-height: 90vh;
  }
}
</style>
