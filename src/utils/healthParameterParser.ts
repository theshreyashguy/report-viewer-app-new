import { HealthParameter } from '@/types/health';
import { ParameterValidator } from './parameterValidator';

export class HealthParameterParser {
  private validator: ParameterValidator;

  constructor() {
    this.validator = new ParameterValidator();
  }

  parseHealthParameters(text: string): HealthParameter[] {
    const lines = text.split('\n').filter(line => line.trim());
    const parameters: HealthParameter[] = [];
    
    // Enhanced parsing patterns for better accuracy
    const patterns = [
      // Pattern 1: Parameter Value Unit with relational ranges (<, >, <=, >=)
      /^(.+?)\s+([0-9]*\.?[0-9]+)\s+([a-zA-Z\/%]+)\s+([<>]=?\s*[0-9]*\.?[0-9]+)/i,
      // Pattern 2: Parameter Value Unit with hyphen ranges (70 - 100)
      /^(.+?)\s+([0-9]*\.?[0-9]+)\s+([a-zA-Z\/%]+)\s+([0-9.]+\s*[\-–]\s*[0-9.]+)/i,
      // Pattern 3: Parameter: Value Unit (Range)
      /^(.+?)\s*[:\-=]\s*([0-9]+\.?[0-9]*)\s*([a-zA-Z/%]+)?\s*(?:\(([^)]+)\))?/i,
      // Pattern 4: Parameter: Value (no unit)
      /^(.+?)\s*[:\-=]\s*([0-9]+\.?[0-9]*)\s*$/i,
      // Pattern 5: Parameter Value Unit
      /^(.+?)\s+([0-9]+\.?[0-9]*)\s+([a-zA-Z/%]+)\s*$/i,
      // Pattern 6: Complex values like "120/80"
      /^(.+?)\s*[:\-=]\s*([0-9]+\/[0-9]+)\s*([a-zA-Z/%]+)?\s*(?:\(([^)]+)\))?/i,
      // Pattern 7: Decimal values with better precision
      /^(.+?)\s*[:\-=]\s*([0-9]*\.?[0-9]+)\s*([a-zA-Z/%]+)?\s*(?:\(([^)]+)\))?/i
    ];

    // Process each line
    lines.forEach((line, index) => {
      const cleanLine = line.trim().replace(/\s+/g, ' ');
      
      // Skip empty lines or lines that are clearly headers/footers
      if (this.validator.isHeaderOrFooter(cleanLine)) {
        return;
      }

      for (const pattern of patterns) {
        const match = cleanLine.match(pattern);
        if (match) {
          const [, rawName, rawValue, unit = '', normalRange = ''] = match;
          
          // Clean and validate the parameter name
          const paramName = this.validator.cleanParameterName(rawName);
          const paramValue = rawValue.trim();
          
          if (paramName && paramValue && this.validator.isValidHealthParameter(paramName)) {
            // Check for duplicates
            const existingParam = parameters.find(p => 
              p.name.toLowerCase() === paramName.toLowerCase()
            );
            
            if (!existingParam) {
              const category = this.validator.categorizeParameter(paramName);
              const cleanedRange = this.validator.cleanNormalRange(normalRange);
              
              parameters.push({
                id: `param-${Date.now()}-${index}`,
                name: paramName,
                value: paramValue,
                unit: unit.trim(),
                normalRange: cleanedRange,
                isOutOfRange: this.validator.checkIfOutOfRange(paramValue, cleanedRange),
                category: category
              });
            }
          }
          break;
        }
      }
    });

    // Post-process to enhance accuracy
    return this.postProcessParameters(parameters);
  }

  private postProcessParameters(parameters: HealthParameter[]): HealthParameter[] {
    // Remove duplicates based on similar names
    const uniqueParameters: HealthParameter[] = [];
    
    parameters.forEach(param => {
      const similar = uniqueParameters.find(existing => 
        this.validator.areParametersSimilar(param.name, existing.name)
      );
      
      if (!similar) {
        uniqueParameters.push(param);
      } else {
        // Keep the one with more complete information
        if (param.normalRange && !similar.normalRange) {
          const index = uniqueParameters.indexOf(similar);
          uniqueParameters[index] = param;
        }
      }
    });
    
    return uniqueParameters.sort((a, b) => a.name.localeCompare(b.name));
  }
}
