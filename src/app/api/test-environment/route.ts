import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? 'SET' : 'NOT SET'
    };

    return NextResponse.json({
      type: 'environment',
      success: true,
      data: envVars
    });

  } catch (error: any) {
    console.error('Environment test error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
} 