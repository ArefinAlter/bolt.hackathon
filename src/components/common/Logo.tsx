'use client'

import Link from 'next/link'
import Image from 'next/image'

interface LogoProps {
  href?: string
  className?: string
  width?: number
  height?: number
}

export function Logo({ 
  href = "/", 
  className = "", 
  width = 120, 
  height = 32 
}: LogoProps) {
  return (
    <Link href={href} className={`flex items-center ${className}`}>
      <Image
        src="/main_logo.svg"
        alt="Dokani"
        width={width}
        height={height}
        className="h-8 w-auto"
        style={{ width: 'auto' }}
      />
    </Link>
  )
} 