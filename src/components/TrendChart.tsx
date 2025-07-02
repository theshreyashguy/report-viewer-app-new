
import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { TrendData } from '@/types/health';

interface TrendChartProps {
  data: TrendData[];
  availableParameters: string[];
}

const TrendChart: React.FC<TrendChartProps> = ({ data, availableParameters }) => {
  const [selectedParameters, setSelectedParameters] = useState<string[]>(
    availableParameters.slice(0, 3) // Default to first 3 parameters
  );

  const colors = [
    '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1',
    '#d084d0', '#ffb347', '#87ceeb', '#dda0dd', '#98fb98'
  ];

  const handleParameterToggle = (parameter: string) => {
    setSelectedParameters(prev => 
      prev.includes(parameter)
        ? prev.filter(p => p !== parameter)
        : [...prev, parameter]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Health Trends</CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <div className="text-gray-500">
            <p>No trend data available.</p>
            <p className="text-sm mt-2">Upload more reports to see trends over time.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Health Trends</span>
          <Badge variant="outline">{data.length} reports</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Parameter Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Select Parameters to Display:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {availableParameters.map((parameter) => (
                <div key={parameter} className="flex items-center space-x-2">
                  <Checkbox
                    id={parameter}
                    checked={selectedParameters.includes(parameter)}
                    onCheckedChange={() => handleParameterToggle(parameter)}
                  />
                  <label
                    htmlFor={parameter}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {parameter}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          {selectedParameters.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip 
                    labelFormatter={(value) => `Date: ${formatDate(value as string)}`}
                    formatter={(value, name) => [
                      typeof value === 'number' ? value.toFixed(1) : value,
                      name
                    ]}
                  />
                  <Legend />
                  {selectedParameters.map((parameter, index) => (
                    <Line
                      key={parameter}
                      type="monotone"
                      dataKey={parameter}
                      stroke={colors[index % colors.length]}
                      strokeWidth={2}
                      dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>Select at least one parameter to display the trend chart.</p>
            </div>
          )}

          {/* Summary Stats */}
          {selectedParameters.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              {selectedParameters.slice(0, 3).map((parameter) => {
                const values = data
                  .map(d => d[parameter])
                  .filter(v => typeof v === 'number') as number[];
                
                if (values.length === 0) return null;
                
                const latest = values[values.length - 1];
                const previous = values[values.length - 2];
                const trend = previous ? ((latest - previous) / previous * 100) : 0;
                
                return (
                  <div key={parameter} className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-sm text-gray-600">{parameter}</div>
                    <div className="text-lg font-semibold">{latest}</div>
                    {previous && (
                      <div className={`text-xs ${trend > 0 ? 'text-red-600' : trend < 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend).toFixed(1)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TrendChart;
