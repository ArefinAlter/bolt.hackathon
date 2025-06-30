'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import Image from 'next/image'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src="/main_logo.svg"
              alt="Dokani"
              width={120}
              height={32}
              className="h-8 w-auto"
              style={{ width: 'auto' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-gray-900 hover:text-gray-700 transition-colors">
              Features
            </Link>
            <Link href="#benefits" className="text-gray-900 hover:text-gray-700 transition-colors">
              Problem & Solution
            </Link>
            <Link href="#pricing" className="text-gray-900 hover:text-gray-700 transition-colors">
              Pricing
            </Link>
            <Link href="#stack" className="text-gray-900 hover:text-gray-700 transition-colors">
              Tech Stack
            </Link>
          </nav>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" className="text-gray-900 hover:text-gray-700">
              Sign In
            </Button>
            <Link href="/auth/signup">
              <Button className="bg-primary hover:bg-primary/90 text-gray-900 font-medium">
                Get Started
              </Button>
            </Link>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-900"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link 
                href="#features" 
                className="block px-3 py-2 text-gray-900 hover:text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link 
                href="#benefits" 
                className="block px-3 py-2 text-gray-900 hover:text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Problem & Solution
              </Link>
              <Link 
                href="#pricing" 
                className="block px-3 py-2 text-gray-900 hover:text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link 
                href="#stack" 
                className="block px-3 py-2 text-gray-900 hover:text-gray-700"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tech Stack
              </Link>
            </nav>
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
              <Button variant="ghost" className="w-full justify-start text-gray-900">
                Sign In
              </Button>
              <Link href="/auth/signup" className="block">
                <Button className="w-full bg-primary hover:bg-primary/90 text-gray-900">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}