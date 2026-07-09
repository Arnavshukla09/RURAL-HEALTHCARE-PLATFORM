"use client"

import { useState } from "react";
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
  MessageCircle
} from "lucide-react";


interface DirectoryProps {
  setCurrentPage: (page: string) => void;
  language: string;
}

export function Directory({ setCurrentPage, language }: DirectoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('all');
  const [doctors] = useState([
    { id: '1', name: 'Dr. Ajay Goenka', specialty: 'general', specialtyName: 'General Medicine', experience: 22, rating: 4.6, location: 'AIIMS Bhopal, Saket Nagar', phone: '+91 755-2672355', available: true, verified: true, consultationFee: 0, image: '', bio: 'Senior Consultant, Dept. of General Medicine, AIIMS Bhopal' },
    { id: '2', name: 'Dr. Sanjeev Sharma', specialty: 'cardiology', specialtyName: 'Cardiology', experience: 18, rating: 4.7, location: 'Hamidia Hospital, Bhopal', phone: '+91 755-2540222', available: true, verified: true, consultationFee: 0, image: '', bio: 'Head of Cardiology, Hamidia Hospital (Gandhi Medical College)' },
    { id: '3', name: 'Dr. Priya Verma', specialty: 'pediatrics', specialtyName: 'Pediatrics', experience: 15, rating: 4.8, location: 'Kamla Nehru Hospital, Bhopal', phone: '+91 755-2540570', available: true, verified: true, consultationFee: 0, image: '', bio: 'Associate Professor, Pediatrics, Kamla Nehru Hospital' },
    { id: '4', name: 'Dr. Rakesh Malviya', specialty: 'orthopedics', specialtyName: 'Orthopedics', experience: 20, rating: 4.5, location: 'BMHRC, Bhopal', phone: '+91 755-2742612', available: true, verified: true, consultationFee: 0, image: '', bio: 'Senior Orthopedic Surgeon, Bhopal Memorial Hospital & Research Centre' },
    { id: '5', name: 'Dr. Nidhi Gupta', specialty: 'gynecology', specialtyName: 'Obstetrics & Gynecology', experience: 16, rating: 4.9, location: 'Sultania Zanana Hospital, Bhopal', phone: '+91 755-2540333', available: true, verified: true, consultationFee: 0, image: '', bio: 'Consultant Gynecologist, Sultania Zanana Hospital' },
    { id: '6', name: 'Dr. Vivek Saraswat', specialty: 'cardiology', specialtyName: 'Cardiology', experience: 25, rating: 4.8, location: 'Bansal Hospital, Bhopal', phone: '+91 755-4082222', available: true, verified: true, consultationFee: 500, image: '', bio: 'Director — Cardiology & Interventional Cardiology, Bansal Hospital' },
    { id: '7', name: 'Dr. Asha Bhandari', specialty: 'general', specialtyName: 'General Medicine', experience: 12, rating: 4.4, location: 'District Hospital, Sehore', phone: '+91 7562-224430', available: true, verified: true, consultationFee: 0, image: '', bio: 'Medical Officer, District Hospital Sehore' },
    { id: '8', name: 'Dr. Rajesh Patel', specialty: 'pediatrics', specialtyName: 'Pediatrics', experience: 14, rating: 4.6, location: 'MY Hospital, Indore', phone: '+91 731-2527383', available: true, verified: true, consultationFee: 0, image: '', bio: 'Pediatrics Department, Maharaja Yeshwantrao Hospital, Indore' },
    { id: '9', name: 'Dr. Meena Joshi', specialty: 'gynecology', specialtyName: 'Obstetrics & Gynecology', experience: 19, rating: 4.7, location: 'Chirayu Medical College, Bhopal', phone: '+91 755-6679100', available: true, verified: true, consultationFee: 300, image: '', bio: 'Professor & HOD, OB-GYN, Chirayu Medical College & Hospital' },
    { id: '10', name: 'Dr. Sunil Jain', specialty: 'orthopedics', specialtyName: 'Orthopedics', experience: 23, rating: 4.5, location: 'CHL Hospital, Indore', phone: '+91 731-4710000', available: true, verified: true, consultationFee: 400, image: '', bio: 'Senior Orthopedic & Joint Replacement Surgeon, CHL Hospital Indore' },
    { id: '11', name: 'Dr. Kavita Sharma', specialty: 'general', specialtyName: 'General Medicine', experience: 10, rating: 4.3, location: 'CHC Berasia, Bhopal', phone: '+91 755-2770491', available: true, verified: true, consultationFee: 0, image: '', bio: 'Medical Officer, Community Health Centre Berasia' },
    { id: '12', name: 'Dr. Arun Dubey', specialty: 'cardiology', specialtyName: 'Cardiology', experience: 17, rating: 4.6, location: 'Bombay Hospital, Indore', phone: '+91 731-2558866', available: true, verified: true, consultationFee: 600, image: '', bio: 'Consultant Cardiologist, Bombay Hospital & Research Centre, Indore' },
    { id: '13', name: 'Dr. Sunita Rawat', specialty: 'pediatrics', specialtyName: 'Pediatrics', experience: 11, rating: 4.5, location: 'District Hospital, Vidisha', phone: '+91 7592-234567', available: true, verified: true, consultationFee: 0, image: '', bio: 'Pediatrician, District Hospital Vidisha' },
    { id: '14', name: 'Dr. Manish Tiwari', specialty: 'general', specialtyName: 'General Medicine', experience: 28, rating: 4.9, location: 'AIIMS Bhopal, Saket Nagar', phone: '+91 755-2672355', available: true, verified: true, consultationFee: 0, image: '', bio: 'Professor & Head, Dept. of General Medicine, AIIMS Bhopal' },
    { id: '15', name: 'Dr. Pooja Singh', specialty: 'gynecology', specialtyName: 'Obstetrics & Gynecology', experience: 9, rating: 4.4, location: 'PHC Obedullaganj, Raisen', phone: '+91 7480-255444', available: true, verified: true, consultationFee: 0, image: '', bio: 'Medical Officer (OB-GYN), Primary Health Centre Obedullaganj' },
  ]);

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

  const hospitals = [
    {
      id: 1,
      name: language === 'en' ? 'AIIMS Bhopal' : 'एम्स भोपाल',
      type: 'government',
      location: language === 'en' ? 'Saket Nagar, Bhopal' : 'साकेत नगर, भोपाल',
      phone: '+91 755-2672355',
      emergency: true,
      beds: 900,
      availableBeds: 78,
      rating: 4.7,
      services: ['Emergency', 'Surgery', 'Cardiology', 'Neurology', 'Oncology', 'Pediatrics', 'Trauma Centre'],
      image: ''
    },
    {
      id: 2,
      name: language === 'en' ? 'Hamidia Hospital (GMC)' : 'हमीदिया अस्पताल (जीएमसी)',
      type: 'government',
      location: language === 'en' ? 'Royal Market, Bhopal' : 'रॉयल मार्केट, भोपाल',
      phone: '+91 755-2540222',
      emergency: true,
      beds: 1100,
      availableBeds: 120,
      rating: 4.2,
      services: ['Emergency', 'General Medicine', 'Surgery', 'Orthopedics', 'TB Centre', 'ICU'],
      image: ''
    },
    {
      id: 3,
      name: language === 'en' ? 'Kamla Nehru Hospital' : 'कमला नेहरू अस्पताल',
      type: 'government',
      location: language === 'en' ? 'Arera Hills, Bhopal' : 'अरेरा हिल्स, भोपाल',
      phone: '+91 755-2540570',
      emergency: true,
      beds: 350,
      availableBeds: 40,
      rating: 4.3,
      services: ['Maternity', 'Pediatrics', 'Gynecology', 'NICU', 'General Medicine'],
      image: ''
    },
    {
      id: 4,
      name: language === 'en' ? 'Bansal Hospital' : 'बंसल अस्पताल',
      type: 'private',
      location: language === 'en' ? 'C-Sector, Shahpura, Bhopal' : 'सी-सेक्टर, शाहपुरा, भोपाल',
      phone: '+91 755-4082222',
      emergency: true,
      beds: 300,
      availableBeds: 25,
      rating: 4.5,
      services: ['Cardiology', 'Neurosurgery', 'Orthopedics', 'Cancer Centre', 'ICU', 'Dialysis'],
      image: ''
    },
    {
      id: 5,
      name: language === 'en' ? 'Chirayu Medical College & Hospital' : 'चिरायु मेडिकल कॉलेज एवं अस्पताल',
      type: 'private',
      location: language === 'en' ? 'Bhopal-Indore Highway, Bhopal' : 'भोपाल-इंदौर हाईवे, भोपाल',
      phone: '+91 755-6679100',
      emergency: true,
      beds: 550,
      availableBeds: 45,
      rating: 4.4,
      services: ['Emergency', 'Surgery', 'Cardiology', 'Orthopedics', 'Radiology', 'Pathology'],
      image: ''
    },
    {
      id: 6,
      name: language === 'en' ? 'MY Hospital (Indore)' : 'एम.वाय. अस्पताल (इंदौर)',
      type: 'government',
      location: language === 'en' ? 'MY Hospital Road, Indore' : 'एम.वाय. अस्पताल रोड, इंदौर',
      phone: '+91 731-2527383',
      emergency: true,
      beds: 1000,
      availableBeds: 95,
      rating: 4.1,
      services: ['Emergency', 'General Medicine', 'Surgery', 'Pediatrics', 'Gynecology', 'Trauma'],
      image: ''
    },
    {
      id: 7,
      name: language === 'en' ? 'Bombay Hospital, Indore' : 'बॉम्बे अस्पताल, इंदौर',
      type: 'private',
      location: language === 'en' ? 'Ring Road, Indore' : 'रिंग रोड, इंदौर',
      phone: '+91 731-2558866',
      emergency: true,
      beds: 500,
      availableBeds: 30,
      rating: 4.6,
      services: ['Cardiology', 'Oncology', 'Nephrology', 'Neurology', 'Joint Replacement', 'ICU'],
      image: ''
    },
    {
      id: 8,
      name: language === 'en' ? 'District Hospital, Sehore' : 'जिला अस्पताल, सीहोर',
      type: 'government',
      location: language === 'en' ? 'Civil Lines, Sehore' : 'सिविल लाइन्स, सीहोर',
      phone: '+91 7562-224430',
      emergency: true,
      beds: 120,
      availableBeds: 18,
      rating: 3.8,
      services: ['Emergency', 'General Medicine', 'Maternity', 'Pharmacy'],
      image: ''
    },
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
    setCurrentPage('consultation');
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
