<template>
  <!-- 静态图片立绘 - 使用容器缩放 -->
  <div
    v-if="spriteType === 'image'"
    class="pointer-events-none absolute z-5 transition-all duration-300"
    :style="spriteContainerStyle"
  >
    <img :src="imageUrl" alt="角色立绘" class="h-[70vh] w-auto object-contain drop-shadow-2xl" draggable="false" />
  </div>

  <!-- Live2D 模型渲染 - 画布始终存在，通过可见度控制显示/隐藏 -->
  <canvas
    ref="live2dCanvasRef"
    class="live2d-canvas pointer-events-none absolute inset-0 z-5"
    :style="{ width: '100%', height: '100%', display: live2dCanvasRef ? 'block' : 'none' }"
  />
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { PixiLive2DRenderer, type Live2DModelConfig } from '../lib/renderers/PixiLive2DRenderer';

interface Props {
  // 立绘（静态图片）设置
  spriteScale: number;
  spritePositionX: number;
  spritePositionY: number;
  // Live2D 模型设置
  live2dScale: number;
  live2dPositionX: number;
  live2dPositionY: number;
  // 通用属性
  spriteType: 'live2d' | 'image' | 'none';
  imageUrl?: string;
  live2dModelId?: string;
  live2dModels?: any[];
  motion?: string;
  expression?: string;
}

const props = defineProps<Props>();

const live2dCanvasRef = ref<HTMLCanvasElement | null>(null);

let live2dRenderer: PixiLive2DRenderer | null = null;
// 记录上一次的动作和表情，用于判断是否需要重新播放
let lastMotion: string | undefined = undefined;
let lastExpression: string | undefined = undefined;
let lastModelId: string | undefined = undefined;

async function ensureRendererReady(): Promise<boolean> {
  // 已有且就绪
  if (live2dRenderer && live2dRenderer.isReady()) return true;

  // 确保 canvas 已挂载
  await nextTick();
  if (!live2dCanvasRef.value) {
    console.error('[CharacterSprite] Canvas 元素不存在，等待一帧后重试');
    await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
    await nextTick();
  }
  if (!live2dCanvasRef.value) {
    console.error('[CharacterSprite] Canvas 仍不存在，无法初始化渲染器');
    return false;
  }

  try {
    if (!live2dRenderer) {
      console.info('[CharacterSprite] 初始化 Pixi Live2D 渲染器');
      live2dRenderer = new PixiLive2DRenderer();
    }
    const renderer = live2dRenderer;
    if (!renderer) {
      console.error('[CharacterSprite] 渲染器实例创建失败');
      return false;
    }
    if (!renderer.isReady()) {
      await renderer.init(live2dCanvasRef.value);
      console.info('[CharacterSprite] Pixi Live2D 渲染器初始化完成');
    }
    return !!renderer && renderer.isReady();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    console.error('[CharacterSprite] 渲染器初始化失败:', message);
    if (stack) console.error('[CharacterSprite] 初始化错误堆栈:', stack);
    return false;
  }
}

// 立绘容器样式（仅用于静态图片）
const spriteContainerStyle = computed(() => {
  return {
    left: `${props.spritePositionX}%`,
    bottom: `${100 - props.spritePositionY}%`,
    transform: `translateX(-50%) scale(${props.spriteScale})`,
    transformOrigin: 'bottom center',
  };
});

