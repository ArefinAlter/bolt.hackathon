import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerEmail = searchParams.get('customer_email');
    const businessId = searchParams.get('business_id');

    if (!customerEmail || !businessId) {
      return NextResponse.json(
        { error: 'Missing required parameters: customer_email and business_id' },
        { status: 400 }
      );
    }

    // Call the Supabase Edge Function
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/risk-assessment/profile?customer_email=${encodeURIComponent(customerEmail)}&business_id=${businessId}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Edge function error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error calling risk assessment profile function:', error);
    return NextResponse.json(
      { error: 'Failed to fetch risk profile' },
      { status: 500 }
    );
  }
} 