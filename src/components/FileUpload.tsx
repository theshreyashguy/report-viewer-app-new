
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploadProps {
  onFileUpload: (file: File) => void;
  isProcessing: boolean;
  progress: number;
  error?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ 
  onFileUpload, 
  isProcessing, 
  progress, 
  error 
}) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setUploadedFile(file);
      onFileUpload(file);
    }
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024 // 10MB
  });

  const hasFileRejections = fileRejections.length > 0;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <Card>
        <CardContent className="p-6">
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
              ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
              ${hasFileRejections ? 'border-red-500 bg-red-50' : ''}
              ${isProcessing ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            <div className="flex flex-col items-center space-y-4">
              <Upload className="w-12 h-12 text-gray-400" />
              
              {isDragActive ? (
                <p className="text-blue-600 font-medium">Drop the file here...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-gray-600 font-medium">
                    Drag & drop your health report here, or click to browse
                  </p>
                  <p className="text-sm text-gray-500">
                    Supports PDF, PNG, and JPEG files (max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {hasFileRejections && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {fileRejections[0].errors[0].message}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {uploadedFile && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-8 h-8 text-blue-500" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {uploadedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              {!isProcessing && progress === 100 && (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
            </div>
            
            {isProcessing && (
              <div className="mt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing...</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FileUpload;
