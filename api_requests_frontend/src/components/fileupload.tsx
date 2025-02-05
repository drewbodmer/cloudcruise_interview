'use client'

import { useState, Fragment } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

import { ScrollArea } from "@/components/ui/scroll-area"

interface FileUploadProps {
  apiHost: string;
  files: string[];
}

export default function FileUpload({ files, apiHost }: FileUploadProps) {
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
      const response = await fetch(`${apiHost}/api/upload`, {
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
    <Card className="w-[80vw] min-w-[650px] max-w-[1000px]">
      <CardHeader>
        <CardTitle>1. Upload .har file</CardTitle>
        <CardDescription>Use these files in the next step.</CardDescription>
      </CardHeader>
      <CardContent className="flex space-x-4">
        <div className="flex-1">
          <Input
            id="harfile"
            type="file"
            accept=".har"
            onChange={handleFileChange}
          />
          <Button
            onClick={handleUpload}
            disabled={!file || isUploading}
            className="mt-2"
          >
            {isUploading ? 'Uploading...' : 'Submit'}
          </Button>
        </div>
        <ScrollArea className="flex-1 h-[200px]">
          <div className="p-4">
            <h4 className="mb-4 text-sm font-medium leading-none">Available Files</h4>
            {files.map((file) => (
              <Fragment key={file}>
                <div className="text-sm">
                  {file}
                </div>
                <Separator className="my-2" />
              </Fragment>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
      <CardFooter className="flex justify-between">
        {error && <p className="text-sm text-red-500">{error}</p>}
      </CardFooter>
    </Card>
  );
}