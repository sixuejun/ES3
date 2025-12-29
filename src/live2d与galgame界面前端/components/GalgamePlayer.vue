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

    <!-- 角色立绘 - 支持多角色显示 -->
    <CharacterSprite
      v-for="(character, index) in displayCharacters"
      :key="`character-${index}-${character.name}`"
      :sprite-scale="character.scale"
      :sprite-position-x="character.positionX"
      :sprite-position-y="character.positionY"
      :live2d-scale="character.scale"
      :live2d-position-x="character.positionX"
      :live2d-position-y="character.positionY"
      :sprite-type="character.type"
      :image-url="character.imageUrl"
      :live2d-model-id="character.modelId"
      :live2d-models="live2dModels"
      :motion="character.motion"
      :expression="character.expression"
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
        style="animation-delay: 25ms"
        aria-label="手机"
        @click.stop="handleTheaterClick"
      >
        <svg
          class="h-5 w-5"
          viewBox="0 0 1024 1024"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          fill="currentColor"
        >
          <path
            d="M820.409449 797.228346q0 25.19685-10.07874 46.866142t-27.716535 38.299213-41.322835 26.204724-50.897638 9.574803l-357.795276 0q-27.212598 0-50.897638-9.574803t-41.322835-26.204724-27.716535-38.299213-10.07874-46.866142l0-675.275591q0-25.19685 10.07874-47.370079t27.716535-38.80315 41.322835-26.204724 50.897638-9.574803l357.795276 0q27.212598 0 50.897638 9.574803t41.322835 26.204724 27.716535 38.80315 10.07874 47.370079l0 675.275591zM738.771654 170.330709l-455.559055 0 0 577.511811 455.559055 0 0-577.511811zM510.992126 776.062992q-21.165354 0-36.787402 15.11811t-15.622047 37.291339q0 21.165354 15.622047 36.787402t36.787402 15.622047q22.173228 0 37.291339-15.622047t15.11811-36.787402q0-22.173228-15.11811-37.291339t-37.291339-15.11811zM591.622047 84.661417q0-8.062992-5.03937-12.598425t-11.086614-4.535433l-128 0q-5.03937 0-10.582677 4.535433t-5.543307 12.598425 5.03937 12.598425 11.086614 4.535433l128 0q6.047244 0 11.086614-4.535433t5.03937-12.598425z"
          ></path>
        </svg>
        <span class="text-sm">手机</span>
      </button>
      <button
        v-if="characterMenuExpanded"
        class="bg-card/80 text-foreground animate-in fade-in slide-in-from-top-2 flex items-center gap-2 rounded-full p-2 pr-4 shadow-lg backdrop-blur-sm transition-colors duration-200 hover:bg-card"
        style="animation-delay: 75ms"
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

      <!-- 手机图标提示（有未读消息时显示） -->
      <button
        v-if="hasUnreadMessages"
        class="bg-card/80 text-foreground animate-in fade-in slide-in-from-top-2 flex items-center justify-center rounded-full p-2 shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-card hover:scale-110"
        style="animation-delay: 100ms"
        aria-label="查看未读消息"
        @click.stop="handleQuickTheaterClick"
      >
        <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 4h10a1 1 0 011 1v14a1 1 0 01-1 1H7a1 1 0 01-1-1V5a1 1 0 011-1z"
          />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5h2m-2 14h2" />
        </svg>
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

    <!-- 小纸条（位于对话框上方，界面中间偏右） -->
    <div
      v-if="
        !blackScreen &&
        !showChoices &&
        currentDialogue &&
        currentNoteContent &&
        currentDialogue.type !== 'blackscreen' &&
        currentDialogue.type !== 'choice'
      "
      class="absolute z-40"
      :style="{
        right: '20%',
        top: '20%',
        maxWidth: '280px',
      }"
    >
      <NoteCard
        :content="currentNoteContent"
        :note-unit-id="currentNoteUnitId"
        :initial-position="currentNotePosition"
        @position-change="handleNotePositionChange"
      />
    </div>

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
      :is-loading="false"
      :streaming-text="undefined"
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
      :user-display-name="userDisplayName"
      :on-user-display-name-change="
        (name: string) => {
          userDisplayName = name;
          saveToStorage(STORAGE_KEYS.USER_DISPLAY_NAME, name);
        }
      "
      :sprite-settings="spriteSettings"
      :on-sprite-settings-change="s => (spriteSettings = s)"
      :live2d-settings="live2dSettings"
      :on-live2d-settings-change="(s: typeof live2dSettings) => (live2dSettings = s)"
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

    <!-- 手机面板（小剧场 + 手机消息） -->
    <PhonePanel
      ref="phonePanelRef"
      :show="showPhonePanel"
      :message-id="currentDialogue?.message_id"
      :status-block="currentDialogue?.statusBlock"
      :on-close="() => (showPhonePanel = false)"
    />

    <!-- 历史对话框 -->
    <div
      v-if="showHistoryDialog"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      @click.self="showHistoryDialog = false"
    >
      <div
        class="bg-card/95 text-foreground relative max-h-[85vh] w-[90%] max-w-3xl rounded-2xl shadow-2xl backdrop-blur-md"
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
            <svg
              class="h-6 w-6"
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              fill="currentColor"
            >
              <path
                d="M170.666667 128h597.333333l115.498667 115.498667a42.666667 42.666667 0 0 1 12.501333 30.165333V853.333333a42.666667 42.666667 0 0 1-42.666667 42.666667H170.666667a42.666667 42.666667 0 0 1-42.666667-42.666667V170.666667a42.666667 42.666667 0 0 1 42.666667-42.666667z m128 42.666667v213.333333h384V170.666667H298.666667z m-42.666667 341.333333v298.666667h512v-298.666667H256z m298.666667-298.666667h85.333333v128h-85.333333V213.333333z"
              ></path>
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
import { computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch } from 'vue';
import { usePendingTextStore } from '../stores/pendingText';
import type { ChoiceOption, DialogBoxStyle, DialogueItem } from '../types/galgame';
import { defaultDialogStyle } from '../types/galgame';
import type { MessageBlock } from '../types/message';
import {
  CharacterStateManager,
  createCharacterConfig,
  detectCharacterExit,
  type CharacterDisplayConfig,
  type CharacterSettings,
} from '../utils/characterParser';
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
import NoteCard from './NoteCard.vue';
import PhonePanel from './PhonePanel.vue';
import SettingsPanel from './SettingsPanel.vue';

// 常量：localStorage 键名
const STORAGE_KEYS = {
  DIALOG_STYLE: 'galgame_dialog_style',
  SPRITE_SETTINGS: 'galgame_sprite_settings',
  LIVE2D_SETTINGS: 'galgame_live2d_settings',
  USER_DISPLAY_NAME: 'galgame_user_display_name',
} as const;

// 预发送文本 store
const pendingTextStore = usePendingTextStore();

const containerRef = ref<HTMLDivElement | null>(null);
const autoPlayTimerRef = ref<ReturnType<typeof setTimeout> | null>(null);

// 对话数据 - 使用 shallowRef 优化性能（数组元素变化时需要整体替换）
const dialogues = shallowRef<DialogueItem[]>([]);
const currentDialogIndex = ref(0);
const currentDialogue = computed(() => dialogues.value[currentDialogIndex.value] || null);

// 标志：是否正在执行历史跳转（防止 loadDialoguesFromTavern 重置索引）
const isJumpingToHistory = ref(false);

// 当前演出单元对应的小纸条（通过 noteUnitId 查找）
const currentNoteContent = computed(() => {
  if (!currentDialogue.value) return undefined;
  // 查找绑定到当前演出单元的小纸条
  const noteDialogue = dialogues.value.find(d => d.noteUnitId === currentDialogue.value?.unitId && d.noteContent);
  return noteDialogue?.noteContent;
});

const currentNoteUnitId = computed(() => {
  if (!currentDialogue.value) return undefined;
  const noteDialogue = dialogues.value.find(d => d.noteUnitId === currentDialogue.value?.unitId && d.noteContent);
  return noteDialogue?.noteUnitId;
});

const currentNotePosition = computed(() => {
  if (!currentDialogue.value) return undefined;
  const noteDialogue = dialogues.value.find(d => d.noteUnitId === currentDialogue.value?.unitId && d.noteContent);
  return noteDialogue?.notePosition;
});

// 处理小纸条位置变化
function handleNotePositionChange(unitId: string, position: { x: number; y: number }) {
  const noteDialogue = dialogues.value.find(d => d.noteUnitId === unitId && d.noteContent);
  if (noteDialogue) {
    noteDialogue.notePosition = position;
    // 持久化保存位置（使用 localStorage）
    const storageKey = `note_position_${unitId}`;
    localStorage.setItem(storageKey, JSON.stringify(position));
  }
}

// UI 状态
const showSettings = ref(false);
const isFullscreen = ref(false);
const autoPlay = ref(false);
const autoPlaySpeed = ref(3000);
const menuExpanded = ref(false);
const characterMenuExpanded = ref(false);
const showCharacterPanel = ref(false);
const showPhonePanel = ref(false);
const blackScreen = ref(false);
const blackScreenText = ref('');
const showChoices = ref(false);
const customModeEnabled = ref(false);
const showInputBox = ref(false);
const inputText = ref('');
const inputRef = ref<HTMLInputElement | null>(null);
const phonePanelRef = ref<InstanceType<typeof PhonePanel> | null>(null);

// 移除流式界面状态（已取消流式功能）

// 样式设置 - 从 localStorage 加载
// 立绘设置（静态图片）- 支持左、右、单角色三种模式的独立设置
const defaultSpriteSettings: CharacterSettings = {
  left: { scale: 1.15, positionX: 30, positionY: 50 }, // 左侧：30%，缩放115%
  right: { scale: 1.15, positionX: 70, positionY: 50 }, // 右侧：70%，缩放115%
  single: { scale: 1.0, positionX: 30, positionY: 50 }, // 单角色：30%，缩放100%
};

const defaultLive2dSettings: CharacterSettings = {
  left: { scale: 1.15, positionX: 30, positionY: 50 }, // 左侧：30%，缩放115%
  right: { scale: 1.15, positionX: 70, positionY: 50 }, // 右侧：70%，缩放115%
  single: { scale: 1.0, positionX: 30, positionY: 50 }, // 单角色：30%，缩放100%
};

const spriteSettings = ref<CharacterSettings>(loadFromStorage(STORAGE_KEYS.SPRITE_SETTINGS, defaultSpriteSettings));