// 播放动作（支持通过文件名或 textMappings 匹配）
function playMotion(modelConfig: Live2DModelConfig, motion: string) {
  if (!live2dRenderer) {
    return;
  }

  // 优先使用新的文本匹配方式（直接使用 group 和 index）
  const matched = live2dRenderer.playMotionByText(motion);

  if (matched) {
    return; // 成功匹配，直接返回
  }

  // 如果没有匹配，回退到旧的文件名匹配方式（向后兼容）
  let motionFile = motion;

  // 先尝试通过 textMappings 匹配动作文件（旧格式）
  if (modelConfig.textMappings?.motions) {
    for (const [file, mappingText] of Object.entries(modelConfig.textMappings.motions)) {
      if (mappingText === motion || String(mappingText).toLowerCase() === motion.toLowerCase()) {
        motionFile = file;
        console.info(`[CharacterSprite] 通过 textMappings 匹配到动作: ${motion} -> ${file}`);
        break;
      }
    }
  }

  // 查找动作组和索引
  const motionConfig = modelConfig.motions?.find((m: any) => {
    const name = typeof m === 'string' ? m : m.name || m.file;
    return name === motionFile || name === `${motionFile}.motion3.json` || m.file === motionFile;
  });

  if (motionConfig) {
    const group = typeof motionConfig === 'string' ? 'idle' : (motionConfig.group ?? 'idle');
    // 不再转换 group 名称，保留原始值（包括空字符串和 "default"）

    // 如果 motionConfig 已经有 index，直接使用
    if (typeof motionConfig !== 'string' && motionConfig.index !== undefined) {
      console.info(`[CharacterSprite] 播放动作: group="${group}", index=${motionConfig.index}, motion=${motionFile}`);
      live2dRenderer.playMotion(group, motionConfig.index, 2);
      return;
    }

    // 否则查找该动作在组中的索引（向后兼容）
    const groupMotions =
      modelConfig.motions?.filter((m: any) => {
        const mGroup = typeof m === 'string' ? 'idle' : (m.group ?? 'idle');
        return mGroup === group;
      }) || [];
    const index = groupMotions.findIndex((m: any) => {
      const name = typeof m === 'string' ? m : m.name || m.file;
      return name === motionFile || name === `${motionFile}.motion3.json` || m.file === motionFile;
    });
    if (index >= 0) {
      console.info(`[CharacterSprite] 播放动作: group="${group}", index=${index}, motion=${motionFile}`);
      // priority=2 表示正常优先级，会打断默认循环动作
      live2dRenderer.playMotion(group, index, 2);
    }
  } else {
    console.warn(`[CharacterSprite] 未找到动作配置: ${motionFile}`);
  }
}

// 播放表情（统一使用 motion API）
function playExpression(modelConfig: Live2DModelConfig, expression: string) {
  if (!live2dRenderer) {
    return;
  }

  // 统一使用 motion API，优先级为 3（强制）
  const matched = live2dRenderer.playMotionByText(expression, 3);

  if (matched) {
    return; // 成功匹配，直接返回
  }

  // 如果没有匹配，回退到旧的方式（向后兼容）
  let expressionFile = expression;

  // 先尝试通过 textMappings 匹配表情文件（旧格式）
  if (modelConfig.textMappings?.expressions) {
    for (const [file, mappingText] of Object.entries(modelConfig.textMappings.expressions)) {
      if (mappingText === expression || String(mappingText).toLowerCase() === expression.toLowerCase()) {
        expressionFile = file;
        console.info(`[CharacterSprite] 通过 textMappings 匹配到表情: ${expression} -> ${file}`);
        break;
      }
    }
  }

  // 查找表情索引（旧格式）
  const expressionIndex = modelConfig.expressions?.findIndex((e: any) => {
    const name = typeof e === 'string' ? e : e.name || e.file;
    return (
      name === expressionFile ||
      name === `${expressionFile}.exp3.json` ||
      (typeof e === 'object' && e.file === expressionFile)
    );
  });

  if (expressionIndex !== undefined && expressionIndex >= 0) {
    console.info(`[CharacterSprite] 播放表情: index=${expressionIndex}, expression=${expressionFile}`);
    live2dRenderer.playExpression(expressionIndex);
  } else {
    console.warn(`[CharacterSprite] 未找到表情配置: ${expressionFile}`);
  }
}

// 播放动作和表情（初次加载模型时调用）
// 如果有表情和动作，先播放表情，等表情完成后再播放动作（避免互相打断）
async function playMotionAndExpression(modelConfig: Live2DModelConfig) {
  if (props.expression && props.motion) {
    // 同时有表情和动作：先播放表情，延迟后播放动作
    playExpression(modelConfig, props.expression);
    // 延迟 3 秒后播放动作（确保表情动画完全结束）
    await new Promise(resolve => setTimeout(resolve, 3000));
    playMotion(modelConfig, props.motion);
  } else {
    // 只有表情或只有动作：直接播放
    if (props.expression) {
      playExpression(modelConfig, props.expression);
    }
    if (props.motion) {
      playMotion(modelConfig, props.motion);
    }
  }
}

