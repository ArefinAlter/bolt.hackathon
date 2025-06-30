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
  TrendingUp,
  Eye,
  MessageSquare,
  Smartphone,
  Globe,
  Target,
  Sparkles
} from 'lucide-react'
import Image from 'next/image'

const currentFeatures = [
  {
    id: 'ai-triage',
    title: 'Smart Return Triage',
    description: 'AI instantly evaluates return requests against your policies for lightning-fast decisions.',
    icon: Brain,
    benefits: [
      'Instant approval/rejection',
      'Policy compliance checks',
      'Fraud detection',
      'Risk assessment'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'vision-triage',
    title: 'Visual Product Assessment',
    description: 'AI vision models analyze product images to instantly determine return eligibility and condition.',
    icon: Eye,
    benefits: [
      'Instant visual analysis',
      'Condition assessment',
      'Policy compliance',
      'Fraud prevention'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'ai-agents',
    title: 'Intelligent AI Agents',
    description: 'Specialized AI agents handle complex arbitration and escalation cases with human-like reasoning.',
    icon: Target,
    benefits: [
      'Complex case resolution',
      'Intelligent escalation',
      'Consistent decisions',
      '24/7 availability'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'voice-service',
    title: 'Voice Customer Support',
    description: 'Natural voice conversations powered by ElevenLabs for seamless customer experiences.',
    icon: Mic,
    benefits: [
      'Human-like conversations',
      'Real-time responses',
      'Multi-language support',
      '24/7 availability'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'video-service',
    title: 'Video Customer Support',
    description: 'Face-to-face video interactions with AI avatars using Tavus for personalized support.',
    icon: Video,
    benefits: [
      'Personal connection',
      'Visual problem solving',
      'Brand consistency',
      'Enhanced trust'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'analytics',
    title: 'Business Intelligence',
    description: 'Comprehensive analytics dashboard for return patterns, costs, and optimization opportunities.',
    icon: BarChart3,
    benefits: [
      'Real-time metrics',
      'Trend analysis',
      'Cost optimization',
      'Performance tracking'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'policy-management',
    title: 'Dynamic Policy Engine',
    description: 'Create, test, and optimize return policies with A/B testing and version control.',
    icon: Settings,
    benefits: [
      'Version control',
      'A/B testing',
      'Rule automation',
      'Compliance tracking'
    ],
    visual: '/landing_hero.svg'
  },
  {
    id: 'automation',
    title: 'End-to-End Automation',
    description: 'Complete workflow automation from return initiation to resolution with intelligent routing.',
    icon: Zap,
    benefits: [
      'Process automation',
      'Smart routing',
      'Status tracking',
      'Integration ready'
    ],
    visual: '/landing_hero.svg'
  }
]

const futureFeatures = [
  {
    id: 'vision-audio',
    title: 'Advanced Vision & Audio AI',
    description: 'State-of-the-art transcription models for intelligent return request analysis during calls.',
    icon: Eye,
    status: 'Coming Soon',
    benefits: [
      'Real-time call analysis',
      'Visual return assessment',
      'Audio transcription',
      'Smart decision making'
    ]
  },
  {
    id: 'ml-analytics',
    title: 'Predictive Analytics',
    description: 'In-house machine learning models analyze your return history to optimize policies and boost retention.',
    icon: TrendingUp,
    status: 'In Development',
    benefits: [
      'Return pattern prediction',
      'Policy optimization',
      'Customer retention insights',
      'Revenue forecasting'
    ]
  },
  {
    id: 'omnichannel',
    title: 'Omnichannel Integration',
    description: 'Seamless integration across all customer touchpoints for consistent return experiences.',
    icon: Globe,
    status: 'Q2 2024',
    benefits: [
      'Unified customer experience',
      'Cross-platform consistency',
      'Centralized management',
      'Real-time synchronization'
    ]
  }
]

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 bg-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Powerful Features
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
            Everything You Need to{' '}
            <span className="gradient-text">Transform Returns</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            From AI-powered triage to predictive analytics, our comprehensive platform handles every aspect of return management.
          </p>
        </div>

        {/* Current Features */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Available Now
            </h3>
            <p className="text-gray-600">
              Core features that are ready to revolutionize your return process
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card 
                  key={feature.id} 
                  className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 animate-fade-in bg-white"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <IconComponent className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-primary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                          <div className="w-2 h-2 bg-gradient-to-r from-primary to-secondary rounded-full mr-3 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Future Features */}
        <div className="mb-16">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Coming Soon
            </h3>
            <p className="text-gray-600">
              Cutting-edge features in development to keep you ahead of the competition
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {futureFeatures.map((feature, index) => {
              const IconComponent = feature.icon
              return (
                <Card 
                  key={feature.id} 
                  className="group hover:shadow-xl transition-all duration-300 border-2 border-dashed border-gray-200 shadow-lg hover:-translate-y-2 animate-fade-in bg-gradient-to-br from-gray-50 to-gray-100"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <IconComponent className="w-7 h-7 text-secondary" />
                      </div>
                      <div className="px-3 py-1 bg-secondary/10 text-secondary text-xs font-medium rounded-full">
                        {feature.status}
                      </div>
                    </div>
                    <CardTitle className="text-xl font-bold text-gray-900 group-hover:text-secondary transition-colors">
                      {feature.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-3">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-gray-700">
                          <div className="w-2 h-2 bg-gradient-to-r from-secondary to-primary rounded-full mr-3 flex-shrink-0" />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center px-8 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <Shield className="w-6 h-6 text-primary mr-3" />
            <div className="text-left">
              <div className="text-sm font-semibold text-gray-900">Enterprise-grade security</div>
              <div className="text-xs text-gray-600">SOC 2 compliant • GDPR ready • 99.9% uptime</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}