const live2dSettings = ref<CharacterSettings>(loadFromStorage(STORAGE_KEYS.LIVE2D_SETTINGS, defaultLive2dSettings));
const dialogStyle = ref<DialogBoxStyle>(loadFromStorage(STORAGE_KEYS.DIALOG_STYLE, defaultDialogStyle));
const previewStyle = ref<DialogBoxStyle>({ ...dialogStyle.value });

// 用户显示名称 - 从 localStorage 加载，默认为空（使用默认判断逻辑）
const userDisplayName = ref<string>(loadFromStorage(STORAGE_KEYS.USER_DISPLAY_NAME, ''));

// Live2D 模型数据 - 从世界书加载，使用 shallowRef（模型配置不需要深层响应式）
const live2dModels = shallowRef<any[]>([]);
// Live2D 世界书资源缓存
const live2dWorldbookModels = shallowRef<Map<string, any>>(new Map());

// 工具函数：迁移旧格式的设置数据到新格式
function migrateOldSettings(oldData: any): CharacterSettings | null {
  // 检查是否是旧格式（有 scale, positionX, positionY 但没有 left, right, single）
  if (
    oldData &&
    typeof oldData === 'object' &&
    'scale' in oldData &&
    'positionX' in oldData &&
    'positionY' in oldData &&
    !('left' in oldData) &&
    !('right' in oldData) &&
    !('single' in oldData)
  ) {
    // 旧格式：{ scale, positionX, positionY }
    // 转换为新格式：{ left, right, single }
    const oldScale = oldData.scale ?? 1.15;
    return {
      left: { scale: oldScale, positionX: 30, positionY: 50 },
      right: { scale: oldScale, positionX: 70, positionY: 50 },
      single: { scale: 1.0, positionX: 30, positionY: 50 },
    };
  }
  return null;
}

// 工具函数：从 localStorage 加载数据，支持数据迁移
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);

      // 如果是设置相关的 key，检查是否需要迁移
      if (key === STORAGE_KEYS.SPRITE_SETTINGS || key === STORAGE_KEYS.LIVE2D_SETTINGS) {
        const migrated = migrateOldSettings(parsed);
        if (migrated) {
          // 保存迁移后的数据
          localStorage.setItem(key, JSON.stringify(migrated));
          console.info(`[GalgamePlayer] 已迁移 ${key} 数据格式`);
          return migrated as T;
        }
      }

      return parsed as T;
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

