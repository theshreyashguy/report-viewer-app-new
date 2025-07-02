import { HealthParameter } from '@/types/health';
import { ImageExtractor } from './imageExtractor';
import { PDFExtractor } from './pdfExtractor';
import { HealthParameterParser } from './healthParameterParser';

export class OCRService {
  private static instance: OCRService;
  private imageExtractor: ImageExtractor;
  private pdfExtractor: PDFExtractor;
  private parameterParser: HealthParameterParser;
  
  constructor() {
    this.imageExtractor = new ImageExtractor();
    this.pdfExtractor = new PDFExtractor();
    this.parameterParser = new HealthParameterParser();
  }
  
  static getInstance(): OCRService {
    if (!OCRService.instance) {
      OCRService.instance = new OCRService();
    }
    return OCRService.instance;
  }

  async extractText(file: File, onProgress?: (progress: number) => void): Promise<string> {
    const fileType = file.type.toLowerCase();
    
    if (fileType === 'application/pdf') {
      return this.pdfExtractor.extractTextFromPDF(file, onProgress);
    } else {
      return this.imageExtractor.extractTextFromImage(file, onProgress);
    }
  }

  async extractTextFromImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this.imageExtractor.extractTextFromImage(file, onProgress);
  }

  async extractTextFromPDF(file: File, onProgress?: (progress: number) => void): Promise<string> {
    return this.pdfExtractor.extractTextFromPDF(file, onProgress);
  }

  parseHealthParameters(text: string): HealthParameter[] {
    return this.parameterParser.parseHealthParameters(text);
  }
}