// 加载 Live2D 模型
async function loadLive2dModel() {
  console.info('[CharacterSprite] loadLive2dModel 被调用', {
    spriteType: props.spriteType,
    live2dModelId: props.live2dModelId,
    hasModels: !!props.live2dModels,
    modelsLength: props.live2dModels?.length || 0,
    hasCanvas: !!live2dCanvasRef.value,
  });

  if (!props.live2dModelId || !props.live2dModels || !live2dCanvasRef.value) {
    console.warn('[CharacterSprite] 加载条件不满足，跳过加载', {
      live2dModelId: props.live2dModelId,
      hasModels: !!props.live2dModels,
      hasCanvas: !!live2dCanvasRef.value,
    });
    return;
  }

  // 确保渲染器已就绪
  const ready = await ensureRendererReady();
  if (!ready) {
    console.error('[CharacterSprite] 渲染器未初始化，无法加载模型');
    return;
  }

  // 输出所有可用的模型ID，用于调试
  const availableModels = props.live2dModels.map(m => ({ id: m.id, name: m.name }));
  console.info('[CharacterSprite] 可用的模型列表:', availableModels);
  console.info('[CharacterSprite] 请求的模型ID:', props.live2dModelId, '类型:', typeof props.live2dModelId);

  // 查找模型配置（支持通过 id 或 name 匹配）
  let modelConfig = props.live2dModels.find(m => m.id === props.live2dModelId) as Live2DModelConfig | undefined;

  // 如果通过 id 没找到，尝试通过 name 匹配
  if (!modelConfig) {
    modelConfig = props.live2dModels.find(m => m.name === props.live2dModelId) as Live2DModelConfig | undefined;
    if (modelConfig) {
      console.info(`[CharacterSprite] 通过 name 匹配到模型: ${props.live2dModelId} -> ${modelConfig.id}`);
    }
  }

  if (!modelConfig) {
    console.warn(`[CharacterSprite] 未找到 Live2D 模型配置: ${props.live2dModelId}`, {
      requestedId: props.live2dModelId,
      requestedIdType: typeof props.live2dModelId,
      availableIds: props.live2dModels.map(m => ({ id: m.id, idType: typeof m.id, name: m.name })),
      availableIdsString: JSON.stringify(props.live2dModels.map(m => m.id)),
      requestedIdString: JSON.stringify(props.live2dModelId),
    });
    return;
  }

  console.info('[CharacterSprite] 找到模型配置:', {
    id: modelConfig.id,
    name: modelConfig.name,
    modelPath: modelConfig.modelPath,
    basePath: modelConfig.basePath,
    motionsCount: modelConfig.motions?.length || 0,
    expressionsCount: modelConfig.expressions?.length || 0,
  });

  try {
    const renderer = live2dRenderer;
    if (!renderer) {
      console.error('[CharacterSprite] 渲染器不存在，无法加载模型');
      return;
    }

    // 如果模型ID变化了，需要重新加载模型
    const needReloadModel = lastModelId !== props.live2dModelId;

    if (needReloadModel) {
      console.info('[CharacterSprite] 模型ID变化，重新加载模型:', {
        oldModelId: lastModelId,
        newModelId: props.live2dModelId,
      });
      await renderer.loadModel(modelConfig);
      console.info('[CharacterSprite] Live2D 模型加载完成');
      lastModelId = props.live2dModelId;

      // 应用用户的缩放和位置设置
      renderer.setScale(props.live2dScale);
      renderer.setPosition(props.live2dPositionX, props.live2dPositionY);
      console.info('[CharacterSprite] 应用用户设置:', {
        scale: props.live2dScale,
        positionX: props.live2dPositionX,
        positionY: props.live2dPositionY,
      });
    }

    // 检查动作和表情是否变化
    const motionChanged = lastMotion !== props.motion;
    const expressionChanged = lastExpression !== props.expression;

    // 只有当动作或表情变化时，才播放动作和表情
    if (motionChanged || expressionChanged || needReloadModel) {
      playMotionAndExpression(modelConfig);
      lastMotion = props.motion;
      lastExpression = props.expression;
    }
  } catch (error) {
    console.error('[CharacterSprite] 加载 Live2D 模型失败:', error);
    // 将错误对象转换为可读字符串（避免在手机上显示 [object Object]）
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorDetails = {
      message: errorMessage,
      stack: errorStack,
      modelId: props.live2dModelId,
      modelConfig: modelConfig ? { id: modelConfig.id, name: modelConfig.name } : null,
      canvasInfo: live2dCanvasRef.value
        ? {
            width: live2dCanvasRef.value.clientWidth,
            height: live2dCanvasRef.value.clientHeight,
            offsetWidth: live2dCanvasRef.value.offsetWidth,
            offsetHeight: live2dCanvasRef.value.offsetHeight,
          }
        : null,
      rendererReady: live2dRenderer?.isReady() || false,
    };
    console.error('[CharacterSprite] 错误详情:', JSON.stringify(errorDetails, null, 2));
    // 同时输出各个字段，方便调试
    console.error('[CharacterSprite] 错误消息:', errorMessage);
    if (errorStack) {
      console.error('[CharacterSprite] 错误堆栈:', errorStack);
    }
    console.error('[CharacterSprite] 模型ID:', props.live2dModelId);
    console.error('[CharacterSprite] Canvas 信息:', errorDetails.canvasInfo);
    console.error('[CharacterSprite] 渲染器就绪:', errorDetails.rendererReady);
  }
}

