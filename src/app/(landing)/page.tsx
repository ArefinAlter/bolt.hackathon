import { HeroSection } from '@/components/landing/HeroSection'
import { FeaturesSection } from '@/components/landing/FeaturesSection'
import { BenefitsSection } from '@/components/landing/BenefitsSection'
import { StackSection } from '@/components/landing/StackSection'
import { PricingSection } from '@/components/landing/PricingSection'
import { Footer } from '@/components/landing/Footer'
import { Header } from '@/components/landing/Header'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <BenefitsSection />
      <StackSection />
      <PricingSection />
      <Footer />
    </main>
  )
}