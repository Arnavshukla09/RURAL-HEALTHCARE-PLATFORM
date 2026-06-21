"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  FileText, Activity, Upload, Download, Calendar, 
  Thermometer, Heart, Droplets, Eye, Loader2, AlertCircle
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface PatientRecordsProps {
  language: string;
}

export function PatientRecords({ language }: PatientRecordsProps) {
  const [records, setRecords] = useState<any[]>([]);
  const [healthData, setHealthData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const content = {
    en: {
      title: 'My Medical Records',
      subtitle: 'View and manage your health information',
      vitals: {
        title: 'Latest Vitals',
        bp: 'Blood Pressure',
        temp: 'Temperature',
        pulse: 'Pulse Rate',
        sugar: 'Blood Sugar',
        hb: 'Hemoglobin',
        weight: 'Weight',
        spo2: 'SpO₂',
        recorded: 'Last recorded'
      },
      records: {
        title: 'Medical Records',
        diagnosis: 'Diagnosis',
        prescription: 'Prescription',
        lab_result: 'Lab Result',
        vaccination: 'Vaccination',
        other: 'Other',
        noRecords: 'No medical records found'
      },
      loading: 'Loading your records...',
      error: 'Could not load records. Please try again.'
    },
    hi: {
      title: 'मेरे चिकित्सा रिकॉर्ड',
      subtitle: 'अपनी स्वास्थ्य जानकारी देखें और प्रबंधित करें',
      vitals: {
        title: 'नवीनतम संकेत',
        bp: 'रक्तचाप',
        temp: 'तापमान',
        pulse: 'नाड़ी दर',
        sugar: 'रक्त शर्करा',
        hb: 'हीमोग्लोबिन',
        weight: 'वजन',
        spo2: 'SpO₂',
        recorded: 'अंतिम रिकॉर्ड'
      },
      records: {
        title: 'चिकित्सा रिकॉर्ड',
        diagnosis: 'निदान',
        prescription: 'प्रिस्क्रिप्शन',
        lab_result: 'लैब रिपोर्ट',
        vaccination: 'टीकाकरण',
        other: 'अन्य',
        noRecords: 'कोई चिकित्सा रिकॉर्ड नहीं मिला'
      },
      loading: 'आपके रिकॉर्ड लोड हो रहे हैं...',
      error: 'रिकॉर्ड लोड नहीं हो सके। कृपया पुनः प्रयास करें।'
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError(language === 'en' ? 'Please login to view records' : 'रिकॉर्ड देखने के लिए लॉगिन करें');
          setLoading(false);
          return;
        }

        // Get patient ID
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (patient?.id) {
          // Fetch medical records
          const { data: medRecords } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patient.id)
            .order('created_at', { ascending: false });
          setRecords(medRecords || []);

          // Fetch health data (vitals)
          const { data: vitals } = await supabase
            .from('health_data')
            .select('*')
            .eq('patient_id', patient.id)
            .order('recorded_at', { ascending: false });
          setHealthData(vitals || []);
        }
      } catch (err) {
        setError(t.error);
        console.error('Failed to fetch records:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Get latest value for each vital type
  const getLatestVital = (dataType: string) => {
    const entry = healthData.find(d => d.data_type === dataType);
    return entry ? { value: entry.value, unit: entry.unit || '', date: entry.recorded_at, notes: entry.notes } : null;
  };

  const latestBpSys = getLatestVital('blood_pressure_systolic');
  const latestBpDia = getLatestVital('blood_pressure_diastolic');
  const latestTemp = getLatestVital('temperature');
  const latestHr = getLatestVital('heart_rate');
  const latestSugar = getLatestVital('blood_sugar_fasting');
  const latestHb = getLatestVital('hemoglobin');
  const latestWeight = getLatestVital('weight');
  const latestSpo2 = getLatestVital('oxygen_saturation');

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(language === 'en' ? 'en-IN' : 'hi-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const recordTypeColors: Record<string, string> = {
    diagnosis: 'bg-blue-100 text-blue-700',
    prescription: 'bg-green-100 text-green-700',
    lab_result: 'bg-purple-100 text-purple-700',
    vaccination: 'bg-amber-100 text-amber-700',
    other: 'bg-gray-100 text-gray-700'
  };

  const recordTypeLabels = t.records as Record<string, string>;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-600 mx-auto mb-3" />
          <p className="text-gray-500">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Latest Vitals */}
        {healthData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                {t.vitals.title}
              </CardTitle>
              {latestBpSys && (
                <CardDescription>{t.vitals.recorded}: {formatDate(latestBpSys.date)}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {latestBpSys && latestBpDia && (
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <Heart className="h-7 w-7 text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.bp}</p>
                    <p className="text-xl font-bold text-gray-900">{latestBpSys.value}/{latestBpDia.value}</p>
                    <p className="text-xs text-gray-400">mmHg</p>
                  </div>
                )}
                {latestTemp && (
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <Thermometer className="h-7 w-7 text-red-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.temp}</p>
                    <p className="text-xl font-bold text-gray-900">{latestTemp.value}</p>
                    <p className="text-xs text-gray-400">{latestTemp.unit}</p>
                  </div>
                )}
                {latestHr && (
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <Activity className="h-7 w-7 text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.pulse}</p>
                    <p className="text-xl font-bold text-gray-900">{latestHr.value}</p>
                    <p className="text-xs text-gray-400">{latestHr.unit}</p>
                  </div>
                )}
                {latestSugar && (
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <Droplets className="h-7 w-7 text-purple-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.sugar}</p>
                    <p className="text-xl font-bold text-gray-900">{latestSugar.value}</p>
                    <p className="text-xs text-gray-400">{latestSugar.unit}</p>
                  </div>
                )}
                {latestHb && (
                  <div className="text-center p-4 bg-orange-50 rounded-lg">
                    <Droplets className="h-7 w-7 text-orange-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.hb}</p>
                    <p className="text-xl font-bold text-gray-900">{latestHb.value}</p>
                    <p className="text-xs text-gray-400">{latestHb.unit}</p>
                  </div>
                )}
                {latestWeight && (
                  <div className="text-center p-4 bg-teal-50 rounded-lg">
                    <Activity className="h-7 w-7 text-teal-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.weight}</p>
                    <p className="text-xl font-bold text-gray-900">{latestWeight.value}</p>
                    <p className="text-xs text-gray-400">{latestWeight.unit}</p>
                  </div>
                )}
                {latestSpo2 && (
                  <div className="text-center p-4 bg-cyan-50 rounded-lg">
                    <Activity className="h-7 w-7 text-cyan-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 mb-1">{t.vitals.spo2}</p>
                    <p className="text-xl font-bold text-gray-900">{latestSpo2.value}</p>
                    <p className="text-xs text-gray-400">{latestSpo2.unit}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Medical Records */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-primary" />
              {t.records.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {records.length > 0 ? (
              records.map((record) => (
                <div key={record.id} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <Badge className={`text-xs ${recordTypeColors[record.record_type] || recordTypeColors.other}`}>
                      {recordTypeLabels[record.record_type] || record.record_type}
                    </Badge>
                    <span className="text-xs text-gray-500">{formatDate(record.created_at)}</span>
                  </div>
                  <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {record.content}
                  </pre>
                  {record.file_url && (
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'View' : 'देखें'}
                      </Button>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4 mr-1" />
                        {language === 'en' ? 'Download' : 'डाउनलोड'}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">{t.records.noRecords}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
