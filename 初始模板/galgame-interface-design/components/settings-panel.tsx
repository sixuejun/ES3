"use client"

import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { X, Check, Paintbrush } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  type DialogBoxStyle,
  boxShapePresets,
  nameShapePresets,
  arrowShapePresets,
  indicatorShapePresets,
  borderWidthPresets,
  backgroundPatternPresets,
} from "./dialog-box"

interface SettingsPanelProps {
  onClose: () => void
  spriteSettings: {
    scale: number
    positionX: number
    positionY: number
  }
  onSpriteSettingsChange: (settings: { scale: number; positionX: number; positionY: number }) => void
  autoPlay: boolean
  onAutoPlayChange: (autoPlay: boolean) => void
  autoPlaySpeed: number
  onAutoPlaySpeedChange: (speed: number) => void
  dialogStyle: DialogBoxStyle
  onDialogStyleChange: (style: DialogBoxStyle) => void
  onSaveStyle: () => void
  currentAppliedStyle: DialogBoxStyle
  customModeEnabled: boolean
  onCustomModeChange: (enabled: boolean) => void
}

function hexToHsl(hex: string): { h: number; s: number; l: number; a: number } {
  let r = 0,
    g = 0,
    b = 0,
    a = 1

  if (hex.startsWith("rgba")) {
    const match = hex.match(/rgba?$$(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?$$/)
    if (match) {
      r = Number.parseInt(match[1]) / 255
      g = Number.parseInt(match[2]) / 255
      b = Number.parseInt(match[3]) / 255
      a = match[4] ? Number.parseFloat(match[4]) : 1
    }
  } else if (hex.startsWith("rgb")) {
    const match = hex.match(/rgb$$(\d+),\s*(\d+),\s*(\d+)$$/)
    if (match) {
      r = Number.parseInt(match[1]) / 255
      g = Number.parseInt(match[2]) / 255
      b = Number.parseInt(match[3]) / 255
    }
  } else if (hex.startsWith("#")) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex)
    if (result) {
      r = Number.parseInt(result[1], 16) / 255
      g = Number.parseInt(result[2], 16) / 255
      b = Number.parseInt(result[3], 16) / 255
      a = result[4] ? Number.parseInt(result[4], 16) / 255 : 1
    }
  }

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100), a }
}

function hslToRgba(h: number, s: number, l: number, a: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const f = (n: number) => l - s * Math.min(l, 1 - l) * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)))
  const r = Math.round(255 * f(0))
  const g = Math.round(255 * f(8))
  const b = Math.round(255 * f(4))
  return a < 1
    ? `rgba(${r}, ${g}, ${b}, ${a.toFixed(2)})`
    : `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`
}

function rgbaToHex(rgba: string): string {
  if (rgba.startsWith("#")) return rgba.slice(0, 7).toUpperCase()
  const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (match) {
    const r = Number.parseInt(match[1]).toString(16).padStart(2, "0")
    const g = Number.parseInt(match[2]).toString(16).padStart(2, "0")
    const b = Number.parseInt(match[3]).toString(16).padStart(2, "0")
    return `#${r}${g}${b}`.toUpperCase()
  }
  return "#000000"
}

