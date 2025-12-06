"use client"

import type React from "react"

import { useState, useCallback, useEffect, useRef } from "react"
import { Settings, Maximize, Minimize, ChevronLeft, ChevronRight } from "lucide-react"
import CharacterSprite from "./character-sprite"
import DialogBox, { type DialogBoxStyle, defaultDialogStyle, ChoiceBox, type ChoiceOption } from "./dialog-box"
import SettingsPanel from "./settings-panel"

interface DialogueItem {
  character?: string
  text: string
  type?: "blackscreen" | "choice"
  options?: ChoiceOption[]
}

// 示例对话数据，包含选项示例
const dialogues: DialogueItem[] = [
  { character: "樱", text: "今天的天气真好呢，阳光透过树叶洒下来，感觉整个人都暖洋洋的。" },
  { character: "樱", text: "你看那边的樱花，已经开始绽放了呢。" },
  { character: "", text: "微风轻轻吹过，花瓣在空中翩翩起舞，仿佛时间都静止了一般。" },
  { character: "你", text: "是啊，春天果然是最美的季节。" },
  { character: "樱", text: "说起来，你有想过毕业之后要做什么吗？" },
  { character: "", text: "她的眼神中似乎带着一丝期待，又有些许不安。" },
  {
    type: "choice",
    text: "",
    options: [
      { id: "honest", text: "坦诚地告诉她自己的想法" },
      { id: "deflect", text: "用玩笑话岔开话题" },
      { id: "ask", text: "反问她的打算" },
    ],
  },
  { type: "blackscreen", text: "那一刻，时间仿佛静止了..." },
  { character: "你", text: "还没想好呢...不过，能和大家一起度过的时光，我想珍惜每一刻。" },
  { character: "樱", text: "嗯...我也是这么想的。（微微一笑）" },
  { type: "blackscreen", text: "三年后的春天——" },
  { character: "樱", text: "那么，我们继续往前走吧，听说前面有一家很棒的咖啡店。" },
]

