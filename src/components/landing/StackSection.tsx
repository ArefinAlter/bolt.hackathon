'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Shield } from 'lucide-react'

const platformLogos = [
  {
    name: 'Shopify',
    logo: '/shopify.svg',
    alt: 'Shopify Integration'
  },
  {
    name: 'WooCommerce',
    logo: '/woocommerce.png',
    alt: 'WooCommerce Integration'
  },
  {
    name: 'WhatsApp',
    logo: '/Whatsapp.svg',
    alt: 'WhatsApp Business Integration'
  },
  {
    name: 'Telegram',
    logo: '/telegram.svg',
    alt: 'Telegram Integration'
  },
  {
    name: 'Messenger',
    logo: '/messenger.svg',
    alt: 'Facebook Messenger Integration'
  }
]

export function StackSection() {
  return (
    <section id="stack" className="py-20 bg-gray-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Zap className="w-4 h-4 mr-2" />
            Platform Integrations
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Seamless{' '}
            <span className="gradient-text">Ecommerce & Messaging</span>
          </h2>
          <p className="text-xl text-gray-900 max-w-3xl mx-auto">
            Integrates with your existing platforms to provide AI-powered customer service and return management
          </p>
        </div>

        {/* Platform Logos Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 mb-16">
          {platformLogos.map((platform, index) => (
            <Card 
              key={platform.name} 
              className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 animate-fade-in bg-white"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Image
                    src={platform.logo}
                    alt={platform.alt}
                    width={64}
                    height={64}
                    className="max-w-full max-h-full object-contain group-hover:scale-110 transition-transform"
                  />
                </div>
                <h4 className="font-semibold text-gray-900">
                  {platform.name}
                </h4>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <Shield className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-gray-900">Enterprise-grade integrations & security</span>
          </div>
        </div>
      </div>
    </section>
  )
}