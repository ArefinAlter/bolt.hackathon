'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Clock, DollarSign, Users, Shield, TrendingUp, AlertTriangle, Target, Zap, BarChart3, ShoppingCart } from 'lucide-react'
import Image from 'next/image'

const problemStats = [
  {
    id: 'time-cost',
    title: '15-20 Minutes',
    subtitle: 'Per Manual Return',
    description: 'Customer service, warehouse handling, and processing time',
    icon: Clock,
    color: 'text-red-600',
    bgColor: 'bg-red-50'
  },
  {
    id: 'cost-per-return',
    title: '$15-25',
    subtitle: 'Cost Per Return',
    description: 'Including shipping, processing, and restocking fees',
    icon: DollarSign,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'revenue-impact',
    title: '20-65%',
    subtitle: 'Of Item Value',
    description: 'Return costs can equal a significant portion of revenue',
    icon: AlertTriangle,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50'
  },
  {
    id: 'customer-loss',
    title: '76%',
    subtitle: 'Stop Buying',
    description: 'After a single bad return experience',
    icon: Users,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50'
  }
]

const solutionStats = [
  {
    id: 'automation',
    title: '85%',
    subtitle: 'Automated Decisions',
    description: 'Reduce processing time from hours to seconds',
    icon: Zap,
    color: 'text-green-600',
    bgColor: 'bg-green-50'
  },
  {
    id: 'cost-reduction',
    title: '40%',
    subtitle: 'Cost Reduction',
    description: 'Through intelligent automation and optimized workflows',
    icon: TrendingUp,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'satisfaction',
    title: '95%',
    subtitle: 'Customer Satisfaction',
    description: 'With instant responses and personalized service',
    icon: Target,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'revenue-recovery',
    title: '+25%',
    subtitle: 'Value Recovery',
    description: 'Through intelligent disposition and fraud prevention',
    icon: BarChart3,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50'
  }
]

const marketData = [
  {
    metric: '$70B',
    label: 'Total Market Size',
    description: 'Return management costs for SMBs'
  },
  {
    metric: '$2.7B',
    label: 'Serviceable Market',
    description: 'English-speaking SMBs on major platforms'
  },
  {
    metric: '15M',
    label: 'Global SMBs',
    description: 'Selling online worldwide'
  },
  {
    metric: '25-40%',
    label: 'E-commerce Returns',
    description: 'Average return rates'
  }
]

export function BenefitsSection() {
  return (
    <>
      {/* Problem Section */}
      <section id="benefits" className="py-20 bg-gray-50 relative overflow-hidden">
        <div className="absolute top-1/4 right-0 w-64 h-64 bg-red-100 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-0 w-48 h-48 bg-orange-100 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              The Hidden Cost of{' '}
              <span className="text-red-600">Manual Returns</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Small businesses lose thousands annually on inefficient return processes. 
              Every manual return costs time, money, and customer relationships.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {problemStats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card 
                  key={stat.id} 
                  className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                      {stat.title}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      {stat.subtitle}
                    </div>
                    <p className="text-xs text-gray-600">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* ROI Calculator */}
          <div className="bg-white rounded-2xl p-8 shadow-lg mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Massive ROI Potential
              </h3>
              <p className="text-gray-600">
                See how much you could save with Dokani's automation
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">$58,800</div>
                <div className="text-sm text-gray-600">Annual savings for 1,000 returns/month</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">230% - 3,200%</div>
                <div className="text-sm text-gray-600">ROI in the first year</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-secondary mb-2">$100 - $1,000</div>
                <div className="text-sm text-gray-600">Monthly cost vs $40K-60K/year for agents</div>
              </div>
            </div>
          </div>

          {/* Customer Impact */}
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Customer Experience Crisis
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">66% check return policies before purchasing</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">52-78% abandon purchases due to poor return policies</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">59% leave after multiple bad experiences</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-gray-700">60%+ value return experience over product price</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-6xl font-bold text-red-600 mb-2">$9B+</div>
                <div className="text-lg text-gray-600">Annual retail losses from return fraud</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute top-1/4 left-0 w-64 h-64 bg-green-100 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-blue-100 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
              Amazon-Level{' '}
              <span className="gradient-text">Return Automation</span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Transform your return process with intelligent automation that reduces costs, 
              improves customer satisfaction, and recovers more value.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {solutionStats.map((stat, index) => {
              const IconComponent = stat.icon
              return (
                <Card 
                  key={stat.id} 
                  className="border-0 shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className={`text-2xl font-bold ${stat.color} mb-1`}>
                      {stat.title}
                    </div>
                    <div className="text-sm font-semibold text-gray-900 mb-2">
                      {stat.subtitle}
                    </div>
                    <p className="text-xs text-gray-600">
                      {stat.description}
                    </p>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* Customer Retention Benefits */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 mb-8">
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Turn Returns Into Repeat Sales
              </h3>
              <p className="text-gray-600">
                Transform a pain point into a positive, trust-building experience
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-success mb-2">60% - 80%</div>
                <div className="text-sm text-gray-600">Faster resolution times</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">70%</div>
                <div className="text-sm text-gray-600">Shoppers prioritize hassle-free returns</div>
              </div>
            </div>
          </div>

          {/* Market Opportunity */}
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Massive Market Opportunity
              </h3>
              <p className="text-gray-600">
                Join the revolution in return management technology
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {marketData.map((data, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary mb-1">{data.metric}</div>
                  <div className="text-sm font-semibold text-gray-900 mb-1">{data.label}</div>
                  <div className="text-xs text-gray-600">{data.description}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  )
}