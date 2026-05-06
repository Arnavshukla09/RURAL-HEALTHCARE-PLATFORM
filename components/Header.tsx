import { Button } from "./ui/button";
import { Menu, X, Heart, Users, Calendar, Phone, Settings, LogOut, MapPin, Activity, AlertTriangle, LayoutDashboard, FileText } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  user: any;
  setUser: (user: any) => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export function Header({ currentPage, setCurrentPage, user, setUser, language, setLanguage }: HeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { key: 'home', label: language === 'en' ? 'Home' : 'होम', icon: Heart },
    { key: 'symptom-checker', label: language === 'en' ? 'Symptoms' : 'लक्षण', icon: Activity },
    { key: 'consultation', label: language === 'en' ? 'Consult' : 'परामर्श', icon: Phone },
    { key: 'records', label: language === 'en' ? 'Records' : 'रिकॉर्ड', icon: FileText },
    { key: 'emergency', label: language === 'en' ? 'Emergency' : 'आपातकाल', icon: AlertTriangle },
    { key: 'locations', label: language === 'en' ? 'Hospitals' : 'अस्पताल', icon: MapPin },
    { key: 'dashboard', label: language === 'en' ? 'Dashboard' : 'डैशबोर्ड', icon: LayoutDashboard },
  ];

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('home');
  };

  return (
    <header className="bg-white border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => setCurrentPage('home')}
          >
            <Heart className="h-8 w-8 text-primary mr-2" />
            <span className="text-xl font-medium text-primary">
              {language === 'en' ? 'RuralHealth' : 'ग्रामीण स्वास्थ्य'}
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={() => setCurrentPage(item.key)}
                  className={`flex items-center space-x-1 px-3 py-2 rounded-md transition-colors ${
                    currentPage === item.key
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Language Toggle */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
              className="hidden sm:inline-flex"
            >
              {language === 'en' ? 'हिं' : 'EN'}
            </Button>

            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {language === 'en' ? `Welcome, ${user.name}` : `स्वागत, ${user.name}`}
                </span>
                {user.role === 'admin' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage('admin')}
                    className="hidden sm:inline-flex"
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {language === 'en' ? 'Admin' : 'प्रशासन'}
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="hidden sm:inline-flex"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  {language === 'en' ? 'Logout' : 'लॉगआउट'}
                </Button>
              </div>
            ) : (
              <Button onClick={() => setCurrentPage('auth')}>
                {language === 'en' ? 'Login' : 'लॉगिन'}
              </Button>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    onClick={() => {
                      setCurrentPage(item.key);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2 w-full px-3 py-2 rounded-md transition-colors ${
                      currentPage === item.key
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-accent hover:text-accent-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              {/* Mobile Language Toggle */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLanguage(language === 'en' ? 'hi' : 'en')}
                className="w-full mt-2"
              >
                {language === 'en' ? 'Switch to Hindi (हिंदी)' : 'Switch to English'}
              </Button>

              {user && (
                <div className="space-y-2 pt-2 border-t border-border">
                  {user.role === 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCurrentPage('admin');
                        setMobileMenuOpen(false);
                      }}
                      className="w-full"
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      {language === 'en' ? 'Admin Panel' : 'प्रशासन पैनल'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    className="w-full"
                  >
                    <LogOut className="h-4 w-4 mr-1" />
                    {language === 'en' ? 'Logout' : 'लॉगआउट'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
