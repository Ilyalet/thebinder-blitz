import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Document } from '@/entities/all';
import { UploadFile } from '@/integrations/Core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, Camera } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useToast } from '@/components/ui/use-toast';

export default function AIDocumentScanner({ onUploadComplete }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { file_url } = await UploadFile({ file });
      const doc = await Document.create({
        name: file.name,
        image_url: file_url,
        status: 'processing',
        upload_date: new Date().toISOString(),
      });
      // Document.jsx picks up status:'processing' on load and runs the full
      // OCR/metadata/task-extraction pipeline — reuse that instead of duplicating it here.
      navigate(createPageUrl(`Document?id=${doc.id}`));
    } catch (error) {
      console.error('Upload failed:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: 'Could not upload document. Please try again.' });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="border-2 border-dashed border-blue-300 bg-blue-50/50">
      <CardContent className="flex flex-col items-center justify-center py-10 gap-3">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileSelect}
          disabled={isUploading}
        />
        {isUploading ? (
          <>
            <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
            <p className="text-sm text-gray-600">Uploading document...</p>
          </>
        ) : (
          <>
            <Upload className="h-10 w-10 text-blue-500" />
            <p className="text-sm font-medium text-gray-700">Scan or upload a document</p>
            <p className="text-xs text-gray-500">Receipts, warranties, bills, insurance, and more</p>
            <Button onClick={() => fileInputRef.current?.click()} className="mt-2">
              <Camera className="h-4 w-4 mr-2" />
              Choose File
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
