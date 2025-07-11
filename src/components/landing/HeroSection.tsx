'use client'

import { Button } from '@/components/ui/button'
import { ArrowRight, Play, Zap, Shield, TrendingUp, Clock, DollarSign, Users, Smartphone } from 'lucide-react'
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
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-black text-sm font-medium mb-6 animate-fade-in">
              <Zap className="w-4 h-4 mr-2 text-black" />
              AI-Powered Return Management
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 animate-slide-up">
              Say Goodbye to{' '}
              <span className="gradient-text">Return Headaches</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              Your AI powered solution to automate return triage, provide voice and video customer service, and recover more value for returns. Automate refunds and RMAs like Amazon — without the Amazon-sized budget.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">10x Faster</div>
                  <div className="text-sm text-gray-600">Most requests in under 2 minutes</div>
                </div>
              </div>

              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <DollarSign className="w-6 h-6 text-success" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">35% Cost Cut</div>
                  <div className="text-sm text-gray-600">vs hiring agents ($40K-60K/year)</div>
                </div>
              </div>

              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Users className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">70% Prioritize</div>
                  <div className="text-sm text-gray-600">Hassle-free return policies</div>
                </div>
              </div>

              <div className="flex items-center bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm hover:shadow-md transition-all duration-300 group">
                <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center mr-3 group-hover:scale-110 transition-transform">
                  <Smartphone className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <div className="text-lg font-semibold text-gray-900">24/7 Automation</div>
                  <div className="text-sm text-gray-600">No agents, no spreadsheets</div>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Link href="/auth/signup">
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-gray-900 font-semibold px-8 py-3 text-lg group">
                  Experience Our Product
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-gray-300 text-gray-900 hover:bg-gray-50 px-8 py-3 text-lg group">
                <Play className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                Watch Demo
              </Button>
            </div>

            {/* Trust indicators */}
            <div className="mt-8 flex items-center justify-center lg:justify-start space-x-6 text-sm text-gray-900 animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
                  src="/landing_hero.svg"
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
                <div className="text-xs text-gray-900 mt-1">Return approved in 2.3s</div>
              </div>

              <div className="absolute -bottom-4 -left-4 bg-white rounded-lg shadow-lg p-4 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Zap className="w-4 h-4 text-gray-900" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">$2,450</div>
                    <div className="text-xs text-gray-900">Value recovered</div>
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