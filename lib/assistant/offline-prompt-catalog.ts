import type { AssistantLanguageCode } from "./languages"

const en = {
  offlineTitle: "Connection problem", offlineGuidance: "You can try the pages already saved on this device. An appointment is confirmed only after the service accepts it online.",
  offlineCallsNote: "These buttons open the phone dialler. A call needs telephone service; tapping does not dispatch help.",
  offlineVoiceNote: "Spoken guidance needs a matching device voice or an available local voice service. Saving this page alone does not install a voice.",
  offlineSavedTitle: "Try your saved pages", offlineSymptomsNote: "Use the built-in symptom questions. This is not a diagnosis.",
  offlineEmergencyNote: "In a serious emergency, do not wait for the internet or this app.", retryConnection: "Retry connection", home: "Home",
  call112: "Call 112: emergency help", mentalHealthCall: "Call 14416: mental health support", stateHealthCall: "Call 104: state health advice",
}
export type OfflinePromptKey = keyof typeof en
export const OFFLINE_PROMPTS: Record<AssistantLanguageCode, Record<OfflinePromptKey, string>> = {
  en,
  hi: {
    offlineTitle: "कनेक्शन में समस्या", offlineGuidance: "इस उपकरण में सहेजे पृष्ठ खोल सकते हैं। अपॉइंटमेंट तभी पक्का होगा जब सेवा इंटरनेट पर उसे स्वीकार करे।",
    offlineCallsNote: "ये बटन फोन डायलर खोलते हैं। कॉल के लिए फोन सेवा चाहिए। बटन छूने से मदद भेजी नहीं जाती।", offlineVoiceNote: "बोलकर मदद के लिए आपकी भाषा की उपकरण आवाज़ या स्थानीय आवाज़ सेवा चाहिए। पृष्ठ सहेजने से आवाज़ स्थापित नहीं होती।",
    offlineSavedTitle: "सहेजे पृष्ठ खोलें", offlineSymptomsNote: "लक्षणों के दिए प्रश्नों का उपयोग करें। यह निदान नहीं है।", offlineEmergencyNote: "गंभीर आपातकाल में इंटरनेट या इस ऐप का इंतज़ार न करें।", retryConnection: "कनेक्शन फिर जाँचें", home: "मुख्य पृष्ठ",
    call112: "112: आपातकालीन मदद", mentalHealthCall: "14416: मानसिक स्वास्थ्य मदद", stateHealthCall: "104: राज्य स्वास्थ्य सलाह",
  },
  mr: {
    offlineTitle: "जोडणीची समस्या", offlineGuidance: "या उपकरणावर जतन केलेली पाने उघडू शकता. सेवा इंटरनेटवर विनंती स्वीकारेल तेव्हाच भेट निश्चित होईल.",
    offlineCallsNote: "ही बटणे फोन डायलर उघडतात. कॉलसाठी फोन सेवा लागते. बटण दाबल्याने मदत पाठवली जात नाही.", offlineVoiceNote: "बोलून मदत मिळण्यासाठी तुमच्या भाषेचा उपकरणावरील आवाज किंवा स्थानिक आवाज सेवा लागते. पान जतन केल्याने आवाज स्थापित होत नाही.",
    offlineSavedTitle: "जतन केलेली पाने उघडा", offlineSymptomsNote: "दिलेल्या लक्षणांच्या प्रश्नांचा वापर करा. हे निदान नाही.", offlineEmergencyNote: "गंभीर आणीबाणीत इंटरनेट किंवा या ॲपची वाट पाहू नका.", retryConnection: "जोडणी पुन्हा तपासा", home: "मुख्य पान",
    call112: "112: तातडीची मदत", mentalHealthCall: "14416: मानसिक आरोग्य मदत", stateHealthCall: "104: राज्य आरोग्य सल्ला",
  },
  bn: {
    offlineTitle: "সংযোগে সমস্যা", offlineGuidance: "এই যন্ত্রে সংরক্ষিত পাতাগুলি খোলার চেষ্টা করতে পারেন। অনলাইনে সেবা অনুরোধ গ্রহণ করলে তবেই বুকিং নিশ্চিত হবে।",
    offlineCallsNote: "এই বোতামগুলি ফোন ডায়ালার খোলে। কল করতে টেলিফোন সেবা লাগে। চাপ দিলে সাহায্য পাঠানো হয় না।", offlineVoiceNote: "কথা শুনতে আপনার ভাষার যন্ত্রের কণ্ঠ বা স্থানীয় কণ্ঠসেবা চাই। পাতা সংরক্ষণ করলেই কণ্ঠ ইনস্টল হয় না।",
    offlineSavedTitle: "সংরক্ষিত পাতা খুলুন", offlineSymptomsNote: "লক্ষণের প্রশ্নগুলি ব্যবহার করুন। এটি রোগনির্ণয় নয়।", offlineEmergencyNote: "গুরুতর জরুরি অবস্থায় ইন্টারনেট বা এই অ্যাপের অপেক্ষা করবেন না।", retryConnection: "সংযোগ আবার দেখুন", home: "মূল পাতা",
    call112: "112: জরুরি সাহায্য", mentalHealthCall: "14416: মানসিক স্বাস্থ্য সহায়তা", stateHealthCall: "104: রাজ্যের স্বাস্থ্য পরামর্শ",
  },
  te: {
    offlineTitle: "కనెక్షన్ సమస్య", offlineGuidance: "ఈ పరికరంలో దాచిన పేజీలను తెరవవచ్చు. సేవ ఆన్‌లైన్‌లో అభ్యర్థనను అంగీకరించిన తరువాతే అపాయింట్మెంట్ నిర్ధారించబడుతుంది.",
    offlineCallsNote: "ఈ బటన్లు ఫోన్ డయలర్ తెరుస్తాయి. కాల్‌కు ఫోన్ సేవ కావాలి. తాకినంత మాత్రాన సహాయం పంపబడదు.", offlineVoiceNote: "మాటల సహాయానికి మీ భాషలో పరికర స్వరం లేదా స్థానిక స్వర సేవ కావాలి. పేజీ దాచడం వల్ల స్వరం ఇన్‌స్టాల్ కాదు.",
    offlineSavedTitle: "దాచిన పేజీలు తెరవండి", offlineSymptomsNote: "లక్షణాల ప్రశ్నలను వాడండి. ఇది వ్యాధి నిర్ధారణ కాదు.", offlineEmergencyNote: "తీవ్ర అత్యవసర పరిస్థితిలో ఇంటర్నెట్ లేదా ఈ యాప్ కోసం వేచి ఉండకండి.", retryConnection: "కనెక్షన్ మళ్లీ చూడండి", home: "ముఖ్య పేజీ",
    call112: "112: అత్యవసర సహాయం", mentalHealthCall: "14416: మానసిక ఆరోగ్య సహాయం", stateHealthCall: "104: రాష్ట్ర ఆరోగ్య సలహా",
  },
  ta: {
    offlineTitle: "இணைப்புச் சிக்கல்", offlineGuidance: "இந்தச் சாதனத்தில் சேமித்த பக்கங்களைத் திறக்கலாம். இணையத்தில் சேவை கோரிக்கையை ஏற்ற பிறகே சந்திப்பு உறுதியாகும்.",
    offlineCallsNote: "இந்தப் பொத்தான்கள் தொலைபேசி அழைப்புத் திரையைத் திறக்கும். அழைக்க தொலைபேசி சேவை வேண்டும். தொடுவதால் உதவி அனுப்பப்படாது.", offlineVoiceNote: "குரல் வழிகாட்டலுக்கு உங்கள் மொழியில் சாதனக் குரல் அல்லது உள்ளூர் குரல் சேவை வேண்டும். பக்கம் சேமித்தால் மட்டும் குரல் நிறுவப்படாது.",
    offlineSavedTitle: "சேமித்த பக்கங்களைத் திறக்கவும்", offlineSymptomsNote: "அறிகுறிக் கேள்விகளைப் பயன்படுத்துங்கள். இது நோய் கண்டறிதல் அல்ல.", offlineEmergencyNote: "தீவிர அவசர நிலையில் இணையம் அல்லது இந்தச் செயலிக்காகக் காத்திருக்க வேண்டாம்.", retryConnection: "இணைப்பை மீண்டும் பார்க்கவும்", home: "முகப்பு",
    call112: "112: அவசர உதவி", mentalHealthCall: "14416: மனநல உதவி", stateHealthCall: "104: மாநில சுகாதார ஆலோசனை",
  },
  gu: {
    offlineTitle: "જોડાણમાં સમસ્યા", offlineGuidance: "આ ઉપકરણમાં સાચવેલા પાના ખોલી શકો છો. સેવા ઓનલાઇન વિનંતી સ્વીકારે ત્યારે જ મુલાકાત પક્કી થાય.",
    offlineCallsNote: "આ બટન ફોન ડાયલર ખોલે છે. કૉલ માટે ફોન સેવા જોઈએ. દબાવવાથી મદદ મોકલાતી નથી.", offlineVoiceNote: "બોલીને મદદ માટે તમારી ભાષાનો ઉપકરણ અવાજ કે સ્થાનિક અવાજ સેવા જોઈએ. પાનું સાચવવાથી અવાજ સ્થાપિત થતો નથી.",
    offlineSavedTitle: "સાચવેલા પાના ખોલો", offlineSymptomsNote: "લક્ષણોના પ્રશ્નો વાપરો. આ નિદાન નથી.", offlineEmergencyNote: "ગંભીર કટોકટીમાં ઇન્ટરનેટ કે આ એપની રાહ ન જુઓ.", retryConnection: "જોડાણ ફરી તપાસો", home: "મુખ્ય પાનું",
    call112: "112: તાત્કાલિક મદદ", mentalHealthCall: "14416: માનસિક આરોગ્ય મદદ", stateHealthCall: "104: રાજ્ય આરોગ્ય સલાહ",
  },
  kn: {
    offlineTitle: "ಸಂಪರ್ಕ ಸಮಸ್ಯೆ", offlineGuidance: "ಈ ಸಾಧನದಲ್ಲಿ ಉಳಿಸಿದ ಪುಟಗಳನ್ನು ತೆರೆಯಬಹುದು. ಸೇವೆ ಆನ್‌ಲೈನ್‌ನಲ್ಲಿ ವಿನಂತಿ ಒಪ್ಪಿದ ನಂತರವೇ ಭೇಟಿ ಖಚಿತವಾಗುತ್ತದೆ.",
    offlineCallsNote: "ಈ ಬಟನ್‌ಗಳು ಫೋನ್ ಡಯಲರ್ ತೆರೆಯುತ್ತವೆ. ಕರೆಗೆ ಫೋನ್ ಸೇವೆ ಬೇಕು. ಮುಟ್ಟುವುದರಿಂದ ಸಹಾಯ ಕಳುಹಿಸುವುದಿಲ್ಲ.", offlineVoiceNote: "ಮಾತಿನ ಸಹಾಯಕ್ಕೆ ನಿಮ್ಮ ಭಾಷೆಯ ಸಾಧನ ಧ್ವನಿ ಅಥವಾ ಸ್ಥಳೀಯ ಧ್ವನಿ ಸೇವೆ ಬೇಕು. ಪುಟ ಉಳಿಸಿದರೆ ಮಾತ್ರ ಧ್ವನಿ ಸ್ಥಾಪನೆಯಾಗುವುದಿಲ್ಲ.",
    offlineSavedTitle: "ಉಳಿಸಿದ ಪುಟಗಳನ್ನು ತೆರೆಯಿರಿ", offlineSymptomsNote: "ಲಕ್ಷಣಗಳ ಪ್ರಶ್ನೆಗಳನ್ನು ಬಳಸಿ. ಇದು ರೋಗನಿರ್ಣಯವಲ್ಲ.", offlineEmergencyNote: "ಗಂಭೀರ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯಲ್ಲಿ ಇಂಟರ್ನೆಟ್ ಅಥವಾ ಈ ಅಪ್ಲಿಕೇಶನ್‌ಗಾಗಿ ಕಾಯಬೇಡಿ.", retryConnection: "ಸಂಪರ್ಕ ಮತ್ತೆ ಪರಿಶೀಲಿಸಿ", home: "ಮುಖಪುಟ",
    call112: "112: ತುರ್ತು ಸಹಾಯ", mentalHealthCall: "14416: ಮಾನಸಿಕ ಆರೋಗ್ಯ ಸಹಾಯ", stateHealthCall: "104: ರಾಜ್ಯ ಆರೋಗ್ಯ ಸಲಹೆ",
  },
  pa: {
    offlineTitle: "ਕਨੈਕਸ਼ਨ ਦੀ ਸਮੱਸਿਆ", offlineGuidance: "ਇਸ ਜੰਤਰ ਵਿੱਚ ਸੰਭਾਲੇ ਪੰਨੇ ਖੋਲ੍ਹ ਸਕਦੇ ਹੋ। ਸੇਵਾ ਆਨਲਾਈਨ ਬੇਨਤੀ ਮੰਨੇ ਤਾਂ ਹੀ ਮੁਲਾਕਾਤ ਪੱਕੀ ਹੁੰਦੀ ਹੈ।",
    offlineCallsNote: "ਇਹ ਬਟਨ ਫੋਨ ਡਾਇਲਰ ਖੋਲ੍ਹਦੇ ਹਨ। ਕਾਲ ਲਈ ਫੋਨ ਸੇਵਾ ਚਾਹੀਦੀ ਹੈ। ਛੂਹਣ ਨਾਲ ਮਦਦ ਭੇਜੀ ਨਹੀਂ ਜਾਂਦੀ।", offlineVoiceNote: "ਬੋਲ ਕੇ ਮਦਦ ਲਈ ਆਪਣੀ ਭਾਸ਼ਾ ਦੀ ਜੰਤਰ ਆਵਾਜ਼ ਜਾਂ ਸਥਾਨਕ ਆਵਾਜ਼ ਸੇਵਾ ਚਾਹੀਦੀ ਹੈ। ਪੰਨਾ ਸੰਭਾਲਣ ਨਾਲ ਆਵਾਜ਼ ਸਥਾਪਤ ਨਹੀਂ ਹੁੰਦੀ।",
    offlineSavedTitle: "ਸੰਭਾਲੇ ਪੰਨੇ ਖੋਲ੍ਹੋ", offlineSymptomsNote: "ਲੱਛਣਾਂ ਦੇ ਸਵਾਲ ਵਰਤੋ। ਇਹ ਨਿਦਾਨ ਨਹੀਂ ਹੈ।", offlineEmergencyNote: "ਗੰਭੀਰ ਐਮਰਜੈਂਸੀ ਵਿੱਚ ਇੰਟਰਨੈੱਟ ਜਾਂ ਇਸ ਐਪ ਦੀ ਉਡੀਕ ਨਾ ਕਰੋ।", retryConnection: "ਕਨੈਕਸ਼ਨ ਫਿਰ ਵੇਖੋ", home: "ਮੁੱਖ ਪੰਨਾ",
    call112: "112: ਤੁਰੰਤ ਮਦਦ", mentalHealthCall: "14416: ਮਾਨਸਿਕ ਸਿਹਤ ਮਦਦ", stateHealthCall: "104: ਰਾਜ ਦੀ ਸਿਹਤ ਸਲਾਹ",
  },
  or: {
    offlineTitle: "ସଂଯୋଗ ସମସ୍ୟା", offlineGuidance: "ଏହି ଉପକରଣରେ ସଞ୍ଚିତ ପୃଷ୍ଠା ଖୋଲିପାରିବେ। ସେବା ଅନଲାଇନ ଅନୁରୋଧ ଗ୍ରହଣ କଲେ ହିଁ ଆପଏଣ୍ଟମେଣ୍ଟ ନିଶ୍ଚିତ ହେବ।",
    offlineCallsNote: "ଏହି ବଟନ ଫୋନ ଡାଏଲର ଖୋଲେ। କଲ ପାଇଁ ଫୋନ ସେବା ଦରକାର। ଛୁଇଁଲେ ସହାୟତା ପଠାଯାଏ ନାହିଁ।", offlineVoiceNote: "କଥା ସହାୟତା ପାଇଁ ନିଜ ଭାଷାର ଉପକରଣ ସ୍ୱର କିମ୍ବା ସ୍ଥାନୀୟ ସ୍ୱର ସେବା ଦରକାର। ପୃଷ୍ଠା ସଞ୍ଚୟ କଲେ ସ୍ୱର ସ୍ଥାପନ ହୁଏନାହିଁ।",
    offlineSavedTitle: "ସଞ୍ଚିତ ପୃଷ୍ଠା ଖୋଲନ୍ତୁ", offlineSymptomsNote: "ଲକ୍ଷଣ ପ୍ରଶ୍ନ ବ୍ୟବହାର କରନ୍ତୁ। ଏହା ରୋଗ ନିର୍ଣ୍ଣୟ ନୁହେଁ।", offlineEmergencyNote: "ଗୁରୁତର ଜରୁରୀ ସ୍ଥିତିରେ ଇଣ୍ଟରନେଟ କିମ୍ବା ଏହି ଆପକୁ ଅପେକ୍ଷା କରନ୍ତୁ ନାହିଁ।", retryConnection: "ସଂଯୋଗ ପୁଣି ଦେଖନ୍ତୁ", home: "ମୁଖ୍ୟ ପୃଷ୍ଠା",
    call112: "112: ଜରୁରୀ ସାହାଯ୍ୟ", mentalHealthCall: "14416: ମାନସିକ ସ୍ୱାସ୍ଥ୍ୟ ସହାୟତା", stateHealthCall: "104: ରାଜ୍ୟ ସ୍ୱାସ୍ଥ୍ୟ ପରାମର୍ଶ",
  },
  ml: {
    offlineTitle: "കണക്ഷൻ പ്രശ്നം", offlineGuidance: "ഈ ഉപകരണത്തിൽ സൂക്ഷിച്ച പേജുകൾ തുറക്കാം. സേവനം ഓൺലൈനിൽ അഭ്യർത്ഥന സ്വീകരിച്ചാൽ മാത്രമേ ബുക്കിംഗ് ഉറപ്പാകൂ.",
    offlineCallsNote: "ഈ ബട്ടണുകൾ ഫോൺ ഡയലർ തുറക്കും. വിളിക്കാൻ ടെലിഫോൺ സേവനം വേണം. തൊടുന്നതുകൊണ്ട് സഹായം അയയ്ക്കില്ല.", offlineVoiceNote: "സംസാര സഹായത്തിന് നിങ്ങളുടെ ഭാഷയുടെ ഉപകരണ ശബ്ദമോ പ്രാദേശിക ശബ്ദ സേവനമോ വേണം. പേജ് സൂക്ഷിക്കുന്നത് മാത്രം ശബ്ദം ഇൻസ്റ്റാൾ ചെയ്യില്ല.",
    offlineSavedTitle: "സൂക്ഷിച്ച പേജുകൾ തുറക്കൂ", offlineSymptomsNote: "ലക്ഷണ ചോദ്യങ്ങൾ ഉപയോഗിക്കൂ. ഇത് രോഗനിർണയമല്ല.", offlineEmergencyNote: "ഗുരുതര അടിയന്തരാവസ്ഥയിൽ ഇന്റർനെറ്റിനോ ഈ ആപ്പിനോ വേണ്ടി കാത്തിരിക്കരുത്.", retryConnection: "കണക്ഷൻ വീണ്ടും പരിശോധിക്കൂ", home: "പ്രധാന പേജ്",
    call112: "112: അടിയന്തര സഹായം", mentalHealthCall: "14416: മാനസികാരോഗ്യ സഹായം", stateHealthCall: "104: സംസ്ഥാന ആരോഗ്യ ഉപദേശം",
  },
  as: {
    offlineTitle: "সংযোগৰ সমস্যা", offlineGuidance: "এই সঁজুলিত সংৰক্ষিত পৃষ্ঠা খুলিব পাৰে। সেৱাই অনলাইন অনুৰোধ গ্ৰহণ কৰিলেহে এপইণ্টমেণ্ট নিশ্চিত হ'ব।",
    offlineCallsNote: "এই বুটামে ফোন ডায়েলাৰ খোলে। ফোন কৰিবলৈ টেলিফোন সেৱা লাগে। স্পৰ্শ কৰিলে সহায় পঠিওৱা নহয়।", offlineVoiceNote: "কথাৰ সহায়ৰ বাবে আপোনাৰ ভাষাৰ সঁজুলিৰ মাত বা স্থানীয় মাতৰ সেৱা লাগে। পৃষ্ঠা সংৰক্ষণ কৰিলেই মাত স্থাপন নহয়।",
    offlineSavedTitle: "সংৰক্ষিত পৃষ্ঠা খোলক", offlineSymptomsNote: "লক্ষণৰ প্ৰশ্নবোৰ ব্যৱহাৰ কৰক। এয়া ৰোগ নিৰ্ণয় নহয়।", offlineEmergencyNote: "গুৰুতৰ জৰুৰী অৱস্থাত ইণ্টাৰনেট বা এই এপৰ অপেক্ষা নকৰিব।", retryConnection: "সংযোগ আকৌ চাওক", home: "মূল পৃষ্ঠা",
    call112: "112: জৰুৰী সহায়", mentalHealthCall: "14416: মানসিক স্বাস্থ্য সহায়", stateHealthCall: "104: ৰাজ্যৰ স্বাস্থ্য পৰামৰ্শ",
  },
  ur: {
    offlineTitle: "کنکشن میں مسئلہ", offlineGuidance: "اس آلے میں محفوظ صفحات کھول سکتے ہیں۔ سروس آن لائن درخواست قبول کرے تو ہی اپائنٹمنٹ پکی ہوگی۔",
    offlineCallsNote: "یہ بٹن فون ڈائلر کھولتے ہیں۔ کال کے لیے فون سروس چاہیے۔ چھونے سے مدد بھیجی نہیں جاتی۔", offlineVoiceNote: "بول کر مدد کے لیے آپ کی زبان کی آلے کی آواز یا مقامی آواز کی خدمت چاہیے۔ صفحہ محفوظ کرنے سے آواز نصب نہیں ہوتی۔",
    offlineSavedTitle: "محفوظ صفحات کھولیں", offlineSymptomsNote: "علامات کے سوالات استعمال کریں۔ یہ تشخیص نہیں ہے۔", offlineEmergencyNote: "شدید ایمرجنسی میں انٹرنیٹ یا اس ایپ کا انتظار نہ کریں۔", retryConnection: "کنکشن پھر دیکھیں", home: "مرکزی صفحہ",
    call112: "112: فوری مدد", mentalHealthCall: "14416: ذہنی صحت کی مدد", stateHealthCall: "104: ریاستی صحت مشورہ",
  },
}
