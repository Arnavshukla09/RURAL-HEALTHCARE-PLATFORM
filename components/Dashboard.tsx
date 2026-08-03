"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { 
  Calendar, 
  Users, 
  Phone, 
  Heart, 
  Bell, 
  MapPin, 
  Clock,
  AlertCircle,
  Activity,
  Stethoscope,
  UserCheck,
  ShieldCheck,
  IndianRupee
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { createClient } from "@/lib/supabase/client";

interface DashboardProps {
  user: any;
  language: string;
}

export function Dashboard({ user, language }: DashboardProps) {
  const router = useRouter();
  const content = {
    en: {
      welcome: `Welcome back, ${user.name}!`,
      quickActions: "Quick Actions",
      upcomingCampaigns: "Upcoming Health Campaigns",
      recentActivity: "Recent Activity",
      notifications: "Notifications",
      bookConsultation: "Book Consultation",
      viewDirectory: "Healthcare Directory", 
      joinCampaign: "Join Campaigns",
      donate: "Support Local Healthcare",
      emergencyContact: "Emergency Contact",
      viewAll: "View All",
      noNotifications: "No new notifications",
      campaignReminder: "Blood donation camp tomorrow at Community Center",
      checkupReminder: "Free health checkup available this week",
      vaccinationAlert: "COVID vaccination drive starting Monday",
      stats: {
        consultations: "Consultations",
        campaigns: "Campaigns Joined",
        donations: "Donations Made"
      }
    },
    hi: {
      welcome: `वापसी पर स्वागत है, ${user.name}!`,
      quickActions: "त्वरित कार्य",
      upcomingCampaigns: "आगामी स्वास्थ्य अभियान",
      recentActivity: "हाल की गतिविधि",
      notifications: "सूचनाएं",
      bookConsultation: "परामर्श बुक करें",
      viewDirectory: "स्वास्थ्य निर्देशिका",
      joinCampaign: "अभियानों में शामिल हों",
      donate: "स्थानीय स्वास्थ्य सेवा का समर्थन करें",
      emergencyContact: "आपातकालीन संपर्क",
      viewAll: "सभी देखें",
      noNotifications: "कोई नई सूचना नहीं",
      campaignReminder: "कल सामुदायिक केंद्र में रक्तदान शिविर",
      checkupReminder: "इस सप्ताह मुफ्त स्वास्थ्य जांच उपलब्ध",
      vaccinationAlert: "सोमवार से कोविड टीकाकरण अभियान शुरू",
      stats: {
        consultations: "परामर्श",
        campaigns: "अभियान में शामिल",
        donations: "दान किया"
      }
    }
  };

  const t = content[language as keyof typeof content];

  // State for real data
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userStats, setUserStats] = useState({ consultations: 0, campaigns: 0 });
  const [registeredCamps, setRegisteredCamps] = useState<any[]>([]);

  // Fetch real notifications and stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) return;

        // Fetch notifications
        const { data: notifs } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (notifs) {
          setNotifications(notifs.map(n => ({
            id: n.id,
            message: n.message || n.title,
            time: getTimeAgo(new Date(n.created_at)),
            type: n.type || 'info',
            urgent: n.type === 'alert'
          })));
        }

        // Fetch appointment count for stats
        const { data: patient } = await supabase
          .from('patients')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (patient?.id) {
          // Fetch appointments count
          const apptRes = await fetch('/api/appointments');
          if (apptRes.ok) {
            const apptData = await apptRes.json();
            setUserStats(prev => ({ ...prev, consultations: apptData.appointments?.length || 0 }));
          }

          // Fetch registered camps from medical records
          const recRes = await fetch('/api/medical-records');
          if (recRes.ok) {
            const allRecords = await recRes.json();
            const records = (allRecords || []).filter((r: any) => 
              r.record_type === 'other' && r.content.startsWith('[Camp Registration]')
            );

          if (records) {
            setUserStats(prev => ({ ...prev, campaigns: records.length }));
            setRegisteredCamps(records.map((r: any) => {
              // Parse the string: "[Camp Registration] Name — Address on Date at Time. Contact: X"
              const content = r.content;
              const titleMatch = content.match(/\[Camp Registration\] (.*?) —/);
              const locMatch = content.match(/— (.*?) on /);
              const dateMatch = content.match(/ on (.*?) at /);
              const timeMatch = content.match(/ at (.*?)\. Contact:/);
              
              return {
                id: r.id,
                title: titleMatch ? titleMatch[1] : 'Camp',
                location: locMatch ? locMatch[1] : 'Unknown',
                date: dateMatch ? dateMatch[1] : '',
                time: timeMatch ? timeMatch[1] : '',
                type: 'checkup',
                participants: 1 // just themselves
              };
            }));
          }
          }
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return language === 'en' ? 'Just now' : 'अभी';
    if (diffHrs < 24) return `${diffHrs} ${language === 'en' ? 'hours ago' : 'घंटे पहले'}`;
    const diffDays = Math.floor(diffHrs / 24);
    return `${diffDays} ${language === 'en' ? 'days ago' : 'दिन पहले'}`;
  };

  // Replaced with dynamic registeredCamps
  // const upcomingCampaigns = [...];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 border-2 border-white">
              <AvatarImage src="" />
              <AvatarFallback className="bg-white text-blue-600 text-lg">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">{t.welcome}</h1>
              <p className="text-blue-100">
                {user.role === 'doctor' && (language === 'en' ? 'Healthcare Provider' : 'स्वास्थ्य सेवा प्रदाता')}
                {user.role === 'patient' && (language === 'en' ? 'Community Member' : 'समुदाय सदस्य')}
                {user.role === 'hospital' && (language === 'en' ? 'Hospital Staff' : 'अस्पताल कर्मचारी')}
                {user.role === 'admin' && (language === 'en' ? 'Administrator' : 'प्रशासक')}
              </p>
              {user.location && (
                <div className="flex items-center mt-1 text-blue-100">
                  <MapPin className="h-4 w-4 mr-1" />
                  <span className="text-sm">{user.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className={`grid grid-cols-1 gap-6 ${user.role === 'patient' ? 'md:grid-cols-2 max-w-3xl mx-auto w-full' : 'md:grid-cols-3'}`}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.stats.consultations}</CardTitle>
              <Stethoscope className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.consultations}</div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'This month' : 'इस महीने'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.stats.campaigns}</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.campaigns}</div>
              <p className="text-xs text-muted-foreground">
                {language === 'en' ? 'Total participated' : 'कुल भागीदारी'}
              </p>
            </CardContent>
          </Card>



          {user.role !== 'patient' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {language === 'en' ? 'Patients Helped' : 'मरीजों की मदद की'}
                </CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">324</div>
                <p className="text-xs text-muted-foreground">
                  {language === 'en' ? 'This year' : 'इस साल'}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="max-w-5xl mx-auto w-full">
          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.quickActions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => router.push("/consultation")}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-5 w-5" />
                    <span>{t.bookConsultation}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/directory")}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Users className="h-5 w-5" />
                    <span>{t.viewDirectory}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/camps")}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>{t.joinCampaign}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => router.push(user.role === 'doctor' ? "/doctor/patients" : "/records")}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Heart className="h-5 w-5" />
                    <span>{user.role === 'doctor' ? (language === 'en' ? 'Patient Records' : 'मरीज़ रिकॉर्ड') : (language === 'en' ? 'My Records' : 'मेरे रिकॉर्ड')}</span>
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="destructive" 
                    size="lg"
                    className="w-full"
                    onClick={() => router.push("/emergency")}
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {t.emergencyContact}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Government Schemes */}
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center text-green-800">
                  <ShieldCheck className="h-5 w-5 mr-2" />
                  {language === 'en' ? 'Government Schemes & Support' : 'सरकारी योजनाएं एवं सहायता'}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                  <h4 className="font-bold text-green-700 mb-2">JSSK (Free Delivery)</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="flex items-start"><Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />100% Free delivery & C-Section</li>
                    <li className="flex items-start"><Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />Free drugs and consumables</li>
                    <li className="flex items-start"><Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />Free diet during stay</li>
                  </ul>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm border border-green-100">
                  <h4 className="font-bold text-green-700 mb-2">JSY (Cash Incentive)</h4>
                  <ul className="text-sm space-y-2 text-gray-700">
                    <li className="flex items-start"><IndianRupee className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />₹1400 for Rural Mothers</li>
                    <li className="flex items-start"><IndianRupee className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />₹1000 for Urban Mothers</li>
                    <li className="flex items-start"><Heart className="h-4 w-4 text-green-500 mr-2 shrink-0 mt-0.5" />Promotes institutional delivery</li>
                  </ul>
                </div>
              </CardContent>
              <div className="p-4 pt-0">
                <Button variant="outline" className="w-full text-green-700 border-green-200 hover:bg-green-100" onClick={() => router.push("/health-info/schemes")}>
                  {language === 'en' ? 'View All Government Schemes' : 'सभी सरकारी योजनाएं देखें'}
                </Button>
              </div>
            </Card>

            {/* Upcoming Campaigns */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.upcomingCampaigns}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => router.push("/camps")}>
                  {t.viewAll}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {registeredCamps.length === 0 ? (
                    <div className="text-center p-4 text-gray-500">
                      {language === 'en' ? 'No registered campaigns yet.' : 'अभी तक कोई पंजीकृत अभियान नहीं है।'}
                    </div>
                  ) : (
                    registeredCamps.slice(0, 3).map((campaign) => (
                    <div key={campaign.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        {campaign.type === 'blood-donation' && <Heart className="h-8 w-8 text-red-500" />}
                        {campaign.type === 'checkup' && <Activity className="h-8 w-8 text-blue-500" />}
                        {campaign.type === 'vaccination' && <Stethoscope className="h-8 w-8 text-green-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900">{campaign.title}</h4>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{campaign.date}</span>
                          <Clock className="h-4 w-4 ml-4 mr-1" />
                          <span>{campaign.time}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-500 mt-1">
                          <MapPin className="h-4 w-4 mr-1" />
                          <span>{campaign.location}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        <Badge variant="secondary">{campaign.participants} {language === 'en' ? 'joined' : 'शामिल'}</Badge>
                      </div>
                    </div>
                  ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
