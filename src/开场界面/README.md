# 开场界面 (Opening Interface)

酒馆助手前端界面项目，为 SillyTavern 提供美观的开场选择和资源管理界面。

## ✨ 功能特性

### 🎮 主菜单界面

- **沉浸式设计**：精美的粒子背景和动画效果
- **多入口导航**：
  - 开始游戏 - 选择故事开场
  - 游戏设置 - 模型和资源管理
  - 角色介绍 - 角色信息浏览

### 📖 开场选择

- **多开场支持**：预设多个故事开场选项
- **智能跳转**：支持跳转到指定的 swipe（消息变体）
  - id01 → 跳转到 swipe2
  - id02 → 显示施工中提示（未完成）
  - id03 → 跳转到 swipe3
  - id04 → 跳转到 swipe4
- **响应式卡片**：美观的开场展示界面
- **装饰元素**：标题左右两侧的星星图标

### 👥 角色介绍

- **轮播展示**：支持多个角色循环浏览
- **详细信息**：角色名称、身份、描述
- **交互导航**：左右按钮和底部指示器控制
- **颜色主题**：角色个性化的视觉风格

### ⚙️ 游戏设置 (模型上传向导)

- **双模式导入**：支持本地文件上传和URL导入
- **批量导入**：支持一次导入多个文件URL
- **智能分类**：自动识别模型、动作、表情文件
- **五步流程**：完整的资源配置向导
- **世界书集成**：自动创建世界书条目供其他界面使用
- **Live2D 模型配置**：自动解析 model3.json，提取动作索引信息

### ✨ 视觉效果

- **粒子动画**：动态背景粒子效果
- **背景图片系统**：
  - 主菜单：显示专用背景图片（`https://iili.io/f1G4kbf.jpg`）
  - 非主菜单：显示通用背景图片（`https://iili.io/fGHD0fs.png`），不透明度 0.9
  - 纯色后备：图片加载失败时显示浅绿色背景（`#e8f5e9`）
- **响应式设计**：支持不同尺寸的容器自适应
- **平滑动画**：Vue过渡和CSS动画
- **主题色彩**：统一的视觉设计语言（浅绿色主题 `#e8f5e9`）

### 📐 自适应功能

- **智能缩放**：根据容器尺寸自动调整界面比例
- **iframe适配**：自动调整嵌入容器高度
- **多设备支持**：桌面端和移动端友好

## 🏗️ 项目结构

```
src/开场界面/
├── app.vue                 # 主应用组件
├── index.ts               # 应用入口和初始化
├── index.html            # HTML模板
├── composables.ts        # 组合式函数
├── data.ts              # 静态数据
├── types/               # 类型定义
│   └── index.ts
├── utils/               # 工具函数
│   ├── iframeHeight.ts  # iframe高度自适应
│   ├── indexedDB.ts     # IndexedDB存储
│   └── worldbookFormat.ts # 世界书格式化
├── components/          # 子组件
│   ├── PageHeader.vue   # 页面头部
│   ├── ModelUploadWizard.vue # 模型上传向导
│   └── CollapsibleSection.vue # 可折叠区域
└── assets/              # 资源文件
    ├── styles/
    │   └── index.scss   # 全局样式
    └── icons/           # 图标组件
        ├── index.ts     # 图标导出
        └── *.vue        # 单个图标组件
```

## 🎯 核心功能详解

### 页面导航系统

```typescript
// 使用组合式函数管理页面状态
const { currentPage, showPage } = usePageNavigation();

// 支持的页面类型
type PageType = 'main-menu' | 'start-game' | 'settings' | 'character-intro';
```

### 角色展示轮播

```typescript
// 角色数据展示
const {
  currentIndex: currentCharacterIndex,
  currentItem: currentCharacter,
  prev: prevCharacter,
  next: nextCharacter,
  goTo: goToCharacter,
} = useCharacterDisplay(characters.value);
```

### 开场选择功能

```typescript
// 选择开场并发送系统消息或跳转 swipe
async function handleSelectOpening(opening: Opening) {
  await selectOpening(opening);
  // 根据 opening.id 自动判断：
  // - 如果是 id02，显示施工中提示
  // - 如果是 id01/id03/id04，跳转到对应的 swipe
  // - 其他情况，发送系统消息
}
```

**跳转逻辑**：

- 系统会检查第一条消息是否有多个 swipe（变体）
- 如果存在对应的 swipe，会切换到该变体并重新加载聊天
- 如果 swipe 不存在，会显示警告提示

### 模型资源管理

