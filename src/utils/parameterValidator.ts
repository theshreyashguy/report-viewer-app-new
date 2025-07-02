export class ParameterValidator {
  cleanParameterName(name: string): string {
    return name
      .trim()
      .replace(/[^\w\s\-\/\(\)]/g, '') // Remove special chars except common ones
      .replace(/\s+/g, ' ')
      .replace(/^(test|lab|result|value)\s+/i, '') // Remove common prefixes
      .trim();
  }

  cleanNormalRange(range: string): string {
    return range
      .trim()
      .replace(/normal\s*[:=]?\s*/i, '') // Remove "normal:" prefix
      .replace(/ref\s*[:=]?\s*/i, '') // Remove "ref:" prefix
      .replace(/range\s*[:=]?\s*/i, '') // Remove "range:" prefix
      .trim();
  }

  isHeaderOrFooter(line: string): boolean {
    const headerFooterPatterns = [
      /^(page|lab|laboratory|hospital|clinic|patient|date|time|doctor|physician)/i,
      /^(report|results|summary|conclusion|notes|remarks)/i,
      /^\d+\/\d+\/\d+/, // Date patterns
      /^\d{1,2}:\d{2}/, // Time patterns
      /^(continued|end of report|thank you)/i
    ];

    return headerFooterPatterns.some(pattern => pattern.test(line)) || 
           line.length < 3 || 
           line.length > 100;
  }

  isValidHealthParameter(name: string): boolean {
    const healthTerms = [
      // Blood tests
      'glucose', 'sugar', 'hemoglobin', 'hgb', 'hb', 'hba1c', 'a1c',
      'cholesterol', 'hdl', 'ldl', 'triglycerides', 'lipid',
      'creatinine', 'urea', 'bun', 'sodium', 'potassium', 'chloride',
      'protein', 'albumin', 'globulin', 'bilirubin',
      'alt', 'ast', 'alp', 'ggt', 'liver', 'enzyme',
      'wbc', 'rbc', 'platelet', 'hematocrit', 'mcv', 'mch', 'mchc',
      'esr', 'crp', 'inflammation',
      
      // Vital signs
      'blood pressure', 'bp', 'systolic', 'diastolic', 'pulse', 'heart rate',
      'temperature', 'temp', 'oxygen', 'o2', 'saturation', 'spo2',
      'weight', 'height', 'bmi', 'body mass',
      
      // Hormones
      'tsh', 'thyroid', 't3', 't4', 'insulin', 'cortisol',
      'testosterone', 'estrogen', 'progesterone',
      
      // Vitamins and minerals
      'vitamin', 'b12', 'd3', 'folate', 'iron', 'ferritin',
      'calcium', 'magnesium', 'phosphorus', 'zinc',
      
      // Urine tests
      'urine', 'urinalysis', 'ketones', 'specific gravity',
      
      // Other common parameters
      'ph', 'co2', 'bicarbonate', 'anion gap'
    ];
    
    const lowerName = name.toLowerCase();
    return healthTerms.some(term => 
      lowerName.includes(term) || 
      term.includes(lowerName) ||
      this.isAbbreviationMatch(lowerName, term)
    );
  }

  private isAbbreviationMatch(name: string, term: string): boolean {
    // Check if name could be an abbreviation of term
    if (name.length <= 5 && term.length > name.length) {
      const termWords = term.split(' ');
      const firstLetters = termWords.map(word => word[0]).join('');
      return firstLetters.toLowerCase() === name.toLowerCase();
    }
    return false;
  }

  checkIfOutOfRange(value: string, normalRange: string): boolean {
    if (!normalRange) return false;
    
    // Handle compound values like "120/80"
    if (value.includes('/')) {
      return this.checkBloodPressureRange(value, normalRange);
    }
    
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return false;
    
    // Enhanced range parsing
    const rangePatterns = [
      /([0-9.]+)\s*[\-–]\s*([0-9.]+)/,
      /([0-9.]+)\s*to\s*([0-9.]+)/i,
      /<\s*([0-9.]+)/,
      />\s*([0-9.]+)/,
      /([0-9.]+)\s*\+/
    ];
    
    for (const pattern of rangePatterns) {
      const match = normalRange.match(pattern);
      if (match) {
        if (pattern.source.includes('<')) {
          return numValue >= parseFloat(match[1]);
        } else if (pattern.source.includes('>')) {
          return numValue <= parseFloat(match[1]);
        } else if (match[2]) {
          const min = parseFloat(match[1]);
          const max = parseFloat(match[2]);
          return numValue < min || numValue > max;
        }
      }
    }
    
    return false;
  }

  private checkBloodPressureRange(value: string, normalRange: string): boolean {
    const bpMatch = value.match(/(\d+)\/(\d+)/);
    if (!bpMatch) return false;
    
    const systolic = parseInt(bpMatch[1]);
    const diastolic = parseInt(bpMatch[2]);
    
    // Standard BP ranges
    const isHighBP = systolic >= 140 || diastolic >= 90;
    const isLowBP = systolic < 90 || diastolic < 60;
    
    return isHighBP || isLowBP;
  }

  categorizeParameter(name: string): string {
    const categories = {
      'Blood Sugar': ['glucose', 'sugar', 'hba1c', 'a1c', 'diabetic'],
      'Lipid Profile': ['cholesterol', 'hdl', 'ldl', 'triglycerides', 'lipid'],
      'Blood Count': ['hemoglobin', 'hgb', 'hb', 'wbc', 'rbc', 'platelet', 'hematocrit', 'mcv', 'mch', 'mchc'],
      'Kidney Function': ['creatinine', 'urea', 'bun', 'kidney'],
      'Liver Function': ['alt', 'ast', 'alp', 'ggt', 'bilirubin', 'liver'],
      'Electrolytes': ['sodium', 'potassium', 'chloride', 'co2', 'bicarbonate'],
      'Vital Signs': ['blood pressure', 'bp', 'heart rate', 'pulse', 'temperature', 'oxygen', 'spo2'],
      'Hormones': ['tsh', 'thyroid', 't3', 't4', 'insulin', 'cortisol', 'testosterone', 'estrogen'],
      'Vitamins': ['vitamin', 'b12', 'd3', 'folate'],
      'Minerals': ['iron', 'ferritin', 'calcium', 'magnesium', 'phosphorus', 'zinc'],
      'Inflammation': ['esr', 'crp', 'inflammation'],
      'Proteins': ['protein', 'albumin', 'globulin']
    };

    const lowerName = name.toLowerCase();
    for (const [category, terms] of Object.entries(categories)) {
      if (terms.some(term => lowerName.includes(term) || term.includes(lowerName))) {
        return category;
      }
    }
    
    return 'Other';
  }

  areParametersSimilar(name1: string, name2: string): boolean {
    const normalized1 = name1.toLowerCase().replace(/[^a-z]/g, '');
    const normalized2 = name2.toLowerCase().replace(/[^a-z]/g, '');
    
    // Check if one is contained in the other
    return normalized1.includes(normalized2) || normalized2.includes(normalized1);
  }
}
