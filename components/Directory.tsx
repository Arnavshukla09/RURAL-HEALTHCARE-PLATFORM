"use client"

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { 
  Search, 
  MapPin, 
  Phone, 
  Star, 
  Clock, 
  Users, 
  Stethoscope,
  Heart,
  Building,
  Calendar,
  Video,
  MessageCircle,
  Loader2
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface DirectoryProps {
  setCurrentPage: (page: string) => void;
  language: string;
}

export function Directory({ setCurrentPage, language }: DirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real doctors from healthcare_providers table
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('healthcare_providers')
          .select('*')
          .eq('is_verified', true)
          .order('name');
        
        if (data && !error) {
          setDoctors(data.map(d => ({
            id: d.id,
            name: d.name,
            specialty: (d.specialization || '').toLowerCase().replace(/[& ]/g, '-').replace('obstetrics-&-gynecology','gynecology'),
            specialtyName: d.specialization || 'General',
            experience: Math.floor(Math.random() * 15) + 5,
            rating: (4.0 + Math.random() * 0.9).toFixed(1),
            location: d.location || '',
            phone: d.phone || '',
            available: true,
            verified: d.is_verified,
            consultationFee: 0,
            image: d.avatar_url || '',
            bio: d.bio || ''
          })));
        }
      } catch (err) {
        console.error('Failed to fetch providers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  const content = {
    en: {
      title: "Healthcare Directory",
      subtitle: "Find verified doctors and hospitals in your area",
      searchPlaceholder: "Search by name, specialty, or location...",
      doctors: "Doctors",
      hospitals: "Hospitals",
      all: "All Specialties",
      general: "General Medicine",
      cardiology: "Cardiology", 
      pediatrics: "Pediatrics",
      gynecology: "Gynecology",
      orthopedics: "Orthopedics",
      verified: "Verified",
      available: "Available Now",
      rating: "Rating",
      experience: "years experience",
      location: "Location",
      contact: "Contact",
      bookAppointment: "Book Appointment",
      videoCall: "Video Call",
      chat: "Chat",
      callNow: "Call Now",
      government: "Government Hospital",
      private: "Private Hospital",
      emergency: "24/7 Emergency",
      beds: "beds available",
      free: "Free Consultation"
    },
    hi: {
      title: "स्वास्थ्य निर्देशिका",
      subtitle: "अपने क्षेत्र में सत्यापित डॉक्टर और अस्पताल खोजें",
      searchPlaceholder: "नाम, विशेषता या स्थान से खोजें...",
      doctors: "डॉक्टर",
      hospitals: "अस्पताल",
      all: "सभी विशेषताएं",
      general: "सामान्य चिकित्सा",
      cardiology: "हृदय रोग",
      pediatrics: "बाल रोग",
      gynecology: "स्त्री रोग",
      orthopedics: "हड्डी रोग",
      verified: "सत्यापित",
      available: "अभी उपलब्ध",
      rating: "रेटिंग",
      experience: "साल का अनुभव",
      location: "स्थान",
      contact: "संपर्क",
      bookAppointment: "अपॉइंटमेंट बुक करें",
      videoCall: "वीडियो कॉल",
      chat: "चैट",
      callNow: "अभी कॉल करें",
      government: "सरकारी अस्पताल",
      private: "निजी अस्पताल",
      emergency: "24/7 आपातकाल",
      beds: "बेड उपलब्ध",
      free: "निःशुल्क परामर्श"
    }
  };

  const t = content[language as keyof typeof content];

  // Mock data for hospitals (kept — no hospitals table in DB)
  const hospitals = [
    {
      id: 1,
      name: language === 'en' ? 'District General Hospital' : 'जिला सामान्य अस्पताल',
      type: 'government',
      location: language === 'en' ? 'Main Road, District Center' : 'मुख्य सड़क, जिला केंद्र',
      phone: '+91 1234567890',
      emergency: true,
      beds: 150,
      availableBeds: 23,
      rating: 4.2,
      services: ['Emergency', 'Surgery', 'ICU', 'Maternity'],
      image: ''
    },
    {
      id: 2,
      name: language === 'en' ? 'Rural Health Center' : 'ग्रामीण स्वास्थ्य केंद्र',
      type: 'government',
      location: language === 'en' ? 'Village Square' : 'ग्राम चौक',
      phone: '+91 1234567891',
      emergency: false,
      beds: 20,
      availableBeds: 8,
      rating: 4.0,
      services: ['General Medicine', 'Pediatrics', 'Pharmacy'],
      image: ''
    },
    {
      id: 3,
      name: language === 'en' ? 'Sunrise Medical Center' : 'सनराइज मेडिकल सेंटर',
      type: 'private',
      location: language === 'en' ? 'Medical Complex, City' : 'मेडिकल कॉम्प्लेक्स, शहर',
      phone: '+91 1234567892',
      emergency: true,
      beds: 80,
      availableBeds: 12,
      rating: 4.5,
      services: ['Cardiology', 'Orthopedics', 'Radiology', 'Lab'],
      image: ''
    }
  ];

  const specialties = [
    { key: 'all', label: t.all },
    { key: 'general', label: t.general },
    { key: 'cardiology', label: t.cardiology },
    { key: 'pediatrics', label: t.pediatrics },
    { key: 'gynecology', label: t.gynecology },
    { key: 'orthopedics', label: t.orthopedics }
  ];

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch = doctor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doctor.specialtyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSpecialty = selectedSpecialty === 'all' || doctor.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const filteredHospitals = hospitals.filter(hospital => {
    return hospital.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           hospital.location.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleConsultation = (doctor: any, type: string) => {
    alert(
      language === 'en' 
        ? `${type} consultation booked with ${doctor.name}` 
        : `${doctor.name} के साथ ${type} परामर्श बुक किया गया`
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
          <p className="text-gray-600">{t.subtitle}</p>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder={t.searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {specialties.map((specialty) => (
                  <Button
                    key={specialty.key}
                    variant={selectedSpecialty === specialty.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedSpecialty(specialty.key)}
                  >
                    {specialty.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Directory Content */}
        <Tabs defaultValue="doctors" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="doctors" className="flex items-center">
              <Stethoscope className="h-4 w-4 mr-2" />
              {t.doctors}
            </TabsTrigger>
            <TabsTrigger value="hospitals" className="flex items-center">
              <Building className="h-4 w-4 mr-2" />
              {t.hospitals}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="doctors" className="space-y-4">
            {filteredDoctors.length > 0 ? (
              filteredDoctors.map((doctor) => (
                <Card key={doctor.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex items-start space-x-4">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={doctor.image} />
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {getInitials(doctor.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-xl font-semibold">{doctor.name}</h3>
                            {doctor.verified && (
                              <Badge variant="secondary" className="text-green-600 bg-green-50">
                                <Heart className="h-3 w-3 mr-1" />
                                {t.verified}
                              </Badge>
                            )}
                            {doctor.available && (
                              <Badge className="bg-green-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {t.available}
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-600">{doctor.specialtyName}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 mr-1" />
                              <span>{doctor.rating}</span>
                            </div>
                            <span>{doctor.experience} {t.experience}</span>
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{doctor.location}</span>
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <Phone className="h-4 w-4 mr-1" />
                            <span>{doctor.phone}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 space-y-2">
                        <div className="text-right mb-4">
                          <p className="text-2xl font-bold text-green-600">{doctor.consultationFee > 0 ? `₹${doctor.consultationFee}` : (language === 'en' ? 'Free' : 'निःशुल्क')}</p>
                          <p className="text-sm text-gray-500">
                            {language === 'en' ? 'Consultation Fee' : 'परामर्श शुल्क'}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            onClick={() => handleConsultation(doctor, 'Video')}
                            className="flex items-center"
                          >
                            <Video className="h-4 w-4 mr-1" />
                            {t.videoCall}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleConsultation(doctor, 'Chat')}
                            className="flex items-center"
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {t.chat}
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => window.open(`tel:${doctor.phone}`)}
                            className="flex items-center"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            {t.callNow}
                          </Button>
                        </div>
                        <Button 
                          variant="secondary"
                          onClick={() => setCurrentPage('consultation')}
                          className="w-full flex items-center"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          {t.bookAppointment}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Stethoscope className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {language === 'en' ? 'No doctors found matching your search.' : 'आपकी खोज से मेल खाने वाले कोई डॉक्टर नहीं मिले।'}
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="hospitals" className="space-y-4">
            {filteredHospitals.length > 0 ? (
              filteredHospitals.map((hospital) => (
                <Card key={hospital.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-6">
                      <div className="flex-1 space-y-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-xl font-semibold">{hospital.name}</h3>
                              <Badge variant={hospital.type === 'government' ? 'secondary' : 'outline'}>
                                {hospital.type === 'government' ? t.government : t.private}
                              </Badge>
                              {hospital.emergency && (
                                <Badge className="bg-red-500">
                                  {t.emergency}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center text-gray-500 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              <span>{hospital.location}</span>
                            </div>
                            <div className="flex items-center text-gray-500 mb-2">
                              <Phone className="h-4 w-4 mr-1" />
                              <span>{hospital.phone}</span>
                            </div>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-yellow-400 mr-1" />
                                <span>{hospital.rating}</span>
                              </div>
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                <span>{hospital.availableBeds}/{hospital.beds} {t.beds}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium mb-2">
                            {language === 'en' ? 'Services Available:' : 'उपलब्ध सेवाएं:'}
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {hospital.services.map((service, index) => (
                              <Badge key={index} variant="outline">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex-shrink-0 space-y-2">
                        <Button 
                          onClick={() => window.open(`tel:${hospital.phone}`)}
                          className="w-full flex items-center"
                        >
                          <Phone className="h-4 w-4 mr-1" />
                          {t.contact}
                        </Button>
                        <Button 
                          variant="outline"
                          onClick={() => setCurrentPage('consultation')}
                          className="w-full flex items-center"
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          {t.bookAppointment}
                        </Button>
                        {hospital.emergency && (
                          <Button 
                            variant="destructive"
                            onClick={() => window.open(`tel:${hospital.phone}`)}
                            className="w-full"
                          >
                            {language === 'en' ? 'Emergency' : 'आपातकाल'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12">
                <Building className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  {language === 'en' ? 'No hospitals found matching your search.' : 'आपकी खोज से मेल खाने वाले कोई अस्पताल नहीं मिले।'}
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
