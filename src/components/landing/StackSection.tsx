'use client'

import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Zap, Shield, Code, Database, Cloud, Cpu, Globe, Lock } from 'lucide-react'

const frontendStack = [
  {
    name: 'React & Next.js',
    description: 'Modern frontend framework with server-side rendering',
    icon: Code
  },
  {
    name: 'TypeScript',
    description: 'Type-safe JavaScript for better development',
    icon: Code
  },
  {
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework for rapid UI development',
    icon: Code
  },
  {
    name: 'Responsive Design',
    description: 'Mobile-first approach for all devices',
    icon: Globe
  }
]

const backendStack = [
  {
    name: 'Supabase',
    description: 'Open source Firebase alternative with PostgreSQL',
    icon: Database
  },
  {
    name: 'Edge Functions',
    description: 'Serverless functions for real-time processing',
    icon: Cloud
  },
  {
    name: 'AI Integration',
    description: 'OpenAI, ElevenLabs, and custom ML models',
    icon: Cpu
  },
  {
    name: 'Security',
    description: 'SOC 2 compliant with enterprise-grade security',
    icon: Lock
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
            Built for Scale
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Enterprise-Grade{' '}
            <span className="gradient-text">Technology Stack</span>
          </h2>
          <p className="text-xl text-gray-900 max-w-3xl mx-auto">
            Built on modern, scalable technologies that power the world's most demanding applications
          </p>
        </div>

        {/* Frontend Stack */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Frontend & User Experience
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {frontendStack.map((tech, index) => (
              <Card 
                key={tech.name} 
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <tech.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {tech.name}
                  </h4>
                  <p className="text-sm text-gray-900">
                    {tech.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Backend Stack */}
        <div className="mb-16">
          <h3 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Backend & Infrastructure
          </h3>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {backendStack.map((tech, index) => (
              <Card 
                key={tech.name} 
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:-translate-y-2 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="p-6 text-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <tech.icon className="w-6 h-6 text-secondary" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {tech.name}
                  </h4>
                  <p className="text-sm text-gray-900">
                    {tech.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
            <Shield className="w-5 h-5 text-primary mr-2" />
            <span className="text-sm font-medium text-gray-900">Enterprise-grade security & compliance</span>
          </div>
        </div>
      </div>
    </section>
  )
}