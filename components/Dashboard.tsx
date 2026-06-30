"use client"

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
  UserCheck
} from "lucide-react";
import { ImageWithFallback } from "./ImageWithFallback";
import { createClient } from "@/lib/supabase/client";

interface DashboardProps {
  user: any;
  setCurrentPage: (page: string) => void;
  language: string;
}

export function Dashboard({ user, setCurrentPage, language }: DashboardProps) {
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
  const [userStats, setUserStats] = useState({ consultations: 0, campaigns: 5 });

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
          const { count } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('patient_id', patient.id);
          
          setUserStats(prev => ({ ...prev, consultations: count || 0 }));
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

  // Static campaign data (no campaigns table in DB)
  const upcomingCampaigns = [
    { id: 1, title: language === 'en' ? 'Blood Donation Drive' : 'रक्तदान अभियान', date: '2026-07-16', time: '09:00 AM', location: language === 'en' ? 'Community Center' : 'सामुदायिक केंद्र', type: 'blood-donation', participants: 45 },
    { id: 2, title: language === 'en' ? 'Free Health Checkup' : 'मुफ्त स्वास्थ्य जांच', date: '2026-07-18', time: '10:00 AM', location: language === 'en' ? 'Village Health Center' : 'ग्राम स्वास्थ्य केंद्र', type: 'checkup', participants: 23 },
    { id: 3, title: language === 'en' ? 'COVID Vaccination' : 'कोविड टीकाकरण', date: '2026-07-20', time: '08:30 AM', location: language === 'en' ? 'District Hospital' : 'जिला अस्पताल', type: 'vaccination', participants: 67 },
  ];

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t.quickActions}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button 
                    onClick={() => setCurrentPage('consultation')}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Phone className="h-5 w-5" />
                    <span>{t.bookConsultation}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentPage('directory')}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Users className="h-5 w-5" />
                    <span>{t.viewDirectory}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentPage('campaigns')}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Calendar className="h-5 w-5" />
                    <span>{t.joinCampaign}</span>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={() => setCurrentPage('records')}
                    className="h-16 flex items-center justify-center space-x-2"
                  >
                    <Heart className="h-5 w-5" />
                    <span>{language === 'en' ? 'My Records' : 'मेरे रिकॉर्ड'}</span>
                  </Button>
                </div>
                
                <div className="mt-4">
                  <Button 
                    variant="destructive" 
                    size="lg"
                    className="w-full"
                    onClick={() => alert(language === 'en' ? 'Emergency services contacted!' : 'आपातकालीन सेवाओं से संपर्क किया गया!')}
                  >
                    <AlertCircle className="h-5 w-5 mr-2" />
                    {t.emergencyContact}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Campaigns */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>{t.upcomingCampaigns}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setCurrentPage('campaigns')}>
                  {t.viewAll}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingCampaigns.slice(0, 3).map((campaign) => (
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
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Notifications */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  {t.notifications}
                </CardTitle>
                <Badge variant="secondary">{notifications.length}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div key={notification.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                        <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                          notification.urgent ? 'bg-red-500' : 'bg-blue-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">{notification.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{notification.time}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>{t.noNotifications}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Featured Campaign Image */}
            <Card>
              <CardHeader>
                <CardTitle>{language === 'en' ? 'Featured Campaign' : 'विशेष अभियान'}</CardTitle>
              </CardHeader>
              <CardContent>
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1608243499710-5ebece89a37d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoZWFsdGhjYXJlJTIwY2FtcGFpZ24lMjB2YWNjaW5hdGlvbnxlbnwxfHx8fDE3NTc4NTQzNDN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Healthcare campaign"
                  className="rounded-lg w-full h-32 object-cover mb-4"
                />
                <h4 className="font-medium mb-2">
                  {language === 'en' ? 'Community Health Drive' : 'सामुदायिक स्वास्थ्य अभियान'}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {language === 'en' 
                    ? 'Join our comprehensive health screening program' 
                    : 'हमारे व्यापक स्वास्थ्य जांच कार्यक्रम में शामिल हों'}
                </p>
                <Button size="sm" onClick={() => setCurrentPage('campaigns')}>
                  {language === 'en' ? 'Learn More' : 'और जानें'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
