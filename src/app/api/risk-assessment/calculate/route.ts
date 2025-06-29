import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customer_email, business_id, order_value, reason_for_return } = body;

    if (!customer_email || !business_id) {
      return NextResponse.json(
        { error: 'Missing required parameters: customer_email and business_id' },
        { status: 400 }
      );
    }

    // Call the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/risk-assessment/calculate`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_email,
          business_id,
          order_value: order_value || 0,
          reason_for_return: reason_for_return || ''
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling risk assessment calculate function:', error);
    return NextResponse.json(
      { error: 'Failed to calculate risk score' },
      { status: 500 }
    );
  }
} 