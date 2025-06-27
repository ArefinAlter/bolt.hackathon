'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'

const integrations = [
  {
    id: 'shopify',
    name: 'Shopify',
    logo: '/shopify.svg',
    description: 'Seamless integration with Shopify stores',
    category: 'ecommerce'
  },
  {
    id: 'woocommerce',
    name: 'WooCommerce',
    logo: '/woocommerce.png',
    description: 'Native WordPress e-commerce support',
    category: 'ecommerce'
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    logo: '/Whatsapp.svg',
    description: 'Direct customer communication',
    category: 'messaging'
  },
  {
    id: 'instagram',
    name: 'Instagram',
    logo: '/instagram.svg',
    description: 'Social commerce integration',
    category: 'messaging'
  },
  {
    id: 'messenger',
    name: 'Messenger',
    logo: '/messenger.svg',
    description: 'Facebook Messenger support',
    category: 'messaging'
  },
  {
    id: 'telegram',
    name: 'Telegram',
    logo: '/telegram.svg',
    description: 'Secure messaging platform',
    category: 'messaging'
  }
]

export function StackSection() {
  return (
    <section id="stack" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-black mb-4">
            Built with Modern Technology
          </h2>
          <p className="text-xl text-black max-w-3xl mx-auto">
            Our platform leverages cutting-edge technologies to deliver exceptional performance and reliability
          </p>
        </div>

        {/* E-commerce Platforms */}
        <div className="mb-12">
          <h3 className="text-xl font-semibold text-black mb-6 text-center">
            E-commerce Platforms
          </h3>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {integrations
              .filter(integration => integration.category === 'ecommerce')
              .map((integration, index) => (
                <Card 
                  key={integration.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`mx-auto mb-4 flex items-center justify-center ${integration.id === 'shopify' || integration.id === 'woocommerce' ? 'w-24 h-24' : 'w-16 h-16'}`}>
                      <Image
                        src={integration.logo}
                        alt={integration.name}
                        width={integration.id === 'shopify' || integration.id === 'woocommerce' ? 96 : 64}
                        height={integration.id === 'shopify' || integration.id === 'woocommerce' ? 96 : 64}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <h4 className="font-semibold text-black mb-2">
                      {integration.name}
                    </h4>
                    <p className="text-sm text-black">
                      {integration.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Messaging Platforms */}
        <div>
          <h3 className="text-xl font-semibold text-black mb-6 text-center">
            Messaging & Communication
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {integrations
              .filter(integration => integration.category === 'messaging')
              .map((integration, index) => (
                <Card 
                  key={integration.id} 
                  className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:-translate-y-1 animate-fade-in"
                  style={{ animationDelay: `${(index + 2) * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 mx-auto mb-4 flex items-center justify-center">
                      <Image
                        src={integration.logo}
                        alt={integration.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <h4 className="font-semibold text-black mb-2">
                      {integration.name}
                    </h4>
                    <p className="text-sm text-black">
                      {integration.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-white shadow-md">
            <span className="text-sm font-medium text-black">
              Don't see your platform? We support 50+ integrations and custom APIs
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}