import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    // Test the send-chat-message function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-ai-agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        testType: 'customer_service',
        data: {
          message: message || 'Hello, I need help with a return',
          context: {
            businessId: '123e4567-e89b-12d3-a456-426614174000',
            customerEmail: 'test@example.com',
            sessionId: 'test-session',
            userRole: 'customer',
            timestamp: new Date().toISOString()
          },
          history: []
        }
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json(
        { error: errorData.error || 'AI test failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      type: 'ai_test',
      success: true,
      data
    });

  } catch (error: any) {
    console.error('AI test error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 