// 监听模型相关属性变化（模型ID、live2dModels）
watch(
  () => [props.live2dModelId, props.live2dModels],
  async (_newVal, oldVal) => {
    const oldModelId = oldVal?.[1] as string | undefined;
    const modelIdChanged = oldModelId !== props.live2dModelId;

    console.info('[CharacterSprite] watch 模型ID变化:', {
      live2dModelId: props.live2dModelId,
      modelsCount: props.live2dModels?.length,
      oldModelId,
      modelIdChanged,
    });

    // 如果模型ID变化，需要加载新模型
    if (modelIdChanged && props.live2dModelId) {
      lastMotion = undefined;
      lastExpression = undefined;

      // 等待 DOM 更新，确保 canvas 元素已经渲染
      await nextTick();

      // 确保 canvas 元素存在
      if (!live2dCanvasRef.value) {
        console.error('[CharacterSprite] Canvas 元素不存在，延迟重试');
        // 再等待一帧
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        await nextTick();
      }

      if (live2dCanvasRef.value) {
        await loadLive2dModel();
      } else {
        console.error('[CharacterSprite] Canvas 元素仍然不存在，无法加载模型');
      }
    }
  },
  { immediate: true },
);

// 单独监听 spriteType 变化，控制模型可见性
watch(
  () => props.spriteType,
  (newType, oldType) => {
    console.info('[CharacterSprite] spriteType 变化:', {
      oldType,
      newType,
      hasRenderer: !!live2dRenderer,
    });

    if (!live2dRenderer) return;

    if (newType === 'live2d') {
      // 切换到 Live2D，显示模型
      console.info('[CharacterSprite] 显示 Live2D 模型');
      live2dRenderer.setVisible(true);
    } else {
      // 切换到其他类型（立绘或 none），隐藏模型
      console.info('[CharacterSprite] 隐藏 Live2D 模型');
      live2dRenderer.setVisible(false);
    }
  },
  { immediate: true },
);

// 单独监听动作和表情变化（不重新加载模型）
watch(
  () => [props.motion, props.expression],
  () => {
    if (props.spriteType === 'live2d' && live2dRenderer && props.live2dModelId && props.live2dModels) {
      // 检查动作和表情是否变化
      const motionChanged = lastMotion !== props.motion;
      const expressionChanged = lastExpression !== props.expression;

      // 只有当动作或表情变化时，才播放动作和表情
      if (motionChanged || expressionChanged) {
        const modelConfig = props.live2dModels.find(m => m.id === props.live2dModelId) as Live2DModelConfig | undefined;
        if (modelConfig) {
          // 如果同时有表情和动作（且至少有一个变化），先播放表情，延迟后播放动作
          if (props.expression && props.motion && (expressionChanged || motionChanged)) {
            if (expressionChanged && props.expression) {
              playExpression(modelConfig, props.expression);
            }
            // 延迟 3 秒后播放动作（确保表情动画完全结束）
            if (motionChanged && props.motion) {
              setTimeout(() => {
                playMotion(modelConfig, props.motion!);
              }, 3000);
            }
          } else {
            // 只有一个或都没有：直接播放变化的部分
            if (motionChanged && props.motion) {
              playMotion(modelConfig, props.motion);
            }
            if (expressionChanged && props.expression) {
              playExpression(modelConfig, props.expression);
            }
          }
          lastMotion = props.motion;
          lastExpression = props.expression;
        }
      }
    }
  },
);