- **文件导入**：本地上传 + URL导入（支持批量）
- **智能分类**：自动识别文件类型和用途
- **动作索引提取**：自动从 model3.json 解析 motion 的 group 和 index
- **世界书集成**：创建JSON格式的世界书条目
- **存储优化**：本地文件存IndexedDB，URL文件直接引用

### 粒子效果系统

```typescript
// 创建动态粒子背景
function createParticles(container: HTMLElement) {
  // 生成指定数量的粒子元素
  // 随机位置、延迟和持续时间
}
```

### 自适应缩放系统

```typescript
// 根据容器尺寸计算缩放比例
function applyScale() {
  const BASE_WIDTH = 1200;
  const BASE_HEIGHT = 800;
  const scale = Math.min(scaleX, scaleY, 1); // 不超过1，不放大
  interfaceElement.style.transform = `scale(${scale})`;
}
```

### iframe高度自适应

```typescript
// 自动调整嵌入容器高度
function adjustIframeHeight() {
  const height = getContentHeight();
  if (iframe) {
    iframe.style.height = `${height}px`;
  }
}
```

## 📁 文件类型支持

### 模型文件

- `.moc3` - MOC模型文件
- `.model3.json` - 模型配置文件
- `.cdi3.json` - 显示信息文件
- `.physics3.json` - 物理文件

### 动作和表情

- `.motion3.json` - 动作文件
- `.exp3.json` - 表情文件

### 图片资源

- `.png`, `.jpg`, `.jpeg` - 纹理、立绘、背景、CG

## 🔄 数据流

```
用户操作 → Vue组件 → Composables函数 → 酒馆API
    ↓
开场选择 → 发送系统消息 → 开始对话
    ↓
模型上传 → 文件处理 → IndexedDB存储 → 世界书条目创建
    ↓
其他界面 → 解析世界书 → 加载资源 → 显示内容
```

## 🎨 样式设计

### 主题色彩

```scss
:root {
  --foreground: #1a1a2e;
  --muted-foreground: #4a4a6a;
  --background: #fdf2f8;
  // ... 更多主题变量
}

// 背景配色
.opening-interface {
  background: #e8f5e9; // 浅绿色主题
}
```

### 背景图片配置

**主菜单背景**：

- 图片 URL：`https://iili.io/f1G4kbf.jpg`
- 仅在主菜单页面显示
- 带有渐变遮罩效果

**非主菜单背景**：

- 图片 URL：`https://iili.io/fGHD0fs.png`
- 在所有非主菜单页面显示
- 不透明度：0.9（通过遮罩实现）
- 纯色后备：`#e8f5e9`（图片加载失败时显示）

**自定义背景图片**：
如需在其他页面添加背景图片，可以在 `index.scss` 中添加：

```scss
.opening-interface.is-start-game {
  .background {
    background-image: url('你的背景图片URL');
    background-size: cover;
    background-position: center;
    background-repeat: no-repeat;
  }
}
```

### 响应式布局

- **基准尺寸**：1200px × 800px (3:2比例)
- **自适应缩放**：根据容器尺寸自动调整
- **移动端优化**：触摸友好的交互设计

## 🔧 技术实现

### Vue 3 + Composition API

- **组合式函数**：逻辑复用和状态管理
- **响应式数据**：自动UI更新
- **生命周期管理**：组件挂载和清理

### 存储策略

- **IndexedDB**：本地文件持久化存储
- **世界书**：结构化数据存储和共享
- **内存缓存**：运行时数据缓存

### 性能优化

- **懒加载**：按需加载组件和资源
- **防抖处理**：避免频繁的DOM操作
- **内存管理**：自动清理事件监听器

## 🚀 使用指南

### 基本使用流程

1. **主菜单**：选择想要的功能入口
2. **开场选择**：浏览并选择故事开场
3. **角色介绍**：了解游戏角色信息
4. **游戏设置**：上传和管理游戏资源

### Live2D 模型配置详细指南

#### 配置流程

**步骤 1：上传文件**

1. 点击"选择文件"或拖放文件到上传区域
2. 支持的文件类型：
   - `.moc3` - 模型文件
   - `.model3.json` - 模型配置文件
   - `.motion3.json` - 动作/表情文件
   - `.png/.jpg` - 纹理文件
3. 也可以通过 URL 导入（输入文件 URL，支持批量，每行一个或使用逗号/分号分隔）

**步骤 2：分类文件**

系统会自动识别文件类型：

