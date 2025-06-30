import { HeroSection } from '@/components/landing/HeroSection'
import { TestimonialSlider } from '@/components/landing/TestimonialSlider'
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
      <TestimonialSlider />
      <FeaturesSection />
      <BenefitsSection />
      <StackSection />
      <PricingSection />
      <Footer />
    </main>
  )
}