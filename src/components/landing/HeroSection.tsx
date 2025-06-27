'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Zap, Shield, TrendingUp } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function HeroSection() {
  return (
    <section className="relative pt-20 pb-16 lg:pt-24 lg:pb-20 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-white to-secondary/5" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-20 h-20 bg-primary/10 rounded-full blur-xl animate-float" />
      <div className="absolute top-40 right-20 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-20 left-1/4 w-16 h-16 bg-success/10 rounded-full blur-xl animate-float" style={{ animationDelay: '4s' }} />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left column - Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6 animate-fade-in">
              <Zap className="w-4 h-4 mr-2" />
              AI-Powered Return Management
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Transform Your{' '}
              <span className="gradient-text">E-commerce Returns</span>{' '}
              with AI
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Automate return triage, provide voice & video customer service, and recover more value from returns with our intelligent platform.
            </p>

            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">85%</div>
                <div className="text-sm text-gray-600">Faster Processing</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">40%</div>
                <div className="text-sm text-gray-600">Cost Reduction</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">95%</div>
                <div className="text-sm text-gray-600">Customer Satisfaction</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-black font-semibold px-8 py-3 text-lg group">
                  Experience Our Product
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-3 text-lg group">
                <Play className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-500 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center">
                <Shield className="w-4 h-4 mr-1 text-success" />
                SOC 2 Compliant
              </div>
              <div className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1 text-success" />
                99.9% Uptime
              </div>
            </div>
          </div>

          {/* Right column - Hero Image */}
          <div className="relative animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="relative">
              {/* Main hero image */}
              <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100">
                <Image
                  src="/landing_image.jpg"
                  alt="Dokani Platform Dashboard"
                  width={600}
                  height={400}
                  className="w-full h-auto object-cover"
                  priority
                />
                
                {/* Overlay with glass effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>

              {/* Floating UI elements */}
              <div className="absolute -top-4 -right-4 bg-white rounded-lg shadow-lg p-4 animate-float">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-success rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">AI Processing</span>
                </div>
                <div className="text-xs text-gray-600 mt-1">Return approved in 2.3s</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-black" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">$2,450</div>
                    <div className="text-xs text-gray-600">Value recovered</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}