- **MOC 文件**：自动分类为模型文件
- **Model3.json**：自动分类为模型配置
- **Motion3.json**：**需要手动确认分类**
  - 系统会根据文件名智能识别（如 `_M` 结尾为动作，`_E` 结尾为表情）
  - 每个文件都显示"动作"或"表情"标签
  - 点击"切换为表情/动作"按钮可以手动调整分类
- **图片文件**：需要手动分类为立绘、背景、CG 或纹理

**重要提示**：请确保所有 motion3.json 文件的分类正确，这会影响后续播放的优先级策略。

**步骤 3：模型设置**

设置模型基本信息：

- 模型名称（必填）
- 模型版本（通常选择 3）

**步骤 4：资源设置 - 动画和表情设置**

在这一步，系统会自动从 model3.json 中提取 motion 索引信息。

- **默认动画设置**：
  - 默认表情：选择模型的默认表情（可选）
  - 默认动作（Idle）：选择待机动作（可选）
  - 自动循环默认动作：勾选后会循环播放默认动作

- **文本映射配置**：
  - 为每个动作或表情设置触发文本
  - 支持多个关键词，用分号分隔（例如：`抱胸;交叉双手;双手交叉`）
  - 系统会将文本解析为标签显示，可以单独删除某个标签

**提示**：系统已自动提取动作索引信息，无需手动配置 group 和 index。

**步骤 5：完成**

点击"完成并创建世界书条目"，系统会：

1. 将文件保存到 IndexedDB（本地文件）或使用 URL（URL 导入）
2. 生成世界书条目，包含完整的模型配置（包含 group、index、motionType、textMappings）
3. 自动添加到角色卡绑定的世界书

#### 世界书条目格式

系统会生成如下格式的世界书条目：

```json
{
  "type": "live2d_model",
  "modelName": "程北极",
  "files": {
    "model3": "https://example.com/model.model3.json",
    "moc3": "https://example.com/model.moc3",
    "textures": ["https://example.com/texture_00.png"]
  },
  "motions": [
    {
      "name": "待机",
      "file": "idle.motion3.json",
      "group": "default",
      "index": 0,
      "motionType": "motion",
      "textMappings": ["待机", "站着"]
    },
    {
      "name": "生气",
      "file": "angry.motion3.json",
      "group": "default",
      "index": 8,
      "motionType": "expression",
      "textMappings": ["生气", "不爽"]
    }
  ],
  "defaultAnimation": {
    "motion": "待机",
    "autoLoop": true
  }
}
```

#### 配置说明

- **name**: 动作/表情名称（从文件名提取）
- **file**: 文件路径（URL 或 indexeddb 路径）
- **group**: 动作组名（从 model3.json 自动解析，通常为 "default"）
- **index**: 在该组中的索引（从 model3.json 自动提取，0-based）
- **motionType**: 类型标记
  - `"motion"`: 动作，播放优先级为 2（正常，可被打断）
  - `"expression"`: 表情，播放优先级为 3（强制，立即切换）
- **textMappings**: 触发文本数组，支持多个关键词

#### 优先级策略

Live2D 动作播放的优先级：

- **Priority 1（idle）**：默认动画，循环播放，容易被打断
- **Priority 2（normal）**：普通动作，可被打断
- **Priority 3（force）**：强制动作（表情），立即切换，打断当前动作

系统会根据 `motionType` 自动选择合适的优先级。

#### 在 Galgame 界面中使用

配置完成后，在 Galgame 界面中：

1. **自动匹配**：系统会根据角色名自动加载对应的 Live2D 模型
2. **文本触发**：当对话中出现 textMappings 中的关键词时，自动播放对应动作
3. **向后兼容**：旧格式的配置仍然可以正常工作

#### 技术细节

- **Group**: 动作组名，在 model3.json 的 `FileReferences.Motions` 对象中定义，通常为空字符串（会转换为 "default"）
- **Index**: 动作在组内的索引，按照 model3.json 中数组的顺序（0-based）
- 系统通过 `pixi-live2d-display` 的 API 直接调用 `model.motion(group, index, priority)`，比文件名匹配方式更准确、性能更好

#### 常见问题

**Q: 为什么要手动分类 motion3.json？**
A: 因为文件名格式不固定，手动分类更可靠。系统会提供智能识别作为初始建议。

**Q: 如果不设置文本映射会怎样？**
A: 可以不设置，但在 Galgame 界面中需要使用完整的文件名来触发动作。

**Q: 可以修改已经创建的世界书条目吗？**
A: 可以，直接编辑世界书条目的 JSON 内容，系统支持手动修改。

**Q: 旧格式的配置还能用吗？**
A: 能用，系统完全向后兼容旧格式（分离的 motions、expressions 和 textMappings 对象）。

