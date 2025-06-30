'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    quote: "65% of customers would shop less with a merchant after having a poor return experience",
    source: "Forbes"
  },
  {
    id: 2,
    quote: "Supply chain digitization in emerging economies is slashing 70% port delays",
    source: "World Bank"
  },
  {
    id: 3,
    quote: "The average return rate for ecommerce was 16.9% in 2024",
    source: "National Retail Federation (NRF) and Happy Returns"
  }
]

export function TestimonialSlider() {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Auto-advance slider
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
    }, 5000) // Change every 5 seconds

    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    )
  }

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/4 left-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-secondary/5 rounded-full blur-3xl" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Industry Insights &{' '}
            <span className="gradient-text">Market Data</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Trusted research and statistics that validate the need for intelligent return automation
          </p>
        </div>

        {/* Testimonial slider */}
        <div className="relative">
          {/* Main testimonial card */}
          <Card className="border-0 shadow-xl bg-white dark:bg-gray-800 relative overflow-hidden">
            <CardContent className="p-12">
              <div className="flex flex-col items-center text-center">
                {/* Quote icon */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full flex items-center justify-center mb-8">
                  <Quote className="w-8 h-8 text-primary" />
                </div>

                {/* Quote text */}
                <blockquote className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-gray-100 mb-8 leading-relaxed max-w-4xl">
                  "{testimonials[currentIndex].quote}"
                </blockquote>

                {/* Source */}
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {testimonials[currentIndex].source}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Industry Research
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Navigation buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 w-12 h-12 bg-white dark:bg-gray-800 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-300 group"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400 group-hover:text-primary transition-colors" />
          </button>

          {/* Dots indicator */}
          <div className="flex justify-center mt-8 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-primary w-8' 
                    : 'bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary mb-2">65%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Customers affected by poor returns</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success mb-2">70%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Port delays reduced by digitization</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-secondary mb-2">16.9%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Average ecommerce return rate</div>
          </div>
        </div>
      </div>
    </section>
  )
} 