import { useState } from "react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { 
  Accessibility, 
  Type, 
  Eye, 
  Volume2, 
  Contrast,
  ChevronUp,
  ChevronDown
} from "lucide-react";

interface AccessibilityBarProps {
  language: string;
  setLanguage: (lang: string) => void;
}

export function AccessibilityBar({ language, setLanguage }: AccessibilityBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [highContrast, setHighContrast] = useState(false);

  const content = {
    en: {
      accessibility: "Accessibility Options",
      fontSize: "Font Size",
      increase: "Increase",
      decrease: "Decrease",
      contrast: "High Contrast",
      on: "On",
      off: "Off",
      language: "Language",
      english: "English",
      hindi: "हिंदी",
      readAloud: "Read Aloud",
      reset: "Reset Settings"
    },
    hi: {
      accessibility: "पहुंच विकल्प",
      fontSize: "फ़ॉन्ट आकार",
      increase: "बढ़ाएं",
      decrease: "घटाएं",
      contrast: "उच्च कंट्रास्ट",
      on: "चालू",
      off: "बंद",
      language: "भाषा",
      english: "English",
      hindi: "हिंदी",
      readAloud: "जोर से पढ़ें",
      reset: "सेटिंग्स रीसेट करें"
    }
  };

  const t = content[language as keyof typeof content];

  const adjustFontSize = (direction: 'increase' | 'decrease') => {
    const newSize = direction === 'increase' ? fontSize + 2 : fontSize - 2;
    const clampedSize = Math.max(12, Math.min(24, newSize));
    setFontSize(clampedSize);
    document.documentElement.style.setProperty('--font-size', `${clampedSize}px`);
  };

  const toggleHighContrast = () => {
    setHighContrast(!highContrast);
    document.documentElement.classList.toggle('high-contrast', !highContrast);
  };

  const resetSettings = () => {
    setFontSize(16);
    setHighContrast(false);
    document.documentElement.style.setProperty('--font-size', '16px');
    document.documentElement.classList.remove('high-contrast');
  };

  const speakText = () => {
    if ('speechSynthesis' in window) {
      const text = document.body.innerText;
      const utterance = new SpeechSynthesisUtterance(text.substring(0, 200) + '...');
      utterance.lang = language === 'en' ? 'en-US' : 'hi-IN';
      speechSynthesis.speak(utterance);
    } else {
      alert(language === 'en' 
        ? 'Speech synthesis not supported in this browser' 
        : 'इस ब्राउज़र में वाक् संश्लेषण समर्थित नहीं है');
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <Button
        className="fixed top-20 left-4 z-50 rounded-full w-12 h-12 bg-purple-600 hover:bg-purple-700 shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Accessibility className="h-5 w-5" />
      </Button>

      {/* Accessibility Panel */}
      {isOpen && (
        <Card className="fixed top-36 left-4 z-40 w-80 shadow-xl border-2 border-purple-200">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center">
                <Accessibility className="h-4 w-4 mr-2" />
                {t.accessibility}
              </h3>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsOpen(false)}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Font Size Controls */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <Type className="h-4 w-4 mr-2" />
                  {t.fontSize}
                </span>
                <span className="text-sm text-gray-500">{fontSize}px</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustFontSize('decrease')}
                  disabled={fontSize <= 12}
                >
                  {t.decrease}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => adjustFontSize('increase')}
                  disabled={fontSize >= 24}
                >
                  {t.increase}
                </Button>
              </div>
            </div>

            {/* High Contrast Toggle */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center">
                  <Contrast className="h-4 w-4 mr-2" />
                  {t.contrast}
                </span>
                <Button
                  size="sm"
                  variant={highContrast ? "default" : "outline"}
                  onClick={toggleHighContrast}
                >
                  {highContrast ? t.on : t.off}
                </Button>
              </div>
            </div>

            {/* Language Toggle */}
            <div className="space-y-2">
              <span className="text-sm font-medium block">{t.language}</span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={language === 'en' ? "default" : "outline"}
                  onClick={() => setLanguage('en')}
                >
                  {t.english}
                </Button>
                <Button
                  size="sm"
                  variant={language === 'hi' ? "default" : "outline"}
                  onClick={() => setLanguage('hi')}
                >
                  {t.hindi}
                </Button>
              </div>
            </div>

            {/* Read Aloud */}
            <div className="space-y-2">
              <Button
                size="sm"
                variant="outline"
                onClick={speakText}
                className="w-full flex items-center justify-center"
              >
                <Volume2 className="h-4 w-4 mr-2" />
                {t.readAloud}
              </Button>
            </div>

            {/* Reset Button */}
            <div className="pt-2 border-t">
              <Button
                size="sm"
                variant="secondary"
                onClick={resetSettings}
                className="w-full"
              >
                {t.reset}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* High Contrast Styles */}
      <style>{`
        .high-contrast {
          --background: #000000 !important;
          --foreground: #ffffff !important;
          --card: #000000 !important;
          --card-foreground: #ffffff !important;
          --primary: #ffffff !important;
          --primary-foreground: #000000 !important;
          --secondary: #333333 !important;
          --secondary-foreground: #ffffff !important;
          --muted: #333333 !important;
          --muted-foreground: #cccccc !important;
          --accent: #666666 !important;
          --accent-foreground: #ffffff !important;
          --border: #ffffff !important;
        }
        
        .high-contrast * {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
          border-color: var(--border) !important;
        }
        
        .high-contrast button {
          background-color: var(--primary) !important;
          color: var(--primary-foreground) !important;
          border: 2px solid var(--border) !important;
        }
        
        .high-contrast input, .high-contrast textarea {
          background-color: var(--background) !important;
          color: var(--foreground) !important;
          border: 2px solid var(--border) !important;
        }
      `}</style>
    </>
  );
}
