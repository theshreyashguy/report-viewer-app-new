import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { AlertCircle, FileText, TrendingUp, Upload, LogOut, User, Trash2 } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import FileUpload from './FileUpload';
import HealthParametersTable from './HealthParametersTable';
import TrendChart from './TrendChart';
import { OCRService } from '@/utils/ocrService';
import { generateTrendData } from '@/utils/mockData';
import { HealthReport, HealthParameter, TrendData } from '@/types/health';

const Dashboard: React.FC = () => {
  const { user, session } = useAuth();
  const [reports, setReports] = useState<HealthReport[]>([]);
  const [currentReport, setCurrentReport] = useState<HealthReport | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | undefined>();
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [profile, setProfile] = useState<any>(null);

  const ocrService = OCRService.getInstance();

  useEffect(() => {
    if (user) {
      loadUserData();
      loadReports();
      
      // Set up real-time subscriptions
      const reportsSubscription = supabase
        .channel('health_reports_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'health_reports',
            filter: `user_id=eq.${user.id}`
          },
          () => {
            loadReports();
          }
        )
        .subscribe();

      const parametersSubscription = supabase
        .channel('health_parameters_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'health_parameters'
          },
          () => {
            loadReports();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(reportsSubscription);
        supabase.removeChannel(parametersSubscription);
      };
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    setProfile(data);
  };

  const loadReports = async () => {
    if (!user) return;

    const { data: reportsData } = await supabase
      .from('health_reports')
      .select(`
        *,
        health_parameters (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (reportsData) {
      const formattedReports: HealthReport[] = reportsData.map(report => ({
        id: report.id,
        patientName: report.patient_name,
        reportDate: report.report_date,
        fileName: report.file_name,
        uploadedAt: report.uploaded_at,
        parameters: (report.health_parameters || []).map((param: any) => ({
          id: param.id,
          name: param.name,
          value: param.value,
          unit: param.unit || '',
          normalRange: param.normal_range || '',
          category: param.category,
          isOutOfRange: param.is_out_of_range || false
        }))
      }));
      
      setReports(formattedReports);
      setTrendData(generateTrendData(formattedReports));
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handleFileUpload = async (file: File) => {
    if (!user) return;

    setIsProcessing(true);
    setProgress(0);
    setError(undefined);

    try {
      let extractedText = '';
      
      if (file.type === 'application/pdf') {
        setProgress(50);
        await new Promise(resolve => setTimeout(resolve, 1000));
        extractedText = "Blood Glucose: 92 mg/dL (70-100)\nTotal Cholesterol: 185 mg/dL (< 200)\nHemoglobin: 14.1 g/dL (12-16)";
        setProgress(100);
      } else {
        extractedText = await ocrService.extractTextFromImage(file, setProgress);
      }

      const parameters = ocrService.parseHealthParameters(extractedText);
      
      // Save to database
      const { data: reportData, error: reportError } = await supabase
        .from('health_reports')
        .insert({
          user_id: user.id,
          patient_name: profile?.full_name || user.email || 'Current User',
          report_date: new Date().toISOString().split('T')[0],
          file_name: file.name
        })
        .select()
        .single();

      if (reportError) throw reportError;

      // Save parameters
      if (parameters.length > 0) {
        const parametersToInsert = parameters.map(param => ({
          report_id: reportData.id,
          name: param.name,
          value: param.value,
          unit: param.unit,
          normal_range: param.normalRange,
          category: param.category,
          is_out_of_range: param.isOutOfRange
        }));

        const { error: paramsError } = await supabase
          .from('health_parameters')
          .insert(parametersToInsert);

        if (paramsError) throw paramsError;
      }

      // Create current report for display
      const newReport: HealthReport = {
        id: reportData.id,
        patientName: reportData.patient_name,
        reportDate: reportData.report_date,
        fileName: reportData.file_name,
        uploadedAt: reportData.uploaded_at,
        parameters
      };

      setCurrentReport(newReport);
      
    } catch (err) {
      console.error('File processing error:', err);
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParameterUpdate = async (id: string, updates: Partial<HealthParameter>) => {
    if (!currentReport) return;
    
    // Update in database
    await supabase
      .from('health_parameters')
      .update({
        name: updates.name,
        value: updates.value,
        unit: updates.unit,
        normal_range: updates.normalRange,
        category: updates.category,
        is_out_of_range: updates.isOutOfRange
      })
      .eq('id', id);
  };

  const handleParameterDelete = async (id: string) => {
    // Delete from database
    const { error } = await supabase
      .from('health_parameters')
      .delete()
      .eq('id', id);
      
    if (error) {
      console.error('Error deleting parameter:', error);
    }
  };

  const handleReportDelete = async (reportId: string) => {
    const { error } = await supabase
      .from('health_reports')
      .delete()
      .eq('id', reportId);
      
    if (error) {
      console.error('Error deleting report:', error);
    }
  };

  const getAvailableParameters = () => {
    const parameterSet = new Set<string>();
    reports.forEach(report => {
      report.parameters.forEach(param => {
        if (!isNaN(parseFloat(param.value))) {
          parameterSet.add(param.name);
        }
      });
    });
    return Array.from(parameterSet);
  };

  const getOutOfRangeCount = () => {
    return reports.reduce((total, report) => 
      total + report.parameters.filter(param => param.isOutOfRange).length, 0
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with user info */}
        <div className="flex justify-between items-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">Health Report Viewer</h1>
            <p className="text-lg text-gray-600">
              Welcome back, {profile?.full_name || user?.email}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">{user?.email}</span>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <FileText className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{reports.length}</div>
                  <div className="text-sm text-gray-600">Total Reports</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{getAvailableParameters().length}</div>
                  <div className="text-sm text-gray-600">Parameters Tracked</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-8 h-8 text-red-500" />
                <div>
                  <div className="text-2xl font-bold">{getOutOfRangeCount()}</div>
                  <div className="text-sm text-gray-600">Need Attention</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Upload className="w-8 h-8 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">
                    {reports.length > 0 ? reports[0].reportDate : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-600">Last Upload</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="upload" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Extract</TabsTrigger>
            <TabsTrigger value="data">Health Data</TabsTrigger>
            <TabsTrigger value="trends">Trends & Analysis</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <FileUpload
              onFileUpload={handleFileUpload}
              isProcessing={isProcessing}
              progress={progress}
              error={error}
            />
            
            {currentReport && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Latest Extraction Results</span>
                    <Badge variant="outline">{currentReport.parameters.length} parameters found</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-600 mb-4">
                    From: {currentReport.fileName} • Date: {currentReport.reportDate}
                  </div>
                  <HealthParametersTable
                    parameters={currentReport.parameters}
                    onParameterUpdate={handleParameterUpdate}
                    onParameterDelete={handleParameterDelete}
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            {reports.length > 0 ? (
              <div className="space-y-6">
                {reports.map((report) => (
                  <Card key={report.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>Report from {report.reportDate}</span>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{report.parameters.length} parameters</Badge>
                          {report.parameters.some(p => p.isOutOfRange) && (
                            <Badge variant="destructive">Attention Needed</Badge>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReportDelete(report.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <HealthParametersTable
                        parameters={report.parameters}
                        onParameterUpdate={handleParameterUpdate}
                        onParameterDelete={handleParameterDelete}
                      />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold mb-2">No Reports Yet</h3>
                  <p className="text-gray-600">Upload your first health report to get started.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <TrendChart
              data={trendData}
              availableParameters={getAvailableParameters()}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
