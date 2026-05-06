import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Users, Activity, Thermometer, Heart, Droplets, 
  User, Home, RefreshCw, WifiOff, CheckCircle, Upload
} from 'lucide-react';

interface LHFModuleProps {
  language: string;
}

export function LHFModule({ language }: LHFModuleProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingSync, setPendingSync] = useState(3);
  const [selectedTab, setSelectedTab] = useState('dashboard');

  const content = {
    en: {
      title: 'Local Health Facilitator Dashboard',
      subtitle: 'Manage patient visits and health data',
      tabs: {
        dashboard: 'Dashboard',
        captureVitals: 'Capture Vitals',
        captureSymptoms: 'Capture Symptoms',
        householdVisit: 'Household Visit',
        syncData: 'Sync Data'
      },
      stats: {
        todayVisits: 'Today\'s Visits',
        pendingSync: 'Pending Sync',
        totalPatients: 'Total Patients'
      },
      vitals: {
        title: 'Capture Patient Vitals',
        patientName: 'Patient Name',
        temperature: 'Temperature (°F)',
        bloodPressure: 'Blood Pressure',
        pulse: 'Pulse (bpm)',
        bloodSugar: 'Blood Sugar (mg/dL)',
        notes: 'Notes',
        save: 'Save Vitals',
        savedOffline: 'Saved offline - will sync when online'
      },
      symptoms: {
        title: 'Capture Symptoms',
        selectSymptoms: 'Select symptoms observed',
        fever: 'Fever',
        cough: 'Cough',
        breathing: 'Breathing Difficulty',
        pain: 'Pain',
        weakness: 'Weakness',
        dizziness: 'Dizziness'
      },
      household: {
        title: 'Household Visit Summary',
        householdId: 'Household ID',
        members: 'Family Members',
        recordVisit: 'Record Visit'
      },
      sync: {
        title: 'Offline Data Sync',
        pendingRecords: 'pending records to sync',
        syncNow: 'Sync Now',
        syncing: 'Syncing...',
        lastSync: 'Last synced',
        allSynced: 'All data synced successfully'
      }
    },
    hi: {
      title: 'स्थानीय स्वास्थ्य सुविधाकर्ता डैशबोर्ड',
      subtitle: 'रोगी यात्राओं और स्वास्थ्य डेटा का प्रबंधन करें',
      tabs: {
        dashboard: 'डैशबोर्ड',
        captureVitals: 'संकेत कैप्चर करें',
        captureSymptoms: 'लक्षण कैप्चर करें',
        householdVisit: 'घरेलू यात्रा',
        syncData: 'डेटा सिंक करें'
      },
      stats: {
        todayVisits: 'आज की यात्राएं',
        pendingSync: 'लंबित सिंक',
        totalPatients: 'कुल मरीज़'
      },
      vitals: {
        title: 'रोगी संकेत कैप्चर करें',
        patientName: 'रोगी का नाम',
        temperature: 'तापमान (°F)',
        bloodPressure: 'रक्तचाप',
        pulse: 'नाड़ी (bpm)',
        bloodSugar: 'रक्त शर्करा (mg/dL)',
        notes: 'नोट्स',
        save: 'संकेत सहेजें',
        savedOffline: 'ऑफ़लाइन सहेजा गया - ऑनलाइन होने पर सिंक होगा'
      },
      symptoms: {
        title: 'लक्षण कैप्चर करें',
        selectSymptoms: 'देखे गए लक्षण चुनें',
        fever: 'बुखार',
        cough: 'खांसी',
        breathing: 'सांस लेने में कठिनाई',
        pain: 'दर्द',
        weakness: 'कमजोरी',
        dizziness: 'चक्कर'
      },
      household: {
        title: 'घरेलू यात्रा सारांश',
        householdId: 'घरेलू आईडी',
        members: 'परिवार के सदस्य',
        recordVisit: 'यात्रा दर्ज करें'
      },
      sync: {
        title: 'ऑफ़लाइन डेटा सिंक',
        pendingRecords: 'सिंक करने के लिए लंबित रिकॉर्ड',
        syncNow: 'अभी सिंक करें',
        syncing: 'सिंक हो रहा है...',
        lastSync: 'अंतिम सिंक',
        allSynced: 'सभी डेटा सफलतापूर्वक सिंक किया गया'
      }
    }
  };

  const t = content[language as keyof typeof content] || content.en;

  const tabs = [
    { id: 'dashboard', label: t.tabs.dashboard },
    { id: 'vitals', label: t.tabs.captureVitals },
    { id: 'symptoms', label: t.tabs.captureSymptoms },
    { id: 'household', label: t.tabs.householdVisit },
    { id: 'sync', label: t.tabs.syncData }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Offline Indicator */}
        {isOffline && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-4 flex items-center gap-3">
              <WifiOff className="h-5 w-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">
                {language === 'en' ? 'Offline Mode - Data will sync when connected' : 'ऑफ़लाइन मोड - कनेक्ट होने पर डेटा सिंक होगा'}
              </span>
            </CardContent>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant={selectedTab === tab.id ? 'default' : 'outline'}
              onClick={() => setSelectedTab(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Dashboard */}
        {selectedTab === 'dashboard' && (
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t.stats.todayVisits}
                  <Users className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">12</p>
                <p className="text-sm text-green-600">+3 {language === 'en' ? 'from yesterday' : 'कल से'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t.stats.pendingSync}
                  <RefreshCw className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{pendingSync}</p>
                <p className="text-sm text-yellow-600">{language === 'en' ? 'records' : 'रिकॉर्ड'}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {t.stats.totalPatients}
                  <User className="h-5 w-5 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">156</p>
                <p className="text-sm text-blue-600">{language === 'en' ? 'this month' : 'इस महीने'}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Capture Vitals */}
        {selectedTab === 'vitals' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2 text-primary" />
                {t.vitals.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t.vitals.patientName}</label>
                  <Input placeholder={language === 'en' ? 'Enter patient name' : 'रोगी का नाम दर्ज करें'} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.vitals.temperature}</label>
                  <div className="flex items-center gap-2">
                    <Thermometer className="h-5 w-5 text-red-500" />
                    <Input type="number" placeholder="98.6" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.vitals.bloodPressure}</label>
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-500" />
                    <Input placeholder="120/80" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.vitals.pulse}</label>
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-green-500" />
                    <Input type="number" placeholder="72" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">{t.vitals.bloodSugar}</label>
                  <div className="flex items-center gap-2">
                    <Droplets className="h-5 w-5 text-purple-500" />
                    <Input type="number" placeholder="95" />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">{t.vitals.notes}</label>
                <Input placeholder={language === 'en' ? 'Additional notes' : 'अतिरिक्त नोट्स'} />
              </div>
              <Button className="w-full">
                <CheckCircle className="mr-2 h-4 w-4" />
                {t.vitals.save}
              </Button>
              {isOffline && (
                <p className="text-sm text-yellow-600 text-center">{t.vitals.savedOffline}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Sync Data */}
        {selectedTab === 'sync' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-primary" />
                {t.sync.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {pendingSync > 0 ? (
                <>
                  <div className="text-center p-6 bg-yellow-50 rounded-lg">
                    <Upload className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
                    <p className="text-xl font-bold mb-2">{pendingSync} {t.sync.pendingRecords}</p>
                    <Button onClick={() => setPendingSync(0)}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {t.sync.syncNow}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-green-50 rounded-lg">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                  <p className="text-xl font-bold mb-2">{t.sync.allSynced}</p>
                  <p className="text-sm text-gray-600">{t.sync.lastSync}: 2025-11-30 10:30 AM</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
