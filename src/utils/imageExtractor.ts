import Tesseract from 'tesseract.js';

export class ImageExtractor {
  async extractTextFromImage(file: File, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const result = await Tesseract.recognize(file, 'eng', {
        logger: (m) => {
          if (m.status === 'recognizing text' && onProgress) {
            onProgress(m.progress * 100);
          }
        }
      });
      return result.data.text;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from image');
    }
  }
}