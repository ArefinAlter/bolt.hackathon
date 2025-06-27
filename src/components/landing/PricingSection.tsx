'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Check, Star } from 'lucide-react'
import Link from 'next/link'

const pricingTiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 99,
    period: 'month',
    description: 'Perfect for small businesses getting started with AI-powered returns',
    features: [
      'Up to 500 returns/month',
      'AI-powered triage',
      'Basic analytics dashboard',
      'Email support',
      'Standard integrations',
      'Policy management'
    ],
    cta: 'Start Free Trial',
    popular: false
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 299,
    period: 'month',
    description: 'Advanced features for growing businesses with higher return volumes',
    features: [
      'Up to 2,500 returns/month',
      'AI triage + voice service',
      'Advanced analytics',
      'Priority support',
      'All integrations',
      'A/B testing',
      'Custom policies',
      'Fraud detection'
    ],
    cta: 'Start Free Trial',
    popular: true
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    period: 'month',
    description: 'Complete solution for large enterprises with custom requirements',
    features: [
      'Unlimited returns',
      'Full AI suite (voice + video)',
      'Custom analytics',
      'Dedicated support',
      'Custom integrations',
      'White-label options',
      'SLA guarantees',
      'Advanced security',
      'Custom training'
    ],
    cta: 'Contact Sales',
    popular: false
  }
]

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
            Simple, Transparent{' '}
            <span className="gradient-text">Pricing</span>
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Choose the plan that fits your business size and needs. All plans include a 14-day free trial.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <Card 
              key={tier.id} 
              className={`relative border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in ${
                tier.popular 
                  ? 'ring-2 ring-primary scale-105 lg:scale-110' 
                  : 'hover:-translate-y-1'
              }`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {tier.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-primary text-black px-4 py-1 rounded-full text-sm font-medium flex items-center">
                    <Star className="w-4 h-4 mr-1" />
                    Most Popular
                  </div>
                </div>
              )}
              
              <CardHeader className="text-center pb-8">
                <CardTitle className="text-2xl font-bold text-black">
                  {tier.name}
                </CardTitle>
                <CardDescription className="text-black mt-2">
                  {tier.description}
                </CardDescription>
                <div className="mt-6">
                  <span className="text-4xl font-bold text-black">
                    ${tier.price}
                  </span>
                  <span className="text-black ml-1">/{tier.period}</span>
                </div>
              </CardHeader>

              <CardContent className="pb-8">
                <ul className="space-y-4">
                  {tier.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start">
                      <Check className="w-5 h-5 text-success mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-black">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Link href="/auth/signup" className="w-full">
                  <Button 
                    className={`w-full ${
                      tier.popular 
                        ? 'bg-primary hover:bg-primary/90 text-black' 
                        : 'bg-gray-900 hover:bg-gray-800 text-white'
                    }`}
                    size="lg"
                  >
                    {tier.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Bottom note */}
        <div className="text-center mt-12">
          <p className="text-black">
            All plans include 14-day free trial • No setup fees • Cancel anytime
          </p>
          <p className="text-sm text-black mt-2">
            Need a custom plan? <Link href="/contact" className="text-primary hover:underline">Contact our sales team</Link>
          </p>
        </div>
      </div>
    </section>
  )
}