"use client"

import type React from "react"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState, useEffect } from "react"

export interface BoxShapePreset {
  id: string
  name: string
  borderRadius: string
  borderWidth: string
  shadow: string
}

export interface NameShapePreset {
  id: string
  name: string
  borderRadius: string
  style: "tag" | "pill" | "square" | "underline" | "floating"
}

export interface ArrowShapePreset {
  id: string
  name: string
  type: "circle" | "square" | "pill" | "minimal" | "inner-round" | "inner-square"
  isInner: boolean
}

export interface IndicatorShapePreset {
  id: string
  name: string
  type: "dots" | "diamonds" | "pulse" | "arrow" | "none"
}

export interface BackgroundPatternPreset {
  id: string
  name: string
  pattern: string
}

export const backgroundPatternPresets: BackgroundPatternPreset[] = [
  { id: "none", name: "无", pattern: "" },
  {
    id: "grid",
    name: "方格",
    pattern:
      "linear-gradient(to right, VAR_BORDER_COLOR 1px, transparent 1px), linear-gradient(to bottom, VAR_BORDER_COLOR 1px, transparent 1px)",
  },
  { id: "dots", name: "圆点", pattern: "radial-gradient(circle, VAR_BORDER_COLOR 1px, transparent 1px)" },
  {
    id: "diamonds",
    name: "菱形",
    pattern:
      "linear-gradient(45deg, VAR_BORDER_COLOR 25%, transparent 25%), linear-gradient(-45deg, VAR_BORDER_COLOR 25%, transparent 25%), linear-gradient(45deg, transparent 75%, VAR_BORDER_COLOR 75%), linear-gradient(-45deg, transparent 75%, VAR_BORDER_COLOR 75%)",
  },
  {
    id: "stripes",
    name: "条纹",
    pattern:
      "repeating-linear-gradient(45deg, transparent, transparent 10px, VAR_BORDER_COLOR 10px, VAR_BORDER_COLOR 20px)",
  },
  {
    id: "gradient-soft",
    name: "柔光渐变",
    pattern: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 50%, VAR_BORDER_COLOR 100%)",
  },
]

// 形状预设
export const boxShapePresets: BoxShapePreset[] = [
  { id: "rounded", name: "圆角", borderRadius: "12px", borderWidth: "1px", shadow: "0 4px 20px rgba(0,0,0,0.08)" },
  { id: "pill", name: "胶囊", borderRadius: "24px", borderWidth: "1px", shadow: "0 4px 24px rgba(0,0,0,0.1)" },
  { id: "sharp", name: "直角", borderRadius: "0px", borderWidth: "2px", shadow: "4px 4px 0 rgba(0,0,0,0.1)" },
  { id: "soft", name: "柔和", borderRadius: "16px", borderWidth: "0px", shadow: "0 8px 32px rgba(0,0,0,0.12)" },
  { id: "frame", name: "画框", borderRadius: "4px", borderWidth: "3px", shadow: "inset 0 0 0 1px rgba(0,0,0,0.05)" },
]

export const borderWidthPresets = [
  { id: "none", name: "无", width: "0px" },
  { id: "thin", name: "细", width: "1px" },
  { id: "medium", name: "中", width: "2px" },
  { id: "thick", name: "粗", width: "3px" },
  { id: "bold", name: "加粗", width: "4px" },
]

export const nameShapePresets: NameShapePreset[] = [
  { id: "tag", name: "标签", borderRadius: "6px 6px 0 0", style: "tag" },
  { id: "pill", name: "胶囊", borderRadius: "999px", style: "pill" },
  { id: "square", name: "方形", borderRadius: "0px", style: "square" },
  { id: "underline", name: "下划线", borderRadius: "0px", style: "underline" },
  { id: "floating", name: "悬浮", borderRadius: "8px", style: "floating" },
]

export const arrowShapePresets: ArrowShapePreset[] = [
  { id: "circle", name: "圆形", type: "circle", isInner: false },
  { id: "square", name: "方形", type: "square", isInner: false },
  { id: "pill", name: "胶囊", type: "pill", isInner: false },
  { id: "minimal", name: "极简", type: "minimal", isInner: false },
  { id: "inner-round", name: "内嵌圆", type: "inner-round", isInner: true },
  { id: "inner-square", name: "内嵌方", type: "inner-square", isInner: true },
]

