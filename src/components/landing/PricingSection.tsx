'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star, Zap, Sparkles, Crown, Rocket } from 'lucide-react'
import Link from 'next/link'

const pricingTiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: 'month',
    description: 'Perfect for small businesses getting started with AI-powered returns',
    icon: Zap,
    features: [
      'Up to 500 returns/month',
      'Smart Return Triage',
      'Basic analytics dashboard',
      'Email support',
      'Standard integrations',
      'Dynamic Policy Engine',
      'End-to-End Automation'
    ],
    cta: 'Start Free Trial',
    popular: false,
    savings: null
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    period: 'month',
    description: 'Advanced features for growing businesses with higher return volumes',
    icon: Sparkles,
    features: [
      'Up to 2,500 returns/month',
      'Everything in Starter',
      'Visual Product Assessment',
      'Voice Customer Support',
      'Video Customer Support',
      'Advanced analytics',
      'Priority support',
      'A/B testing',
      'Fraud detection'
    ],
    cta: 'Start Free Trial',
    popular: true,
    savings: 'Save 20%'
  },
  {
    id: 'business',
    name: 'Business',
    price: 599,
    period: 'month',
    description: 'Complete AI suite for established businesses with complex return needs',
    icon: Crown,
    features: [
      'Up to 10,000 returns/month',
      'Everything in Professional',
      'Intelligent AI Agents',
      'Advanced Vision & Audio AI',
      'Predictive Analytics',
      'Custom integrations',
      'Dedicated support',
      'White-label options',
      'SLA guarantees'
    ],
    cta: 'Start Free Trial',
    popular: false,
    savings: 'Save 30%'
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: 'month',
    description: 'Full platform with future features for large enterprises',
    icon: Rocket,
    features: [
      'Unlimited returns',
      'Everything in Business',
      'Omnichannel Integration',
      'Custom AI model training',
      'Advanced security & compliance',
      'Custom development',
      '24/7 dedicated support',
      'On-premise deployment',
      'Custom SLA guarantees'
    ],
    cta: 'Contact Sales',
    popular: false,
    savings: 'Save 40%'
  }
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Star className="w-4 h-4 mr-2" />
            Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            Revolutionary Return Automation at{' '}
            <span className="gradient-text">Fraction of the Cost</span>
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Starting at just $99/month vs $40K-60K/year for agents. Scale from basic AI triage to full enterprise automation with up to 3,200% ROI.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => {
            const IconComponent = tier.icon
            return (
              <Card 
                key={tier.id} 
                className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in bg-white dark:bg-gray-800 ${
                  tier.popular 
                    ? 'ring-2 ring-primary scale-105 lg:scale-110' 
                    : 'hover:-translate-y-2'
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-primary to-secondary text-gray-900 dark:text-gray-100 px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                {tier.savings && (
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-success text-white px-3 py-1 rounded-full text-xs font-medium">
                      {tier.savings}
                    </div>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    {tier.name}
                  </CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400 mt-2 text-sm">
                    {tier.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                      ${tier.price}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400 ml-1">/{tier.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="pb-6">
                  <ul className="space-y-3">
                    {tier.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start">
                        <Check className="w-4 h-4 text-success mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link href={tier.id === 'enterprise' ? '/contact' : '/auth/signup'} className="w-full">
                    <Button 
                      className={`w-full ${
                        tier.popular 
                          ? 'bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-gray-900 dark:text-gray-100' 
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                      }`}
                      size="lg"
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <Check className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">14-day free trial • No setup fees • Cancel anytime</span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
            Need a custom plan? <Link href="/contact" className="text-primary hover:underline font-medium">Contact our sales team</Link>
          </p>
        </div>
      </div>
    </section>
  )
}