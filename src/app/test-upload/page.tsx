'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { uploadFile } from '@/lib/chat';

export default function TestUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setResult('');

    try {
      const fileUrl = await uploadFile(
        'test-business',
        file,
        (progress) => {
          console.log('Upload progress:', progress);
        },
        true // demo mode
      );

      setResult(`Upload successful! File URL: ${fileUrl}`);
    } catch (error) {
      console.error('Upload error:', error);
      setResult(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-8 max-w-md">
      <h1 className="text-2xl font-bold mb-6">Test File Upload</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Select File</label>
          <input
            type="file"
            onChange={handleFileChange}
            className="w-full border rounded p-2"
            accept="image/*"
          />
        </div>

        {file && (
          <div className="text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
          </div>
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>

        {result && (
          <div className={`p-4 rounded ${result.includes('failed') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
} 