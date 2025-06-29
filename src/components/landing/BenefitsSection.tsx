'use client'

import { Card, CardContent } from '@/components/ui/card'
import { TrendingUp, Clock, DollarSign, Users, Shield, Zap } from 'lucide-react'
import Image from 'next/image'

const benefits = [
  {
    id: 'efficiency',
    title: 'Increase Efficiency',
    description: 'Automate 85% of return decisions and reduce processing time from hours to seconds.',
    metric: '85% faster',
    icon: Clock,
    color: 'text-blue-600'
  },
  {
    id: 'cost-savings',
    title: 'Reduce Costs',
    description: 'Cut operational costs by 40% through intelligent automation and optimized workflows.',
    metric: '40% savings',
    icon: DollarSign,
    color: 'text-green-600'
  },
  {
    id: 'satisfaction',
    title: 'Improve Satisfaction',
    description: 'Deliver exceptional customer experiences with instant responses and personalized service.',
    metric: '95% satisfaction',
    icon: Users,
    color: 'text-purple-600'
  },
  {
    id: 'revenue',
    title: 'Recover Revenue',
    description: 'Maximize value recovery through intelligent disposition and fraud prevention.',
    metric: '+25% recovery',
    icon: TrendingUp,
    color: 'text-orange-600'
  }
]

export function BenefitsSection() {
  return (
    <section id="benefits" className="py-20 bg-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left column - Content */}
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Transform Your Business with{' '}
              <span className="gradient-text">Measurable Results</span>
            </h2>
            <p className="text-xl text-gray-900 dark:text-gray-100 mb-8">
              Join hundreds of e-commerce businesses that have revolutionized their return management and seen immediate impact on their bottom line.
            </p>

            {/* Benefits grid */}
            <div className="grid sm:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon
                return (
                  <Card 
                    key={benefit.id} 
                    className="border-0 shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className={`w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0`}>
                          <IconComponent className={`w-5 h-5 ${benefit.color}`} />
                        </div>
                        <div>
                          <div className={`text-2xl font-bold ${benefit.color} mb-1`}>
                            {benefit.metric}
                          </div>
                          <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            {benefit.title}
                          </h3>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            {benefit.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Right column - Visual */}
          <div className="relative">
            {/* Spinning Bolt Badge */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="animate-spin-slow">
                <Image
                  src="/bolt_badge.png"
                  alt="Bolt Badge"
                  width={120}
                  height={120}
                  className="w-30 h-30"
                />
              </div>
            </div>

            {/* Background circles */}
            <div className="relative w-full h-96">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full" />
              <div className="absolute inset-4 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-full" />
              <div className="absolute inset-8 bg-white rounded-full shadow-lg" />
              
              {/* Floating metrics */}
              <div className="absolute top-8 left-8 bg-white rounded-lg shadow-lg p-3 animate-float">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Real-time Processing</span>
                </div>
              </div>
              
              <div className="absolute top-8 right-8 bg-white rounded-lg shadow-lg p-3 animate-float" style={{ animationDelay: '1s' }}>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Fraud Protected</span>
                </div>
              </div>
              
              <div className="absolute bottom-8 left-8 bg-white rounded-lg shadow-lg p-3 animate-float" style={{ animationDelay: '2s' }}>
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Revenue Recovery</span>
                </div>
              </div>
              
              <div className="absolute bottom-8 right-8 bg-white rounded-lg shadow-lg p-3 animate-float" style={{ animationDelay: '3s' }}>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Happy Customers</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}