import * as pdfjsLib from 'pdfjs-dist';
import { ImageExtractor } from './imageExtractor';

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '//cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

export class PDFExtractor {
  private imageExtractor: ImageExtractor;

  constructor() {
    this.imageExtractor = new ImageExtractor();
  }

  async extractTextFromPDF(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      // Read file as ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';
      
      // Process each page
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        try {
          const page = await pdf.getPage(pageNum);
          
          // Create canvas for rendering
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d')!;
          
          // Set scale for better quality
          const scale = 2;
          const viewport = page.getViewport({ scale });
          
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          // Render page to canvas
          await page.render({
            canvasContext: context,
            viewport: viewport
          }).promise;
          
          // Convert canvas to blob, then to file
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), 'image/png');
          });
          
          const pageFile = new File([blob], `page-${pageNum}.png`, { type: 'image/png' });
          
          // Extract text from this page with combined progress
          const pageText = await this.imageExtractor.extractTextFromImage(pageFile, (ocrProgress) => {
            if (onProgress) {
              const totalProgress = ((pageNum - 1) / pdf.numPages) * 100 + (ocrProgress / pdf.numPages);
              onProgress(Math.min(totalProgress, 100));
            }
          });
          
          if (pageText.trim()) {
            fullText += `\n--- Page ${pageNum} ---\n${pageText}\n`;
          }
          
        } catch (pageError) {
          console.warn(`Failed to process page ${pageNum}:`, pageError);
          // Continue with other pages
        }
      }
      
      return fullText.trim();
      
    } catch (error) {
      console.error('PDF extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }
}