<template>
  <div class="model-upload-wizard">
    <PageHeader title="游戏设置" @back="$emit('close')">
      <IconUpload />
      <template #actions>
        <button class="bubble-btn bubble-btn-sm" :disabled="clearingCache" @click="handleClearCache">
          {{ clearingCache ? '清理中...' : '清除缓存' }}
        </button>
      </template>
    </PageHeader>

    <!-- 步骤指示器 -->
    <div class="steps-indicator">
      <div
        v-for="(step, index) in steps"
        :key="index"
        :class="['step-item', { active: currentStep === index, completed: currentStep > index }]"
      >
        <div class="step-number">{{ index + 1 }}</div>
        <div class="step-label">{{ step.label }}</div>
      </div>
    </div>

    <!-- 步骤1: 上传文件 -->
    <div v-show="currentStep === 0" class="step-content">
      <!-- 统一显示所有已上传文件列表 -->
      <div v-if="pendingFiles.length > 0" class="uploaded-files-preview">
        <div class="files-summary">
          <p>
            已选择 {{ pendingFiles.length }} 个文件（可混合使用本地文件和URL导入）
            <span v-if="pendingFiles.some(f => f.sourceUrl)" class="hint">
              - {{ pendingFiles.filter(f => f.sourceUrl).length }} 个来自URL
            </span>
          </p>
          <button class="bubble-btn bubble-btn-sm" @click="clearFiles">清空</button>
        </div>
        <div class="files-list">
          <div
            v-for="(fileWithSource, index) in pendingFiles"
            :key="`${fileWithSource.file.name}-${index}`"
            class="file-item"
          >
            <span class="file-name">{{ fileWithSource.file.name }}</span>
            <span v-if="fileWithSource.sourceUrl" class="file-source-badge" title="URL导入">URL</span>
            <span :class="['file-type-badge', getFileTypeClass(fileWithSource.file)]">{{
              getFileTypeLabel(fileWithSource.file)
            }}</span>
            <button class="remove-file-btn" title="移除" @click.stop="removeFile(index)">
              <IconClose class="icon-sm" />
            </button>
          </div>
        </div>
      </div>

      <!-- 上传方式：本地文件和URL导入并排显示 -->
      <div class="upload-methods-container">
        <!-- 本地文件上传 -->
        <div class="upload-method-section">
          <h3 class="method-title">本地文件上传</h3>
          <div class="upload-area" @click="triggerFileInput" @dragover.prevent @drop.prevent="handleDrop">
            <input
              ref="fileInputRef"
              type="file"
              class="hidden-input"
              accept=".png,.jpg,.jpeg,.moc3,.model3.json,.cdi3.json,.motion3.json,.physics3.json"
              multiple
              @change="handleFileSelect"
            />
            <div class="upload-area-inner">
              <div class="upload-placeholder">
                <IconUpload class="icon-lg" />
                <p>点击或拖拽文件到这里上传</p>
                <p class="hint">支持模型文件（.moc3, .model3.json等）</p>
                <p class="hint">支持图片文件（.png, .jpg等）</p>
              </div>
            </div>
          </div>
        </div>

        <!-- URL导入 -->
        <div class="upload-method-section">
          <h3 class="method-title">URL导入</h3>
          <div class="url-upload-area">
            <div class="url-input-group">
              <textarea
                v-model="urlInput"
                class="url-input"
                placeholder="请输入文件URL，每行一个，或使用逗号/分号分隔&#10;支持图片和模型文件"
                rows="3"
                @keydown.ctrl.enter="importFromUrl"
              />
              <button
                class="bubble-btn bubble-btn-primary"
                :disabled="!urlInput.trim() || importingUrl"
                @click="importFromUrl"
              >
                {{ importingUrl ? '导入中...' : '导入 URL' }}
              </button>
            </div>
            <p class="hint">可以输入多个URL，每行一个，或使用逗号/分号分隔（Ctrl+Enter 快速导入）</p>
            <p class="hint">导入的文件会与本地文件合并显示，URL 文件会保留原始地址</p>
          </div>
        </div>
      </div>

      <div class="step-actions">
        <button class="bubble-btn" @click="$emit('close')">取消</button>
        <button
          class="bubble-btn bubble-btn-primary"
          :disabled="pendingFiles.length === 0"
          @click="handleUploadAndNext"
        >
          完成上传并分类文件
        </button>
      </div>
    </div>

    <!-- 步骤2: 分类和确认 -->
    <div v-show="currentStep === 1" class="step-content">
      <div v-if="classifying" class="classifying-status">
        <p>正在自动分类文件...</p>
      </div>
      <div v-else class="classified-files">
        <!-- 资源名称输入 -->
        <div class="settings-card">
          <h3>资源名称</h3>
          <input v-model="modelName" type="text" placeholder="请输入资源名称" class="model-name-input" />
          <p class="hint">资源名称将用于世界书条目和配置（可以是模型名、角色名等）</p>
        </div>

        <!-- 文件分类显示 -->
        <div class="files-categories">
          <!-- 模型文件 -->
          <div v-if="classifiedFiles.moc3 || classifiedFiles.model3" class="category-section">
            <h3>模型文件</h3>
            <div class="file-category">
              <div v-if="classifiedFiles.model3" class="category-item">
                <IconCheck class="icon-sm" />
                <span>{{ classifiedFiles.model3.name }}</span>
              </div>
              <div v-if="classifiedFiles.moc3" class="category-item">
                <IconCheck class="icon-sm" />
                <span>{{ classifiedFiles.moc3.name }}</span>
              </div>
            </div>
          </div>

          <!-- 纹理文件 -->
          <div v-if="classifiedFiles.textures.length > 0" class="category-section">
            <h3>纹理文件 ({{ classifiedFiles.textures.length }})</h3>
            <div class="file-category">
              <div
                v-for="texture in classifiedFiles.textures"
                :key="texture.name"
                class="category-item category-item-with-select"
              >
                <IconCheck class="icon-sm" />
                <span class="file-name">{{ texture.name }}</span>
                <select
                  :value="'texture'"
                  class="classify-select"
                  @change="reclassifyImage('texture', texture.name, ($event.target as HTMLSelectElement).value as any)"
                >
                  <option value="texture">纹理</option>
                  <option value="sprite">立绘</option>
                  <option value="background">背景</option>
                  <option value="cg">CG</option>
                  <option value="unclassified">待分类</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 动作/表情文件 -->
          <div v-if="classifiedFiles.motions.length > 0" class="category-section">
            <h3>动作/表情文件 ({{ classifiedFiles.motions.length }})</h3>
            <p class="hint">请确认每个文件是"动作"还是"表情"（系统已自动识别，可手动调整）</p>
            <div class="file-category">
              <div v-for="motion in classifiedFiles.motions" :key="motion.name" class="category-item">
                <IconCheck class="icon-sm" />
                <span>{{ motion.name }}</span>
                <span :class="['type-badge', motion.type === 'motion' ? 'badge-motion' : 'badge-expression']">
                  {{ motion.type === 'motion' ? '动作' : '表情' }}
                </span>
                <button class="toggle-type-btn" @click="toggleMotionType(motion)">
                  切换为{{ motion.type === 'motion' ? '表情' : '动作' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 立绘文件 -->
          <div v-if="classifiedFiles.sprites.length > 0" class="category-section">
            <h3>角色立绘 ({{ classifiedFiles.sprites.length }})</h3>
            <div class="file-category">
              <div
                v-for="sprite in classifiedFiles.sprites"
                :key="sprite.name"
                class="category-item category-item-with-select"
              >
                <IconCheck class="icon-sm" />
                <span class="file-name">{{ sprite.name }}</span>
                <span v-if="sprite.characterName" class="character-name-badge">{{ sprite.characterName }}</span>
                <select
                  :value="'sprite'"
                  class="classify-select"
                  @change="reclassifyImage('sprite', sprite.name, ($event.target as HTMLSelectElement).value as any)"
                >
                  <option value="sprite">立绘</option>
                  <option value="background">背景</option>
                  <option value="cg">CG</option>
                  <option value="texture">纹理</option>
                  <option value="unclassified">待分类</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 背景文件 -->
          <div v-if="classifiedFiles.backgrounds.length > 0" class="category-section">
            <h3>背景 ({{ classifiedFiles.backgrounds.length }})</h3>
            <div class="file-category">
              <div
                v-for="bg in classifiedFiles.backgrounds"
                :key="bg.name"
                class="category-item category-item-with-select"
              >
                <IconCheck class="icon-sm" />
                <span class="file-name">{{ bg.name }}</span>
                <select
                  :value="'background'"
                  class="classify-select"
                  @change="reclassifyImage('background', bg.name, ($event.target as HTMLSelectElement).value as any)"
                >
                  <option value="background">背景</option>
                  <option value="sprite">立绘</option>
                  <option value="cg">CG</option>
                  <option value="texture">纹理</option>
                  <option value="unclassified">待分类</option>
                </select>
              </div>
            </div>
          </div>

          <!-- CG文件 -->
          <div v-if="classifiedFiles.cgs.length > 0" class="category-section">
            <h3>CG ({{ classifiedFiles.cgs.length }})</h3>
            <div class="file-category">
              <div v-for="cg in classifiedFiles.cgs" :key="cg.name" class="category-item category-item-with-select">
                <IconCheck class="icon-sm" />
                <span class="file-name">{{ cg.name }}</span>
                <select
                  :value="'cg'"
                  class="classify-select"
                  @change="reclassifyImage('cg', cg.name, ($event.target as HTMLSelectElement).value as any)"
                >
                  <option value="cg">CG</option>
                  <option value="sprite">立绘</option>
                  <option value="background">背景</option>
                  <option value="texture">纹理</option>
                  <option value="unclassified">待分类</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 待分类图片 -->
          <div v-if="classifiedFiles.unclassifiedImages.length > 0" class="category-section">
            <h3>待分类图片 ({{ classifiedFiles.unclassifiedImages.length }})</h3>
            <p class="hint">点击选择框将图片分类为立绘、背景、CG或纹理</p>
            <div class="file-category">
              <div
                v-for="image in classifiedFiles.unclassifiedImages"
                :key="image.name"
                class="category-item category-item-with-select"
              >
                <IconCheck class="icon-sm" />
                <span class="file-name">{{ image.name }}</span>
                <select
                  :value="''"
                  class="classify-select"
                  @change="classifyImage(image.name, ($event.target as HTMLSelectElement).value as any)"
                >
                  <option value="" disabled>选择分类...</option>
                  <option value="sprite">立绘</option>
                  <option value="background">背景</option>
                  <option value="cg">CG</option>
                  <option value="texture">纹理</option>
                </select>
              </div>
            </div>
          </div>

          <!-- 其他文件 -->
          <div v-if="classifiedFiles.others.length > 0" class="category-section">
            <h3>其他文件 ({{ classifiedFiles.others.length }})</h3>
            <div class="file-category">
              <div v-for="file in classifiedFiles.others" :key="file.name" class="category-item">
                <IconCheck class="icon-sm" />
                <span>{{ file.name }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="step-actions">
        <button class="bubble-btn" @click="prevStep">上一步</button>
        <button class="bubble-btn bubble-btn-primary" :disabled="!canProceed" @click="nextStep">下一步</button>
      </div>
    </div>

    <!-- 步骤3: 模型设置（可选，只在有模型时显示） -->
    <div v-show="currentStep === 2" class="step-content">
      <div v-if="hasModelFiles" class="model-settings">
        <div class="settings-card">
          <h3>模型设置</h3>
          <div class="setting-item">
            <label>模型名称</label>
            <input v-model="modelName" type="text" />
          </div>
          <div class="setting-item">
            <label>模型版本</label>
            <select v-model="modelVersion">
              <option :value="3">3 (model3.json)</option>
              <option :value="2">2 (model.json)</option>
            </select>
          </div>
        </div>
      </div>
      <div v-else class="settings-card">
        <p class="hint">未检测到模型文件，将跳过此步骤</p>
      </div>
      <div class="step-actions">
        <button class="bubble-btn" @click="prevStep">上一步</button>
        <button class="bubble-btn bubble-btn-primary" @click="nextStep">
          {{ hasModelFiles ? '下一步：资源设置' : '下一步' }}
        </button>
      </div>
    </div>

    <!-- 步骤4: 资源设置（列表界面） -->
    <div v-show="currentStep === 3 && !resourceDetailPage" class="step-content">
      <div class="resource-settings-list">
        <!-- 动画和表情设置入口 -->
        <button
          v-if="hasModelFiles && (motionCount > 0 || expressionCount > 0)"
          class="resource-entry-btn"
          @click="openResourceDetail('animation')"
        >
          <div class="resource-entry-icon">
            <svg class="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <div class="resource-entry-content">
            <span class="resource-entry-title">动画和表情设置</span>
            <span class="resource-entry-desc">{{ motionCount }} 个动作，{{ expressionCount }} 个表情</span>
          </div>
          <div class="resource-entry-badge">{{ motionCount + expressionCount }}</div>
          <svg class="resource-entry-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- 角色立绘设置入口 -->
        <button
          v-if="classifiedFiles.sprites.length > 0"
          class="resource-entry-btn"
          @click="openResourceDetail('sprite')"
        >
          <div class="resource-entry-icon">
            <svg class="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <div class="resource-entry-content">
            <span class="resource-entry-title">角色立绘设置</span>
            <span class="resource-entry-desc">配置立绘的文本映射</span>
          </div>
          <div class="resource-entry-badge">{{ classifiedFiles.sprites.length }}</div>
          <svg class="resource-entry-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- 背景设置入口 -->
        <button
          v-if="classifiedFiles.backgrounds.length > 0"
          class="resource-entry-btn"
          @click="openResourceDetail('background')"
        >
          <div class="resource-entry-icon">
            <svg class="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="resource-entry-content">
            <span class="resource-entry-title">背景设置</span>
            <span class="resource-entry-desc">配置背景的文本映射</span>
          </div>
          <div class="resource-entry-badge">{{ classifiedFiles.backgrounds.length }}</div>
          <svg class="resource-entry-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- CG设置入口 -->
        <button v-if="classifiedFiles.cgs.length > 0" class="resource-entry-btn" @click="openResourceDetail('cg')">
          <div class="resource-entry-icon">
            <svg class="icon-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div class="resource-entry-content">
            <span class="resource-entry-title">CG设置</span>
            <span class="resource-entry-desc">配置CG的文本映射</span>
          </div>
          <div class="resource-entry-badge">{{ classifiedFiles.cgs.length }}</div>
          <svg class="resource-entry-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>

        <!-- 无可配置资源提示 -->
        <div
          v-if="
            !(hasModelFiles && (motionCount > 0 || expressionCount > 0)) &&
            classifiedFiles.sprites.length === 0 &&
            classifiedFiles.backgrounds.length === 0 &&
            classifiedFiles.cgs.length === 0
          "
          class="no-resources-hint"
        >
          <p>暂无可配置的资源</p>
          <p class="hint">请在上一步中上传并分类文件</p>
        </div>
      </div>
      <div class="step-actions">
        <button class="bubble-btn" @click="prevStep">上一步</button>
        <button class="bubble-btn bubble-btn-primary" @click="nextStep">下一步：完成</button>
      </div>
    </div>

    <!-- 步骤4: 资源设置详情页面 -->
    <div v-show="currentStep === 3 && resourceDetailPage" class="step-content resource-detail-page">
      <!-- 详情页内容区域（可滚动，包含头部） -->
      <div class="resource-detail-content">
        <!-- 详情页头部（在可滚动区域内） -->
        <div class="resource-detail-header">
          <button class="back-btn" @click="closeResourceDetail">
            <svg class="icon-sm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            返回
          </button>
          <h3 class="resource-detail-title">{{ resourceDetailTitle }}</h3>
        </div>
        <!-- 动画和表情设置详情 -->
        <div v-if="resourceDetailPage === 'animation'" class="animation-settings">
          <div class="settings-hint">
            <p>提示：系统已从模型文件中提取动作索引信息，配置完成后将自动生成优化的映射表</p>
          </div>
          <div class="setting-item">
            <label>默认表情</label>
            <select v-model="defaultExpression" class="select-with-scroll">
              <option value="none">无</option>
              <option v-for="expr in expressionList" :key="expr.name" :value="expr.name">
                {{ expr.name }}
              </option>
            </select>
          </div>
          <div class="setting-item">
            <label>默认动作（Idle）</label>
            <select v-model="defaultMotion" class="select-with-scroll">
              <option value="none">无</option>
              <option v-for="motion in motionList" :key="motion.name" :value="motion.name">
                {{ motion.name }}
              </option>
            </select>
          </div>
          <div class="setting-item">
            <label>
              <input v-model="autoLoopDefaultMotion" type="checkbox" />
              自动循环默认动作
            </label>
            <p class="hint">当没有检测到特定文本时，将自动循环播放默认动作</p>
          </div>

          <!-- 文本到动作/表情映射 -->
          <div class="text-mapping-section">
            <div class="text-mapping-header">
              <h4>文本映射</h4>
              <button class="bubble-btn bubble-btn-sm add-mapping-btn" @click="addMapping">
                <IconUpload class="icon-sm" />
                添加映射
              </button>
            </div>
            <p class="hint">当检测到特定文本时，自动播放对应的动作和表情（多个文本用分号分隔）</p>
            <div class="mapping-list">
              <div v-for="(mapping, index) in textMappings" :key="index" class="mapping-item">
                <div class="mapping-inputs-vertical">
                  <div class="text-tags-input-wrapper">
                    <label class="mapping-label">触发文本</label>
                    <input
                      :value="mapping.text"
                      type="text"
                      placeholder="输入触发文本，多个用分号(;)分隔"
                      class="mapping-text-input tags-input"
                      @blur="handleTextMappingBlur(index, $event)"
                      @keydown.enter="handleTextMappingEnter(index, $event)"
                    />
                    <div v-if="mapping.textTags && mapping.textTags.length > 0" class="text-tags">
                      <span v-for="(tag, tagIndex) in mapping.textTags" :key="tagIndex" class="text-tag">
                        {{ tag }}
                        <button class="tag-remove" @click="removeTextTag(index, tagIndex)">×</button>
                      </span>
                    </div>
                  </div>
                  <div class="mapping-selects-row">
                    <div class="mapping-select-item">
                      <label class="mapping-label">表情</label>
                      <select v-model="mapping.expression" class="mapping-select select-with-scroll">
                        <option value="none">无表情</option>
                        <option v-for="expr in expressionList" :key="expr.name" :value="expr.name">
                          {{ expr.name }}
                        </option>
                      </select>
                    </div>
                    <div class="mapping-select-item">
                      <label class="mapping-label">动作</label>
                      <select v-model="mapping.motion" class="mapping-select select-with-scroll">
                        <option value="none">无动作</option>
                        <option v-for="motion in motionList" :key="motion.name" :value="motion.name">
                          {{ motion.name }}
                        </option>
                      </select>
                    </div>
                    <button class="remove-mapping-btn" title="删除" @click="removeMapping(index)">
                      <IconClose class="icon-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 角色立绘设置详情 -->
        <div v-if="resourceDetailPage === 'sprite'" class="sprite-settings">
          <div v-for="(sprite, index) in spriteResources" :key="index" class="sprite-item">
            <div class="sprite-header">
              <span class="sprite-name">{{ sprite.name }}</span>
              <span v-if="sprite.characterName" class="character-name-badge">{{ sprite.characterName }}</span>
              <button class="bubble-btn bubble-btn-sm add-mapping-btn-inline" @click="addSpriteMapping(index)">
                <IconUpload class="icon-sm" />
                添加映射
              </button>
            </div>
            <div class="text-mapping-section compact">
              <div class="mapping-list">
                <div v-for="(mapping, mapIndex) in sprite.textMappings || []" :key="mapIndex" class="mapping-item">
                  <div class="mapping-inputs">
                    <div class="text-tags-input-wrapper">
                      <input
                        :value="mapping.text"
                        type="text"
                        placeholder="输入触发文本，多个用分号(;)分隔"
                        class="mapping-text-input tags-input"
                        @blur="handleSpriteMappingBlur(index, mapIndex, $event)"
                        @keydown.enter="handleSpriteMappingEnter(index, mapIndex, $event)"
                      />
                      <div v-if="mapping.textTags && mapping.textTags.length > 0" class="text-tags">
                        <span v-for="(tag, tagIndex) in mapping.textTags" :key="tagIndex" class="text-tag">
                          {{ tag }}
                          <button class="tag-remove" @click="removeSpriteTextTag(index, mapIndex, tagIndex)">×</button>
                        </span>
                      </div>
                    </div>
                    <button class="remove-mapping-btn" title="删除" @click="removeSpriteMapping(index, mapIndex)">
                      <IconClose class="icon-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 背景设置详情 -->
        <div v-if="resourceDetailPage === 'background'" class="background-settings">
          <div v-for="(bg, index) in backgroundResources" :key="index" class="background-item">
            <div class="resource-header">
              <span class="resource-name">{{ bg.name }}</span>
              <button class="bubble-btn bubble-btn-sm add-mapping-btn-inline" @click="addBackgroundMapping(index)">
                <IconUpload class="icon-sm" />
                添加映射
              </button>
            </div>
            <div class="text-mapping-section compact">
              <div class="mapping-list">
                <div v-for="(mapping, mapIndex) in bg.textMappings || []" :key="mapIndex" class="mapping-item">
                  <div class="mapping-inputs">
                    <div class="text-tags-input-wrapper">
                      <input
                        :value="mapping.text"
                        type="text"
                        placeholder="输入触发文本，多个用分号(;)分隔"
                        class="mapping-text-input tags-input"
                        @blur="handleBackgroundMappingBlur(index, mapIndex, $event)"
                        @keydown.enter="handleBackgroundMappingEnter(index, mapIndex, $event)"
                      />
                      <div v-if="mapping.textTags && mapping.textTags.length > 0" class="text-tags">
                        <span v-for="(tag, tagIndex) in mapping.textTags" :key="tagIndex" class="text-tag">
                          {{ tag }}
                          <button class="tag-remove" @click="removeBackgroundTextTag(index, mapIndex, tagIndex)">
                            ×
                          </button>
                        </span>
                      </div>
                    </div>
                    <button class="remove-mapping-btn" title="删除" @click="removeBackgroundMapping(index, mapIndex)">
                      <IconClose class="icon-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- CG设置详情 -->
        <div v-if="resourceDetailPage === 'cg'" class="cg-settings">
          <div v-for="(cg, index) in cgResources" :key="index" class="cg-item">
            <div class="resource-header">
              <span class="resource-name">{{ cg.name }}</span>
              <button class="bubble-btn bubble-btn-sm add-mapping-btn-inline" @click="addCGMapping(index)">
                <IconUpload class="icon-sm" />
                添加映射
              </button>
            </div>
            <div class="text-mapping-section compact">
              <div class="mapping-list">
                <div v-for="(mapping, mapIndex) in cg.textMappings || []" :key="mapIndex" class="mapping-item">
                  <div class="mapping-inputs">
                    <div class="text-tags-input-wrapper">
                      <input
                        :value="mapping.text"
                        type="text"
                        placeholder="输入触发文本，多个用分号(;)分隔"
                        class="mapping-text-input tags-input"
                        @blur="handleCGMappingBlur(index, mapIndex, $event)"
                        @keydown.enter="handleCGMappingEnter(index, mapIndex, $event)"
                      />
                      <div v-if="mapping.textTags && mapping.textTags.length > 0" class="text-tags">
                        <span v-for="(tag, tagIndex) in mapping.textTags" :key="tagIndex" class="text-tag">
                          {{ tag }}
                          <button class="tag-remove" @click="removeCGTextTag(index, mapIndex, tagIndex)">×</button>
                        </span>
                      </div>
                    </div>
                    <button class="remove-mapping-btn" title="删除" @click="removeCGMapping(index, mapIndex)">
                      <IconClose class="icon-sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 详情页底部操作 -->
      <div class="step-actions">
        <button class="bubble-btn bubble-btn-primary" @click="closeResourceDetail">完成设置</button>
      </div>
    </div>

    <!-- 步骤5: 完成 -->
    <div v-show="currentStep === 4" class="step-content">
      <div class="completion-summary">
        <IconCheck class="icon-lg success-icon" />
        <h2>准备完成</h2>
        <p>模型 "{{ modelName }}" 已准备就绪</p>
        <div class="summary-details">
          <p>模型文件: {{ hasModelFiles ? '✓' : '✗' }}</p>
          <p>纹理文件: {{ classifiedFiles.textures.length }} 个</p>
          <p>动作文件: {{ motionCount }} 个</p>
          <p>表情文件: {{ expressionCount }} 个</p>
        </div>
      </div>
      <div class="step-actions">
        <button class="bubble-btn" @click="prevStep">上一步</button>
        <button class="bubble-btn bubble-btn-primary" :disabled="creating" @click="completeUpload">
          <span v-if="creating">正在创建...</span>
          <span v-else>完成并创建世界书条目</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 第三方库
import toastr from 'toastr';
import { computed, ref } from 'vue';

// 项目内部
import { IconCheck, IconClose, IconUpload } from '../assets/icons';
import { parseModel3Motions } from '../composables';
import { WORLDBOOK_NAME } from '../data';
import type { ImportedModel } from '../types';
import { clearAllFiles, storeFile } from '../utils/indexedDB';
import {
  createBackgroundResourceWorldbookEntry,
  createCGResourceWorldbookEntry,
  createModelResourceWorldbookEntry,
  createSpriteResourceWorldbookEntry,
} from '../utils/worldbookFormat';
import PageHeader from './PageHeader.vue';

const emit = defineEmits<{
  close: [];
  complete: [model: ImportedModel];
}>();

const steps = [
  { label: '上传文件' },
  { label: '分类文件' },
  { label: '模型设置' },
  { label: '资源设置' },
  { label: '完成' },
];

const currentStep = ref(0);
const fileInputRef = ref<HTMLInputElement>();

// 资源设置详情页面状态
type ResourceDetailPage = 'animation' | 'sprite' | 'background' | 'cg' | null;
const resourceDetailPage = ref<ResourceDetailPage>(null);
const resourceDetailTitle = computed(() => {
  switch (resourceDetailPage.value) {
    case 'animation':
      return '动画和表情设置';
    case 'sprite':
      return '角色立绘设置';
    case 'background':
      return '背景设置';
    case 'cg':
      return 'CG设置';
    default:
      return '';
  }
});

function openResourceDetail(page: ResourceDetailPage) {
  resourceDetailPage.value = page;
}

function closeResourceDetail() {
  resourceDetailPage.value = null;
}

// 文件包装类型：用于区分本地文件和 URL 导入的文件
interface FileWithSource {
  file: File;
  /** 如果是 URL 导入的文件，存储原始 URL；本地文件则为 undefined */
  sourceUrl?: string;
}

const pendingFiles = ref<FileWithSource[]>([]);
const modelName = ref('');
const classifying = ref(false);
const creating = ref(false);
const modelVersion = ref(3);
const urlInput = ref('');
const importingUrl = ref(false);
const clearingCache = ref(false);

interface ClassifiedFile {
  name: string;
  file: File;
  /** 如果是 URL 导入的文件，存储原始 URL；本地文件则为 undefined */
  sourceUrl?: string;
  type:
    | 'texture'
    | 'moc3'
    | 'model3'
    | 'cdi3'
    | 'motion'
    | 'expression'
    | 'sprite'
    | 'background'
    | 'cg'
    | 'unclassified_image'
    | 'other';
  canToggle?: boolean;
  /** 资源所属的角色名（用于立绘） */
  characterName?: string;
}

const classifiedFiles = ref<{
  textures: ClassifiedFile[];
  moc3: ClassifiedFile | null;
  model3: ClassifiedFile | null;
  cdi3: ClassifiedFile | null;
  motions: ClassifiedFile[];
  sprites: ClassifiedFile[];
  backgrounds: ClassifiedFile[];
  cgs: ClassifiedFile[];
  unclassifiedImages: ClassifiedFile[];
  others: ClassifiedFile[];
}>({
  textures: [],
  moc3: null,
  model3: null,
  cdi3: null,
  motions: [],
  sprites: [],
  backgrounds: [],
  cgs: [],
  unclassifiedImages: [],
  others: [],
});

const hasModelFiles = computed(() => classifiedFiles.value.moc3 || classifiedFiles.value.model3);
const motionCount = computed(() => classifiedFiles.value.motions.filter(m => m.type === 'motion').length);
const expressionCount = computed(() => classifiedFiles.value.motions.filter(m => m.type === 'expression').length);

// Motion 索引映射表（从 model3.json 解析）：文件名 -> { group, index }
const motionIndexMap = ref<Map<string, { group: string; index: number }>>(new Map());

// 允许跳过：如果没有模型文件，只要有其他资源也可以继续
// 如果有待分类图片，需要先分类完才能继续
const canProceed = computed(() => {
  const hasModel = classifiedFiles.value.moc3 || classifiedFiles.value.model3;
  const hasOtherResources =
    classifiedFiles.value.sprites.length > 0 ||
    classifiedFiles.value.backgrounds.length > 0 ||
    classifiedFiles.value.cgs.length > 0 ||
    classifiedFiles.value.textures.length > 0;
  const hasUnclassifiedImages = classifiedFiles.value.unclassifiedImages.length > 0;

  return modelName.value.trim() !== '' && (hasModel || hasOtherResources) && !hasUnclassifiedImages;
});

function formatSize(bytes: number): string {
  if (bytes <= 0) return '0 KB';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

async function handleClearCache() {
  if (clearingCache.value) return;

  const confirmed = window.confirm('确定要清除已缓存的模型和资源吗？这会删除本地 IndexedDB 缓存，需要重新上传或导入。');
  if (!confirmed) return;

  clearingCache.value = true;
  try {
    const { clearedCount, clearedSize } = await clearAllFiles();
    if (clearedCount === 0) {
      toastr.info('当前没有可清理的缓存');
      return;
    }
    toastr.success(`已清理 ${clearedCount} 个缓存文件，释放 ${formatSize(clearedSize)}`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    console.error('清理 IndexedDB 缓存失败:', error);
    toastr.error(`清理失败：${errorMessage}`);
  } finally {
    clearingCache.value = false;
  }
}

function triggerFileInput() {
  fileInputRef.value?.click();
}

function handleFileSelect(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (files && files.length > 0) {
    // 累积文件，不替换现有文件
    const newFiles = Array.from(files);
    // 检查是否已有同名文件，避免重复
    const existingNames = new Set(pendingFiles.value.map(f => f.file.name));
    const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
    // 本地文件不包含 sourceUrl
    pendingFiles.value.push(...uniqueNewFiles.map(file => ({ file, sourceUrl: undefined })));

    if (uniqueNewFiles.length < newFiles.length) {
      toastr.info(`已跳过 ${newFiles.length - uniqueNewFiles.length} 个重复文件`);
    }
  }
  input.value = '';
}

function handleDrop(event: DragEvent) {
  const files = event.dataTransfer?.files;
  if (files && files.length > 0) {
    // 累积文件，不替换现有文件
    const newFiles = Array.from(files);
    // 检查是否已有同名文件，避免重复
    const existingNames = new Set(pendingFiles.value.map(f => f.file.name));
    const uniqueNewFiles = newFiles.filter(f => !existingNames.has(f.name));
    // 本地文件不包含 sourceUrl
    pendingFiles.value.push(...uniqueNewFiles.map(file => ({ file, sourceUrl: undefined })));

    if (uniqueNewFiles.length < newFiles.length) {
      toastr.info(`已跳过 ${newFiles.length - uniqueNewFiles.length} 个重复文件`);
    }
  }
}

function clearFiles() {
  pendingFiles.value = [];
}

function removeFile(index: number) {
  pendingFiles.value.splice(index, 1);
}

/**
 * 从URL导入文件（支持多个URL，每行一个或使用逗号/分号分隔）
 */
async function importFromUrl() {
  const inputText = urlInput.value.trim();
  if (!inputText) {
    toastr.warning('请输入URL');
    return;
  }

  importingUrl.value = true;
  try {
    // 解析多个URL（支持换行、逗号、分号分隔）
    const urls = inputText
      .split(/[,\n;]/)
      .map(u => u.trim())
      .filter(u => u.length > 0);

    if (urls.length === 0) {
      toastr.warning('未找到有效的URL');
      return;
    }

    const existingNames = new Set(pendingFiles.value.map(f => f.file.name));
    let successCount = 0;
    let failCount = 0;
    const failedUrls: string[] = [];

    // 批量导入文件
    for (const url of urls) {
      try {
        // 验证URL格式
        try {
          new URL(url);
        } catch {
          console.warn(`无效的URL格式: ${url}`);
          failCount++;
          failedUrls.push(url);
          continue;
        }

        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok) {
          console.error(`无法访问文件: ${url}`, response.statusText);
          failCount++;
          failedUrls.push(url);
          continue;
        }

        // 实际下载文件
        const downloadResponse = await fetch(url);
        if (!downloadResponse.ok) {
          console.error(`无法下载文件: ${url}`, downloadResponse.statusText);
          failCount++;
          failedUrls.push(url);
          continue;
        }

        const blob = await downloadResponse.blob();

        // 从URL或Content-Disposition头获取文件名
        let filename = url.split('/').pop()?.split('?')[0] || 'unknown';
        const contentDisposition = downloadResponse.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1].replace(/['"]/g, '');
          }
        }

        // 如果文件名没有扩展名，尝试从Content-Type推断
        if (!filename.match(/\.[a-z0-9]+$/i)) {
          const contentType = downloadResponse.headers.get('Content-Type');
          if (contentType) {
            const extMap: Record<string, string> = {
              'image/png': '.png',
              'image/jpeg': '.jpg',
              'image/jpg': '.jpg',
              'application/json': '.json',
              'application/octet-stream': '.moc3',
            };
            const ext = extMap[contentType] || '';
            filename += ext;
          }
        }

        // 检查是否已存在同名文件
        if (existingNames.has(filename)) {
          console.info(`已跳过重复文件: ${filename}`);
          continue;
        }

        // 创建File对象，并保存原始URL
        const file = new File([blob], filename, { type: blob.type });
        pendingFiles.value.push({ file, sourceUrl: url });
        existingNames.add(filename);
        successCount++;
      } catch (error) {
        console.error(`导入URL失败: ${url}`, error);
        failCount++;
        failedUrls.push(url);
      }
    }

    urlInput.value = '';

    // 显示导入结果
    if (successCount > 0) {
      toastr.success(`成功导入 ${successCount} 个文件${urls.length > 1 ? `（共 ${urls.length} 个URL）` : ''}`);
    }
    if (failCount > 0) {
      const errorMsg =
        failCount === 1 && failedUrls[0]
          ? `导入失败: ${failedUrls[0]}`
          : `导入失败 ${failCount} 个文件，请检查URL是否正确`;
      toastr.warning(errorMsg);
    }
    if (successCount === 0 && failCount > 0) {
      toastr.error('所有URL导入失败，请检查网络连接和URL是否正确');
    }
  } catch (error) {
    console.error('URL导入失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    toastr.error(`URL导入失败: ${errorMessage}`);
  } finally {
    importingUrl.value = false;
  }
}

function getFileTypeClass(file: File | FileWithSource): string {
  const name = (file instanceof File ? file.name : file.file.name).toLowerCase();
  if (name.endsWith('.moc3')) return 'type-moc3';
  if (name.endsWith('.model3.json')) return 'type-model3';
  if (name.endsWith('.cdi3.json')) return 'type-cdi3';
  if (name.endsWith('.motion3.json')) return 'type-motion';
  if (name.match(/\.(png|jpg|jpeg)$/)) {
    return 'type-image'; // 统一显示为图片
  }
  return 'type-other';
}

function getFileTypeLabel(file: File | FileWithSource): string {
  const name = (file instanceof File ? file.name : file.file.name).toLowerCase();
  if (name.endsWith('.moc3')) return 'MOC';
  if (name.endsWith('.model3.json')) return '模型配置';
  if (name.endsWith('.cdi3.json')) return '显示信息';
  if (name.endsWith('.motion3.json')) return '动作/表情';
  if (name.match(/\.(png|jpg|jpeg)$/)) {
    return '图片'; // 统一显示为图片
  }
  return '其他';
}

async function handleUploadAndNext() {
  // 完成上传并直接进入第二步分类文件
  if (pendingFiles.value.length === 0) return;
  await classifyPendingFiles();
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

/**
 * 解析 model3.json 并构建 motion 索引映射表
 */
async function parseModel3AndBuildIndex() {
  if (!classifiedFiles.value.model3) {
    console.warn('[ModelUploadWizard] 没有 model3.json 文件');
    return;
  }

  try {
    const groups = await parseModel3Motions(classifiedFiles.value.model3.file);

    // 构建文件名 -> (group, index) 的映射表
    motionIndexMap.value.clear();
    for (const { group, motions } of groups) {
      for (const motion of motions) {
        // 提取文件名（去除路径）
        const fileName = motion.file.split('/').pop() || motion.file;
        motionIndexMap.value.set(fileName, {
          group,
          index: motion.index,
        });
      }
    }

    console.info('[ModelUploadWizard] Motion 索引映射表:', motionIndexMap.value);
  } catch (error) {
    console.error('[ModelUploadWizard] 解析 model3.json 失败:', error);
    toastr.error('解析模型文件失败，部分功能可能不可用');
  }
}

async function nextStep() {
  if (currentStep.value === 0) {
    // 从步骤1到步骤2：分类文件
    if (pendingFiles.value.length === 0) return;
    await classifyPendingFiles();
  }
  if (currentStep.value === 2 && hasModelFiles.value) {
    // 从步骤3到步骤4：解析 model3.json 获取索引
    await parseModel3AndBuildIndex();
  }
  if (currentStep.value < steps.length - 1) {
    currentStep.value++;
  }
}

function prevStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

/**
 * 智能识别动作/表情文件类型
 */
function detectMotionType(filename: string): 'motion' | 'expression' {
  const name = filename.toLowerCase();

  // 表情标识
  const expressionPatterns = [
    /_e\./i, // _E.
    /\.e\./i, // .E.
    /expression/i, // expression
    /表情/i, // 表情（中文）
    /exp/i, // exp
    /f\d+/i, // f01, f02 (常见表情命名)
    /^expr/i, // expr开头
  ];

  // 动作标识
  const motionPatterns = [
    /_m\./i, // _M.
    /\.m\./i, // .M.
    /motion/i, // motion
    /动作/i, // 动作（中文）
    /mot/i, // mot
    /idle/i, // idle（待机动作）
    /tap/i, // tap（点击动作）
    /touch/i, // touch
  ];

  // 优先检查表情标识（因为有些文件名可能同时包含motion）
  for (const pattern of expressionPatterns) {
    if (pattern.test(name)) {
      return 'expression';
    }
  }

  // 检查动作标识
  for (const pattern of motionPatterns) {
    if (pattern.test(name)) {
      return 'motion';
    }
  }

  // 默认返回动作
  return 'motion';
}

async function classifyPendingFiles() {
  classifying.value = true;
  try {
    // 从文件名提取模型名（如果还没有设置）
    if (!modelName.value) {
      const modelFile = pendingFiles.value.find(
        f => f.file.name.endsWith('.model3.json') || f.file.name.endsWith('.moc3'),
      );
      if (modelFile) {
        modelName.value = modelFile.file.name.replace(/\.(model3\.json|moc3)$/, '');
      } else {
        // 如果没有模型文件，使用默认名称或第一个文件名
        const firstFile = pendingFiles.value[0];
        if (firstFile) {
          modelName.value = firstFile.file.name.replace(/\.[^.]*$/, '') || '新资源';
        } else {
          modelName.value = '新资源';
        }
      }
    }

    // 分类文件
    const files: ClassifiedFile[] = pendingFiles.value.map(fileWithSource => {
      const file = fileWithSource.file;
      const name = file.name.toLowerCase();
      let type: ClassifiedFile['type'] = 'other';
      let canToggle = false;
      let characterName: string | undefined;

      // 判断文件类型（不再自动识别图片类型）
      if (name.endsWith('.moc3')) {
        type = 'moc3';
      } else if (name.endsWith('.model3.json')) {
        type = 'model3';
      } else if (name.endsWith('.cdi3.json')) {
        type = 'cdi3';
      } else if (name.endsWith('.motion3.json')) {
        // 使用智能识别动作/表情（作为初始建议）
        type = detectMotionType(file.name);
        // 所有 motion 文件都允许切换（必须让用户确认）
        canToggle = true;
      } else if (name.match(/\.(png|jpg|jpeg)$/)) {
        // 图片文件统一归类为待分类图片，等待用户手动分类
        type = 'unclassified_image';
      }

      return {
        name: file.name,
        file,
        sourceUrl: fileWithSource.sourceUrl,
        type,
        canToggle,
        characterName,
      };
    });

    // 组织分类结果
    classifiedFiles.value = {
      textures: [], // 纹理将通过手动分类从待分类图片中移入
      moc3: files.find(f => f.type === 'moc3') || null,
      model3: files.find(f => f.type === 'model3') || null,
      cdi3: files.find(f => f.type === 'cdi3') || null,
      motions: files.filter(f => f.type === 'motion' || f.type === 'expression'),
      sprites: [], // 立绘将通过手动分类从待分类图片中移入
      backgrounds: [], // 背景将通过手动分类从待分类图片中移入
      cgs: [], // CG将通过手动分类从待分类图片中移入
      unclassifiedImages: files.filter(f => f.type === 'unclassified_image'),
      others: files.filter(f => f.type === 'other'),
    };

    // 初始化资源数据
    initializeResourceData();
  } catch (error) {
    console.error('分类文件失败:', error);
    toastr.error('分类文件失败');
  } finally {
    classifying.value = false;
  }
}

function toggleMotionType(motion: ClassifiedFile) {
  if (motion.type === 'motion') {
    motion.type = 'expression';
  } else {
    motion.type = 'motion';
  }
}

/**
 * 手动分类图片（使用文件名作为唯一标识符）
 */
function classifyImage(filename: string, targetType: 'sprite' | 'background' | 'cg' | 'texture') {
  // 通过文件名查找图片
  const imageIndex = classifiedFiles.value.unclassifiedImages.findIndex(img => img.name === filename);
  if (imageIndex === -1) {
    console.warn(`未找到文件: ${filename}`);
    return;
  }

  const image = classifiedFiles.value.unclassifiedImages[imageIndex];
  if (!image) return;

  // 从待分类列表中移除
  classifiedFiles.value.unclassifiedImages.splice(imageIndex, 1);

  // 更新类型并添加到对应分类
  image.type = targetType;

  // 如果是立绘，尝试从文件名提取角色名
  if (targetType === 'sprite') {
    const match = image.name.match(/([^_/\\]+?)[_-]?(sprite|立绘|stand|portrait)/i);
    if (match && match[1]) {
      image.characterName = match[1];
    }
  }

  // 添加到对应分类数组
  if (targetType === 'sprite') {
    classifiedFiles.value.sprites.push(image);
    // 更新资源数据
    spriteResources.value.push({
      name: image.name,
      file: image.file,
      characterName: image.characterName,
      textMappings: [],
    });
  } else if (targetType === 'background') {
    classifiedFiles.value.backgrounds.push(image);
    backgroundResources.value.push({
      name: image.name,
      file: image.file,
      textMappings: [],
    });
  } else if (targetType === 'cg') {
    classifiedFiles.value.cgs.push(image);
    cgResources.value.push({
      name: image.name,
      file: image.file,
      textMappings: [],
    });
  } else if (targetType === 'texture') {
    classifiedFiles.value.textures.push(image);
  }

  toastr.success(
    `已将 "${image.name}" 分类为${targetType === 'sprite' ? '立绘' : targetType === 'background' ? '背景' : targetType === 'cg' ? 'CG' : '纹理'}`,
  );
}

/**
 * 重新分类图片（使用文件名作为唯一标识符）
 */
function reclassifyImage(
  currentType: 'sprite' | 'background' | 'cg' | 'texture',
  filename: string,
  targetType: 'sprite' | 'background' | 'cg' | 'texture' | 'unclassified',
) {
  if (targetType === currentType) return; // 如果类型相同，不需要重新分类

  let image: ClassifiedFile | undefined;
  let imageIndex: number;

  // 从当前分类中通过文件名查找图片并移除
  if (currentType === 'sprite') {
    imageIndex = classifiedFiles.value.sprites.findIndex(img => img.name === filename);
    if (imageIndex !== -1) {
      image = classifiedFiles.value.sprites[imageIndex];
      classifiedFiles.value.sprites.splice(imageIndex, 1);
      // 找到对应的资源并移除
      const resourceIndex = spriteResources.value.findIndex(r => r.name === filename);
      if (resourceIndex >= 0) {
        spriteResources.value.splice(resourceIndex, 1);
      }
    }
  } else if (currentType === 'background') {
    imageIndex = classifiedFiles.value.backgrounds.findIndex(img => img.name === filename);
    if (imageIndex !== -1) {
      image = classifiedFiles.value.backgrounds[imageIndex];
      classifiedFiles.value.backgrounds.splice(imageIndex, 1);
      const resourceIndex = backgroundResources.value.findIndex(r => r.name === filename);
      if (resourceIndex >= 0) {
        backgroundResources.value.splice(resourceIndex, 1);
      }
    }
  } else if (currentType === 'cg') {
    imageIndex = classifiedFiles.value.cgs.findIndex(img => img.name === filename);
    if (imageIndex !== -1) {
      image = classifiedFiles.value.cgs[imageIndex];
      classifiedFiles.value.cgs.splice(imageIndex, 1);
      const resourceIndex = cgResources.value.findIndex(r => r.name === filename);
      if (resourceIndex >= 0) {
        cgResources.value.splice(resourceIndex, 1);
      }
    }
  } else if (currentType === 'texture') {
    imageIndex = classifiedFiles.value.textures.findIndex(img => img.name === filename);
    if (imageIndex !== -1) {
      image = classifiedFiles.value.textures[imageIndex];
      classifiedFiles.value.textures.splice(imageIndex, 1);
    }
  }

  if (!image) {
    console.warn(`未找到文件: ${filename} 在分类 ${currentType} 中`);
    return;
  }

  // 重置图片的类型信息（移回待分类）
  image.type = 'unclassified_image';
  if (image.characterName && targetType !== 'sprite') {
    image.characterName = undefined;
  }

  // 根据目标类型添加到对应分类
  if (targetType === 'unclassified') {
    // 移回待分类列表
    classifiedFiles.value.unclassifiedImages.push(image);
    toastr.info(`已将 "${image.name}" 移回待分类`);
  } else {
    // 直接添加到目标分类
    image.type = targetType;

    // 如果是立绘，尝试从文件名提取角色名
    if (targetType === 'sprite') {
      const match = image.name.match(/([^_/\\]+?)[_-]?(sprite|立绘|stand|portrait)/i);
      if (match && match[1]) {
        image.characterName = match[1];
      }
    }

    // 添加到对应分类数组
    if (targetType === 'sprite') {
      classifiedFiles.value.sprites.push(image);
      spriteResources.value.push({
        name: image.name,
        file: image.file,
        characterName: image.characterName,
        textMappings: [],
      });
    } else if (targetType === 'background') {
      classifiedFiles.value.backgrounds.push(image);
      backgroundResources.value.push({
        name: image.name,
        file: image.file,
        textMappings: [],
      });
    } else if (targetType === 'cg') {
      classifiedFiles.value.cgs.push(image);
      cgResources.value.push({
        name: image.name,
        file: image.file,
        textMappings: [],
      });
    } else if (targetType === 'texture') {
      classifiedFiles.value.textures.push(image);
    }

    toastr.success(
      `已将 "${image.name}" 重新分类为${targetType === 'sprite' ? '立绘' : targetType === 'background' ? '背景' : targetType === 'cg' ? 'CG' : '纹理'}`,
    );
  }
}

// ==================== 动画和表情设置 ====================
const defaultExpression = ref('none');
const defaultMotion = ref('none');
const autoLoopDefaultMotion = ref(true);

interface TextToAnimationMapping {
  text: string;
  textTags?: string[]; // 用于显示标签
  expression: string;
  motion: string;
}

const textMappings = ref<TextToAnimationMapping[]>([]);

// 获取动作和表情列表
const motionList = computed(() => {
  return classifiedFiles.value.motions
    .filter(m => m.type === 'motion')
    .map(m => ({
      name: extractMotionName(m.name),
      file: m.file,
    }));
});

const expressionList = computed(() => {
  return classifiedFiles.value.motions
    .filter(m => m.type === 'expression')
    .map(m => ({
      name: extractMotionName(m.name),
      file: m.file,
    }));
});

function addMapping() {
  textMappings.value.push({
    text: '',
    textTags: [],
    expression: 'none',
    motion: 'none',
  });
}

function removeMapping(index: number) {
  textMappings.value.splice(index, 1);
}

/**
 * 处理文本映射输入（解析分号分隔的文本为标签）
 */
function parseTextToTags(text: string): string[] {
  return text
    .split(';')
    .map(t => t.trim())
    .filter(t => t.length > 0);
}

function handleTextMappingBlur(index: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();
  const tags = parseTextToTags(value);
  textMappings.value[index].text = tags.join(';');
  textMappings.value[index].textTags = tags;
}

function handleTextMappingEnter(_index: number, event: KeyboardEvent) {
  event.preventDefault();
  (event.target as HTMLInputElement).blur();
}

function removeTextTag(mappingIndex: number, tagIndex: number) {
  if (!textMappings.value[mappingIndex].textTags) return;
  textMappings.value[mappingIndex].textTags!.splice(tagIndex, 1);
  textMappings.value[mappingIndex].text = textMappings.value[mappingIndex].textTags!.join(';');
}

// ==================== 资源设置 ====================
interface ResourceWithMappings {
  name: string;
  file: File;
  characterName?: string;
  textMappings?: Array<{ text: string; textTags?: string[] }>;
}

// 立绘资源（使用 ref 以便保存用户输入）
const spriteResources = ref<ResourceWithMappings[]>([]);

// 背景资源（使用 ref 以便保存用户输入）
const backgroundResources = ref<ResourceWithMappings[]>([]);

// CG资源（使用 ref 以便保存用户输入）
const cgResources = ref<ResourceWithMappings[]>([]);

// 在分类完成后初始化资源数据
function initializeResourceData() {
  spriteResources.value = classifiedFiles.value.sprites.map(s => ({
    name: s.name,
    file: s.file,
    characterName: s.characterName,
    textMappings: [],
  }));

  backgroundResources.value = classifiedFiles.value.backgrounds.map(bg => ({
    name: bg.name,
    file: bg.file,
    textMappings: [],
  }));

  cgResources.value = classifiedFiles.value.cgs.map(cg => ({
    name: cg.name,
    file: cg.file,
    textMappings: [],
  }));
}

function addSpriteMapping(index: number) {
  if (!spriteResources.value[index].textMappings) {
    spriteResources.value[index].textMappings = [];
  }
  spriteResources.value[index].textMappings!.push({ text: '', textTags: [] });
}

function removeSpriteMapping(spriteIndex: number, mappingIndex: number) {
  if (spriteResources.value[spriteIndex].textMappings) {
    spriteResources.value[spriteIndex].textMappings!.splice(mappingIndex, 1);
  }
}

function handleSpriteMappingBlur(spriteIndex: number, mappingIndex: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();
  const tags = parseTextToTags(value);
  if (!spriteResources.value[spriteIndex].textMappings) return;
  spriteResources.value[spriteIndex].textMappings![mappingIndex].text = tags.join(';');
  spriteResources.value[spriteIndex].textMappings![mappingIndex].textTags = tags;
}

function handleSpriteMappingEnter(_spriteIndex: number, _mappingIndex: number, event: KeyboardEvent) {
  event.preventDefault();
  (event.target as HTMLInputElement).blur();
}

function removeSpriteTextTag(spriteIndex: number, mappingIndex: number, tagIndex: number) {
  if (!spriteResources.value[spriteIndex].textMappings?.[mappingIndex].textTags) return;
  spriteResources.value[spriteIndex].textMappings![mappingIndex].textTags!.splice(tagIndex, 1);
  spriteResources.value[spriteIndex].textMappings![mappingIndex].text =
    spriteResources.value[spriteIndex].textMappings![mappingIndex].textTags!.join(';');
}

function addBackgroundMapping(index: number) {
  if (!backgroundResources.value[index].textMappings) {
    backgroundResources.value[index].textMappings = [];
  }
  backgroundResources.value[index].textMappings!.push({ text: '', textTags: [] });
}

function removeBackgroundMapping(bgIndex: number, mappingIndex: number) {
  if (backgroundResources.value[bgIndex].textMappings) {
    backgroundResources.value[bgIndex].textMappings!.splice(mappingIndex, 1);
  }
}

function handleBackgroundMappingBlur(bgIndex: number, mappingIndex: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();
  const tags = parseTextToTags(value);
  if (!backgroundResources.value[bgIndex].textMappings) return;
  backgroundResources.value[bgIndex].textMappings![mappingIndex].text = tags.join(';');
  backgroundResources.value[bgIndex].textMappings![mappingIndex].textTags = tags;
}

function handleBackgroundMappingEnter(_bgIndex: number, _mappingIndex: number, event: KeyboardEvent) {
  event.preventDefault();
  (event.target as HTMLInputElement).blur();
}

function removeBackgroundTextTag(bgIndex: number, mappingIndex: number, tagIndex: number) {
  if (!backgroundResources.value[bgIndex].textMappings?.[mappingIndex].textTags) return;
  backgroundResources.value[bgIndex].textMappings![mappingIndex].textTags!.splice(tagIndex, 1);
  backgroundResources.value[bgIndex].textMappings![mappingIndex].text =
    backgroundResources.value[bgIndex].textMappings![mappingIndex].textTags!.join(';');
}

function addCGMapping(index: number) {
  if (!cgResources.value[index].textMappings) {
    cgResources.value[index].textMappings = [];
  }
  cgResources.value[index].textMappings!.push({ text: '', textTags: [] });
}

function removeCGMapping(cgIndex: number, mappingIndex: number) {
  if (cgResources.value[cgIndex].textMappings) {
    cgResources.value[cgIndex].textMappings!.splice(mappingIndex, 1);
  }
}

function handleCGMappingBlur(cgIndex: number, mappingIndex: number, event: Event) {
  const input = event.target as HTMLInputElement;
  const value = input.value.trim();
  const tags = parseTextToTags(value);
  if (!cgResources.value[cgIndex].textMappings) return;
  cgResources.value[cgIndex].textMappings![mappingIndex].text = tags.join(';');
  cgResources.value[cgIndex].textMappings![mappingIndex].textTags = tags;
}

function handleCGMappingEnter(_cgIndex: number, _mappingIndex: number, event: KeyboardEvent) {
  event.preventDefault();
  (event.target as HTMLInputElement).blur();
}

function removeCGTextTag(cgIndex: number, mappingIndex: number, tagIndex: number) {
  if (!cgResources.value[cgIndex].textMappings?.[mappingIndex].textTags) return;
  cgResources.value[cgIndex].textMappings![mappingIndex].textTags!.splice(tagIndex, 1);
  cgResources.value[cgIndex].textMappings![mappingIndex].text =
    cgResources.value[cgIndex].textMappings![mappingIndex].textTags!.join(';');
}

async function completeUpload() {
  if (!canProceed.value) {
    toastr.warning('请先完成所有必填项');
    return;
  }

  creating.value = true;

  // 用于清理创建的 Object URL
  const objectUrls: string[] = [];

  // 错误统计
  const errors: string[] = [];
  let successCount = 0;
  let failCount = 0;

  try {
    toastr.info('正在保存文件并创建世界书条目...');

    // 存储文件到 IndexedDB（仅本地文件）
    const storedFiles: Array<{
      type: 'texture' | 'moc3' | 'model3' | 'cdi3';
      fileId?: string;
      filename: string;
      url?: string; // URL 文件的原始 URL
    }> = [];

    // 处理纹理文件
    for (const texture of classifiedFiles.value.textures) {
      try {
        if (texture.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          storedFiles.push({ type: 'texture', filename: texture.file.name, url: texture.sourceUrl });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(modelName.value, texture.file.name, texture.file);
          storedFiles.push({ type: 'texture', fileId, filename: texture.file.name });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`纹理文件 "${texture.file.name}": ${errorMsg}`);
        console.error(`存储纹理文件失败: ${texture.file.name}`, error);
        failCount++;
      }
    }

    // 处理 moc3 文件
    if (classifiedFiles.value.moc3) {
      try {
        if (classifiedFiles.value.moc3.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          storedFiles.push({
            type: 'moc3',
            filename: classifiedFiles.value.moc3.file.name,
            url: classifiedFiles.value.moc3.sourceUrl,
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(
            modelName.value,
            classifiedFiles.value.moc3.file.name,
            classifiedFiles.value.moc3.file,
          );
          storedFiles.push({ type: 'moc3', fileId, filename: classifiedFiles.value.moc3.file.name });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`模型文件 "${classifiedFiles.value.moc3.file.name}": ${errorMsg}`);
        console.error(`存储 moc3 文件失败: ${classifiedFiles.value.moc3.file.name}`, error);
        failCount++;
      }
    }

    // 处理 model3 文件
    if (classifiedFiles.value.model3) {
      try {
        if (classifiedFiles.value.model3.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          storedFiles.push({
            type: 'model3',
            filename: classifiedFiles.value.model3.file.name,
            url: classifiedFiles.value.model3.sourceUrl,
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(
            modelName.value,
            classifiedFiles.value.model3.file.name,
            classifiedFiles.value.model3.file,
          );
          storedFiles.push({ type: 'model3', fileId, filename: classifiedFiles.value.model3.file.name });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`模型文件 "${classifiedFiles.value.model3.file.name}": ${errorMsg}`);
        console.error(`存储 model3 文件失败: ${classifiedFiles.value.model3.file.name}`, error);
        failCount++;
      }
    }

    // 处理 cdi3 文件
    if (classifiedFiles.value.cdi3) {
      try {
        if (classifiedFiles.value.cdi3.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          storedFiles.push({
            type: 'cdi3',
            filename: classifiedFiles.value.cdi3.file.name,
            url: classifiedFiles.value.cdi3.sourceUrl,
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(
            modelName.value,
            classifiedFiles.value.cdi3.file.name,
            classifiedFiles.value.cdi3.file,
          );
          storedFiles.push({ type: 'cdi3', fileId, filename: classifiedFiles.value.cdi3.file.name });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`显示信息文件 "${classifiedFiles.value.cdi3.file.name}": ${errorMsg}`);
        console.error(`存储 cdi3 文件失败: ${classifiedFiles.value.cdi3.file.name}`, error);
        failCount++;
      }
    }

    // 处理动作和表情文件
    const storedMotions: Array<{
      name: string;
      fileId?: string;
      filename: string;
      url?: string;
      type: 'motion' | 'expression';
    }> = [];
    for (const motion of classifiedFiles.value.motions.filter(m => m.type === 'motion' || m.type === 'expression')) {
      try {
        if (motion.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          storedMotions.push({
            name: extractMotionName(motion.name),
            filename: motion.file.name,
            url: motion.sourceUrl,
            type: motion.type as 'motion' | 'expression',
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(modelName.value, motion.file.name, motion.file);
          storedMotions.push({
            name: extractMotionName(motion.name),
            fileId,
            filename: motion.file.name,
            type: motion.type as 'motion' | 'expression',
          });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`${motion.type === 'motion' ? '动作' : '表情'}文件 "${motion.file.name}": ${errorMsg}`);
        console.error(`存储动作文件失败: ${motion.file.name}`, error);
        failCount++;
      }
    }

    // 处理立绘文件并构建数据
    const spriteGroups = new Map<
      string,
      Array<{ name: string; fileId?: string; filename: string; url?: string; textMappings: string[] }>
    >();

    for (const sprite of spriteResources.value) {
      try {
        // 查找对应的 ClassifiedFile 以获取 sourceUrl
        const classifiedSprite = classifiedFiles.value.sprites.find(s => s.name === sprite.name);
        const characterName = sprite.characterName || 'default';

        if (!spriteGroups.has(characterName)) {
          spriteGroups.set(characterName, []);
        }

        const textMappings = (sprite.textMappings || []).map(m => m.text.trim()).filter(text => text.length > 0);

        if (classifiedSprite?.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          spriteGroups.get(characterName)!.push({
            name: sprite.name,
            filename: sprite.file.name,
            url: classifiedSprite.sourceUrl,
            textMappings,
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(modelName.value, sprite.file.name, sprite.file);
          spriteGroups.get(characterName)!.push({
            name: sprite.name,
            fileId,
            filename: sprite.file.name,
            textMappings,
          });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`立绘文件 "${sprite.file.name}": ${errorMsg}`);
        console.error(`存储立绘文件失败: ${sprite.file.name}`, error);
        failCount++;
      }
    }

    // 处理背景文件并构建数据
    const backgroundData: Array<{
      name: string;
      fileId?: string;
      filename: string;
      url?: string;
      textMappings: string[];
    }> = [];
    for (const bg of backgroundResources.value) {
      try {
        // 查找对应的 ClassifiedFile 以获取 sourceUrl
        const classifiedBg = classifiedFiles.value.backgrounds.find(b => b.name === bg.name);
        const textMappings = (bg.textMappings || []).map(m => m.text.trim()).filter(text => text.length > 0);

        if (classifiedBg?.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          backgroundData.push({
            name: bg.name,
            filename: bg.file.name,
            url: classifiedBg.sourceUrl,
            textMappings,
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(modelName.value, bg.file.name, bg.file);
          backgroundData.push({
            name: bg.name,
            fileId,
            filename: bg.file.name,
            textMappings,
          });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`背景文件 "${bg.file.name}": ${errorMsg}`);
        console.error(`存储背景文件失败: ${bg.file.name}`, error);
        failCount++;
      }
    }

    // 处理CG文件并构建数据
    const cgData: Array<{ name: string; fileId?: string; filename: string; url?: string; textMappings: string[] }> = [];
    for (const cg of cgResources.value) {
      try {
        // 查找对应的 ClassifiedFile 以获取 sourceUrl
        const classifiedCg = classifiedFiles.value.cgs.find(c => c.name === cg.name);
        const textMappings = (cg.textMappings || []).map(m => m.text.trim()).filter(text => text.length > 0);

        if (classifiedCg?.sourceUrl) {
          // URL 文件：不保存到 IndexedDB，直接使用原始 URL
          cgData.push({
            name: cg.name,
            filename: cg.file.name,
            url: classifiedCg.sourceUrl,
            textMappings,
          });
          successCount++;
        } else {
          // 本地文件：保存到 IndexedDB
          const fileId = await storeFile(modelName.value, cg.file.name, cg.file);
          cgData.push({
            name: cg.name,
            fileId,
            filename: cg.file.name,
            textMappings,
          });
          successCount++;
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`CG文件 "${cg.file.name}": ${errorMsg}`);
        console.error(`存储CG文件失败: ${cg.file.name}`, error);
        failCount++;
      }
    }

    // 创建所有资源的世界书条目（使用 PartialDeep 类型，因为所有函数都返回 PartialDeep<WorldbookEntry>）
    const resourceEntries: Array<
      | ReturnType<typeof createModelResourceWorldbookEntry>
      | ReturnType<typeof createSpriteResourceWorldbookEntry>
      | ReturnType<typeof createBackgroundResourceWorldbookEntry>
      | ReturnType<typeof createCGResourceWorldbookEntry>
    > = [];

    // 如果有模型文件，创建模型资源世界书条目（包含默认动画和文本映射）
    // 即使没有动作/表情文件，也应该创建模型资源条目（只包含文件信息）
    const hasModel = storedFiles.some(f => f.type === 'model3' || f.type === 'moc3');
    if (hasModel) {
      try {
        // 构建模型文件信息
        const model3File = storedFiles.find(f => f.type === 'model3');
        const moc3File = storedFiles.find(f => f.type === 'moc3');
        const cdi3File = storedFiles.find(f => f.type === 'cdi3');
        const textureFiles = storedFiles.filter(f => f.type === 'texture');

        // 构建统一的 motions 配置（包含 group, index, motionType, textMappings）
        // 根据文件来源选择路径格式：URL 文件使用原始 URL，本地文件使用 indexeddb 路径
        const unifiedMotions: Array<{
          name: string;
          file: string;
          group: string;
          index: number;
          motionType: 'motion' | 'expression';
          textMappings?: string[];
        }> = [];

        // 遍历所有分类的 motion 文件
        for (const storedMotion of storedMotions) {
          const fileName = storedMotion.filename;
          const motionName = extractMotionName(fileName);

          // 从 motionIndexMap 获取 group 和 index
          // 注意：使用 ?? 而不是 ||，以保留空字符串 group（空字符串是有效的 group 名称）
          const indexInfo = motionIndexMap.value.get(fileName);
          const group = indexInfo?.group ?? 'default';
          const index = indexInfo?.index ?? 0;

          // 查找该 motion 的文本映射
          const mappingsForThisMotion: string[] = [];
          for (const mapping of textMappings.value) {
            const targetField = storedMotion.type === 'motion' ? mapping.motion : mapping.expression;
            if (targetField === motionName && mapping.textTags && mapping.textTags.length > 0) {
              mappingsForThisMotion.push(...mapping.textTags);
            }
          }

          // 构建文件路径
          const filePath = storedMotion.url || `indexeddb://${modelName.value}/${fileName}`;

          unifiedMotions.push({
            name: motionName,
            file: filePath,
            group,
            index,
            motionType: storedMotion.type,
            textMappings: mappingsForThisMotion.length > 0 ? mappingsForThisMotion : undefined,
          });
        }

        // 构建默认动画设置
        const defaultAnimation: {
          expression?: string;
          motion?: string;
          autoLoop?: boolean;
        } = {};
        if (defaultExpression.value && defaultExpression.value !== 'none') {
          defaultAnimation.expression = defaultExpression.value;
        }
        if (defaultMotion.value && defaultMotion.value !== 'none') {
          defaultAnimation.motion = defaultMotion.value;
          defaultAnimation.autoLoop = autoLoopDefaultMotion.value;
        }

        // 创建模型资源世界书条目
        // 根据文件来源选择路径格式：URL 文件使用原始 URL，本地文件使用 indexeddb 路径
        const modelResourceEntry = createModelResourceWorldbookEntry(modelName.value, {
          type: 'live2d_model',
          modelName: modelName.value,
          files: {
            model3: model3File ? model3File.url || `indexeddb://${modelName.value}/${model3File.filename}` : undefined,
            moc3: moc3File ? moc3File.url || `indexeddb://${modelName.value}/${moc3File.filename}` : undefined,
            textures: textureFiles.map(t => t.url || `indexeddb://${modelName.value}/${t.filename}`),
            cdi3: cdi3File ? cdi3File.url || `indexeddb://${modelName.value}/${cdi3File.filename}` : undefined,
          },
          motions: unifiedMotions,
          defaultAnimation: Object.keys(defaultAnimation).length > 0 ? defaultAnimation : undefined,
        });

        resourceEntries.push(modelResourceEntry);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`创建模型资源世界书条目失败: ${errorMsg}`);
        console.error('创建模型资源世界书条目失败:', error);
      }
    }

    // 创建立绘资源世界书条目（按角色分组）
    for (const [characterName, sprites] of spriteGroups.entries()) {
      if (sprites.length > 0) {
        const entry = createSpriteResourceWorldbookEntry(characterName === 'default' ? '' : characterName, {
          type: 'sprite',
          characterName: characterName === 'default' ? undefined : characterName,
          sprites: sprites.map(s => ({
            name: s.name,
            // 根据文件来源选择路径格式：URL 文件使用原始 URL，本地文件使用 indexeddb 路径
            file: s.url
              ? s.url
              : characterName && characterName !== 'default'
                ? `indexeddb://${characterName}/${s.filename}`
                : `indexeddb://${modelName.value}/${s.filename}`,
            textMappings: s.textMappings.length > 0 ? s.textMappings : undefined,
          })),
        });
        resourceEntries.push(entry);
      }
    }

    // 创建背景资源世界书条目
    if (backgroundData.length > 0) {
      const entry = createBackgroundResourceWorldbookEntry({
        type: 'background',
        backgrounds: backgroundData.map(bg => ({
          name: bg.name,
          // 根据文件来源选择路径格式：URL 文件使用原始 URL，本地文件使用 indexeddb 路径
          file: bg.url || `indexeddb://backgrounds/${bg.filename}`,
          textMappings: bg.textMappings.length > 0 ? bg.textMappings : undefined,
        })),
      });
      resourceEntries.push(entry);
    }

    // 创建CG资源世界书条目
    if (cgData.length > 0) {
      const entry = createCGResourceWorldbookEntry({
        type: 'cg',
        cgs: cgData.map(cg => ({
          name: cg.name,
          // 根据文件来源选择路径格式：URL 文件使用原始 URL，本地文件使用 indexeddb 路径
          file: cg.url || `indexeddb://cgs/${cg.filename}`,
          textMappings: cg.textMappings.length > 0 ? cg.textMappings : undefined,
        })),
      });
      resourceEntries.push(entry);
    }

    // 将资源世界书条目添加到世界书（使用角色卡绑定的世界书）
    if (resourceEntries.length > 0) {
      try {
        // 获取角色卡绑定的世界书
        let targetWorldbookName: string | null = null;
        try {
          const charWorldbooks = getCharWorldbookNames('current');
          // 优先使用 primary 世界书，如果没有则使用第一个 additional
          targetWorldbookName = charWorldbooks.primary || charWorldbooks.additional[0] || null;
        } catch (error) {
          console.warn('获取角色卡世界书失败，使用默认世界书:', error);
        }

        // 如果没有角色卡世界书，使用默认世界书
        if (!targetWorldbookName) {
          targetWorldbookName = WORLDBOOK_NAME;
        }

        // 确保世界书存在
        try {
          await getWorldbook(targetWorldbookName);
        } catch {
          // 如果世界书不存在，尝试创建
          try {
            await createWorldbook(targetWorldbookName, []);
          } catch (createError) {
            // 如果是角色卡世界书且创建失败，可能需要先绑定世界书
            console.warn(`创建世界书 ${targetWorldbookName} 失败:`, createError);
            // 回退到默认世界书
            if (targetWorldbookName !== WORLDBOOK_NAME) {
              targetWorldbookName = WORLDBOOK_NAME;
              try {
                await getWorldbook(WORLDBOOK_NAME);
              } catch {
                await createWorldbook(WORLDBOOK_NAME, []);
              }
            } else {
              throw createError;
            }
          }
        }

        await createWorldbookEntries(targetWorldbookName, resourceEntries);
        console.info(`已在世界书 ${targetWorldbookName} 中创建 ${resourceEntries.length} 个资源世界书条目`);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        errors.push(`创建资源世界书条目失败: ${errorMsg}`);
        console.error('创建资源世界书条目失败:', error);
        toastr.warning('创建资源世界书条目时出现问题，但文件已保存');
      }
    }

    // 创建导入模型对象
    const importedModel: ImportedModel = {
      name: modelName.value,
      files: storedFiles.map(f => ({
        type: f.type,
        url: f.url || '', // URL 文件保留原始 URL
        filename: f.filename,
        fileId: f.fileId,
        isLocal: !f.url, // 有 URL 的是 URL 文件，否则是本地文件
      })),
      motions: storedMotions.map(m => ({
        name: m.name,
        url: m.url || '', // URL 文件保留原始 URL
        type: m.type,
        fileId: m.fileId,
        isLocal: !m.url, // 有 URL 的是 URL 文件，否则是本地文件
      })),
    };

    // 保存模型数据到变量（供其他界面使用）
    // 这里需要从 composables 导入 saveModelToVariables 或直接使用相关函数
    // 暂时先创建世界书条目，后续可以添加保存到变量的功能

    // 清理 Object URL 防止内存泄漏
    for (const url of objectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch (error) {
        console.warn('清理 Object URL 失败:', error);
      }
    }

    // 生成最终消息
    const resourceCount = spriteResources.value.length + backgroundResources.value.length + cgResources.value.length;
    const resourceMessage = resourceCount > 0 ? `，包含 ${resourceCount} 个资源文件` : '';

    if (failCount === 0) {
      // 全部成功
      toastr.success(`模型 "${modelName.value}" 已成功创建世界书条目并保存文件${resourceMessage}`);
    } else if (successCount > 0) {
      // 部分成功
      toastr.warning(
        `模型 "${modelName.value}" 已部分完成：成功 ${successCount} 个，失败 ${failCount} 个${resourceMessage}`,
      );

      // 输出详细错误信息到控制台
      if (errors.length > 0) {
        console.group('文件保存错误详情');
        errors.forEach((err, index) => {
          console.error(`${index + 1}. ${err}`);
        });
        console.groupEnd();
      }
    } else {
      // 全部失败
      toastr.error(`保存失败：所有文件都未能成功保存`);
      if (errors.length > 0) {
        console.group('文件保存错误详情');
        errors.forEach((err, index) => {
          console.error(`${index + 1}. ${err}`);
        });
        console.groupEnd();
      }
      creating.value = false;
      return; // 如果全部失败，不触发 complete 事件
    }

    // 延迟触发完成事件，让用户看到成功消息
    // 注意：完成上传后不会自动关闭，用户可以继续使用向导
    setTimeout(() => {
      emit('complete', importedModel);
    }, 500);
  } catch (error) {
    // 清理 Object URL 防止内存泄漏
    for (const url of objectUrls) {
      try {
        URL.revokeObjectURL(url);
      } catch (revokeError) {
        console.warn('清理 Object URL 失败:', revokeError);
      }
    }

    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error('创建世界书条目失败:', error);
    toastr.error(`创建世界书条目失败: ${errorMsg}`);

    // 如果有部分成功，显示错误统计
    if (errors.length > 0) {
      console.group('错误详情');
      errors.forEach((err, index) => {
        console.error(`${index + 1}. ${err}`);
      });
      console.groupEnd();
    }
  } finally {
    creating.value = false;
  }
}

function extractMotionName(filename: string): string {
  return filename
    .replace(/\.motion3?\.json$/i, '')
    .replace(/^\d+_/, '')
    .replace(/_m$/i, '')
    .replace(/_e$/i, '')
    .replace(/_motion$/i, '')
    .replace(/_expression$/i, '');
}
</script>

<style lang="scss" scoped>
.model-upload-wizard {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.steps-indicator {
  display: flex;
  justify-content: space-between;
  margin: 16px 0;
  padding: 0 20px;
  flex-shrink: 0;
}

.step-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    top: 20px;
    left: 50%;
    width: 100%;
    height: 2px;
    background: rgba(0, 0, 0, 0.1);
    z-index: -1;
  }

  &:last-child::after {
    display: none;
  }

  &.active .step-number {
    background: var(--primary-color, #ec4899);
    color: white;
  }

  &.completed .step-number {
    background: #10b981;
    color: white;
  }
}

.step-number {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  margin-bottom: 8px;
}

.step-label {
  font-size: 14px;
  color: var(--muted-foreground);
}

.step-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
  min-height: 0; // 关键：允许 flex 子元素缩小

  > *:not(.step-actions) {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    min-height: 0; // 关键：允许滚动

    // 隐藏滚动条但保持滚动功能
    scrollbar-width: none; // Firefox
    -ms-overflow-style: none; // IE/Edge

    &::-webkit-scrollbar {
      display: none; // Chrome/Safari
    }
  }

  .step-actions {
    flex-shrink: 0; // 防止操作按钮被压缩
    margin-top: auto;
    padding-top: 16px;
  }
}

.upload-area {
  border: 2px dashed rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;

  &:hover {
    border-color: var(--primary-color, #ec4899);
    background: rgba(236, 72, 153, 0.05);
  }
}

.upload-area-inner {
  width: 100%;
  height: 100%;
}

.upload-area-inner {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.uploaded-files-preview {
  width: 100%;
  cursor: default;

  // 防止点击文件列表时触发上传区域点击
  * {
    pointer-events: auto;
  }
}

.files-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.summary-actions {
  display: flex;
  gap: 8px;
}

.files-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 200px;
  overflow-y: auto;
  overflow-x: hidden;

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  transition: background 0.2s;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.file-name {
  flex: 1;
  text-align: left;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.remove-file-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
}

.file-source-badge {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.file-type-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;

  &.type-texture {
    background: #e0f2fe;
    color: #0369a1;
  }

  &.type-moc3,
  &.type-model3 {
    background: #fef3c7;
    color: #92400e;
  }

  &.type-motion {
    background: #dbeafe;
    color: #1e40af;
  }

  &.type-image {
    background: #fce7f3;
    color: #9f1239;
  }

  &.type-other {
    background: #f3f4f6;
    color: #6b7280;
  }
}

.classifying-status {
  text-align: center;
  padding: 20px;
}

.classified-files {
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
  overflow-x: hidden;

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

.settings-card {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.model-name-input {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 16px;
  margin-top: 8px;
}

.files-categories {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-section {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
  padding: 16px;
  backdrop-filter: blur(10px);
}

.file-category {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  max-height: 300px;
  overflow-y: auto;
  overflow-x: hidden;

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

.category-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.toggle-type-btn {
  margin-left: auto;
  padding: 4px 8px;
  font-size: 12px;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  margin-left: 8px;

  &.badge-motion {
    background: #e3f2fd;
    color: #1976d2;
  }

  &.badge-expression {
    background: #fce4ec;
    color: #c2185b;
  }
}

.step-actions {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
}

.character-name-badge {
  padding: 2px 8px;
  background: rgba(99, 102, 241, 0.2);
  color: #6366f1;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  margin-left: auto;
}

// 上传方式相关样式
.upload-methods-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-top: 24px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
}

.upload-method-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.method-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--foreground);
}

.url-upload-area {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.url-input-group {
  display: flex;
  gap: 12px;
  align-items: stretch;
}

.url-input {
  flex: 1;
  padding: 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  font-family: inherit;
  resize: vertical;
  min-height: 60px;
  line-height: 1.5;
}

// 手动分类相关样式
.category-item-with-select {
  padding: 12px;
}

.classify-select {
  margin-left: auto;
  min-width: 140px;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 14px;
  background: white;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(0, 0, 0, 0.3);
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
}

.completion-summary {
  text-align: center;
  padding: 40px;
}

.success-icon {
  width: 64px;
  height: 64px;
  color: #10b981;
  margin-bottom: 16px;
}

.summary-details {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
  max-width: 300px;
  margin-left: auto;
  margin-right: auto;
}

.hidden-input {
  display: none;
}

// 资源设置列表
.resource-settings-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

// 资源入口按钮
.resource-entry-btn {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  backdrop-filter: blur(10px);

  &:hover {
    background: rgba(255, 255, 255, 0.8);
    border-color: var(--primary-color, #ec4899);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: translateY(0);
  }
}

.resource-entry-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(236, 72, 153, 0.1);
  border-radius: 12px;
  color: var(--primary-color, #ec4899);
  flex-shrink: 0;
}

.resource-entry-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.resource-entry-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--foreground);
}

.resource-entry-desc {
  font-size: 13px;
  color: var(--muted-foreground);
}

.resource-entry-badge {
  padding: 4px 12px;
  background: var(--primary-color, #ec4899);
  color: white;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  flex-shrink: 0;
}

.resource-entry-arrow {
  width: 20px;
  height: 20px;
  color: var(--muted-foreground);
  flex-shrink: 0;
}

.no-resources-hint {
  text-align: center;
  padding: 40px 20px;
  color: var(--muted-foreground);

  p {
    margin: 8px 0;
  }
}

// 资源详情页面
.resource-detail-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.resource-detail-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 0 4px 0 0;
  min-height: 0; // 关键：允许内容滚动

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

.resource-detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  margin-bottom: 16px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 8px;
  z-index: 10;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--foreground);
  transition: all 0.2s;
  flex-shrink: 0;

  &:hover {
    background: rgba(0, 0, 0, 0.1);
  }
}

.resource-detail-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--foreground);
}

// 垂直布局的映射输入
.mapping-inputs-vertical {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.mapping-selects-row {
  display: flex;
  gap: 12px;
  align-items: flex-end;
  flex-wrap: wrap;
}

.mapping-select-item {
  flex: 1;
  min-width: 120px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mapping-label {
  font-size: 12px;
  color: var(--muted-foreground);
  font-weight: 500;
}

// 动画设置
.animation-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-item {
  margin-bottom: 10px;

  label {
    display: block;
    margin-bottom: 6px;
    font-weight: 500;
    font-size: 14px;
    color: var(--foreground);
  }

  input[type='text'],
  select {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    font-size: 14px;
    background: white;
  }

  input[type='checkbox'] {
    margin-right: 8px;
  }
}

.select-with-scroll {
  // select元素不支持隐藏滚动条，保持可见但样式简洁
  max-height: 200px;
  overflow-y: auto;
}

// 文本映射
.text-mapping-section {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.1);

  &.compact {
    margin-top: 8px;
    padding-top: 8px;
  }

  h4 {
    margin-bottom: 8px;
    font-size: 14px;
    font-weight: 600;
  }

  .text-mapping-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 12px;

    h4 {
      margin: 0;
      flex-shrink: 0;
    }

    .settings-hint {
      padding: 12px;
      margin-bottom: 16px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 8px;

      p {
        margin: 0;
        font-size: 13px;
        color: #3b82f6;
        line-height: 1.5;
      }
    }

    .hint {
      flex: 1;
      margin: 0;
      font-size: 12px;
      color: var(--muted-foreground);
      line-height: 1.4;
    }

    .add-mapping-btn {
      flex-shrink: 0;
    }
  }
}

.mapping-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  overflow-x: hidden;

  // 隐藏滚动条但保持滚动功能
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge

  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }
}

.mapping-item {
  padding: 10px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.mapping-inputs {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.text-tags-input-wrapper {
  flex: 1;
  min-width: 200px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.mapping-text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 14px;

  &.tags-input {
    padding-bottom: 6px;
  }

  &:focus {
    outline: none;
    border-color: #6366f1;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
  }
}

.text-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.text-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: rgba(99, 102, 241, 0.1);
  color: #6366f1;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;

  .tag-remove {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    margin-left: 2px;
    border: none;
    background: rgba(99, 102, 241, 0.2);
    color: #6366f1;
    border-radius: 50%;
    cursor: pointer;
    font-size: 14px;
    line-height: 1;
    transition: all 0.2s;

    &:hover {
      background: rgba(99, 102, 241, 0.3);
    }
  }
}

.mapping-select {
  min-width: 120px;
  padding: 8px 12px;
  border: 1px solid rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  font-size: 14px;
}

.remove-mapping-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: none;
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(239, 68, 68, 0.2);
  }
}

// 资源设置
.sprite-settings,
.background-settings,
.cg-settings {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sprite-item,
.background-item,
.cg-item {
  padding: 12px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
}

.sprite-header,
.resource-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.sprite-name,
.resource-name {
  font-weight: 500;
  color: var(--foreground);
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.add-mapping-btn-inline {
  flex-shrink: 0;
}
</style>