function ColorSlider({
  label,
  value,
  onChange,
  showAlpha = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  showAlpha?: boolean
}) {
  // 使用本地状态管理滑块，避免每次滑动都触发父组件更新
  const [localHsl, setLocalHsl] = useState(() => hexToHsl(value))
  const [localHexInput, setLocalHexInput] = useState(() => rgbaToHex(value))
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // 当外部 value 变化时同步本地状态
  useEffect(() => {
    const newHsl = hexToHsl(value)
    setLocalHsl(newHsl)
    setLocalHexInput(rgbaToHex(value))
  }, [value])

  // 防抖更新父组件
  const debouncedOnChange = useCallback(
    (newColor: string) => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
      debounceRef.current = setTimeout(() => {
        onChange(newColor)
      }, 16) // ~60fps
    },
    [onChange],
  )

  const handleHslChange = useCallback(
    (key: "h" | "s" | "l" | "a", val: number) => {
      const newHsl = { ...localHsl, [key]: val }
      setLocalHsl(newHsl)
      const newColor = hslToRgba(newHsl.h, newHsl.s, newHsl.l, newHsl.a)
      debouncedOnChange(newColor)
    },
    [localHsl, debouncedOnChange],
  )

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value.toUpperCase()
    setLocalHexInput(input)

    if (/^#[0-9A-F]{6}$/.test(input)) {
      const newHsl = hexToHsl(input)
      newHsl.a = localHsl.a // 保持当前透明度
      setLocalHsl(newHsl)
      onChange(hslToRgba(newHsl.h, newHsl.s, newHsl.l, newHsl.a))
    }
  }

  const handleHexBlur = () => {
    setLocalHexInput(rgbaToHex(value))
  }

  const currentColor = hslToRgba(localHsl.h, localHsl.s, localHsl.l, localHsl.a)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={localHexInput}
            onChange={handleHexInput}
            onBlur={handleHexBlur}
            className="w-20 px-2 py-0.5 text-xs border rounded bg-background text-foreground font-mono"
            placeholder="#000000"
          />
          <div className="w-6 h-6 rounded border border-border shadow-sm" style={{ background: currentColor }} />
        </div>
      </div>

      {/* 色相 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-6">H</span>
        <div className="flex-1 relative h-5 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
            }}
          />
          <input
            type="range"
            min="0"
            max="360"
            value={localHsl.h}
            onChange={(e) => handleHslChange("h", Number.parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
            style={{ left: `calc(${(localHsl.h / 360) * 100}% - 8px)`, background: `hsl(${localHsl.h}, 100%, 50%)` }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-8 text-right">{localHsl.h}°</span>
      </div>

      {/* 饱和度 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-6">S</span>
        <div className="flex-1 relative h-5 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to right, hsl(${localHsl.h}, 0%, ${localHsl.l}%), hsl(${localHsl.h}, 100%, ${localHsl.l}%))`,
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={localHsl.s}
            onChange={(e) => handleHslChange("s", Number.parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
            style={{ left: `calc(${localHsl.s}% - 8px)`, background: currentColor }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-8 text-right">{localHsl.s}%</span>
      </div>

      {/* 亮度 */}
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground w-6">L</span>
        <div className="flex-1 relative h-5 flex items-center">
          <div
            className="absolute inset-y-1 left-0 right-0 rounded-full"
            style={{
              background: `linear-gradient(to right, #000, hsl(${localHsl.h}, ${localHsl.s}%, 50%), #fff)`,
            }}
          />
          <input
            type="range"
            min="0"
            max="100"
            value={localHsl.l}
            onChange={(e) => handleHslChange("l", Number.parseInt(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
            style={{ left: `calc(${localHsl.l}% - 8px)`, background: currentColor }}
          />
        </div>
        <span className="text-[10px] text-muted-foreground w-8 text-right">{localHsl.l}%</span>
      </div>

      {/* 透明度 */}
      {showAlpha && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground w-6">A</span>
          <div className="flex-1 relative h-5 flex items-center">
            <div
              className="absolute inset-y-1 left-0 right-0 rounded-full"
              style={{
                backgroundImage: `
                  linear-gradient(45deg, #ccc 25%, transparent 25%),
                  linear-gradient(-45deg, #ccc 25%, transparent 25%),
                  linear-gradient(45deg, transparent 75%, #ccc 75%),
                  linear-gradient(-45deg, transparent 75%, #ccc 75%)
                `,
                backgroundSize: "8px 8px",
                backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
              }}
            />
            <div
              className="absolute inset-y-1 left-0 right-0 rounded-full"
              style={{
                background: `linear-gradient(to right, transparent, ${hslToRgba(localHsl.h, localHsl.s, localHsl.l, 1)})`,
              }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={Math.round(localHsl.a * 100)}
              onChange={(e) => handleHslChange("a", Number.parseInt(e.target.value) / 100)}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
              style={{ left: `calc(${localHsl.a * 100}% - 8px)`, background: currentColor }}
            />
          </div>
          <span className="text-[10px] text-muted-foreground w-8 text-right">{Math.round(localHsl.a * 100)}%</span>
        </div>
      )}
    </div>
  )
}

// 预览用对话框组件 - 与正文完全一致的缩小版
function DialogPreview({ style }: { style: DialogBoxStyle }) {
  const boxShape = boxShapePresets.find((p) => p.id === style.boxShape) || boxShapePresets[0]
  const nameShape = nameShapePresets.find((p) => p.id === style.nameShape) || nameShapePresets[0]
  const arrowShape = arrowShapePresets.find((p) => p.id === style.arrowShape) || arrowShapePresets[0]
  const indicatorShape = indicatorShapePresets.find((p) => p.id === style.indicatorShape) || indicatorShapePresets[0]
  const bgPattern = backgroundPatternPresets.find((p) => p.id === style.backgroundPattern)
  const borderWidthPreset = borderWidthPresets.find((p) => p.id === style.borderWidth) || borderWidthPresets[1]

  const getBorderColorForPattern = (borderColor: string, opacity = 0.08): string => {
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

  const getBackgroundStyles = (): React.CSSProperties => {
    const styles: React.CSSProperties = {
      backgroundColor: style.colors.boxBackground,
    }
    if (bgPattern?.pattern) {
      const patternBorderColor = getBorderColorForPattern(style.colors.boxBorder, 0.08)
      const resolvedPattern = bgPattern.pattern.replace(/VAR_BORDER_COLOR/g, patternBorderColor)
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

  // 渲染角色名（缩小版）
  const renderCharacterName = () => {
    const { nameBackground, nameText, nameBorder } = style.colors
    const { style: nameStyleType, borderRadius } = nameShape

    if (nameStyleType === "underline") {
      return (
        <span
          className="inline-block px-1 pb-0.5 text-[10px] font-medium"
          style={{
            color: nameText,
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            borderBottomColor: nameBorder,
          }}
        >
          樱
        </span>
      )
    }

    if (nameStyleType === "floating") {
      return (
        <span
          className="inline-block px-2 py-0.5 text-[10px] font-medium shadow-sm -translate-y-0.5"
          style={{ background: nameBackground, color: nameText, borderRadius }}
        >
          樱
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
        className="inline-block px-2 py-0.5 text-[10px] font-medium"
        style={{
          background: nameBackground,
          color: nameText,
          ...borderStyle,
          borderRadius,
        }}
      >
        樱
      </span>
    )
  }

  const renderIndicator = () => {
    const { type } = indicatorShape
    const { indicatorColor } = style.colors

    if (type === "none") return null

    if (type === "dots") {
      return (
        <div className="flex gap-0.5 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1 h-1 rounded-full"
              style={{
                background: indicatorColor,
                opacity: i === 2 ? 1 : 0.4,
                animation: i === 2 ? "pulse 1s ease-in-out infinite" : undefined,
              }}
            />
          ))}
        </div>
      )
    }

    if (type === "diamonds") {
      return (
        <div className="flex gap-0.5 items-center">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rotate-45"
              style={{
                background: indicatorColor,
                opacity: i === 2 ? 1 : 0.3 + i * 0.15,
                animation: i === 2 ? "diamondPulse 1.2s ease-in-out infinite" : undefined,
              }}
            />
          ))}
        </div>
      )
    }

    if (type === "pulse") {
      return (
        <div className="relative w-2 h-2">
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: indicatorColor,
              opacity: 0.4,
              animation: "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
            }}
          />
          <span
            className="absolute inset-0 rounded-full"
            style={{
              background: indicatorColor,
              animation: "pulse 2s ease-in-out infinite",
            }}
          />
        </div>
      )
    }

    if (type === "arrow") {
      return (
        <svg
          className="w-3 h-3"
          style={{
            color: indicatorColor,
            animation: "arrowBounce 0.8s ease-in-out infinite",
          }}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      )
    }

    return null
  }

  // 渲染箭头按钮
  const renderArrowButton = (direction: "left" | "right", isInner: boolean) => {
    const { type } = arrowShape
    const { arrowBackground, arrowIcon } = style.colors
    const isMinimal = type === "minimal"

    if (isInner) {
      const isRound = type === "inner-round"
      return (
        <div
          className={`flex items-center justify-center ${isRound ? "w-5 h-full mx-0.5 rounded-full" : "w-6 h-full"}`}
          style={{
            background: isRound ? arrowBackground : "transparent",
            color: arrowIcon,
            borderLeft: !isRound && direction === "right" ? `1px solid ${style.colors.boxBorder}` : undefined,
            borderRight: !isRound && direction === "left" ? `1px solid ${style.colors.boxBorder}` : undefined,
          }}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
            />
          </svg>
        </div>
      )
    }

    const shapeClass = {
      circle: "w-6 h-6 rounded-full",
      square: "w-6 h-6 rounded",
      pill: "w-7 h-5 rounded-full",
      minimal: "w-6 h-6",
      "inner-round": "",
      "inner-square": "",
    }[type]

    return (
      <div
        className={`flex items-center justify-center ${shapeClass}`}
        style={{
          background: isMinimal ? "transparent" : arrowBackground,
          color: arrowIcon,
        }}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={direction === "left" ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
          />
        </svg>
      </div>
    )
  }

  const isInnerArrow = arrowShape.isInner

  const isPillShape = style.boxShape === "pill"

  return (
    <div className="flex items-center gap-1.5 w-full">
      {/* 外置左箭头 */}
      {!isInnerArrow && renderArrowButton("left", false)}

      <div
        className={`flex-1 min-h-[60px] relative flex ${isInnerArrow ? "overflow-hidden" : ""} ${isPillShape ? "backdrop-blur-md" : ""}`}
        style={{
          ...getBackgroundStyles(),
          borderWidth: borderWidthPreset.width,
          borderStyle: "solid",
          borderColor: style.colors.boxBorder,
          borderRadius: boxShape.borderRadius,
          boxShadow: boxShape.shadow,
        }}
      >
        {/* 内置左箭头 */}
        {isInnerArrow && renderArrowButton("left", true)}

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col">
          {/* 角色名区域 */}
          <div className="h-[20px] flex items-end px-2">{renderCharacterName()}</div>

          {/* 对话内容 */}
          <div className="px-2 pb-2 pt-0.5 flex-1">
            <p className="leading-relaxed text-[10px]" style={{ color: style.colors.dialogText }}>
              今天的天气真好呢...
              <span className="animate-pulse ml-0.5" style={{ color: style.colors.nameText }}>
                ｜
              </span>
            </p>
          </div>

          {/* 呼吸指示器 */}
          <div className={`absolute bottom-1.5 ${isInnerArrow ? "left-1/2 -translate-x-1/2" : "right-2"}`}>
            {renderIndicator()}
          </div>
        </div>

        {/* 内置右箭头 */}
        {isInnerArrow && renderArrowButton("right", true)}
      </div>

      {/* 外置右箭头 */}
      {!isInnerArrow && renderArrowButton("right", false)}

      {/* 动画样式 */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes diamondPulse {
          0%, 100% { opacity: 1; transform: rotate(45deg) scale(1); }
          50% { opacity: 0.6; transform: rotate(45deg) scale(0.8); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
        @keyframes arrowBounce {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(2px); }
        }
      `}</style>
    </div>
  )
}

export default function SettingsPanel({
  onClose,
  spriteSettings,
  onSpriteSettingsChange,
  autoPlay,
  onAutoPlayChange,
  autoPlaySpeed,
  onAutoPlaySpeedChange,
  dialogStyle,
  onDialogStyleChange,
  onSaveStyle,
  currentAppliedStyle,
  customModeEnabled,
  onCustomModeChange,
}: SettingsPanelProps) {
  const [activeTab, setActiveTab] = useState("sprite")
  const [hasChanges, setHasChanges] = useState(false)
  const [saved, setSaved] = useState(false)

  // 检查是否有未保存的更改
  useEffect(() => {
    const isDifferent = JSON.stringify(dialogStyle) !== JSON.stringify(currentAppliedStyle)
    setHasChanges(isDifferent)
    if (isDifferent) setSaved(false)
  }, [dialogStyle, currentAppliedStyle])

  const handleSave = () => {
    onSaveStyle()
    setSaved(true)
    setHasChanges(false)
  }

  const updateShape = (key: keyof DialogBoxStyle, value: string) => {
    onDialogStyleChange({ ...dialogStyle, [key]: value })
  }

  const updateColor = (key: keyof DialogBoxStyle["colors"], value: string) => {
    onDialogStyleChange({
      ...dialogStyle,
      colors: { ...dialogStyle.colors, [key]: value },
    })
  }

  return (
    <div
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-2xl w-[90%] max-w-md max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">设置</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted transition-colors" aria-label="关闭设置">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 内容 */}
        <div className="p-4 overflow-y-auto max-h-[calc(85vh-60px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="sprite" className="text-xs">
                立绘
              </TabsTrigger>
              <TabsTrigger value="playback" className="text-xs">
                播放
              </TabsTrigger>
              <TabsTrigger value="shapes" className="text-xs">
                形状
              </TabsTrigger>
              <TabsTrigger value="colors" className="text-xs">
                颜色
              </TabsTrigger>
            </TabsList>

            {/* 立绘设置 */}
            <TabsContent value="sprite" className="space-y-4 animate-in fade-in duration-200">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm">立绘大小</Label>
                    <span className="text-xs text-muted-foreground">{Math.round(spriteSettings.scale * 100)}%</span>
                  </div>
                  <Slider
                    value={[spriteSettings.scale]}
                    onValueChange={([value]) => onSpriteSettingsChange({ ...spriteSettings, scale: value })}
                    min={0.5}
                    max={1.5}
                    step={0.05}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm">水平位置</Label>
                    <span className="text-xs text-muted-foreground">{spriteSettings.positionX}%</span>
                  </div>
                  <Slider
                    value={[spriteSettings.positionX]}
                    onValueChange={([value]) => onSpriteSettingsChange({ ...spriteSettings, positionX: value })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm">垂直位置</Label>
                    <span className="text-xs text-muted-foreground">{spriteSettings.positionY}%</span>
                  </div>
                  <Slider
                    value={[spriteSettings.positionY]}
                    onValueChange={([value]) => onSpriteSettingsChange({ ...spriteSettings, positionY: value })}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </TabsContent>

            {/* 播放设置 */}
            <TabsContent value="playback" className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <Label className="text-sm">自动播放</Label>
                <Switch checked={autoPlay} onCheckedChange={onAutoPlayChange} />
              </div>
              {autoPlay && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between mb-2">
                    <Label className="text-sm">播放速度</Label>
                    <span className="text-xs text-muted-foreground">{autoPlaySpeed / 1000}秒/句</span>
                  </div>
                  <Slider
                    value={[autoPlaySpeed]}
                    onValueChange={([value]) => onAutoPlaySpeedChange(value)}
                    min={1000}
                    max={8000}
                    step={500}
                  />
                </div>
              )}
            </TabsContent>

            {/* 形状设置 */}
            <TabsContent value="shapes" className="space-y-4 animate-in fade-in duration-200">
              {/* 自定义模式开关 */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-primary" />
                  <Label className="text-sm font-medium">自定义模式</Label>
                </div>
                <Switch checked={customModeEnabled} onCheckedChange={onCustomModeChange} />
              </div>

              {customModeEnabled && (
                <>
                  {/* 实时预览 */}
                  <div className="p-3 bg-muted/30 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">实时预览</span>
                      <Button
                        size="sm"
                        variant={hasChanges ? "default" : "outline"}
                        disabled={!hasChanges}
                        onClick={handleSave}
                        className="h-7 text-xs gap-1"
                      >
                        {saved ? (
                          <>
                            <Check className="w-3 h-3" /> 已保存
                          </>
                        ) : (
                          "保存应用"
                        )}
                      </Button>
                    </div>
                    <DialogPreview style={dialogStyle} />
                  </div>

                  {/* 文本框形状 */}
                  <div className="space-y-2">
                    <Label className="text-sm">文本框形状</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {boxShapePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateShape("boxShape", preset.id)}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            dialogStyle.boxShape === preset.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 边框粗细 */}
                  <div className="space-y-2">
                    <Label className="text-sm">边框粗细</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {borderWidthPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateShape("borderWidth", preset.id)}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            dialogStyle.borderWidth === preset.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 背景图案 */}
                  <div className="space-y-2">
                    <Label className="text-sm">背景图案</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {backgroundPatternPresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateShape("backgroundPattern", preset.id)}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            dialogStyle.backgroundPattern === preset.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 角色名形状 */}
                  <div className="space-y-2">
                    <Label className="text-sm">角色名形状</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {nameShapePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateShape("nameShape", preset.id)}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            dialogStyle.nameShape === preset.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 箭头形状 */}
                  <div className="space-y-2">
                    <Label className="text-sm">箭头按钮</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {arrowShapePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateShape("arrowShape", preset.id)}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            dialogStyle.arrowShape === preset.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 呼吸指示器 */}
                  <div className="space-y-2">
                    <Label className="text-sm">呼吸指示器</Label>
                    <div className="grid grid-cols-5 gap-2">
                      {indicatorShapePresets.map((preset) => (
                        <button
                          key={preset.id}
                          onClick={() => updateShape("indicatorShape", preset.id)}
                          className={`p-2 text-xs rounded-lg border transition-all ${
                            dialogStyle.indicatorShape === preset.id
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {preset.name}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </TabsContent>

            {/* 颜色设置 */}
            <TabsContent value="colors" className="space-y-3 animate-in fade-in duration-200">
              {customModeEnabled ? (
                <>
                  <ColorSlider
                    label="文本框背景"
                    value={dialogStyle.colors.boxBackground}
                    onChange={(v) => updateColor("boxBackground", v)}
                  />
                  <ColorSlider
                    label="文本框边框"
                    value={dialogStyle.colors.boxBorder}
                    onChange={(v) => updateColor("boxBorder", v)}
                  />
                  <ColorSlider
                    label="角色名背景"
                    value={dialogStyle.colors.nameBackground}
                    onChange={(v) => updateColor("nameBackground", v)}
                  />
                  <ColorSlider
                    label="角色名文字"
                    value={dialogStyle.colors.nameText}
                    onChange={(v) => updateColor("nameText", v)}
                    showAlpha={false}
                  />
                  <ColorSlider
                    label="对话文字"
                    value={dialogStyle.colors.dialogText}
                    onChange={(v) => updateColor("dialogText", v)}
                    showAlpha={false}
                  />
                  <ColorSlider
                    label="旁白文字"
                    value={dialogStyle.colors.narrationText}
                    onChange={(v) => updateColor("narrationText", v)}
                    showAlpha={false}
                  />
                  <ColorSlider
                    label="箭头背景"
                    value={dialogStyle.colors.arrowBackground}
                    onChange={(v) => updateColor("arrowBackground", v)}
                  />
                  <ColorSlider
                    label="箭头图标"
                    value={dialogStyle.colors.arrowIcon}
                    onChange={(v) => updateColor("arrowIcon", v)}
                    showAlpha={false}
                  />
                  <ColorSlider
                    label="指示器颜色"
                    value={dialogStyle.colors.indicatorColor}
                    onChange={(v) => updateColor("indicatorColor", v)}
                    showAlpha={false}
                  />
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Paintbrush className="w-8 h-8 text-muted-foreground mb-3" />
                  <p className="text-sm text-muted-foreground">请先在「形状」标签页中开启自定义模式</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
