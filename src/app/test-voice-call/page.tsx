'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useToast } from '@/hooks/use-toast'
import { Phone, Mic, Square, RotateCcw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/common/Logo'
import { DemoToggle } from '@/components/common/DemoToggle'

interface CallSession {
  id: string
  status: string
  call_type: string
  provider: string
  streaming_enabled: boolean
  external_session_id: string
  session_url: string
  created_at: string
}

interface CallTranscript {
  speaker: string
  message: string
  timestamp_seconds: number
  created_at: string
}

export default function TestVoiceCallPage() {
  const [isDemoMode, setIsDemoMode] = useState(true)
  const [callSession, setCallSession] = useState<CallSession | null>(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [transcripts, setTranscripts] = useState<CallTranscript[]>([])
  const [userInput, setUserInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [callStats, setCallStats] = useState({ duration: 0, quality_score: 0, satisfaction_score: 0 })
  const [logs, setLogs] = useState<string[]>([])
  const { toast } = useToast()
  const router = useRouter()

  const addLog = (message: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])

  const initiateCall = async () => {
    try {
      setIsProcessing(true)
      addLog('Initiating voice call...')
      const response = await fetch('/api/initiate-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` },
        body: JSON.stringify({ call_type: 'voice', provider: 'elevenlabs', streaming_enabled: true, demo_mode: isDemoMode })
      })
      const result = await response.json()
      if (result.success) {
        setCallSession(result.data)
        setIsCallActive(true)
        addLog(`Call initiated. Session ID: ${result.data.id}`)
        toast({ title: 'Call Started', description: 'Voice call initiated.' })
      } else throw new Error(result.error || 'Failed to initiate call')
    } catch (error: any) {
      addLog(`Error: ${error.message}`)
      toast({ title: 'Error', description: error.message, variant: 'destructive' })
    } finally { setIsProcessing(false) }
  }

  const endCall = () => {
    addLog('Ending call...')
    setIsCallActive(false)
    setCallSession(null)
    setTranscripts([])
    addLog('Call ended')
    toast({ title: 'Call Ended', description: 'Voice call terminated.' })
  }

  const sendMessage = async () => {
    if (!userInput.trim() || !callSession) return
    try {
      setIsProcessing(true)
      const message = userInput.trim()
      setUserInput('')
      setTranscripts(prev => [...prev, { speaker: 'user', message, timestamp_seconds: Date.now() / 1000, created_at: new Date().toISOString() }])
      addLog(`User: ${message}`)
      const response = await fetch('/api/call-ai-processor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}` },
        body: JSON.stringify({ call_session_id: callSession.id, message, speaker: 'user', demo_mode: isDemoMode })
      })
      const result = await response.json()
      if (result.success && result.ai_response) {
        setTranscripts(prev => [...prev, { speaker: 'agent', message: result.ai_response, timestamp_seconds: Date.now() / 1000, created_at: new Date().toISOString() }])
        addLog(`AI: ${result.ai_response}`)
      }
    } catch (error: any) {
      addLog(`Error: ${error.message}`)
      toast({ title: 'Error', description: 'Failed to process message.', variant: 'destructive' })
    } finally { setIsProcessing(false) }
  }

  const simulateVoiceInput = async () => {
    if (!callSession) return
    try {
      setIsProcessing(true)
      setIsListening(true)
      addLog('Simulating voice input...')
      await new Promise(resolve => setTimeout(resolve, 2000))
      const simulatedMessage = 'I need help with a return for my recent order'
      setUserInput(simulatedMessage)
      addLog(`Simulated: ${simulatedMessage}`)
      await sendMessage()
    } catch (error: any) {
      addLog(`Error: ${error.message}`)
    } finally {
      setIsProcessing(false)
      setIsListening(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Logo />
              <span className="text-sm text-gray-500">Voice Call Testing</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Voice Call AI Test</h1>
              <p className="text-gray-600">Test voice calls with AI integration and real-time processing</p>
            </div>
            <DemoToggle 
              isDemoMode={isDemoMode} 
              onDemoModeChange={setIsDemoMode}
              showLabel={true}
            />
          </div>
          <Tabs defaultValue="call" className="space-y-4">
            <TabsList>
              <TabsTrigger value="call">Call Interface</TabsTrigger>
              <TabsTrigger value="transcripts">Transcripts</TabsTrigger>
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </TabsList>
            <TabsContent value="call" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Call Controls</CardTitle>
                  <CardDescription>Manage your voice call session</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Button onClick={initiateCall} disabled={isCallActive || isProcessing} className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />{isProcessing ? 'Starting...' : 'Start Call'}
                    </Button>
                    <Button onClick={endCall} disabled={!isCallActive} variant="destructive" className="flex items-center space-x-2">
                      <Square className="h-4 w-4" />End Call
                    </Button>
                    <Button onClick={simulateVoiceInput} disabled={!isCallActive || isProcessing} variant="outline" className="flex items-center space-x-2">
                      {isListening ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Mic className="h-4 w-4" />}{isListening ? 'Processing...' : 'Simulate Voice'}
                    </Button>
                  </div>
                  {callSession && (
                    <Alert><AlertDescription><strong>Session ID:</strong> {callSession.id}<br /><strong>Status:</strong> {callSession.status}<br /><strong>Provider:</strong> {callSession.provider}<br /><strong>Streaming:</strong> {callSession.streaming_enabled ? 'Enabled' : 'Disabled'}</AlertDescription></Alert>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Message Input</CardTitle><CardDescription>Send text messages to test AI responses</CardDescription></CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input value={userInput} onChange={e => setUserInput(e.target.value)} placeholder="Type your message here..." onKeyPress={e => e.key === 'Enter' && sendMessage()} disabled={!isCallActive || isProcessing} />
                    <Button onClick={sendMessage} disabled={!isCallActive || !userInput.trim() || isProcessing}>{isProcessing ? 'Processing...' : 'Send'}</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="transcripts" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Call Transcripts</CardTitle><CardDescription>Real-time conversation history</CardDescription></CardHeader>
                <CardContent>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {transcripts.length === 0 ? (<p className="text-muted-foreground">No transcripts yet. Start a call to see conversation history.</p>) : (
                      transcripts.map((transcript, index) => (
                        <div key={index} className={`p-3 rounded-lg ${transcript.speaker === 'user' ? 'bg-blue-50 border border-blue-200 ml-8' : 'bg-gray-50 border border-gray-200 mr-8'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{transcript.speaker === 'user' ? 'You' : 'AI Agent'}</span>
                            <span className="text-xs text-muted-foreground">{new Date(transcript.created_at).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm">{transcript.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="logs" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>System Logs</CardTitle><CardDescription>Real-time system activity and events</CardDescription></CardHeader>
                <CardContent>
                  <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
                    {logs.length === 0 ? (<p>No logs yet. Start a call to see activity.</p>) : (logs.map((log, index) => (<div key={index} className="mb-1">{log}</div>)))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
} 