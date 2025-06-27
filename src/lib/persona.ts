import { supabase } from './supabase';
import { Persona, PersonaFormData, PersonaTestResult } from '@/types/persona';

// Fetch all personas for a business
export async function fetchPersonas(businessId: string): Promise<{
  voice_personas: Persona[];
  video_personas: Persona[];
}> {
  try {
    // Call the list-personas function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/list-personas?business_id=${businessId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch personas');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching personas:', error);
    throw error;
  }
}

// Create a new voice persona
export async function createVoicePersona(
  businessId: string,
  formData: PersonaFormData
): Promise<Persona> {
  try {
    // First, upload voice samples
    const voiceSampleUrls = [];
    if (formData.voice_samples && formData.voice_samples.length > 0) {
      for (const sample of formData.voice_samples) {
        const sampleUrl = await uploadFile(businessId, 'voice_sample', sample);
        voiceSampleUrls.push(sampleUrl);
      }
    }
    
    // Call the create-voice-persona function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-voice-persona`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        persona_name: formData.persona_name,
        voice_samples: voiceSampleUrls,
        voice_settings: formData.voice_settings
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create voice persona');
    }
    
    const data = await response.json();
    return data.persona_config;
  } catch (error) {
    console.error('Error creating voice persona:', error);
    throw error;
  }
}

// Create a new video persona
export async function createVideoPersona(
  businessId: string,
  formData: PersonaFormData
): Promise<Persona> {
  try {
    // First, upload video samples
    let trainVideoUrl = '';
    let consentVideoUrl = '';
    
    if (formData.video_samples && formData.video_samples.length > 0) {
      // First sample is training video
      trainVideoUrl = await uploadFile(businessId, 'video_sample', formData.video_samples[0]);
      
      // Second sample is consent video (if provided)
      if (formData.video_samples.length > 1) {
        consentVideoUrl = await uploadFile(businessId, 'video_sample', formData.video_samples[1]);
      }
    }
    
    // Call the create-tavus-persona function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-tavus-persona`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        persona_name: formData.persona_name,
        train_video_url: trainVideoUrl,
        consent_video_url: consentVideoUrl,
        persona_settings: formData.video_settings
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create video persona');
    }
    
    const data = await response.json();
    return data.persona_config;
  } catch (error) {
    console.error('Error creating video persona:', error);
    throw error;
  }
}

// Test a persona
export async function testPersona(
  configId: string,
  testContent: string,
  testType: 'voice' | 'video' = 'voice'
): Promise<PersonaTestResult> {
  try {
    // Call the test-persona function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/test-persona`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        config_id: configId,
        test_content: testContent,
        test_type: testType
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to test persona');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error testing persona:', error);
    throw error;
  }
}

// Set a persona as default
export async function setDefaultPersona(
  personaId: string,
  businessId: string,
  provider: 'elevenlabs' | 'tavus'
): Promise<Persona> {
  try {
    // Update provider_configs table
    const { data, error } = await supabase
      .from('provider_configs')
      .update({ 
        config_data: { is_default: true },
        is_default: true
      })
      .eq('id', personaId)
      .eq('business_id', businessId)
      .eq('provider', provider)
      .select();
    
    if (error) {
      throw error;
    }
    
    // Reset other personas of the same type
    await supabase
      .from('provider_configs')
      .update({ 
        config_data: { is_default: false },
        is_default: false
      })
      .eq('business_id', businessId)
      .eq('provider', provider)
      .neq('id', personaId);
    
    return data[0];
  } catch (error) {
    console.error('Error setting default persona:', error);
    throw error;
  }
}

// Delete a persona
export async function deletePersona(personaId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from('provider_configs')
      .delete()
      .eq('id', personaId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting persona:', error);
    throw error;
  }
}

// Helper function to upload files
async function uploadFile(businessId: string, fileType: string, file: File): Promise<string> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Call the upload-file function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        file_type: fileType,
        file_name: file.name,
        file_data: base64,
        file_metadata: {
          size: file.size,
          type: file.type,
          last_modified: file.lastModified
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }
    
    const data = await response.json();
    return data.file_url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}