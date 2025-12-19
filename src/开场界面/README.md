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
- **即时应用**：选择后立即发送系统消息开始对话
- **响应式卡片**：美观的开场展示界面

### 👥 角色介绍

- **轮播展示**：支持多个角色循环浏览
- **详细信息**：角色名称、身份、描述
- **交互导航**：左右按钮和底部指示器控制
- **颜色主题**：角色个性化的视觉风格

### ⚙️ 游戏设置 (模型上传向导)

- **双模式导入**：支持本地文件上传和URL导入
- **GitHub仓库支持**：自动解析GitHub仓库结构
- **智能分类**：自动识别模型、动作、表情文件
- **五步流程**：完整的资源配置向导
- **世界书集成**：自动创建世界书条目供其他界面使用

### ✨ 视觉效果

- **粒子动画**：动态背景粒子效果
- **响应式设计**：支持不同尺寸的容器自适应
- **平滑动画**：Vue过渡和CSS动画
- **主题色彩**：统一的视觉设计语言

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
// 选择开场并发送系统消息
async function handleSelectOpening(opening: Opening) {
  await selectOpening(opening); // 发送系统消息
}
```

### 模型资源管理

- **文件导入**：本地上传 + URL导入 + GitHub仓库解析
- **智能分类**：自动识别文件类型和用途
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
    message: '系统消息内容',
  },
  // ... 更多开场
];
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

## 📈 性能分析

详见 [`性能分析.md`](./性能分析.md)

### 关键指标

- **编译时间**：< 20秒
- **首屏加载**：< 3秒
- **交互响应**：< 100ms
- **内存占用**：< 50MB

## 🔄 更新日志

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





