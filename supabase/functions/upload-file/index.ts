import { serve } from "https://deno.land/std@0.220.0/http/server.ts"

Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { business_id, file_type, file_name, file_data, file_metadata, demo_mode } = await req.json()

    // Demo mode - return mock upload data
    if (demo_mode) {
      // Create appropriate demo URL based on file type
      let demoUrl = 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Demo+Image';
      
      if (file_type === 'voice_sample') {
        demoUrl = 'https://via.placeholder.com/400x200/10B981/FFFFFF?text=Voice+Sample';
      } else if (file_type === 'video_sample') {
        demoUrl = 'https://via.placeholder.com/400x300/7C3AED/FFFFFF?text=Video+Sample';
      } else if (file_type === 'evidence_video') {
        demoUrl = 'https://via.placeholder.com/400x300/DC2626/FFFFFF?text=Evidence+Video';
      }
      
      const mockUploadData = {
        success: true,
        file_id: 'demo-file-123',
        file_url: demoUrl,
        file_path: `${business_id || 'demo-business'}/${file_type || 'evidence_photo'}/demo_${file_name || 'file.jpg'}`,
        message: 'File uploaded successfully (demo mode)',
        demo_mode: true
      }

      return new Response(
        JSON.stringify(mockUploadData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate required fields
    if (!business_id || !file_type || !file_name || !file_data) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_id, file_type, file_name, file_data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['voice_sample', 'video_sample', 'evidence_photo', 'evidence_video']
    if (!allowedTypes.includes(file_type)) {
      return new Response(
        JSON.stringify({ error: `Invalid file_type. Must be one of: ${allowedTypes.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Generate unique file path
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filePath = `${business_id}/${file_type}/${timestamp}_${file_name}`

    // Convert base64 to bytes for upload
    const base64Data = file_data
    const binaryString = atob(base64Data)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Upload to Supabase Storage using service role
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('uploads')
      .upload(filePath, bytes, {
        contentType: getContentType(file_name),
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: `Storage upload failed: ${uploadError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseClient.storage
      .from('uploads')
      .getPublicUrl(filePath)

    // Store file metadata in database
    const { data: fileRecord, error: dbError } = await supabaseClient
      .from('file_uploads')
      .insert([
        {
          business_id,
          file_type,
          file_name,
          file_path: filePath,
          file_url: urlData.publicUrl,
          file_size: bytes.length,
          metadata: file_metadata || {},
          uploaded_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to clean up the uploaded file if database insert fails
      await supabaseClient.storage.from('uploads').remove([filePath])
      
      return new Response(
        JSON.stringify({ error: `Database insert failed: ${dbError.message}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        file_id: fileRecord.id,
        file_url: urlData.publicUrl,
        file_path: filePath,
        message: 'File uploaded successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in upload-file:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  const mimeTypes: Record<string, string> = {
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'm4a': 'audio/mp4',
    'mp4': 'video/mp4',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp'
  }

  return mimeTypes[extension || ''] || 'application/octet-stream'
} 