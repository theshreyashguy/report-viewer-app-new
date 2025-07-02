
import { HealthReport, TrendData } from '@/types/health';

export const generateMockReports = (patientName: string): HealthReport[] => {
  const baseDate = new Date();
  
  return [
    {
      id: 'report-1',
      patientName,
      reportDate: new Date(baseDate.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fileName: 'health_report_3_months_ago.pdf',
      uploadedAt: new Date().toISOString(),
      parameters: [
        {
          id: 'glucose-1',
          name: 'Blood Glucose',
          value: '95',
          unit: 'mg/dL',
          normalRange: '70-100',
          isOutOfRange: false,
          category: 'Blood Sugar'
        },
        {
          id: 'cholesterol-1',
          name: 'Total Cholesterol',
          value: '180',
          unit: 'mg/dL',
          normalRange: '< 200',
          isOutOfRange: false,
          category: 'Lipid Profile'
        },
        {
          id: 'hemoglobin-1',
          name: 'Hemoglobin',
          value: '14.2',
          unit: 'g/dL',
          normalRange: '12-16',
          isOutOfRange: false,
          category: 'Blood Count'
        }
      ]
    },
    {
      id: 'report-2',
      patientName,
      reportDate: new Date(baseDate.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fileName: 'health_report_2_months_ago.pdf',
      uploadedAt: new Date().toISOString(),
      parameters: [
        {
          id: 'glucose-2',
          name: 'Blood Glucose',
          value: '102',
          unit: 'mg/dL',
          normalRange: '70-100',
          isOutOfRange: true,
          category: 'Blood Sugar'
        },
        {
          id: 'cholesterol-2',
          name: 'Total Cholesterol',
          value: '195',
          unit: 'mg/dL',
          normalRange: '< 200',
          isOutOfRange: false,
          category: 'Lipid Profile'
        },
        {
          id: 'hemoglobin-2',
          name: 'Hemoglobin',
          value: '13.8',
          unit: 'g/dL',
          normalRange: '12-16',
          isOutOfRange: false,
          category: 'Blood Count'
        }
      ]
    },
    {
      id: 'report-3',
      patientName,
      reportDate: new Date(baseDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      fileName: 'health_report_1_month_ago.pdf',
      uploadedAt: new Date().toISOString(),
      parameters: [
        {
          id: 'glucose-3',
          name: 'Blood Glucose',
          value: '88',
          unit: 'mg/dL',
          normalRange: '70-100',
          isOutOfRange: false,
          category: 'Blood Sugar'
        },
        {
          id: 'cholesterol-3',
          name: 'Total Cholesterol',
          value: '175',
          unit: 'mg/dL',
          normalRange: '< 200',
          isOutOfRange: false,
          category: 'Lipid Profile'
        },
        {
          id: 'hemoglobin-3',
          name: 'Hemoglobin',
          value: '14.5',
          unit: 'g/dL',
          normalRange: '12-16',
          isOutOfRange: false,
          category: 'Blood Count'
        }
      ]
    }
  ];
};

export const generateTrendData = (reports: HealthReport[]): TrendData[] => {
  return reports.map(report => {
    const trendPoint: TrendData = {
      date: report.reportDate
    };
    
    report.parameters.forEach(param => {
      const numericValue = parseFloat(param.value);
      if (!isNaN(numericValue)) {
        trendPoint[param.name] = numericValue;
      }
    });
    
    return trendPoint;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};
