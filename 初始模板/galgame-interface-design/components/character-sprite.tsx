"use client"

interface CharacterSpriteProps {
  scale: number
  positionX: number
  positionY: number
}

export default function CharacterSprite({ scale, positionX, positionY }: CharacterSpriteProps) {
  return (
    <div
      className="absolute z-5 transition-all duration-300 pointer-events-none"
      style={{
        left: `${positionX}%`,
        bottom: `${100 - positionY}%`,
        transform: `translateX(-50%) scale(${scale})`,
        transformOrigin: "bottom center",
      }}
    >
      <img
        src="/anime-girl-with-long-hair-school-uniform-spring-ge.jpg"
        alt="角色立绘"
        className="h-[70vh] w-auto object-contain drop-shadow-2xl"
        draggable={false}
      />
    </div>
  )
}
