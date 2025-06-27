import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client only if environment variables are available
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { action, ...data } = body

    // Validate action
    if (!action || !['create', 'triage'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "create" or "triage"' },
        { status: 400 }
      )
    }

    if (action === 'create') {
      return await handleCreateReturn(supabase, data)
    } else if (action === 'triage') {
      return await handleTriageReturn(supabase, data)
    }

  } catch (error) {
    console.error('Error in returns API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleCreateReturn(supabase: any, data: any) {
  try {
    const { 
      business_id, 
      customer_email, 
      order_number, 
      product_name, 
      return_reason, 
      evidence_files = [] 
    } = data

    // Validate required fields
    if (!business_id || !customer_email || !order_number || !product_name || !return_reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Generate public ID
    const public_id = `RET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Create return request
    const { data: returnRequest, error } = await supabase
      .from('return_requests')
      .insert([{
        public_id,
        business_id,
        customer_email,
        order_number,
        product_name,
        return_reason,
        evidence_files,
        status: 'pending_triage'
      }])
      .select()
      .single()

    if (error) {
      console.error('Error creating return request:', error)
      return NextResponse.json(
        { error: 'Failed to create return request' },
        { status: 500 }
      )
    }

    // Automatically trigger triage
    const triageResult = await handleTriageReturn(supabase, {
      return_request_id: returnRequest.id,
      public_id: returnRequest.public_id
    })

    return NextResponse.json({
      success: true,
      data: returnRequest,
      triage_result: triageResult
    })

  } catch (error) {
    console.error('Error in handleCreateReturn:', error)
    return NextResponse.json(
      { error: 'Failed to create return request' },
      { status: 500 }
    )
  }
}

async function handleTriageReturn(supabase: any, data: any) {
  try {
    const { return_request_id, public_id } = data

    // Validate required fields
    if (!return_request_id && !public_id) {
      return NextResponse.json(
        { error: 'Missing return_request_id or public_id' },
        { status: 400 }
      )
    }

    // Get return request
    let query = supabase
      .from('return_requests')
      .select('*')

    if (return_request_id) {
      query = query.eq('id', return_request_id)
    } else {
      query = query.eq('public_id', public_id)
    }

    const { data: returnRequest, error: fetchError } = await query.single()

    if (fetchError || !returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      )
    }

    // Call the triage-return Supabase function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-return`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        return_request_id: returnRequest.id,
        public_id: returnRequest.public_id
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Triage failed')
    }

    const triageResult = await response.json()

    return NextResponse.json({
      success: true,
      data: triageResult
    })

  } catch (error) {
    console.error('Error in handleTriageReturn:', error)
    return NextResponse.json(
      { error: 'Failed to triage return request' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url)
    const public_id = searchParams.get('public_id')
    const return_request_id = searchParams.get('return_request_id')

    if (!public_id && !return_request_id) {
      return NextResponse.json(
        { error: 'Missing public_id or return_request_id parameter' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('return_requests')
      .select('*')

    if (return_request_id) {
      query = query.eq('id', return_request_id)
    } else {
      query = query.eq('public_id', public_id)
    }

    const { data: returnRequest, error } = await query.single()

    if (error || !returnRequest) {
      return NextResponse.json(
        { error: 'Return request not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: returnRequest
    })

  } catch (error) {
    console.error('Error in returns GET API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json()
    const { return_request_id, public_id, ...updateData } = body

    if (!return_request_id && !public_id) {
      return NextResponse.json(
        { error: 'Missing return_request_id or public_id' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('return_requests')
      .update(updateData)

    if (return_request_id) {
      query = query.eq('id', return_request_id)
    } else {
      query = query.eq('public_id', public_id)
    }

    const { data: updatedRequest, error } = await query.select().single()

    if (error || !updatedRequest) {
      return NextResponse.json(
        { error: 'Failed to update return request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: updatedRequest
    })

  } catch (error) {
    console.error('Error in returns PUT API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 