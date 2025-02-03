'use client'

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const API_HOST = process.env.HOST || 'http://localhost:3000';

export default function FileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    
    if (selectedFile) {
      if (selectedFile.name.endsWith('.har')) {
        setFile(selectedFile);
        setError('');
      } else {
        setFile(null);
        setError('Please select a .har file');
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_HOST}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Upload successful:', data);
        setFile(null);
      } else {
        setError('Upload failed');
      }
    } catch (err) {
      setError('Upload failed');
      console.error(err);
    } finally {
        setIsUploading(false);
    }
  };

    return (
        <div className="flex flex-col w-full max-w-sm gap-4">
        <div className="flex items-center space-x-2">
          <Label htmlFor="harfile">.har file</Label>
          <Input 
            id="harfile" 
            type="file" 
            accept=".har"
            onChange={handleFileChange}
          />
          <Button 
            onClick={handleUpload} 
            disabled={!file || isUploading}
          >
            {isUploading ? 'Uploading...' : 'Submit'}
          </Button>
        </div>
        {file && <p className="text-sm text-gray-500">Selected: {file.name}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
      );
}