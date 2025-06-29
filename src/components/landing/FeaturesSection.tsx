'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Brain, 
  Mic, 
  Video, 
  BarChart3, 
  Settings, 
  Zap,
  Shield,
  Clock,
  TrendingUp
} from 'lucide-react'

const features = [
  {
    id: 'ai-triage',
    title: 'AI-Powered Return Triage',
    description: 'Intelligent automation that evaluates return requests against your policies and makes instant decisions.',
    icon: Brain,
    benefits: [
      'Instant decision making',
      'Policy compliance',
      'Fraud detection',
      'Risk assessment'
    ]
  },
  {
    id: 'voice-service',
    title: 'Voice Customer Service',
    description: 'Natural voice interactions powered by ElevenLabs for seamless customer support experiences.',
    icon: Mic,
    benefits: [
      'Natural conversations',
      'Real-time responses',
      'Multi-language support',
      '24/7 availability'
    ]
  },
  {
    id: 'video-service',
    title: 'Video Customer Service',
    description: 'Face-to-face video support with AI avatars using Tavus for personalized customer interactions.',
    icon: Video,
    benefits: [
      'Personal connection',
      'Visual problem solving',
      'Brand consistency',
      'Enhanced trust'
    ]
  },
  {
    id: 'analytics',
    title: 'Business Analytics Dashboard',
    description: 'Comprehensive insights into return patterns, costs, and opportunities for optimization.',
    icon: BarChart3,
    benefits: [
      'Real-time metrics',
      'Trend analysis',
      'Cost optimization',
      'Performance tracking'
    ]
  },
  {
    id: 'policy-management',
    title: 'Policy Management Tools',
    description: 'Dynamic policy creation and management with version control and A/B testing capabilities.',
    icon: Settings,
    benefits: [
      'Version control',
      'A/B testing',
      'Rule automation',
      'Compliance tracking'
    ]
  },
  {
    id: 'automation',
    title: 'Workflow Automation',
    description: 'End-to-end automation from return initiation to resolution with intelligent routing.',
    icon: Zap,
    benefits: [
      'Process automation',
      'Smart routing',
      'Status tracking',
      'Integration ready'
    ]
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Powerful Features for Modern E-commerce
          </h2>
          <p className="text-xl text-gray-900 dark:text-gray-100 max-w-3xl mx-auto">
            Everything you need to streamline returns, enhance customer experience, and boost your bottom line.
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon
            return (
              <Card 
                key={feature.id} 
                className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardHeader className="pb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription className="text-gray-900 dark:text-gray-100">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <ul className="space-y-2">
                    {feature.benefits.map((benefit, benefitIndex) => (
                      <li key={benefitIndex} className="flex items-center text-sm text-gray-900 dark:text-gray-100">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full mr-3 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white shadow-md">
            <Shield className="w-5 h-5 text-success mr-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Enterprise-grade security and compliance</span>
          </div>
        </div>
      </div>
    </section>
  )
}