export default function GalgamePlayer() {
  const [currentDialogIndex, setCurrentDialogIndex] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)
  const [autoPlaySpeed, setAutoPlaySpeed] = useState(3000)
  const [menuExpanded, setMenuExpanded] = useState(false)
  const [blackScreen, setBlackScreen] = useState(false)
  const [blackScreenText, setBlackScreenText] = useState("")
  const [showChoices, setShowChoices] = useState(false)
  const [customModeEnabled, setCustomModeEnabled] = useState(false)
  const [spriteSettings, setSpriteSettings] = useState({
    scale: 1,
    positionX: 50,
    positionY: 50,
  })
  const [dialogStyle, setDialogStyle] = useState<DialogBoxStyle>(defaultDialogStyle)
  const [previewStyle, setPreviewStyle] = useState<DialogBoxStyle>(defaultDialogStyle)

  const containerRef = useRef<HTMLDivElement>(null)
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null)

  const currentDialogue = dialogues[currentDialogIndex]

  const nextDialogue = useCallback(
    (skipBlackscreen = false) => {
      if (currentDialogIndex < dialogues.length - 1) {
        const nextIndex = currentDialogIndex + 1
        setCurrentDialogIndex(nextIndex)
        if (skipBlackscreen) {
          setBlackScreen(false)
        }
        setShowChoices(false)
      }
    },
    [currentDialogIndex],
  )

  const prevDialogue = useCallback(() => {
    if (currentDialogIndex > 0) {
      setCurrentDialogIndex((prev) => prev - 1)
      setShowChoices(false)
    }
  }, [currentDialogIndex])

  useEffect(() => {
    if (currentDialogue.type === "blackscreen") {
      setBlackScreenText(currentDialogue.text)
      setBlackScreen(true)
      setShowChoices(false)
    } else if (currentDialogue.type === "choice") {
      setShowChoices(true)
      setBlackScreen(false)
    } else {
      setBlackScreen(false)
      setShowChoices(false)
    }
  }, [currentDialogIndex, currentDialogue])

  // 自动播放逻辑
  useEffect(() => {
    if (autoPlay && currentDialogIndex < dialogues.length - 1 && !showChoices) {
      const delay = currentDialogue.type === "blackscreen" ? autoPlaySpeed + 2000 : autoPlaySpeed
      autoPlayTimerRef.current = setTimeout(() => {
        nextDialogue()
      }, delay)
    }
    return () => {
      if (autoPlayTimerRef.current) {
        clearTimeout(autoPlayTimerRef.current)
      }
    }
  }, [autoPlay, autoPlaySpeed, currentDialogIndex, nextDialogue, currentDialogue.type, showChoices])

  // 全屏切换
  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener("fullscreenchange", handleFullscreenChange)
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange)
  }, [])

  const handleBlackScreenClick = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const halfWidth = rect.width / 2

    if (clickX < halfWidth) {
      if (currentDialogIndex > 0) {
        setCurrentDialogIndex((prev) => prev - 1)
        setBlackScreen(false)
      }
    } else {
      nextDialogue(true)
    }
  }

  const handleClick = () => {
    if (!showSettings && !menuExpanded && !showChoices) {
      if (!blackScreen) {
        nextDialogue()
      }
    }
  }

  const handleChoiceSelect = (id: string) => {
    // 处理选项选择
    console.log("Selected:", id)
    nextDialogue()
  }

  const handleSaveStyle = () => {
    setDialogStyle(previewStyle)
  }

  const handleOpenSettings = () => {
    if (!customModeEnabled) {
      setPreviewStyle(dialogStyle)
    }
    setShowSettings(true)
    setMenuExpanded(false)
  }

  return (
    <div
      ref={containerRef}
      className="relative w-screen h-screen overflow-hidden select-none"
      style={{ aspectRatio: "16/9" }}
    >
      {/* 背景 */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url('/anime-spring-park-with-cherry-blossoms-and-sunligh.jpg')`,
        }}
      />

      {/* 绿色清新滤镜叠加 */}
      <div className="absolute inset-0 bg-primary/5" />

      {/* 角色立绘 */}
      <CharacterSprite
        scale={spriteSettings.scale}
        positionX={spriteSettings.positionX}
        positionY={spriteSettings.positionY}
      />

      <div className="absolute top-4 right-4 z-50 flex flex-col items-end gap-2">
        {/* 齿轮按钮 */}
        <button
          onClick={() => {
            if (menuExpanded) {
              handleOpenSettings()
            } else {
              setMenuExpanded(true)
            }
          }}
          className={`p-2 rounded-full bg-card/80 backdrop-blur-sm 
                     text-foreground hover:bg-card transition-all shadow-lg
                     flex items-center gap-2 ${menuExpanded ? "pr-4" : ""}`}
          aria-label="设置"
        >
          <Settings className="w-5 h-5" />
          {menuExpanded && <span className="text-sm animate-in fade-in slide-in-from-left-2 duration-200">设置</span>}
        </button>

        {/* 展开的全屏按钮 */}
        {menuExpanded && (
          <button
            onClick={() => {
              toggleFullscreen()
              setMenuExpanded(false)
            }}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm 
                       text-foreground hover:bg-card transition-colors shadow-lg 
                       flex items-center gap-2 pr-4 animate-in fade-in slide-in-from-top-2 duration-200"
            aria-label={isFullscreen ? "退出全屏" : "全屏"}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            <span className="text-sm">{isFullscreen ? "退出全屏" : "全屏"}</span>
          </button>
        )}
      </div>

      {/* 点击区域 */}
      <div className="absolute inset-0 cursor-pointer z-10" onClick={handleClick} />

      {/* 点击其他区域收起菜单 */}
      {menuExpanded && <div className="absolute inset-0 z-40" onClick={() => setMenuExpanded(false)} />}

      <div
        className={`absolute inset-0 z-30 bg-black flex items-center justify-center transition-opacity duration-1000 ${
          blackScreen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={handleBlackScreenClick}
      >
        <p className="text-white text-xl md:text-2xl text-center px-8 leading-relaxed animate-in fade-in duration-1000">
          {blackScreenText}
        </p>
        {/* 左右箭头指示区域 */}
        {blackScreen && (
          <>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors">
              <ChevronLeft className="w-8 h-8" />
            </div>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors">
              <ChevronRight className="w-8 h-8" />
            </div>
          </>
        )}
      </div>

      {/* 选项框 */}
      {showChoices && currentDialogue.options && (
        <ChoiceBox options={currentDialogue.options} customStyle={dialogStyle} onSelect={handleChoiceSelect} />
      )}

      {!blackScreen && !showChoices && currentDialogue.type !== "blackscreen" && currentDialogue.type !== "choice" && (
        <DialogBox
          character={currentDialogue.character || ""}
          text={currentDialogue.text}
          isLastDialogue={currentDialogIndex >= dialogues.length - 1}
          isFirstDialogue={currentDialogIndex === 0}
          onPrev={prevDialogue}
          onNext={nextDialogue}
          dialogKey={currentDialogIndex}
          customStyle={dialogStyle}
        />
      )}

      {/* 设置面板 */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          spriteSettings={spriteSettings}
          onSpriteSettingsChange={setSpriteSettings}
          autoPlay={autoPlay}
          onAutoPlayChange={setAutoPlay}
          autoPlaySpeed={autoPlaySpeed}
          onAutoPlaySpeedChange={setAutoPlaySpeed}
          dialogStyle={previewStyle}
          onDialogStyleChange={setPreviewStyle}
          onSaveStyle={handleSaveStyle}
          currentAppliedStyle={dialogStyle}
          customModeEnabled={customModeEnabled}
          onCustomModeChange={setCustomModeEnabled}
        />
      )}
    </div>
  )
}