export const indicatorShapePresets: IndicatorShapePreset[] = [
  { id: "dots", name: "呼吸点", type: "dots" },
  { id: "diamonds", name: "菱形", type: "diamonds" },
  { id: "pulse", name: "脉冲", type: "pulse" },
  { id: "arrow", name: "箭头", type: "arrow" },
  { id: "none", name: "无", type: "none" },
]

export interface DialogBoxStyle {
  boxShape: string
  nameShape: string
  arrowShape: string
  indicatorShape: string
  backgroundPattern: string
  borderWidth: string
  colors: {
    boxBackground: string
    boxBorder: string
    nameBackground: string
    nameText: string
    nameBorder: string
    dialogText: string
    narrationText: string
    arrowBackground: string
    arrowIcon: string
    indicatorColor: string
  }
  fontSize: string
}

export const defaultDialogStyle: DialogBoxStyle = {
  boxShape: "rounded",
  nameShape: "tag",
  arrowShape: "circle",
  indicatorShape: "dots",
  backgroundPattern: "none",
  borderWidth: "thin",
  colors: {
    boxBackground: "rgba(255, 255, 255, 0.9)",
    boxBorder: "rgba(16, 185, 129, 0.3)",
    nameBackground: "rgba(236, 253, 245, 0.9)",
    nameText: "#059669",
    nameBorder: "rgba(16, 185, 129, 0.3)",
    dialogText: "#374151",
    narrationText: "#6b7280",
    arrowBackground: "rgba(255, 255, 255, 0.85)",
    arrowIcon: "#10b981",
    indicatorColor: "#10b981",
  },
  fontSize: "16px",
}

export interface ChoiceOption {
  id: string
  text: string
  onClick?: () => void
}

interface ChoiceBoxProps {
  options: ChoiceOption[]
  customStyle?: DialogBoxStyle
  onSelect: (id: string) => void
}