watch(
  live2dSettings,
  newSettings => {
    saveToStorage(STORAGE_KEYS.LIVE2D_SETTINGS, newSettings);
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

// 角色状态管理器（管理在场角色）
const characterStateManager = new CharacterStateManager();

// 为每个演出单元计算角色状态快照（用于回顾时保持正确的角色显示模式）
function computeCharacterStateSnapshot(
  dialogues: DialogueItem[],
  targetIndex: number,
): {
  charactersBefore: string[];
  charactersAfter: string[];
  isNewCharacterEntry: boolean;
  isCharacterExit: boolean;
} {
  const snapshotManager = new CharacterStateManager();
  let isNewCharacterEntry = false;
  let isCharacterExit = false;

  // 从第一个对话开始，逐个处理到目标索引之前
  for (let i = 0; i < targetIndex; i++) {
    const d = dialogues[i];
    if (!d) continue;

    // CG模式不处理角色状态
    if (d.isCG || d.type === 'cg') {
      snapshotManager.clearAll();
      continue;
    }

    // 检测离场标记（优先从文本检测，如果文本包含"离场"关键字则使用character字段）
    let exitCharacter = d.text ? detectCharacterExit(d.text) : null;
    if (!exitCharacter && d.character && d.text && d.text.includes('离场')) {
      exitCharacter = d.character;
    }

    if (exitCharacter) {
      snapshotManager.processDialogue(exitCharacter, true);
    } else if (d.character) {
      snapshotManager.processDialogue(d.character, false);
    }
  }

  // 获取目标索引之前的状态
  const charactersBefore = snapshotManager.getOnStageCharacters();

  // 处理目标索引的对话，检查是否是新角色登场或角色离场
  const targetDialogue = dialogues[targetIndex];
  if (targetDialogue && !targetDialogue.isCG && targetDialogue.type !== 'cg') {
    // 检测离场标记（优先从文本检测，如果文本包含"离场"关键字则使用character字段）
    let exitCharacter = targetDialogue.text ? detectCharacterExit(targetDialogue.text) : null;
    if (!exitCharacter && targetDialogue.character && targetDialogue.text && targetDialogue.text.includes('离场')) {
      exitCharacter = targetDialogue.character;
    }

    if (exitCharacter) {
      // 角色离场
      isCharacterExit = true;
      snapshotManager.processDialogue(exitCharacter, true);
    } else if (targetDialogue.character) {
      // 检查是否是新角色登场
      const beforeEntry = snapshotManager.getOnStageCharacters();
      if (!beforeEntry.includes(targetDialogue.character)) {
        isNewCharacterEntry = true;
      }
      snapshotManager.processDialogue(targetDialogue.character, false);
    }
  }

  return {
    charactersBefore,
    charactersAfter: snapshotManager.getOnStageCharacters(),
    isNewCharacterEntry,
    isCharacterExit,
  };
}

// 解析并返回当前需要显示的所有角色（自动管理双角色显示）
const displayCharacters = computed<CharacterDisplayConfig[]>(() => {
  const dialogue = currentDialogue.value;

  if (!dialogue) {
    return [];
  }

  // CG模式不显示角色
  if (dialogue.isCG || dialogue.type === 'cg') {
    // CG模式时清空在场角色
    characterStateManager.clearAll();
    return [];
  }

  const currentIndex = currentDialogIndex.value;
  const isReviewing = currentIndex < dialogues.value.length - 1;

  let onStageCharacters: string[];
  let reviewSnapshotManager: CharacterStateManager | null = null;

  if (isReviewing) {
    // 回顾模式：使用快照来决定角色状态
    const snapshot = computeCharacterStateSnapshot(dialogues.value, currentIndex);

    // 如果当前演出单元是新角色登场，回顾之前的应该保持单角色模式（只显示第一个角色）
    // 如果当前演出单元是角色离场，回顾之前的应该保持双角色模式（显示离场前的两个角色）
    if (snapshot.isNewCharacterEntry) {
      // 新角色登场：回顾时保持单角色模式（只显示之前的第一个角色）
      onStageCharacters = snapshot.charactersBefore.slice(0, 1);
      // 创建一个临时的状态管理器来计算位置
      reviewSnapshotManager = new CharacterStateManager();
      snapshot.charactersBefore.slice(0, 1).forEach(char => {
        reviewSnapshotManager!.processDialogue(char, false);
      });
    } else if (snapshot.isCharacterExit) {
      // 角色离场：回顾时保持双角色模式（显示离场前的两个角色，即 charactersBefore）
      // 确保最多显示2个角色
      onStageCharacters = snapshot.charactersBefore.slice(0, 2);
      // 创建一个临时的状态管理器来计算位置
      reviewSnapshotManager = new CharacterStateManager();
      snapshot.charactersBefore.slice(0, 2).forEach(char => {
        reviewSnapshotManager!.processDialogue(char, false);
      });
    } else {
      // 其他情况，使用之前的状态（保持原有逻辑）
      onStageCharacters = snapshot.charactersBefore;
      // 创建一个临时的状态管理器来计算位置
      reviewSnapshotManager = new CharacterStateManager();
      snapshot.charactersBefore.forEach(char => {
        reviewSnapshotManager!.processDialogue(char, false);
      });
    }
  } else {
    // 正常播放模式：实时更新角色状态
    // 检测离场标记（优先从文本中检测，如果没有则从character字段获取）
    let exitCharacter = dialogue.text ? detectCharacterExit(dialogue.text) : null;

    // 如果文本中没有检测到离场标记，但dialogue.character存在且文本中包含"离场"关键字，使用character字段
    if (!exitCharacter && dialogue.character && dialogue.text && dialogue.text.includes('离场')) {
      exitCharacter = dialogue.character;
    }

    // 更新角色状态
    // 如果有离场标记，传入离场的角色名；否则传入当前对话的角色名
    onStageCharacters = exitCharacter
      ? characterStateManager.processDialogue(exitCharacter, true)
      : characterStateManager.processDialogue(dialogue.character, false);
  }

  // 如果没有在场角色，返回空数组
  if (onStageCharacters.length === 0) {
    return [];
  }

  // 为每个在场角色创建显示配置
  const manager = reviewSnapshotManager || characterStateManager;
  return onStageCharacters
    .map(charName => {
      const position = manager.getCharacterPosition(charName);
      const totalCount = onStageCharacters.length;

      // 确定角色类型（live2d / image / none）
      // 优先查找 Live2D 模型
      const live2dModel = live2dModels.value.find(m => m.name === charName);

      let config: CharacterDisplayConfig;

      if (live2dModel) {
        // Live2D 模型：使用 live2dSettings
        config = createCharacterConfig(charName, position, totalCount, live2dSettings.value, false);
        config.type = 'live2d';
        config.modelId = live2dModel.id;
      } else {
        // 如果没有 Live2D 模型，查找立绘资源
        // 使用 spriteSettings
        config = createCharacterConfig(charName, position, totalCount, spriteSettings.value, true);

        // 如果是当前发言的角色，使用当前对话的立绘资源
        if (dialogue.character === charName && dialogue.sprite?.imageUrl) {
          config.type = 'image';
          config.imageUrl = dialogue.sprite.imageUrl;
        } else {
          // 对于非当前发言的角色，尝试从历史对话中查找立绘
          // 查找该角色最近一次对话中的立绘资源
          const characterDialogue = dialogues.value
            .slice()
            .reverse()
            .find(d => d.character === charName && d.sprite?.imageUrl);

          if (characterDialogue?.sprite?.imageUrl) {
            config.type = 'image';
            config.imageUrl = characterDialogue.sprite.imageUrl;
          } else {
            config.type = 'none';
          }
        }
      }

      // 应用动作和表情（只给当前发言的角色）
      if (dialogue.character === charName) {
        config.motion = dialogue.motion;
        config.expression = dialogue.expression;
      }

      return config;
    })
    .filter(char => char.type !== 'none'); // 过滤掉没有资源的角色
});

// 用户消息编辑状态（内存中）
const userMessageEdits = ref<Map<number, { text?: string; deleted?: boolean }>>(new Map());

// 判断用户是否在最后一条对话
function isUserAtLastDialogue(): boolean {
  return currentDialogIndex.value >= dialogues.value.length - 1;
}

// 深度比较两个对话项是否相同（比较关键字段）
function areDialoguesEqual(d1: DialogueItem, d2: DialogueItem): boolean {
  // 比较关键标识字段
  if (d1.unitId !== d2.unitId || d1.message_id !== d2.message_id) {
    return false;
  }

  // 比较主要内容字段
  if (d1.character !== d2.character || d1.text !== d2.text || d1.type !== d2.type || d1.role !== d2.role) {
    return false;
  }

  // 比较场景和视觉效果
  if (
    d1.scene !== d2.scene ||
    d1.sceneImageUrl !== d2.sceneImageUrl ||
    d1.motion !== d2.motion ||
    d1.expression !== d2.expression ||
    d1.isCG !== d2.isCG ||
    d1.cgImageUrl !== d2.cgImageUrl
  ) {
    return false;
  }

  // 比较立绘状态
  if (
    d1.sprite?.type !== d2.sprite?.type ||
    d1.sprite?.live2dModelId !== d2.sprite?.live2dModelId ||
    d1.sprite?.imageUrl !== d2.sprite?.imageUrl
  ) {
    return false;
  }

  // 比较选项（简单比较选项数量）
  if ((d1.options?.length || 0) !== (d2.options?.length || 0)) {
    return false;
  }

  return true;
}

// 比较两个对话列表是否实质性相同
function areDialoguesListsEqual(oldList: DialogueItem[], newList: DialogueItem[]): boolean {
  if (oldList.length !== newList.length) {
    return false;
  }

  for (let i = 0; i < oldList.length; i++) {
    if (!areDialoguesEqual(oldList[i], newList[i])) {
      return false;
    }
  }

  return true;
}

// 增量更新对话列表
function updateDialoguesIncremental(newDialogues: DialogueItem[]): boolean {
  const oldList = dialogues.value;
  const oldIndex = currentDialogIndex.value;

  // 如果列表完全相同，跳过更新
  if (areDialoguesListsEqual(oldList, newDialogues)) {
    return false; // 没有变化
  }

  // 如果新列表为空或更短，直接替换（可能是清空或重置）
  if (newDialogues.length === 0 || newDialogues.length < oldList.length) {
    dialogues.value = newDialogues;
    // 调整索引
    if (currentDialogIndex.value >= newDialogues.length) {
      currentDialogIndex.value = Math.max(0, newDialogues.length - 1);
    }
    return true; // 有变化
  }

  // 增量更新：只添加新对话，不删除或修改已有对话
  // 找到第一个新对话的起始位置
  let firstNewIndex = oldList.length;

  // 检查是否有新对话（通过 message_id 判断）
  const oldLastMessageId = oldList.length > 0 ? oldList[oldList.length - 1].message_id : -1;
  const newLastMessageId = newDialogues.length > 0 ? newDialogues[newDialogues.length - 1].message_id : -1;

  // 如果新列表的最后一条消息ID大于旧列表的最后一条，说明有新消息
  if (newLastMessageId !== undefined && oldLastMessageId !== undefined && newLastMessageId > oldLastMessageId) {
    // 找到新消息的起始位置
    for (let i = 0; i < newDialogues.length; i++) {
      if (newDialogues[i].message_id !== undefined && newDialogues[i].message_id! > oldLastMessageId) {
        firstNewIndex = i;
        break;
      }
    }

    // 只添加新对话
    const newDialoguesToAdd = newDialogues.slice(firstNewIndex);
    if (newDialoguesToAdd.length > 0) {
      dialogues.value = [...oldList, ...newDialoguesToAdd];

      // 保持当前播放位置（不自动跳转）
      currentDialogIndex.value = oldIndex;

      return true; // 有变化
    }
  }

  // 如果没有新对话，但内容有更新，进行完整替换（但保持播放位置）
  dialogues.value = newDialogues;

  // 保持当前播放位置（如果索引仍然有效）
  if (currentDialogIndex.value >= dialogues.value.length) {
    currentDialogIndex.value = Math.max(0, dialogues.value.length - 1);
  }

  return true; // 有变化
}

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
    let lastIsCG: boolean | undefined; // 上一次是否为CG模式
    let lastCgImageUrl: string | undefined; // 上一次CG图片URL

    // 预加载所有 Live2D 模型（在后台异步加载，不阻塞对话构建）
    if (live2dModels.value.length > 0) {
      console.info(`[对话加载] 开始预加载 ${live2dModels.value.length} 个 Live2D 模型`);
      const { live2dModelManager } = await import('../lib/managers/Live2DModelManager');
      live2dModelManager.preloadModels(live2dModels.value).catch(error => {
        console.warn('[对话加载] Live2D 模型预加载失败:', error);
      });
    }

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

    // 继承CG状态（narration等块应该继承CG状态，避免打断CG场景）
    const inheritCGState = (dialogue: DialogueItem) => {
      if (dialogue.type === 'blackscreen') return;
      // 如果当前对话没有设置CG状态，且上一次是CG模式，则继承CG状态
      if (dialogue.isCG === undefined && lastIsCG) {
        dialogue.isCG = lastIsCG;
        if (lastCgImageUrl) {
          dialogue.cgImageUrl = lastCgImageUrl;
        }
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
      // 如果是普通模式的character块（isCG === false），会打断CG模式
      if (dialogue.isCG === false) {
        // 离开CG模式，更新立绘/Live2D状态
        lastSpriteState = dialogue.sprite ? { ...dialogue.sprite } : undefined;
        lastMotion = dialogue.motion;
        lastExpression = dialogue.expression;
        lastIsCG = false;
        lastCgImageUrl = undefined;
      } else if (dialogue.isCG === true) {
        // 进入CG模式，清除立绘/Live2D状态
        lastSpriteState = undefined;
        lastMotion = undefined;
        lastExpression = undefined;
        lastIsCG = true;
        lastCgImageUrl = dialogue.cgImageUrl;
      } else {
        // 未明确设置isCG，保持原有逻辑
        lastSpriteState = dialogue.sprite ? { ...dialogue.sprite } : undefined;
        lastMotion = dialogue.motion;
        lastExpression = dialogue.expression;
        // 如果当前对话设置了isCG，更新CG状态
        if (dialogue.isCG !== undefined) {
          lastIsCG = dialogue.isCG;
          lastCgImageUrl = dialogue.cgImageUrl;
        }
      }
    };

    // 处理每条消息
    for (const msg of messages) {
      const messageText = msg.message || '';

      // 解析消息块（传入上一行的场景用于继承）
      const blocks = await parseMessageBlocks(messageText, lastScene, userDisplayName.value);

      // 如果没有解析到块，不显示该消息（它很可能不属于我们的剧情文本）
      // StatusBlock 位于 <content> 之外，只用于状态栏显示，不创建对话项
      if (blocks.length === 0) {
        continue;
      }

      // 解析StatusBlock（用于状态栏显示，不作为对话项）
      const statusBlock = parseStatusBlock(messageText);

      // 为当前消息生成 unitIndex 计数器（每个消息独立计数）
      let unitIndex = 0;

      // 处理每个解析到的块，按原始顺序
      // 连续的choice块会被合并成一个选择界面
      let blockIndex = 0;
      while (blockIndex < blocks.length) {
        const block = blocks[blockIndex];

        // 如果是choice块，收集连续的choice块并合并
        if (block.type === 'choice') {
          const choiceBlocks: MessageBlock[] = [block];
          let nextIndex = blockIndex + 1;

          // 收集连续的choice块
          while (nextIndex < blocks.length && blocks[nextIndex].type === 'choice') {
            choiceBlocks.push(blocks[nextIndex]);
            nextIndex++;
          }

          // 检查choice块的格式
          const hasFormat1 = choiceBlocks.some(b => b.choiceFormat === 'format1');
          const hasFormat2 = choiceBlocks.some(b => b.choiceFormat === 'format2');

          if (hasFormat1) {
            // 格式1：合并所有选项
            const allOptions: Array<{
              id: string;
              text: string;
              character?: string;
              response?: string;
            }> = [];
            for (const choiceBlock of choiceBlocks) {
              if (choiceBlock.options) {
                allOptions.push(...choiceBlock.options);
              }
            }

            if (allOptions.length > 0) {
              // 为格式1选项分配唯一ID，避免多个 choice 块默认使用相同的 choice_0 导致点击错乱
              const mergedOptions = allOptions.map((opt, idx) => ({
                ...opt,
                id: opt.id && opt.id !== 'choice_0' ? opt.id : `choice_${msg.message_id}_${unitIndex}_${idx}`,
              }));

              const choiceDialogue: DialogueItem = {
                unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
                unitIndex: unitIndex++,
                character: '',
                text: '',
                type: 'choice',
                message_id: msg.message_id,
                role: 'system',
                choiceFormat: 'format1',
                options: mergedOptions,
                statusBlock,
              };

              inheritSceneAndBackground(choiceDialogue);
              inheritSpriteState(choiceDialogue);
              inheritCGState(choiceDialogue);
              newDialogues.push(choiceDialogue);
              updateSceneState(choiceDialogue);
            }
          } else if (hasFormat2) {
            // 格式2：合并所有选项文本
            const allChoices: string[] = [];
            for (const choiceBlock of choiceBlocks) {
              if (choiceBlock.choices) {
                allChoices.push(...choiceBlock.choices);
              }
            }

            if (allChoices.length > 0) {
              const choiceDialogue: DialogueItem = {
                unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
                unitIndex: unitIndex++,
                character: '',
                text: '',
                type: 'choice',
                message_id: msg.message_id,
                role: 'system',
                choiceFormat: 'format2',
                options: allChoices.map((choice, index) => ({
                  id: `choice_${index}`,
                  text: choice,
                })),
                statusBlock,
              };

              inheritSceneAndBackground(choiceDialogue);
              inheritSpriteState(choiceDialogue);
              inheritCGState(choiceDialogue);
              newDialogues.push(choiceDialogue);
              updateSceneState(choiceDialogue);
            }
          }

          // 跳过已处理的choice块
          blockIndex = nextIndex;
          continue;
        }

        // 处理非choice块
        if (block.type === 'character') {
          // 优先使用原始文本关键词（用于 playMotionByText 匹配），回退到文件路径（向后兼容）
          const motionToUse = block.motion || block.motionFile;
          const expressionToUse = block.expression || block.expressionFile;

          // 检查是否有motion和expression（仅针对Live2D模型）
          const hasMotionExpr = hasMotionAndExpression(
            block.character || '',
            motionToUse,
            expressionToUse,
            live2dModels.value,
          );

          const live2dModel = live2dModels.value.find(m => m.name === block.character);
          const hasSpriteImage = !!block.spriteImageUrl || !!msg.extra?.sprite_image;

          console.info('[对话创建] 资源检查:', {
            character: block.character,
            hasLive2dModel: !!live2dModel,
            hasMotionExpr,
            hasSpriteImage,
            spriteImageUrl: block.spriteImageUrl,
            blockIsCG: block.isCG,
          });

          // 判断是否进入CG模式：
          // 1. 只有明确指定了CG场景格式（block.isCG === true）时才进入CG模式
          // 2. CG模式下不展示立绘和模型，优先展示CG
          // 3. 普通模式（block.isCG === false）使用立绘或模型
          // 4. CG模式不会被旁白、用户消息、选择格式打断（通过继承CG状态实现）
          const isCGMode = block.isCG === true;

          console.info('[对话创建] CG模式判断:', {
            isCGMode,
            reason:
              block.isCG === true
                ? '明确指定CG场景格式，进入CG模式'
                : block.isCG === false
                  ? '普通模式，使用立绘或模型'
                  : '未设置isCG，使用默认逻辑',
          });

          const dialogue: DialogueItem = {
            unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
            unitIndex: unitIndex++,
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
              : (() => {
                  const imageUrl = block.spriteImageUrl || msg.extra?.sprite_image || undefined;

                  // 优先使用 Live2D 模型（如果有）
                  // live2dModel 是从世界书加载的 live2dModels.value 中根据角色名匹配得到的
                  if (live2dModel) {
                    console.info('[对话创建] 从世界书匹配到 Live2D 模型:', {
                      character: block.character,
                      modelId: live2dModel.id,
                      modelName: live2dModel.name,
                      source: 'live2dModels.value (从世界书加载)',
                    });
                    return {
                      type: 'live2d',
                      live2dModelId: live2dModel.id, // 这个值来自世界书
                      imageUrl: undefined,
                    };
                  }

                  // 其次使用立绘图片（如果有）
                  if (imageUrl) {
                    console.info('[对话创建] 使用立绘图片:', block.character, 'imageUrl:', imageUrl);
                    return {
                      type: 'image',
                      live2dModelId: undefined,
                      imageUrl,
                    };
                  }

                  // 如果都没有，不显示立绘
                  console.info('[对话创建] 无立绘资源:', block.character, '不显示立绘');
                  return {
                    type: 'none',
                    live2dModelId: undefined,
                    imageUrl: undefined,
                  };
                })(),
          };

          inheritSceneAndBackground(dialogue);
          newDialogues.push(dialogue);
          updateSceneState(dialogue);
          updateSpriteStateFromCharacter(dialogue);
        } else if (block.type === 'narration') {
          const dialogue: DialogueItem = {
            unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
            unitIndex: unitIndex++,
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
          inheritCGState(dialogue); // 继承CG状态，避免narration块打断CG场景
          newDialogues.push(dialogue);
          updateSceneState(dialogue);
        } else if (block.type === 'blacktext') {
          const dialogue: DialogueItem = {
            unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
            unitIndex: unitIndex++,
            character: '',
            text: block.message || '',
            type: 'blackscreen',
            message_id: msg.message_id,
            role: 'system',
            statusBlock,
          };
          // blacktext块会打断CG模式，清除CG状态
          lastIsCG = undefined;
          lastCgImageUrl = undefined;
          newDialogues.push(dialogue);
        } else if (block.type === 'user') {
          const dialogue: DialogueItem = {
            unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
            unitIndex: unitIndex++,
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
          inheritCGState(dialogue); // 继承CG状态
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
        } else if (block.type === 'note') {
          // 小纸条块：绑定到前面的演出单元（使用 unitId）
          // 查找最近的非小纸条、非选项的演出单元
          let targetUnitId: string | undefined;
          for (let i = newDialogues.length - 1; i >= 0; i--) {
            const dialogue = newDialogues[i];
            // 跳过选项和小纸条类型的演出单元
            if (dialogue.type !== 'choice' && !dialogue.noteContent) {
              targetUnitId = dialogue.unitId;
              break;
            }
          }

          if (targetUnitId) {
            // 找到目标演出单元，绑定小纸条
            const targetDialogue = newDialogues.find(d => d.unitId === targetUnitId);
            if (targetDialogue) {
              // 后一个小纸条替换前一个小纸条（如果绑定到同一个演出单元）
              targetDialogue.noteContent = block.noteContent;
              targetDialogue.noteUnitId = targetUnitId;
              // 从 block 中读取 noteUnitId（如果有）
              if (block.noteUnitId) {
                targetDialogue.noteUnitId = block.noteUnitId;
              }
            }
          } else {
            // 如果没有找到目标演出单元，创建一个空的对话项来承载小纸条
            const dialogue: DialogueItem = {
              unitId: `msg_${msg.message_id}_unit_${unitIndex}`,
              unitIndex: unitIndex++,
              character: '',
              text: '',
              type: 'narration',
              message_id: msg.message_id,
              role: 'system',
              noteContent: block.noteContent,
              noteUnitId: block.noteUnitId,
              statusBlock,
            };
            inheritSceneAndBackground(dialogue);
            newDialogues.push(dialogue);
          }
        }

        // 移动到下一个块
        blockIndex++;
      }
    }

    // 过滤已删除的消息
    const filteredDialogues = newDialogues.filter(d => !d.isDeleted);

    // 记录当前播放位置（如果对话列表已存在）
    const previousLength = dialogues.value.length;

    // 使用增量更新逻辑，避免不必要的响应式更新
    updateDialoguesIncremental(filteredDialogues);

    // 如果正在执行历史跳转，不修改索引（由跳转函数自己处理）
    if (isJumpingToHistory.value) {
      // 历史跳转中，不修改索引
      isJumpingToHistory.value = false; // 重置标志
    }
    // 如果是首次加载（previousLength === 0），显示第一条对话
    else if (previousLength === 0 && filteredDialogues.length > 0) {
      currentDialogIndex.value = 0;
    }
    // updateDialoguesIncremental 已经处理了索引更新，这里不需要额外处理

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
  let testUnitIndex = 0;
  const createTestDialogue = (dialogue: Partial<DialogueItem>): DialogueItem => {
    return {
      unitId: `test_unit_${testUnitIndex}`,
      unitIndex: testUnitIndex++,
      message_id: 0,
      role: 'assistant',
      character: '',
      text: '',
      ...dialogue,
    } as DialogueItem;
  };
  dialogues.value = [
    createTestDialogue({
      character: '小雪',
      text: '你好啊，欢迎来到这个 Galgame 风格的对话界面！',
      type: undefined,
      scene: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=1080&fit=crop',
      sprite: { type: 'image' as const, imageUrl: '/placeholder-user.jpg' },
    }),
    createTestDialogue({
      character: '小雪',
      text: '这是一个支持多种演出效果的界面，包括角色对话、旁白、黑屏转场和选项选择。',
      isThrough: false,
    }),
    createTestDialogue({
      character: '',
      text: '这是一段旁白文字，用于描述场景或补充说明。旁白会以斜体居中显示。',
      type: 'narration' as const,
    }),
    createTestDialogue({
      character: '小雪',
      text: '*through* 这是一段内心独白，使用了 through 格式，会以浅灰色斜体显示。',
      isThrough: true,
    }),
    createTestDialogue({
      character: '',
      text: '时间悄然流逝...',
      type: 'blackscreen' as const,
    }),
    createTestDialogue({
      character: '小雪',
      text: '你可以通过点击右上角的齿轮图标打开设置面板，自定义对话框的样式和颜色。',
    }),
    createTestDialogue({
      character: '小雪',
      text: '现在，请选择你想要做的事情：',
    }),
    createTestDialogue({
      character: '',
      text: '',
      type: 'choice' as const,
      options: [
        { id: 'opt1', text: '查看设置选项' },
        { id: 'opt2', text: '继续对话' },
        { id: 'opt3', text: '了解更多功能' },
      ],
    }),
    createTestDialogue({
      character: '小雪',
      text: '感谢你的选择！这个界面还支持 Live2D 模型显示，不过需要先在角色卡变量中配置模型。',
    }),
    createTestDialogue({
      character: '小雪',
      text: '你还可以点击左上角的角色按钮，查看角色状态栏和小剧场。',
    }),
    createTestDialogue({
      character: '',
      text: '--- 以下是 Live2D 模型和立绘测试 ---',
      type: 'narration' as const,
    }),
    createTestDialogue({
      character: '',
      text: '测试 1：程北极 Live2D 模型 - 正常动作 + 微笑表情',
      type: 'narration' as const,
      scene: '程北极房间白天',
    }),
    createTestDialogue({
      character: '程北极',
      text: '你好，我是程北极。这是 Live2D 模型的测试，使用了"正常动作"和"微笑"表情。',
      type: undefined,
      scene: '程北极房间白天',
      motion: '正常动作',
      expression: '微笑',
      sprite: { type: 'live2d' as const, live2dModelId: '程北极' },
    }),
    createTestDialogue({
      character: '',
      text: '测试 2：程北极 Live2D 模型 - 抱臂动作 + 严肃表情',
      type: 'narration' as const,
      scene: '操场',
    }),
    createTestDialogue({
      character: '程北极',
      text: '这是另一个测试，使用了"抱臂"动作和"严肃"表情。',
      type: undefined,
      scene: '操场',
      motion: '抱臂',
      expression: '严肃',
      sprite: { type: 'live2d' as const, live2dModelId: '程北极' },
    }),
    createTestDialogue({
      character: '',
      text: '测试 3：程北极 Live2D 模型 - 叹气动作 + 困惑表情',
      type: 'narration' as const,
      scene: '房间白天',
    }),
    createTestDialogue({
      character: '程北极',
      text: '这是"叹气"动作和"困惑"表情的测试。',
      type: undefined,
      scene: '房间白天',
      motion: '叹气',
      expression: '困惑',
      sprite: { type: 'live2d' as const, live2dModelId: '程北极' },
    }),
    createTestDialogue({
      character: '',
      text: '测试 4：女同学立绘（没有 Live2D 模型，使用立绘资源）',
      type: 'narration' as const,
      scene: '操场',
    }),
    createTestDialogue({
      character: '女同学',
      text: '呀？程北极你在等人吗？这是立绘资源的测试，我没有 Live2D 模型，所以会显示立绘图片。',
      type: undefined,
      scene: '操场',
      sprite: {
        type: 'image' as const,
        imageUrl: 'https://iili.io/f01ajiN.png', // 校服女NPC 立绘
      },
    }),
    createTestDialogue({
      character: '',
      text: '测试 5：程北极回复 - 正常动作 + 正常表情',
      type: 'narration' as const,
    }),
    createTestDialogue({
      character: '程北极',
      text: '嗯，在等人。这是回复测试，使用了"正常动作"和"正常表情"。',
      type: undefined,
      motion: '正常动作',
      expression: '正常表情',
      sprite: { type: 'live2d' as const, live2dModelId: '程北极' },
    }),
    createTestDialogue({
      character: '',
      text: '测试 6：程北极 Live2D 模型 - 向右看动作 + 害羞表情',
      type: 'narration' as const,
      scene: '巴士站白天',
    }),
    createTestDialogue({
      character: '程北极',
      text: '这是"向右看"动作和"害羞"表情的测试。',
      type: undefined,
      scene: '巴士站白天',
      motion: '向右看',
      expression: '害羞',
      sprite: { type: 'live2d' as const, live2dModelId: '程北极' },
    }),
    createTestDialogue({
      character: '',
      text: '测试 7：程北极 Live2D 模型 - 摇头动作 + 无语表情',
      type: 'narration' as const,
      scene: '程北极房间夜晚',
    }),
    createTestDialogue({
      character: '程北极',
      text: '这是"摇头"动作和"无语"表情的测试。',
      type: undefined,
      scene: '程北极房间夜晚',
      motion: '摇头',
      expression: '无语',
      sprite: { type: 'live2d' as const, live2dModelId: '程北极' },
    }),
    createTestDialogue({
      character: '',
      text: '--- Live2D 模型和立绘测试结束 ---',
      type: 'narration' as const,
    }),
    createTestDialogue({
      character: '',
      text: '测试对话到此结束。在实际使用时，对话数据会从酒馆消息中自动读取。',
      type: 'narration' as const,
    }),
  ];
}

// 加载 Live2D 模型配置（仅从世界书读取）
async function loadLive2dModels() {
  try {
    const modelsMap = new Map<string, any>();

    // 从世界书读取模型资源
    try {
      const resources = await loadWorldbookResources();
      console.info(`[GalgamePlayer] 从世界书加载到 ${resources.models.size} 个 Live2D 模型`);

      for (const [modelName, modelData] of resources.models.entries()) {
        const model3Url = modelData.files?.model3 || '';
        // 如果 model3 是完整 URL，直接使用；否则需要 basePath
        const isFullUrl = model3Url.startsWith('http://') || model3Url.startsWith('https://');
        const basePath = isFullUrl
          ? model3Url.substring(0, model3Url.lastIndexOf('/') + 1)
          : model3Url.substring(0, model3Url.lastIndexOf('/') + 1);
        // 如果 model3 是完整 URL，modelPath 使用完整 URL；否则只使用文件名
        const modelPath = isFullUrl ? model3Url : model3Url ? model3Url.split('/').pop() : '';

        const newModel: any = {
          name: modelName, // 使用modelName作为name（例如"程北极"）
          id: modelName, // 使用modelName作为id
          basePath,
          modelPath,
          version: 3, // Live2D Cubism 3.0
          textures: modelData.files?.textures || [],
          motions:
            modelData.motions?.map(m => ({
              group: m.group ?? 'default', // 使用 ?? 保留空字符串 group（空字符串是有效的 group 名称）
              name: m.name,
              file: m.file,
              index: m.index,
              motionType: m.motionType,
              textMappings: m.textMappings,
            })) || [],
          // 向后兼容：如果存在旧的 expressions 字段，也保留
          expressions: modelData.expressions?.map(e => e.name || e.file) || [],
          defaultAnimation: modelData.defaultAnimation,
          // 向后兼容：如果存在旧的 textMappings 字段，也保留
          textMappings: modelData.textMappings,
        };

        console.info(`[GalgamePlayer] 从世界书加载模型配置: ${modelName}`, {
          modelPath,
          basePath,
          isFullUrl,
          motionsCount: newModel.motions.length,
          expressionsCount: newModel.expressions.length,
          hasTextMappings: !!newModel.textMappings,
        });

        modelsMap.set(modelName, newModel);
      }

      live2dWorldbookModels.value = resources.models;
    } catch (error) {
      console.warn('[GalgamePlayer] 从世界书加载模型资源失败:', error);
    }

    live2dModels.value = Array.from(modelsMap.values());
    console.info(`[GalgamePlayer] 加载了 ${live2dModels.value.length} 个 Live2D 模型配置`);
    console.info(
      '[GalgamePlayer] 模型列表详情:',
      live2dModels.value.map(m => ({
        id: m.id,
        name: m.name,
        modelPath: m.modelPath,
        basePath: m.basePath,
        motionsCount: m.motions?.length || 0,
        expressionsCount: m.expressions?.length || 0,
        hasTextMappings: !!m.textMappings,
      })),
    );
  } catch (error) {
    console.error('[GalgamePlayer] 加载 Live2D 模型配置失败:', error);
  }
}

function nextDialogue(skipBlackscreen = false) {
  if (currentDialogIndex.value < dialogues.value.length - 1) {
    currentDialogIndex.value++;
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

    // 移除流式状态检查（已取消流式功能）

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
    const messageReceivedCleanup = eventOn(tavern_events.MESSAGE_RECEIVED, async (messageId: string | number) => {
      const messageIdNum = Number(messageId);

      // 解析消息中的 phone 标签并更新世界书
      try {
        const messages = getChatMessages(messageIdNum);
        if (messages.length > 0) {
          const messageText = messages[0].message || '';
          await parsePhoneTagsAndUpdateWorldbook(messageText);
        }
      } catch (error) {
        console.warn('解析 phone 标签失败:', error);
      }

      // 保存当前播放位置（无论用户是否在最后一个演出单元，都保持当前位置不变）
      const currentIndex = currentDialogIndex.value;

      // 重新加载对话数据
      await loadDialoguesFromTavern();

      // 保持当前位置不变（套用"用户不在最后一个演出单元"的逻辑）
      // 如果索引仍然有效，保持当前位置；如果索引超出范围，调整到最后一个有效位置
      if (currentIndex < dialogues.value.length) {
        currentDialogIndex.value = currentIndex;
        console.info('保持当前播放位置:', currentIndex);
      } else if (dialogues.value.length > 0) {
        // 如果索引超出范围，调整到最后一个有效位置
        currentDialogIndex.value = dialogues.value.length - 1;
        console.info('索引超出范围，调整到最后一个演出单元');
      }
    });
    if (messageReceivedCleanup) {
      eventCleanups.push(() => messageReceivedCleanup.stop());
    }

    // 监听消息更新
    const messageUpdatedCleanup = eventOn(tavern_events.MESSAGE_UPDATED, async () => {
      await loadDialoguesFromTavern();
    });
    if (messageUpdatedCleanup) {
      eventCleanups.push(() => messageUpdatedCleanup.stop());
    }

    // 监听聊天切换
    const chatChangedCleanup = eventOn(tavern_events.CHAT_CHANGED, () => {
      loadDialoguesFromTavern();
      currentDialogIndex.value = 0;
    });
    if (chatChangedCleanup) {
      eventCleanups.push(() => chatChangedCleanup.stop());
    }

    // 移除流式token监听（已取消流式功能）
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

// 存储收到 AI 主动发送消息的联系人（用于显示未读标记）
const unreadContacts = ref<Set<string>>(new Set());

// 检查是否有未读消息
const hasUnreadMessages = computed(() => {
  if (typeof window !== 'undefined' && (window as any).getUnreadContacts) {
    const unreadList = (window as any).getUnreadContacts() as string[];
    return unreadList && unreadList.length > 0;
  }
  return false;
});

// 未读联系人功能已集成到 PhonePanel 中

// 解析消息中的 <phone> 标签并更新世界书
async function parsePhoneTagsAndUpdateWorldbook(messageText: string) {
  // 匹配所有 <phone> 标签
  const phoneRegex = /<phone>([\s\S]*?)<\/phone>/gi;
  const phoneMatches = Array.from(messageText.matchAll(phoneRegex));

  if (phoneMatches.length === 0) return;

  // 记录收到 AI 主动发送消息的联系人
  const aiSentContacts = new Set<string>();

  try {
    // 获取角色卡绑定的世界书
    let targetWorldbookName: string | null = null;
    try {
      const charWorldbooks = getCharWorldbookNames('current');
      targetWorldbookName = charWorldbooks.primary || charWorldbooks.additional[0] || null;
    } catch (error) {
      console.warn('获取角色卡世界书失败:', error);
    }

    // 如果没有角色卡世界书，使用默认世界书
    if (!targetWorldbookName) {
      targetWorldbookName = '开场界面-模型数据';
    }

    // 确保世界书存在
    let worldbook: any[] = [];
    try {
      worldbook = await getWorldbook(targetWorldbookName);
    } catch {
      // 如果世界书不存在，创建它
      await createOrReplaceWorldbook(targetWorldbookName, []);
      worldbook = [];
    }

    // 解析每个 phone 标签
    for (const match of phoneMatches) {
      const phoneContent = match[1].trim();
      if (!phoneContent) continue;

      // 解析格式支持两种：
      // 1. 用户发送的格式：与{{联系人}}的聊天：消息内容|时间
      // 2. AI主动发送的格式：{{联系人}}：消息内容|时间
      const lines = phoneContent.split('\n').filter(line => line.trim());
      const contactMessages: Map<string, Array<{ speaker: string; content: string; time: string }>> = new Map();

      for (const line of lines) {
        // 先尝试匹配 AI 主动发送的格式：{{联系人}}：消息内容|时间
        let lineMatch = line.match(/^(.+?)[：:](.+?)\|(.+)$/);
        let contactName: string | null = null;
        let speaker: string | null = null;
        let content: string | null = null;
        let time: string | null = null;

        if (lineMatch) {
          const potentialContact = lineMatch[1].trim();
          const potentialContent = lineMatch[2].trim();
          const potentialTime = lineMatch[3].trim();

          // 判断是否是用户发送的格式（包含"与"和"的聊天"）
          const userFormatMatch = potentialContact.match(/^与(.+?)的聊天$/);
          if (userFormatMatch) {
            // 用户发送格式：与{{联系人}}的聊天：消息内容|时间
            contactName = userFormatMatch[1].trim();
            content = potentialContent;
            time = potentialTime;
            // 判断发言者：如果内容中包含 {{user}} 或 <user>，则为用户消息
            if (content.includes('{{user}}') || content.includes('<user>')) {
              speaker = '{{user}}';
              content = content.replace(/{{user}}|<user>/gi, '').trim();
            } else {
              speaker = contactName;
            }
          } else {
            // AI 主动发送格式：{{联系人}}：消息内容|时间
            // 判断是否是用户消息
            if (potentialContact === '{{user}}' || potentialContact === '<user>') {
              // 这是用户消息，但需要知道是发给哪个联系人的
              // 由于没有联系人信息，跳过这条消息（或者可以记录为"未指定"联系人）
              continue;
            }
            // 这是联系人发送的消息（AI 主动发送）
            contactName = potentialContact;
            speaker = contactName;
            content = potentialContent;
            time = potentialTime;
            // 记录收到 AI 主动发送消息的联系人
            aiSentContacts.add(contactName);
          }
        } else {
          // 尝试匹配格式2：与{{联系人}}的聊天|消息内容|时间
          lineMatch = line.match(/^与(.+?)的聊天\|(.+?)\|(.+)$/);
          if (lineMatch) {
            contactName = lineMatch[1].trim();
            content = lineMatch[2].trim();
            time = lineMatch[3].trim();
            speaker = '{{user}}'; // 这种格式通常是用户消息
          }
        }

        // 如果解析成功，添加到对应联系人的消息列表
        if (contactName && content && time && speaker) {
          if (!contactMessages.has(contactName)) {
            contactMessages.set(contactName, []);
          }
          contactMessages.get(contactName)!.push({
            speaker,
            content,
            time,
          });
        }
      }

      // 为每个联系人更新世界书条目
      for (const [contactName, messages] of contactMessages.entries()) {
        const entryName = `与${contactName}的聊天记录`;

        // 查找或创建条目
        let entry = worldbook.find(e => e.name === entryName);

        if (!entry) {
          // 创建新条目
          entry = {
            name: entryName,
            content: '',
            comment: '',
            priority: 100,
            enabled: true,
            insertion_order: 0,
            case_sensitive: false,
            name_regex: false,
            content_regex: false,
            exclude_recursion: false,
            display_index: 0,
            probability: 100,
            delay: 0,
            delay_on: 0,
            delay_off: 0,
            recursion: {
              prevent_incoming: false,
              prevent_outgoing: false,
              delay_until: null,
            },
            position: {
              before: [],
              after: [],
              order: 0,
            },
            disable: false,
            exclude: false,
            uid: Date.now().toString(),
          };
          worldbook.push(entry);
        }

        // 更新条目内容
        const existingContent = entry.content || '';
        const newLines = messages.map(msg => `${msg.speaker}：${msg.content}|${msg.time}`);
        const updatedContent = existingContent ? `${existingContent}\n${newLines.join('\n')}` : newLines.join('\n');

        entry.content = updatedContent;
      }
    }

    // 更新世界书
    if (worldbook.length > 0) {
      await updateWorldbookWith(targetWorldbookName, () => worldbook);
      console.info(`已更新世界书 ${targetWorldbookName} 中的聊天记录条目`);
    }

    // 更新未读联系人列表
    if (aiSentContacts.size > 0) {
      aiSentContacts.forEach(contact => {
        unreadContacts.value.add(contact);
      });
      // PhonePanel 会自动检查和更新未读标记
    }
  } catch (error) {
    console.error('解析 phone 标签并更新世界书失败:', error);
  }
}

// 获取手机面板的待发送消息并附加phone标签
function getTheaterPhoneContent(): string {
  if (phonePanelRef.value && typeof phonePanelRef.value.getPendingMessages === 'function') {
    return phonePanelRef.value.getPendingMessages();
  }
  return '';
}

// 统一的消息发送函数，自动附加phone标签（只针对小剧场输入的内容）
async function sendUserMessageWithPhone(messageText: string) {
  // 检测是否有连续创建的多个演出单元
  // 如果有，则使用预发送文本构建发送内容，而不是使用消息文本中的 [[user||...]] 块
  const inputTexts = pendingTextStore.getInputTexts();
  const phoneTexts = pendingTextStore.getPhoneTexts();

  console.info('[GalgamePlayer] 准备发送消息');
  console.info('[GalgamePlayer] GalgamePlayer 输入的预发送文本数量:', inputTexts.length);
  console.info(
    '[GalgamePlayer] GalgamePlayer 输入的预发送文本:',
    inputTexts.map(t => t.text),
  );
  console.info('[GalgamePlayer] PhonePanel 预发送文本数量:', phoneTexts.length);
  console.info(
    '[GalgamePlayer] PhonePanel 预发送文本:',
    phoneTexts.map(t => t.text),
  );

  let finalMessage = '';

  if (inputTexts.length > 0) {
    // 有连续创建的多个演出单元，使用预发送文本
    console.info('[GalgamePlayer] 检测到连续创建的演出单元，使用预发送文本构建发送内容');

    // 获取当前场景
    const currentScene = currentDialogue.value?.scene || '{{scene}}';

    // 为每个输入文本创建 [[user||...]] 块
    const userBlocks = inputTexts.map(item => `[[user||场景：${currentScene}||台词：${item.text}]]`).join('\n\n');

    finalMessage = userBlocks;
  } else {
    // 没有预发送文本，使用传入的消息文本
    finalMessage = messageText;
  }

  // 附加 PhonePanel 的预发送文本（格式化为 <phone> 标签）
  const phoneContent = getTheaterPhoneContent();
  if (phoneContent) {
    finalMessage = `${finalMessage}\n\n${phoneContent}`;
  }

  // 同时附加 PhonePanel store 中的预发送文本
  if (phoneTexts.length > 0) {
    console.info('[GalgamePlayer] 附加 PhonePanel store 中的预发送文本');
    // 按联系人分组
    const phoneTextsByContact = new Map<string, typeof phoneTexts>();
    for (const item of phoneTexts) {
      if (item.contact) {
        const existing = phoneTextsByContact.get(item.contact) || [];
        existing.push(item);
        phoneTextsByContact.set(item.contact, existing);
      }
    }

    // 为每个联系人生成 <phone> 标签
    const phoneBlocks: string[] = [];
    for (const [contact, items] of phoneTextsByContact.entries()) {
      for (const item of items) {
        phoneBlocks.push(`<phone>与${contact}的聊天：${item.text}|${item.timestamp}</phone>`);
      }
    }

    if (phoneBlocks.length > 0) {
      finalMessage = `${finalMessage}\n\n${phoneBlocks.join('\n')}`;
    }
  }

  console.info('[GalgamePlayer] 最终发送的消息内容:', finalMessage);

  await createChatMessages(
    [
      {
        role: 'user',
        message: finalMessage,
      },
    ],
    { refresh: 'none' },
  );

  // 发送后清除所有预发送文本
  pendingTextStore.clearAll();
  console.info('[GalgamePlayer] 已清除所有预发送文本');
}

/**
 * 裁剪消息文本，保留 </content> 标签及其之后的所有内容（用于智能裁剪）
 */
function trimMessageAfterContentTag(messageText: string): string {
  // 查找 </content> 标签的结束位置
  const contentEndIndex = messageText.indexOf('</content>');
  if (contentEndIndex !== -1) {
    // 保留 </content> 标签及其之后的所有内容
    return messageText.substring(contentEndIndex + '</content>'.length);
  }
  // 如果没有找到 </content>，返回空字符串（删除所有内容）
  return '';
}

/**
 * 裁剪消息文本，保留 <content>...</content> 标签块及其之后的所有内容
 */
function trimMessageBeforeContentTag(messageText: string): string {
  // 查找 <content> 标签的开始位置
  const contentStartIndex = messageText.indexOf('<content>');
  if (contentStartIndex !== -1) {
    // 保留从 <content> 标签开始到末尾的所有内容（包括 <content> 标签及其之后的所有内容）
    return messageText.substring(contentStartIndex);
  }
  // 如果没有找到 <content>，查找 </content> 标签
  const contentEndIndex = messageText.indexOf('</content>');
  if (contentEndIndex !== -1) {
    // 保留 </content> 标签及其之后的所有内容
    return messageText.substring(contentEndIndex);
  }
  // 如果都没有找到，返回原文本
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
    const tempMessageId = getLastMessageId() + 1;
    const tempUnitIndex = dialogues.value.length;
    const unitId = `msg_${tempMessageId}_unit_${tempUnitIndex}`;
    // 继承当前对话的背景和立绘状态
    const currentDialogueData = currentDialogue.value;
    const newDialogue: DialogueItem = {
      unitId,
      unitIndex: tempUnitIndex,
      character: '你',
      text,
      type: 'user',
      isEditable: true,
      message_id: tempMessageId, // 临时ID
      role: 'user',
      // 继承背景
      scene: currentDialogueData?.scene,
      sceneImageUrl: currentDialogueData?.sceneImageUrl,
      // 继承立绘状态
      sprite: currentDialogueData?.sprite ? { ...currentDialogueData.sprite } : undefined,
      motion: currentDialogueData?.motion,
      expression: currentDialogueData?.expression,
      // 继承CG状态
      isCG: currentDialogueData?.isCG,
      cgImageUrl: currentDialogueData?.cgImageUrl,
    };

    // 添加到预发送文本 store
    const timestamp = new Date().toISOString();
    pendingTextStore.addInputText(text, timestamp, unitId);

    // 插入到对话列表
    const newDialogues = [...dialogues.value];
    newDialogues.splice(currentDialogIndex.value + 1, 0, newDialogue);
    dialogues.value = newDialogues;

    // 移动到新插入的对话
    currentDialogIndex.value = currentDialogIndex.value + 1;

    console.info('已保存到正文（不刷新界面，继承背景）:', text);
  } catch (error) {
    console.error('保存到正文失败:', error);
  }
}

// 裁剪选项文本：删除未选中的整个选项块
// 格式1：每个 [[choice||选项X：内容||角色名：角色||台词：台词]] 是独立块，删除未选中的块
// 格式2：[[choice||选项1：内容||选项2：内容||选项3：内容]] 是一个块包含多个选项，保留整个块但只显示选中的选项
async function trimChoiceText(messageId: number, selectedText: string): Promise<void> {
  try {
    const messages = getChatMessages(messageId);
    if (messages.length === 0) return;

    const originalMessage = messages[0];
    const messageText = originalMessage.message || '';

    // 提取 <content> 标签中的内容
    const contentMatch = messageText.match(/<content>([\s\S]*?)<\/content>/i);
    if (!contentMatch) {
      console.warn('消息中没有找到 <content> 标签，跳过裁剪');
      return;
    }

    let contentText = contentMatch[1];
    let hasChanges = false;

    // 查找所有 [[choice||...]] 块
    const choiceBlockRegex = /\[\[choice\|\|([^\]]+)\]\]/g;
    const allChoiceBlocks: Array<{ block: string; content: string }> = [];
    let match;

    while ((match = choiceBlockRegex.exec(contentText)) !== null) {
      allChoiceBlocks.push({
        block: match[0],
        content: match[1],
      });
    }

    console.info(`找到 ${allChoiceBlocks.length} 个选项块`);

    // 解析每个选项块，判断格式
    for (const choiceBlock of allChoiceBlocks) {
      const kvPairs: Record<string, string> = {};
      const parts = choiceBlock.content.split('||');

      // 解析键值对
      for (const part of parts) {
        const colonMatch = part.match(/^([^：:]+)[：:]\s*(.*)$/);
        if (colonMatch) {
          const key = colonMatch[1].trim();
          const value = colonMatch[2].trim();
          kvPairs[key] = value;
        }
      }

      // 检查是否有角色名或台词（格式1）
      const hasCharacterOrResponse =
        kvPairs['角色名'] ||
        kvPairs['character'] ||
        kvPairs['台词'] ||
        kvPairs['response'] ||
        kvPairs['text'] ||
        kvPairs['旁白'] ||
        kvPairs['narration'];

      // 查找所有选项键（选项X，允许带冒号）
      const optionKeys: string[] = [];
      for (const key in kvPairs) {
        // 匹配 "选项X" 或 "选项X：" 格式（X可以是任意数字）
        if (key.match(/^选项\d+：?$/)) {
          const optionNum = key.replace(/^选项(\d+)：?$/, '$1');
          optionKeys.push(optionNum);
        }
      }

      // 判断格式
      if (optionKeys.length === 1 && hasCharacterOrResponse) {
        // 格式1：单个选项 + 角色回复
        // 提取选项内容（兼容带冒号和不带冒号的键名）
        const optionKey = `选项${optionKeys[0]}`;
        const optionText = kvPairs[optionKey] || kvPairs[`${optionKey}：`];

        if (optionText && optionText.trim() !== selectedText.trim()) {
          // 删除未选中的选项块
          contentText = contentText.replace(choiceBlock.block, '');
          hasChanges = true;
          console.info('已删除未选中的格式1选项块:', optionText);
        } else if (optionText && optionText.trim() === selectedText.trim()) {
          // 保留选中的选项块
          console.info('保留选中的格式1选项块:', optionText);
        }
      } else if (optionKeys.length > 1) {
        // 格式2：多个选项在一个块中
        // 只保留被选中的选项，删除其他选项
        let newChoiceContent = '';
        let foundSelected = false;

        for (const optionNum of optionKeys) {
          const optionKey = `选项${optionNum}`;
          const optionText = kvPairs[optionKey];

          if (optionText === selectedText) {
            // 只保留这一个选项
            newChoiceContent = `选项${optionNum}：${optionText}`;
            foundSelected = true;
            break;
          }
        }

        if (foundSelected) {
          const newChoiceBlock = `[[choice||${newChoiceContent}]]`;
          contentText = contentText.replace(choiceBlock.block, newChoiceBlock);
          hasChanges = true;
          console.info('已裁剪格式2选项块，只保留选中的选项:', selectedText);
        }
      }
    }

    // 清理多余的空行
    if (hasChanges) {
      contentText = contentText.replace(/\n{3,}/g, '\n\n').trim();

      // 更新消息文本
      const newMessageText = messageText.replace(contentMatch[0], `<content>${contentText}</content>`);

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
        console.info('已更新消息文本（删除未选中的选项块）');
      }
    }
  } catch (error) {
    console.error('裁剪选项文本失败:', error);
  }
}

// 删除所有选项块（用于自定义输入时，因为都没有选择）
async function trimAllChoiceBlocks(messageId: number): Promise<void> {
  try {
    const messages = getChatMessages(messageId);
    if (messages.length === 0) return;

    const originalMessage = messages[0];
    const messageText = originalMessage.message || '';

    // 提取 <content> 标签中的内容
    const contentMatch = messageText.match(/<content>([\s\S]*?)<\/content>/i);
    if (!contentMatch) {
      console.warn('消息中没有找到 <content> 标签，跳过裁剪');
      return;
    }

    let contentText = contentMatch[1];

    // 查找所有 [[choice||...]] 块并删除
    const choiceBlockRegex = /\[\[choice\|\|([^\]]+)\]\]/g;
    const hasChoiceBlocks = choiceBlockRegex.test(contentText);

    if (hasChoiceBlocks) {
      // 删除所有选项块
      contentText = contentText.replace(choiceBlockRegex, '');

      // 清理多余的空行
      contentText = contentText.replace(/\n{3,}/g, '\n\n').trim();

      // 更新消息文本
      const newMessageText = messageText.replace(contentMatch[0], `<content>${contentText}</content>`);

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
        console.info('已删除所有选项块（自定义输入）');
      }
    }
  } catch (error) {
    console.error('删除所有选项块失败:', error);
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

    // 1. 自动识别并裁剪选项文本
    // 如果是自定义输入，删除所有选项块（因为都没有选择）
    // 如果是选择选项，只保留被选择的选项，删除其他未选择的选项
    if (id === 'custom' && customText) {
      // 自定义输入：删除所有选项块
      await trimAllChoiceBlocks(currentMessageId);
    } else {
      // 选择选项：只保留被选择的选项
      await trimChoiceText(currentMessageId, messageText);
    }

    // 2. 格式1：插入演出单元3（用户选择）和演出单元4（角色回复）
    // 检查是否是格式1（有角色回复）
    const isFormat1 = selectedOption && selectedOption.character && selectedOption.response;

    if (isFormat1) {
      // 检查是否已有演出单元3和4（回溯时替换，而不是追加）
      const choiceParentId = currentDialogue.value?.unitId;
      const existingUserDialogueIndex = dialogues.value.findIndex(
        d => d.isChoiceResponse && d.choiceParentId === choiceParentId && d.type === 'user',
      );
      const existingResponseDialogueIndex = dialogues.value.findIndex(
        d => d.isChoiceResponse && d.choiceParentId === choiceParentId && d.type !== 'user' && d.type !== 'choice',
      );

      // 获取当前对话的背景信息，用于继承到演出单元3和4
      const currentDialogueData = currentDialogue.value;
      const inheritScene = currentDialogueData?.scene;
      const inheritSceneImageUrl = currentDialogueData?.sceneImageUrl;
      const inheritSprite = currentDialogueData?.sprite;
      const inheritMotion = currentDialogueData?.motion;
      const inheritExpression = currentDialogueData?.expression;
      const inheritIsCG = currentDialogueData?.isCG;
      const inheritCgImageUrl = currentDialogueData?.cgImageUrl;

      // 演出单元3：用户对话框（显示选项内容）
      if (existingUserDialogueIndex !== -1) {
        // 回溯：替换现有的用户对话框
        dialogues.value[existingUserDialogueIndex].text = messageText;
        // 确保背景也被继承
        if (inheritScene) {
          dialogues.value[existingUserDialogueIndex].scene = inheritScene;
        }
        if (inheritSceneImageUrl) {
          dialogues.value[existingUserDialogueIndex].sceneImageUrl = inheritSceneImageUrl;
        }
      } else {
        // 首次选择：插入新的用户对话框
        const userDialogue: DialogueItem = {
          unitId: currentMessageId !== undefined ? `msg_${currentMessageId}_unit_choice_user` : `temp_unit_choice_user`,
          unitIndex: currentDialogIndex.value + 1,
          character: '你',
          text: messageText,
          type: 'user',
          message_id: currentMessageId,
          role: 'user',
          isChoiceResponse: true,
          choiceParentId: choiceParentId,
          // 继承背景
          scene: inheritScene,
          sceneImageUrl: inheritSceneImageUrl,
        };

        // 插入到选项框后面
        const newDialogues = [...dialogues.value];
        newDialogues.splice(currentDialogIndex.value + 1, 0, userDialogue);
        dialogues.value = newDialogues;

        // 更新后续对话的索引（因为插入了新对话）
        currentDialogIndex.value++;
      }

      // 演出单元4：角色回复对话框
      const responseCharacter = selectedOption?.character || '';
      const responseText = selectedOption?.response || '';

      if (existingResponseDialogueIndex !== -1) {
        // 回溯：替换现有的回复对话框
        dialogues.value[existingResponseDialogueIndex].character = responseCharacter;
        dialogues.value[existingResponseDialogueIndex].text = responseText;
        // 确保背景也被继承
        if (inheritScene) {
          dialogues.value[existingResponseDialogueIndex].scene = inheritScene;
        }
        if (inheritSceneImageUrl) {
          dialogues.value[existingResponseDialogueIndex].sceneImageUrl = inheritSceneImageUrl;
        }
        if (inheritSprite) {
          dialogues.value[existingResponseDialogueIndex].sprite = { ...inheritSprite };
        }
        if (inheritMotion) {
          dialogues.value[existingResponseDialogueIndex].motion = inheritMotion;
        }
        if (inheritExpression) {
          dialogues.value[existingResponseDialogueIndex].expression = inheritExpression;
        }
        if (inheritIsCG !== undefined) {
          dialogues.value[existingResponseDialogueIndex].isCG = inheritIsCG;
        }
        if (inheritCgImageUrl) {
          dialogues.value[existingResponseDialogueIndex].cgImageUrl = inheritCgImageUrl;
        }
      } else {
        // 首次选择：插入新的回复对话框
        const responseDialogue: DialogueItem = {
          unitId:
            currentMessageId !== undefined
              ? `msg_${currentMessageId}_unit_choice_response`
              : `temp_unit_choice_response`,
          unitIndex: currentDialogIndex.value + 1,
          character: responseCharacter,
          text: responseText,
          type: undefined,
          message_id: currentMessageId,
          role: 'assistant',
          isChoiceResponse: true,
          choiceParentId: choiceParentId,
          // 继承背景和立绘状态
          scene: inheritScene,
          sceneImageUrl: inheritSceneImageUrl,
          sprite: inheritSprite ? { ...inheritSprite } : undefined,
          motion: inheritMotion,
          expression: inheritExpression,
          isCG: inheritIsCG,
          cgImageUrl: inheritCgImageUrl,
        };

        // 插入到用户对话框后面
        const newDialogues = [...dialogues.value];
        const insertIndex =
          existingUserDialogueIndex !== -1 ? existingUserDialogueIndex + 1 : currentDialogIndex.value + 1;
        newDialogues.splice(insertIndex, 0, responseDialogue);
        dialogues.value = newDialogues;
      }
    }

    // 3. 区分演出中和演出后的行为
    if (isAllDialoguesLoaded) {
      // 演出后：真选项框，裁剪当前消息，保留 <content>...</content> 标签块及其之后的所有内容，然后删除后续对话并触发 AI 回复
      if (currentMessageId !== undefined) {
        try {
          // 先裁剪当前消息文本，保留 <content>...</content> 标签块及其之后的所有内容
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
              console.info('已裁剪消息文本，保留 <content>...</content> 标签块及其之后的所有内容');
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
          await deleteChatMessages(messagesToDelete, { refresh: 'none' });
          console.info(`已删除 ${messagesToDelete.length} 条后续消息`);
        }
      }

      // 发送用户输入的消息（不附加任何标签，直接发送纯文本）
      await createChatMessages(
        [
          {
            role: 'user',
            message: messageText, // 直接发送纯文本，不附加任何标签
          },
        ],
        { refresh: 'none' },
      );
      console.info('已发送用户消息（无标签）:', messageText);

      // 移除流式界面准备（已取消流式功能）

      // 触发 AI 生成回复
      await triggerSlash('/trigger');
      console.info('已触发 AI 生成');

      // 重新加载对话数据（不自动跳转，保持用户播放位置）
      await loadDialoguesFromTavern();
    }

    // 演出中：带角色回复的选项（格式1）会继续剧情演出，不触发 AI 回复
    // 如果是自定义输入选项，则裁剪当前消息并在 </content> 之前停止，然后删除后续对话并触发 AI 回复
    if (!isAllDialoguesLoaded && id === 'custom' && customText) {
      // 自定义输入选项：智能裁剪 - 删除之后的演出文本，保留</content>之后的内容
      if (currentMessageId !== undefined) {
        try {
          const messages = getChatMessages(currentMessageId);
          if (messages.length > 0) {
            const currentMessage = messages[0];
            const originalText = currentMessage.message || '';
            // 保留 </content> 标签及其之后的所有内容
            const trimmedText = trimMessageAfterContentTag(originalText);

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
              console.info('已裁剪消息文本（保留</content>之后的内容）');
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
          await deleteChatMessages(messagesToDelete, { refresh: 'none' });
          console.info(`已删除 ${messagesToDelete.length} 条后续消息`);
        }
      }

      // 发送用户输入的消息（不附加任何标签，直接发送纯文本）
      await createChatMessages(
        [
          {
            role: 'user',
            message: messageText, // 直接发送纯文本，不附加任何标签
          },
        ],
        { refresh: 'none' },
      );
      console.info('已发送用户消息（自定义输入，无标签）:', messageText);

      // 移除流式界面准备（已取消流式功能）

      // 触发 AI 生成回复
      await triggerSlash('/trigger');
      console.info('已触发 AI 生成（自定义输入）');

      // 重新加载对话数据（不自动跳转，保持用户播放位置）
      await loadDialoguesFromTavern();
    } else if (!isAllDialoguesLoaded) {
      // 普通选项：只显示角色回复，不删除后续对话，不触发 AI 回复
      // 继续下一条对话
      nextDialogue();
    }
  } catch (error) {
    console.error('处理选择时出错:', error);
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

  // 返回消息的完整文本
  return text;
}

// 移除流式处理相关函数（已取消流式功能）

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
          const blocks = await parseMessageBlocks(messageText, undefined, userDisplayName.value);

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

    // 先保存当前对话索引，以便在找不到时恢复
    const previousIndex = currentDialogIndex.value;

    // 设置历史跳转标志，防止 loadDialoguesFromTavern 重置索引
    isJumpingToHistory.value = true;

    // 重新加载对话数据
    await loadDialoguesFromTavern();

    // 等待 DOM 更新
    await nextTick();

    // 找到对应的对话索引（查找第一个匹配的对话项）
    // 注意：一个 message_id 可能对应多个对话项（因为一条消息可能包含多个块）
    let dialogueIndex = -1;

    // 首先尝试精确匹配
    dialogueIndex = dialogues.value.findIndex(d => d.message_id === messageId);

    // 如果没找到，尝试查找包含该 message_id 的第一个对话项
    if (dialogueIndex < 0) {
      // 查找所有匹配的对话项
      const matchingDialogues = dialogues.value
        .map((d, index) => ({ dialogue: d, index }))
        .filter(({ dialogue }) => dialogue.message_id === messageId);

      if (matchingDialogues.length > 0) {
        // 使用第一个匹配的对话项
        dialogueIndex = matchingDialogues[0].index;
      }
    }

    if (dialogueIndex >= 0) {
      currentDialogIndex.value = dialogueIndex;
      // 确保界面更新
      await nextTick();
      console.info(`已跳转到消息 ${messageId}（索引 ${dialogueIndex}，总对话数: ${dialogues.value.length}）`);
    } else {
      console.warn(
        `未找到消息 ${messageId} 对应的对话，当前对话数量: ${dialogues.value.length}`,
        `对话 message_id 列表:`,
        dialogues.value.map((d, i) => ({ index: i, message_id: d.message_id })).slice(0, 10),
      );
      // 如果没找到，保持当前位置或跳转到第一条
      if (previousIndex >= 0 && previousIndex < dialogues.value.length) {
        currentDialogIndex.value = previousIndex;
        console.info(`保持当前位置（索引 ${previousIndex}）`);
      } else if (dialogues.value.length > 0) {
        currentDialogIndex.value = 0;
        console.info('已跳转到第一条对话');
      }
    }
  } catch (error) {
    console.error('跳转到历史消息失败:', error);
    // 确保标志被重置
    isJumpingToHistory.value = false;
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

function handleTheaterClick() {
  showPhonePanel.value = true;
  characterMenuExpanded.value = false;
}

// 快速打开手机面板并展开联系人列表
function handleQuickTheaterClick() {
  showPhonePanel.value = true;
  characterMenuExpanded.value = false;
  // 自动展开联系人列表
  nextTick(() => {
    // PhonePanel 会自动展开联系人列表（如果有未读消息）
  });
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
  const timestamp = new Date().toISOString();
  inputText.value = '';
  showInputBox.value = false;

  const currentMessageId = currentDialogue.value?.message_id;
  const lastMessageId = getLastMessageId();

  // 智能裁剪：无论是否演出完成，都需要裁剪当前消息，保留 <content>...</content> 标签块及其之后的所有内容
  if (currentMessageId !== undefined) {
    try {
      // 获取当前消息的完整文本
      const messages = getChatMessages(currentMessageId);
      if (messages.length > 0) {
        const currentMessage = messages[0];
        const originalText = currentMessage.message || '';

        // 裁剪消息文本，保留 <content>...</content> 标签块及其之后的所有内容
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
          console.info('已裁剪消息文本，保留 <content>...</content> 标签块及其之后的所有内容');
        }
      }

      // 删除当前消息之后的所有消息（无论是否演出完成）
      if (currentMessageId < lastMessageId) {
        const messagesToDelete: number[] = [];
        for (let i = currentMessageId + 1; i <= lastMessageId; i++) {
          messagesToDelete.push(i);
        }
        if (messagesToDelete.length > 0) {
          await deleteChatMessages(messagesToDelete, { refresh: 'none' });
          console.info(`已删除 ${messagesToDelete.length} 条后续消息`);
        }
      }
    } catch (error) {
      console.error('裁剪和删除后续消息失败:', error);
    }
  }

  // 在当前位置后插入用户对话，继承当前对话的背景和立绘状态
  const tempMessageId = getLastMessageId() + 1;
  const tempUnitIndex = dialogues.value.length;
  const currentDialogueData = currentDialogue.value;
  const unitId = `msg_${tempMessageId}_unit_${tempUnitIndex}`;
  const newDialogue: DialogueItem = {
    unitId,
    unitIndex: tempUnitIndex,
    character: '你',
    text,
    type: 'user',
    isEditable: true,
    message_id: tempMessageId, // 临时ID，实际会从酒馆获取
    role: 'user',
    // 继承背景
    scene: currentDialogueData?.scene,
    sceneImageUrl: currentDialogueData?.sceneImageUrl,
    // 继承立绘状态
    sprite: currentDialogueData?.sprite ? { ...currentDialogueData.sprite } : undefined,
    motion: currentDialogueData?.motion,
    expression: currentDialogueData?.expression,
    // 继承CG状态
    isCG: currentDialogueData?.isCG,
    cgImageUrl: currentDialogueData?.cgImageUrl,
  };

  // 添加到预发送文本 store
  const pendingTextId = pendingTextStore.addInputText(text, timestamp, unitId);

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

    // 发送用户消息（自动附加phone标签）
    await sendUserMessageWithPhone(formattedMessage);
    console.info('已发送用户消息:', text);

    // 移除流式界面准备（已取消流式功能）

    // 触发 AI 生成回复
    await triggerSlash('/trigger');
    console.info('已触发 AI 生成');

    // 重新加载对话数据（不自动跳转，保持用户播放位置）
    await loadDialoguesFromTavern();

    // 重新加载后，如果进入了新的演出单元（AI 生成了回复），则从预发送文本中移除
    // 因为此时输入已经提交到消息文本
    const newLastMessageId = getLastMessageId();
    if (newLastMessageId > lastMessageId) {
      // 说明进入了新的演出单元
      pendingTextStore.clearByUnitId(unitId);
      console.info('[GalgamePlayer] 输入已提交到消息文本，从预发送文本中移除:', unitId);
    }
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
      const dialogue = newDialogues[dialogueIndex];
      newDialogues[dialogueIndex] = {
        ...dialogue,
        text: newText,
      };
      dialogues.value = newDialogues;

      // 如果该消息在预发送文本中，也要同步更新
      if (dialogue.unitId) {
        pendingTextStore.updateTextByUnitId(dialogue.unitId, newText);
        console.info('[GalgamePlayer] 同步编辑到预发送文本:', dialogue.unitId, newText);
      }
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
