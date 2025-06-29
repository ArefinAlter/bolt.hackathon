'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Bot, MessageSquare, FileText, Settings, Play, Square, RotateCcw, CheckCircle, XCircle, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Loader2, Zap, AlertTriangle, BarChart3 } from 'lucide-react'

interface TestResult {
  function: string
  success: boolean
  response: any
  error?: string
  timestamp: string
  duration: number
}

export default function TestAllAIPage() {
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [selectedFunction, setSelectedFunction] = useState('all')
  const [customInput, setCustomInput] = useState('I need help with a return for my recent order')
  const [logs, setLogs] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>({})
  const [errors, setErrors] = useState<any>({})
  const { toast } = useToast()

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const addTestResult = (result: TestResult) => {
    setTestResults(prev => [result, ...prev])
  }

  const testFunction = async (functionName: string, input: any): Promise<TestResult> => {
    const startTime = Date.now()
    addLog(`Testing ${functionName}...`)

    try {
      let response: Response
      let endpoint: string
      let body: any

      switch (functionName) {
        case 'customer-service-agent':
          endpoint = '/api/test-ai'
          body = {
            agent_type: 'customer-service',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'triage-agent':
          endpoint = '/api/test-ai'
          body = {
            agent_type: 'triage',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'layered-decision-engine':
          endpoint = '/api/test-ai'
          body = {
            agent_type: 'layered-decision',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'request-mcp-server':
          endpoint = '/api/test-ai'
          body = {
            agent_type: 'request-mcp',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'policy-mcp-server':
          endpoint = '/api/test-ai'
          body = {
            agent_type: 'policy-mcp',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'conversation-mcp-server':
          endpoint = '/api/test-ai'
          body = {
            agent_type: 'conversation-mcp',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'send-chat-message':
          endpoint = '/api/send-chat-message'
          body = {
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'initiate-call':
          endpoint = '/api/initiate-call'
          body = {
            call_type: 'voice',
            provider: 'elevenlabs',
            streaming_enabled: true,
            demo_mode: isDemoMode
          }
          break

        case 'initiate-video-conversation':
          endpoint = '/api/initiate-video-conversation'
          body = {
            call_type: 'video',
            provider: 'tavus',
            streaming_enabled: true,
            demo_mode: isDemoMode
          }
          break

        case 'call-ai-processor':
          endpoint = '/api/call-ai-processor'
          body = {
            call_session_id: 'demo-session-123',
            message: input,
            speaker: 'user',
            demo_mode: isDemoMode
          }
          break

        case 'stream-ai-response':
          endpoint = '/api/stream-ai-response'
          body = {
            call_session_id: 'demo-session-123',
            message: input,
            demo_mode: isDemoMode
          }
          break

        case 'get-user-preferences':
          endpoint = '/api/get-user-preferences'
          body = {
            demo_mode: isDemoMode
          }
          break

        case 'get-analytics':
          endpoint = '/api/get-analytics'
          body = {
            business_id: 'demo-business-123',
            metric_type: 'all',
            demo_mode: isDemoMode
          }
          break

        default:
          throw new Error(`Unknown function: ${functionName}`)
      }

      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()
      const duration = Date.now() - startTime

      const testResult: TestResult = {
        function: functionName,
        success: result.success || response.ok,
        response: result,
        timestamp: new Date().toISOString(),
        duration
      }

      addLog(`${functionName} test completed in ${duration}ms`)
      return testResult

    } catch (error) {
      const duration = Date.now() - startTime
      addLog(`${functionName} test failed: ${error.message}`)
      
      return {
        function: functionName,
        success: false,
        response: null,
        error: error.message,
        timestamp: new Date().toISOString(),
        duration
      }
    }
  }

  const runSingleTest = async () => {
    if (!customInput.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a test message.',
        variant: 'destructive',
      })
      return
    }

    setIsRunning(true)
    const result = await testFunction(selectedFunction, customInput)
    addTestResult(result)
    setIsRunning(false)

    if (result.success) {
      toast({
        title: 'Test Completed',
        description: `${selectedFunction} test completed successfully.`,
      })
    } else {
      toast({
        title: 'Test Failed',
        description: result.error || 'Test failed',
        variant: 'destructive',
      })
    }
  }

  const runAllTests = async () => {
    setIsRunning(true)
    setIsLoading(true)
    setErrors({})
    setResults({})
    addLog('Starting comprehensive AI function tests...')

    const functions = [
      'customer-service-agent',
      'triage-agent',
      'layered-decision-engine',
      'request-mcp-server',
      'policy-mcp-server',
      'conversation-mcp-server',
      'send-chat-message',
      'initiate-call',
      'initiate-video-conversation',
      'call-ai-processor',
      'stream-ai-response',
      'get-user-preferences',
      'get-analytics'
    ]

    const results: TestResult[] = []

    for (const func of functions) {
      const result = await testFunction(func, customInput)
      results.push(result)
      addTestResult(result)
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    setIsRunning(false)
    setIsLoading(false)
    
    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    
    addLog(`All tests completed. ${successCount}/${totalCount} successful.`)
    
    toast({
      title: 'All Tests Completed',
      description: `${successCount}/${totalCount} tests passed successfully.`,
    })
  }

  const clearResults = () => {
    setTestResults([])
    setLogs([])
    setResults({})
    setErrors({})
    addLog('Test results cleared')
  }

  const getFunctionDescription = (functionName: string): string => {
    const descriptions: Record<string, string> = {
      'customer-service-agent': 'AI agent for customer service interactions',
      'triage-agent': 'AI agent for initial request classification',
      'layered-decision-engine': 'Multi-layered AI decision making system',
      'request-mcp-server': 'MCP server for return request processing',
      'policy-mcp-server': 'MCP server for policy management',
      'conversation-mcp-server': 'MCP server for conversation handling',
      'send-chat-message': 'Chat message processing with AI',
      'initiate-call': 'Voice call initiation',
      'initiate-video-conversation': 'Video call initiation',
      'call-ai-processor': 'Real-time call AI processing',
      'stream-ai-response': 'Streaming AI response generation',
      'get-user-preferences': 'User preferences retrieval',
      'get-analytics': 'Analytics data retrieval',
      'all': 'All AI functions'
    }
    return descriptions[functionName] || 'Unknown function'
  }

  const aiFunctions = [
    {
      id: 'customer-service-agent',
      name: 'Customer Service Agent',
      description: 'Main AI agent for handling customer inquiries and return requests',
      icon: Bot,
      endpoint: '/api/test-ai',
      category: 'Core AI'
    },
    {
      id: 'triage-agent',
      name: 'Triage Agent',
      description: 'Routes and categorizes incoming requests',
      icon: Shield,
      endpoint: '/api/test-ai',
      category: 'Core AI'
    },
    {
      id: 'layered-decision-engine',
      name: 'Layered Decision Engine',
      description: 'Makes complex decisions using multiple AI layers',
      icon: Brain,
      endpoint: '/api/test-ai',
      category: 'Core AI'
    },
    {
      id: 'request-mcp-server',
      name: 'Request MCP Server',
      description: 'Manages return request data and operations',
      icon: MessageSquare,
      endpoint: '/api/test-ai',
      category: 'MCP Servers'
    },
    {
      id: 'policy-mcp-server',
      name: 'Policy MCP Server',
      description: 'Handles policy and compliance operations',
      icon: Settings,
      endpoint: '/api/test-ai',
      category: 'MCP Servers'
    },
    {
      id: 'conversation-mcp-server',
      name: 'Conversation MCP Server',
      description: 'Manages conversation history and context',
      icon: Users,
      endpoint: '/api/test-ai',
      category: 'MCP Servers'
    },
    {
      id: 'voice-call',
      name: 'Voice Call AI',
      description: 'AI-powered voice call processing',
      icon: Phone,
      endpoint: '/api/test-voice-call',
      category: 'Call AI'
    },
    {
      id: 'video-call',
      name: 'Video Call AI',
      description: 'AI-powered video call processing',
      icon: Video,
      endpoint: '/api/test-video-call',
      category: 'Call AI'
    }
  ]

  const getCategoryFunctions = (category: string) => {
    return aiFunctions.filter(f => f.category === category)
  }

  const categories = [...new Set(aiFunctions.map(f => f.category))]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/main_logo.svg"
                alt="Dokani"
                width={240}
                height={64}
                className="h-16 w-auto dark:hidden"
              />
              <Image
                src="/white_logo.svg"
                alt="Dokani"
                width={240}
                height={64}
                className="h-16 w-auto hidden dark:block"
              />
            </Link>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              AI Testing Suite
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">AI Testing Suite</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-2">
                Test all AI functions and MCP servers in demo mode
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex space-x-3">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={isDemoMode}
                  onCheckedChange={setIsDemoMode}
                />
                <Label>Demo Mode</Label>
              </div>
              <Button 
                onClick={runAllTests} 
                disabled={isRunning || isLoading}
                className="bg-primary hover:bg-primary/90 text-black"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Test Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Test Input
              </CardTitle>
              <CardDescription>
                Enter a test message to send to all AI functions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="test-input">Test Message</Label>
                  <Textarea
                    id="test-input"
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Enter a test message..."
                    rows={3}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={isDemoMode ? "default" : "secondary"}>
                    {isDemoMode ? "Demo Mode" : "Live Mode"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {isDemoMode ? "Using mock data and AI responses" : "Using real data and AI responses"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Functions by Category */}
          <Tabs defaultValue={categories[0]} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              {categories.map(category => (
                <TabsTrigger key={category} value={category}>
                  {category}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map(category => (
              <TabsContent key={category} value={category} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {getCategoryFunctions(category).map((func) => {
                    const Icon = func.icon
                    const hasResult = results[func.id]
                    const hasError = errors[func.id]
                    
                    return (
                      <Card key={func.id} className="relative">
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <CardTitle className="text-lg">{func.name}</CardTitle>
                            </div>
                            {hasResult && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {hasError && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          <CardDescription>{func.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <Button
                            onClick={() => testFunction(func.id, customInput)}
                            disabled={isRunning || isLoading}
                            className="w-full"
                            variant="outline"
                          >
                            {isLoading ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="mr-2 h-4 w-4" />
                            )}
                            Test Function
                          </Button>

                          {hasResult && (
                            <div className="space-y-2">
                              <Label>Result:</Label>
                              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md text-sm">
                                <pre className="whitespace-pre-wrap overflow-x-auto">
                                  {JSON.stringify(hasResult, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}

                          {hasError && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>{hasError}</AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Summary */}
          {Object.keys(results).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Test Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {Object.keys(results).length}
                    </div>
                    <div className="text-sm text-gray-500">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {Object.keys(errors).length}
                    </div>
                    <div className="text-sm text-gray-500">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {aiFunctions.length}
                    </div>
                    <div className="text-sm text-gray-500">Total Functions</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
} 