// 监听 Live2D 位置和缩放变化
watch(
  () => [props.live2dScale, props.live2dPositionX, props.live2dPositionY],
  () => {
    if (props.spriteType === 'live2d' && live2dRenderer) {
      live2dRenderer.setScale(props.live2dScale);
      live2dRenderer.setPosition(props.live2dPositionX, props.live2dPositionY);
    }
  },
);

onMounted(async () => {
  // 等待 DOM 完全渲染
  await nextTick();

  // 确保 canvas 元素存在
  if (!live2dCanvasRef.value) {
    console.error('[CharacterSprite] Canvas 元素不存在');
    return;
  }

  // 初始化渲染器（无论当前是否需要显示 Live2D）
  if (!live2dRenderer) {
    try {
      // 检查 canvas 尺寸（在手机上可能为 0）
      const canvas = live2dCanvasRef.value;
      if (!canvas) {
        console.error('[CharacterSprite] Canvas 元素不存在');
        return;
      }

      const canvasWidth = canvas.clientWidth || canvas.offsetWidth || 800;
      const canvasHeight = canvas.clientHeight || canvas.offsetHeight || 600;

      console.info('[CharacterSprite] 初始化 Pixi Live2D 渲染器', {
        canvasWidth,
        canvasHeight,
        clientWidth: canvas.clientWidth,
        clientHeight: canvas.clientHeight,
        offsetWidth: canvas.offsetWidth,
        offsetHeight: canvas.offsetHeight,
      });

      // 如果 canvas 尺寸为 0，等待一帧后重试
      if (canvasWidth === 0 || canvasHeight === 0) {
        console.warn('[CharacterSprite] Canvas 尺寸为 0，等待一帧后重试');
        await new Promise(resolve => requestAnimationFrame(() => resolve(undefined)));
        await nextTick();

        const retryWidth = canvas.clientWidth || canvas.offsetWidth || 800;
        const retryHeight = canvas.clientHeight || canvas.offsetHeight || 600;
        console.info('[CharacterSprite] 重试时 Canvas 尺寸:', {
          width: retryWidth,
          height: retryHeight,
        });

        if (retryWidth === 0 || retryHeight === 0) {
          console.error('[CharacterSprite] Canvas 尺寸仍然为 0，无法初始化渲染器');
          return;
        }
      }

      live2dRenderer = new PixiLive2DRenderer();
      await live2dRenderer.init(canvas);
      console.info('[CharacterSprite] Pixi Live2D 渲染器初始化完成');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      console.error('[CharacterSprite] 渲染器初始化失败:', errorMessage);
      if (errorStack) {
        console.error('[CharacterSprite] 初始化错误堆栈:', errorStack);
      }
      console.error(
        '[CharacterSprite] 初始化错误详情:',
        JSON.stringify({ message: errorMessage, stack: errorStack }, null, 2),
      );
      return;
    }
  }

  // 如果有模型ID，加载模型
  if (props.live2dModelId && props.live2dModels) {
    await loadLive2dModel();

    // 根据当前 spriteType 设置可见性
    if (props.spriteType === 'live2d') {
      live2dRenderer.setVisible(true);
    } else {
      live2dRenderer.setVisible(false);
    }
  }
});

onUnmounted(() => {
  if (live2dRenderer) {
    live2dRenderer.destroy();
    live2dRenderer = null;
  }
});
</script>

<style scoped>
.live2d-canvas {
  width: 100%;
  height: 70vh;
  min-height: 400px;
  display: block;
}
</style>
