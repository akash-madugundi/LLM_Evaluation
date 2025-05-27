import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const PdfUpload = ({ pdfFile, isUploading, uploadProgress, isProcessing, onFileChange, onFileUpload, onDrop }) => {
  
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex-grow flex flex-col items-center justify-center p-8 space-y-6"
    >
      <Card 
        className="w-full max-w-md bg-background/70 backdrop-blur-sm p-6 shadow-xl border-dashed border-primary/50"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-center text-xl font-semibold text-foreground">Upload PDF Document</CardTitle>
        </CardHeader>
        <CardContent className="p-0 flex flex-col items-center space-y-4">
          <UploadCloud className="h-16 w-16 text-primary mx-auto" />
          <p className="text-center text-muted-foreground">
            Drag & drop your PDF here, or click to select.
          </p>
          <Input 
            id="pdf-upload"
            type="file" 
            accept=".pdf" 
            onChange={onFileChange} 
            className="hidden" 
          />
          <Button variant="outline" onClick={() => document.getElementById('pdf-upload').click()} className="w-full">
            Select PDF
          </Button>
          {pdfFile && <p className="text-sm text-accent">Selected: {pdfFile.name}</p>}
          {(isUploading || isProcessing) && (
            <div className="w-full space-y-2">
              <Progress value={isUploading ? uploadProgress : 100} className="w-full h-2" />
              <p className="text-sm text-center text-primary">
                {isUploading ? `Uploading... ${uploadProgress}%` : 'Processing PDF...'}
              </p>
            </div>
          )}
          <Button onClick={onFileUpload} disabled={!pdfFile || isUploading || isProcessing} className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity">
            {isProcessing ? 'Processing...' : (isUploading ? 'Uploading...' : 'Upload & Process')}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default PdfUpload;