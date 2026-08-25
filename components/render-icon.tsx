"use client"

import React from "react"

interface RenderIconProps {
  icon: unknown
  className?: string
  size?: number
}

export function RenderIcon({ icon, className, size }: RenderIconProps) {
  if (!icon) return null
  const Component = icon as React.ComponentType<{ className?: string; size?: number }>
  return <Component className={className} size={size} />
}
