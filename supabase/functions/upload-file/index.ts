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

    const { business_id, file_type, file_name, file_data, file_metadata } = await req.json()

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

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseClient.storage
      .from('uploads')
      .upload(filePath, file_data, {
        contentType: getContentType(file_name),
        upsert: false
      })

    if (uploadError) {
      throw uploadError
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
          file_size: file_data.length,
          metadata: file_metadata || {},
          uploaded_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (dbError) {
      throw dbError
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