### 高级配置

#### 自定义开场数据

编辑 `data.ts` 中的 `DEFAULT_OPENINGS` 数组：

```typescript
export const DEFAULT_OPENINGS: Opening[] = [
  {
    id: 'custom',
    title: '自定义开场',
    description: '自定义描述',
    image: '图片URL',
    message: '系统消息内容', // 如果不需要跳转 swipe，使用此消息
  },
  // ... 更多开场
];
```

**开场行为配置**：

- 如果需要在 `composables.ts` 的 `selectOpening` 函数中添加跳转逻辑，修改 `swipeIdMap`：

```typescript
const swipeIdMap: Record<string, number> = {
  '01': 2, // id01 -> swipe2
  '03': 3, // id03 -> swipe3
  '04': 4, // id04 -> swipe4
  'custom': 5, // 自定义开场 -> swipe5
};
```

- 如果需要显示特殊提示（如施工中），在 `selectOpening` 函数中添加判断：

```typescript
if (opening.id === 'custom') {
  toastr.warning('自定义提示消息');
  return;
}
```

#### 自定义角色数据

编辑 `data.ts` 中的 `DEFAULT_CHARACTERS` 数组：

```typescript
export const DEFAULT_CHARACTERS: Character[] = [
  {
    name: '角色名',
    role: '角色身份',
    desc: '角色描述',
    image: '角色图片URL',
    colorClass: '主题颜色类名',
  },
  // ... 更多角色
];
```

#### 粒子效果配置

编辑 `data.ts` 中的 `PARTICLE_CONFIG`：

```typescript
export const PARTICLE_CONFIG = {
  count: 50,        // 粒子数量
  minDuration: 10,  // 最小动画时长(秒)
  maxDuration: 20,  // 最大动画时长(秒)
  maxDelay: 5,      // 最大延迟时间(秒)
};
```

## 🔗 集成说明

### 与酒馆助手的集成

- **API调用**：使用酒馆助手提供的接口
- **消息发送**：通过 `createChatMessages` 发送系统消息
- **世界书操作**：创建和管理世界书条目
- **变量存储**：持久化配置数据

### 与其他界面的协作

- **live2d与galgame界面前端**：消费世界书中的资源数据
- **数据共享**：通过世界书实现跨界面数据共享
- **统一存储**：IndexedDB和URL资源统一管理

## 🐛 故障排除

### 编译错误

- 检查文件路径是否正确导入
- 确认所有依赖都已安装
- 查看控制台错误信息

### 功能异常

- 检查酒馆助手API是否可用
- 确认世界书权限设置
- 查看浏览器开发者工具

### 性能问题

- 检查IndexedDB存储空间
- 清理不需要的缓存数据
- 优化大文件上传策略

## 📈 性能指标

### 关键指标

- **编译时间**：< 20秒
- **首屏加载**：< 3秒
- **交互响应**：< 100ms
- **内存占用**：< 50MB

## 🔄 更新日志

### v1.2.0

- ✅ 添加开场跳转功能，支持跳转到指定的 swipe
- ✅ 优化背景图片系统，主菜单和非主菜单使用不同背景
- ✅ 添加非主菜单背景图片，支持不透明度控制
- ✅ 优化"选择开场"标题样式，添加左右星星装饰
- ✅ 更新配色方案，使用浅绿色主题（`#e8f5e9`）
- ✅ 完善文档，添加背景配置和跳转功能说明

### v1.1.0

- ✅ 优化 URL 导入功能，支持批量导入多个文件
- ✅ 删除 GitHub 仓库导入功能
- ✅ 自动解析 model3.json，提取 motion 的 group 和 index
- ✅ 增强 motion 分类功能，所有文件都可手动切换
- ✅ 更新世界书配置格式，统一使用 motions 数组
- ✅ 完善文档，合并所有说明到 README.md

### v1.0.0

- ✅ 完成基础界面框架
- ✅ 实现开场选择功能
- ✅ 集成模型上传向导
- ✅ 添加角色展示轮播
- ✅ 支持粒子背景效果
- ✅ 实现自适应缩放
- ✅ 添加iframe高度自适应

## 📄 许可证

本项目遵循项目根目录的许可证文件。

## 🤝 贡献指南

1. Fork 本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📞 技术支持

如遇问题，请查看：

- [项目Issues](../../issues)
- [酒馆助手文档](https://n0vi028.github.io/JS-Slash-Runner-Doc/)
- [SillyTavern官方文档](https://docs.sillytavern.app/)