export function ChoiceBox({ options, customStyle, onSelect }: ChoiceBoxProps) {
  const style = customStyle || defaultDialogStyle
  const boxShape = boxShapePresets.find((p) => p.id === style.boxShape) || boxShapePresets[0]
  const borderWidthPreset = borderWidthPresets.find((p) => p.id === style.borderWidth) || borderWidthPresets[1]
  const bgPattern = backgroundPatternPresets.find((p) => p.id === style.backgroundPattern)

  const getBackgroundStyles = () => {
    const styles: React.CSSProperties = {
      backgroundColor: style.colors.boxBackground,
    }
    if (bgPattern?.pattern) {
      const resolvedPattern = resolvePatternWithColor(bgPattern.pattern, style.colors.boxBorder)
      styles.backgroundImage = resolvedPattern
      styles.backgroundSize =
        bgPattern.id === "grid"
          ? "20px 20px"
          : bgPattern.id === "dots"
            ? "10px 10px"
            : bgPattern.id === "diamonds"
              ? "20px 20px"
              : undefined
    }
    return styles
  }

  return (
    <div className="absolute inset-0 z-25 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="flex flex-col gap-3 w-full max-w-md px-6">
        {options.map((option, index) => (
          <button
            key={option.id}
            onClick={() => onSelect(option.id)}
            className="group relative px-6 py-4 backdrop-blur-md transition-all duration-300 
                       hover:scale-[1.02] hover:shadow-xl active:scale-[0.98]
                       animate-in fade-in slide-in-from-bottom-2"
            style={{
              ...getBackgroundStyles(),
              borderWidth: borderWidthPreset.width,
              borderStyle: "solid",
              borderColor: style.colors.boxBorder,
              borderRadius: boxShape.borderRadius,
              boxShadow: boxShape.shadow,
              animationDelay: `${index * 100}ms`,
              animationFillMode: "backwards",
            }}
          >
            {/* Hover overlay */}
            <div
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{
                background: `linear-gradient(90deg, ${style.colors.nameBackground}, transparent)`,
                borderRadius: boxShape.borderRadius,
              }}
            />
            <span className="relative z-10 text-base font-medium" style={{ color: style.colors.dialogText }}>
              {option.text}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

interface DialogBoxProps {
  character: string
  text: string
  isLastDialogue: boolean
  isFirstDialogue: boolean
  onPrev: () => void
  onNext: () => void
  dialogKey: number
  customStyle?: DialogBoxStyle
}

function getBorderColorForPattern(borderColor: string, opacity = 0.08): string {
  // 解析 rgba/rgb/hex 颜色
  if (borderColor.startsWith("rgba")) {
    const match = borderColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
  } else if (borderColor.startsWith("rgb")) {
    const match = borderColor.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/)
    if (match) {
      return `rgba(${match[1]}, ${match[2]}, ${match[3]}, ${opacity})`
    }
  } else if (borderColor.startsWith("#")) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})/i.exec(borderColor)
    if (result) {
      const r = Number.parseInt(result[1], 16)
      const g = Number.parseInt(result[2], 16)
      const b = Number.parseInt(result[3], 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
  }
  return `rgba(0, 0, 0, ${opacity})`
}

function resolvePatternWithColor(pattern: string, borderColor: string): string {
  if (!pattern) return ""
  const patternBorderColor = getBorderColorForPattern(borderColor, 0.08)
  return pattern.replace(/VAR_BORDER_COLOR/g, patternBorderColor)
}

export default function DialogBox({
  character,
  text,
  isLastDialogue,
  isFirstDialogue,
  onPrev,
  onNext,
  dialogKey,
  customStyle,
}: DialogBoxProps) {
  const [displayedText, setDisplayedText] = useState("")
  const [isTyping, setIsTyping] = useState(true)

  const style = customStyle || defaultDialogStyle
  const boxShape = boxShapePresets.find((p) => p.id === style.boxShape) || boxShapePresets[0]
  const nameShape = nameShapePresets.find((p) => p.id === style.nameShape) || nameShapePresets[0]
  const arrowShape = arrowShapePresets.find((p) => p.id === style.arrowShape) || arrowShapePresets[0]
  const indicatorShape = indicatorShapePresets.find((p) => p.id === style.indicatorShape) || indicatorShapePresets[0]
  const bgPattern = backgroundPatternPresets.find((p) => p.id === style.backgroundPattern)
  const borderWidthPreset = borderWidthPresets.find((p) => p.id === style.borderWidth) || borderWidthPresets[1]

  const isPillShape = style.boxShape === "pill"

  const getBoxBackgroundStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      // 胶囊形状使用更高透明度的背景
      backgroundColor: isPillShape
        ? style.colors.boxBackground.replace(/[\d.]+\)$/, "0.7)")
        : style.colors.boxBackground,
    }
    if (bgPattern?.pattern) {
      const resolvedPattern = resolvePatternWithColor(bgPattern.pattern, style.colors.boxBorder)
      styles.backgroundImage = resolvedPattern
      styles.backgroundSize =
        bgPattern.id === "grid"
          ? "20px 20px"
          : bgPattern.id === "dots"
            ? "10px 10px"
            : bgPattern.id === "diamonds"
              ? "20px 20px"
              : undefined
    }
    return styles
  }

  useEffect(() => {
    setDisplayedText("")
    setIsTyping(true)
    let index = 0
    const timer = setInterval(() => {
      if (index < text.length) {
        setDisplayedText(text.slice(0, index + 1))
        index++
      } else {
        setIsTyping(false)
        clearInterval(timer)
      }
    }, 50)
    return () => clearInterval(timer)
  }, [text, dialogKey])

  const isNarration = !character || character.trim() === ""

  const renderOuterArrowButton = (direction: "left" | "right", disabled: boolean, onClick: () => void) => {
    const { type } = arrowShape
    const { arrowBackground, arrowIcon } = style.colors

    const baseClass = `flex-shrink-0 flex items-center justify-center transition-all duration-200 ${
      disabled ? "opacity-30 cursor-not-allowed" : "active:scale-95 hover:scale-105"
    }`

    const shapeClass = {
      circle: "w-10 h-10 md:w-11 md:h-11 rounded-full",
      square: "w-10 h-10 md:w-11 md:h-11 rounded-lg",
      pill: "w-12 h-9 md:w-14 md:h-10 rounded-full",
      minimal: "w-10 h-10 md:w-11 md:h-11",
      "inner-round": "",
      "inner-square": "",
    }[type]

    const isMinimal = type === "minimal"

    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        disabled={disabled}
        className={`${baseClass} ${shapeClass} ${isMinimal ? "" : "backdrop-blur-sm"}`}
        style={{ background: isMinimal ? "transparent" : arrowBackground, color: arrowIcon }}
        aria-label={direction === "left" ? "上一条对话" : "下一条对话"}
      >
        <ChevronLeft className={`w-5 h-5 ${direction === "right" ? "hidden" : ""}`} />
        <ChevronRight className={`w-5 h-5 ${direction === "left" ? "hidden" : ""}`} />
      </button>
    )
  }

  const renderInnerArrowButton = (direction: "left" | "right", disabled: boolean, onClick: () => void) => {
    const { type } = arrowShape
    const { arrowBackground, arrowIcon } = style.colors

    const isRound = type === "inner-round"
    const baseClass = `flex items-center justify-center transition-all duration-200 ${
      disabled ? "opacity-30 cursor-not-allowed" : "active:scale-95 hover:bg-opacity-100"
    }`
    const shapeClass = isRound ? "w-9 h-full rounded-full mx-1" : "w-10 h-full"

    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
        disabled={disabled}
        className={`${baseClass} ${shapeClass}`}
        style={{
          background: isRound ? arrowBackground : "transparent",
          color: arrowIcon,
          borderLeft: !isRound && direction === "right" ? `1px solid ${style.colors.boxBorder}` : undefined,
          borderRight: !isRound && direction === "left" ? `1px solid ${style.colors.boxBorder}` : undefined,
        }}
        aria-label={direction === "left" ? "上一条对话" : "下一条对话"}
      >
        <ChevronLeft className={`w-5 h-5 ${direction === "right" ? "hidden" : ""}`} />
        <ChevronRight className={`w-5 h-5 ${direction === "left" ? "hidden" : ""}`} />
      </button>
    )
  }

  const renderCharacterName = () => {
    if (isNarration) return null

    const { nameBackground, nameText, nameBorder } = style.colors
    const { style: nameStyleType, borderRadius } = nameShape

    if (nameStyleType === "underline") {
      return (
        <span
          className="inline-block px-1 pb-1 text-sm font-medium"
          style={{
            color: nameText,
            borderBottomWidth: "2px",
            borderBottomStyle: "solid",
            borderBottomColor: nameBorder,
          }}
        >
          {character}
        </span>
      )
    }

    if (nameStyleType === "floating") {
      return (
        <span
          className="inline-block px-3 py-1 text-sm font-medium shadow-md -translate-y-1"
          style={{ background: nameBackground, color: nameText, borderRadius }}
        >
          {character}
        </span>
      )
    }

    const borderStyle =
      nameStyleType === "tag"
        ? {
            borderTopWidth: "1px",
            borderTopStyle: "solid" as const,
            borderTopColor: nameBorder,
            borderLeftWidth: "1px",
            borderLeftStyle: "solid" as const,
            borderLeftColor: nameBorder,
            borderRightWidth: "1px",
            borderRightStyle: "solid" as const,
            borderRightColor: nameBorder,
            borderBottomWidth: "0px",
          }
        : nameStyleType !== "pill"
          ? {
              borderWidth: "1px",
              borderStyle: "solid" as const,
              borderColor: nameBorder,
            }
          : {}

    return (
      <span
        className="inline-block px-3 py-0.5 text-sm font-medium my-0.5"
        style={{
          background: nameBackground,
          color: nameText,
          ...borderStyle,
          borderRadius,
        }}
      >
        {character}
      </span>
    )
  }

  const renderIndicator = () => {
    const { type } = indicatorShape
    const { indicatorColor } = style.colors

    if (type === "none") return null

    if (type === "dots") {
      return (
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-opacity duration-500"
              style={{
                background: indicatorColor,
                opacity: isTyping ? (i === 2 ? 1 : 0.4) : 0.6,
                animation: isTyping && i === 2 ? "pulse 1s ease-in-out infinite" : undefined,
              }}
            />
          ))}
        </div>
      )
    }

    if (type === "diamonds") {
      return (
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 transition-all duration-300"
              style={{
                background: indicatorColor,
                opacity: isTyping ? (i === 2 ? 1 : 0.3 + i * 0.15) : 0.5,
                transform: `rotate(45deg) scale(${isTyping && i === 2 ? 1.1 : 0.9})`,
                animation: isTyping && i === 2 ? "diamondPulse 1.2s ease-in-out infinite" : undefined,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes diamondPulse {
              0%, 100% { opacity: 1; transform: rotate(45deg) scale(1); }
              50% { opacity: 0.6; transform: rotate(45deg) scale(0.8); }
            }
          `}</style>
        </div>
      )
    }

    if (type === "pulse") {
      return (
        <div className="relative w-3 h-3">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: indicatorColor,
              opacity: 0.4,
              animation: isTyping ? "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" : undefined,
            }}
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: indicatorColor,
              animation: isTyping ? "pulse 2s ease-in-out infinite" : undefined,
            }}
          />
          <style jsx>{`
            @keyframes ping {
              75%, 100% { transform: scale(2); opacity: 0; }
            }
          `}</style>
        </div>
      )
    }

    if (type === "arrow") {
      return (
        <ChevronRight
          className="w-4 h-4 transition-transform duration-300"
          style={{
            color: indicatorColor,
            animation: isTyping ? "arrowBounce 0.8s ease-in-out infinite" : undefined,
          }}
        />
      )
    }

    return null
  }

  const isInnerArrow = arrowShape.isInner

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 p-3 md:p-5">
      <div className="max-w-4xl mx-auto flex items-center gap-3">
        {/* 外置左箭头 */}
        {!isInnerArrow && renderOuterArrowButton("left", isFirstDialogue, onPrev)}

        <div
          className={`flex-1 min-h-[110px] md:min-h-[130px] relative flex ${isInnerArrow ? "overflow-hidden" : ""} ${isPillShape ? "backdrop-blur-md" : "backdrop-blur-md"}`}
          style={{
            ...getBoxBackgroundStyles(),
            borderWidth: borderWidthPreset.width,
            borderStyle: "solid",
            borderColor: style.colors.boxBorder,
            borderRadius: boxShape.borderRadius,
            boxShadow: boxShape.shadow,
          }}
        >
          {/* 内置左箭头 */}
          {isInnerArrow && (
            <div className="flex items-center">{renderInnerArrowButton("left", isFirstDialogue, onPrev)}</div>
          )}

          {/* 主内容区 */}
          <div className="flex-1 flex flex-col">
            {/* 角色名区域 */}
            <div className="h-[36px] flex items-end px-5">{renderCharacterName()}</div>

            {/* 对话内容 */}
            <div className="px-5 pb-4 pt-1 flex-1">
              <p
                className={`leading-relaxed tracking-wide ${isNarration ? "italic text-center py-2" : ""}`}
                style={{
                  color: isNarration ? style.colors.narrationText : style.colors.dialogText,
                  fontSize: style.fontSize,
                }}
              >
                {displayedText}
                {isTyping && (
                  <span className="animate-pulse ml-0.5" style={{ color: style.colors.nameText }}>
                    ｜
                  </span>
                )}
              </p>
            </div>

            {/* 呼吸指示器 */}
            <div className="absolute bottom-3 right-4">{!isInnerArrow && renderIndicator()}</div>
            {isInnerArrow && <div className="absolute bottom-3 left-1/2 -translate-x-1/2">{renderIndicator()}</div>}
          </div>

          {/* 内置右箭头 */}
          {isInnerArrow && (
            <div className="flex items-center">{renderInnerArrowButton("right", isLastDialogue, onNext)}</div>
          )}
        </div>

        {/* 外置右箭头 */}
        {!isInnerArrow && renderOuterArrowButton("right", isLastDialogue, onNext)}
      </div>

      {/* 全局动画样式 */}
      <style jsx global>{`
        @keyframes arrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(3px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
