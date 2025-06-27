export interface Feature {
  id: string
  title: string
  description: string
  icon: string
  benefits: string[]
}

export interface PricingTier {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: string[]
  popular?: boolean
  cta: string
}

export interface StackIntegration {
  id: string
  name: string
  logo: string
  description: string
  category: 'ecommerce' | 'messaging' | 'analytics'
}

export interface Benefit {
  id: string
  title: string
  description: string
  metric?: string
  icon: string
}