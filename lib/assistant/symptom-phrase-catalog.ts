import type { AssistantLanguageCode } from "./languages"

export const ASSISTANT_SYMPTOM_NAMES: Record<string, string> = {
  "low-fever": "Low fever (99–102°F)", "high-fever": "High fever (>103°F)", "mild-headache": "Mild headache", "severe-headache": "Severe headache",
  "dizziness-vertigo": "Dizziness/vertigo", "chest-pain": "Chest pain", "shortness-of-breath": "Shortness of breath", fainting: "Fainting",
  "cough-with-blood": "Cough with blood", cough: "Cough", nausea: "Nausea", vomiting: "Vomiting", diarrhea: "Diarrhea",
  "mild-stomach-ache": "Mild stomach ache", "severe-abdominal-pain": "Severe abdominal pain", "fatigue-exhaustion": "Fatigue/exhaustion",
  "heavy-bleeding": "Heavy bleeding", "snake-bite": "Snake bite",
}
export type AssistantSymptomId = keyof typeof ASSISTANT_SYMPTOM_NAMES

/** Ordered specific-to-general so a high fever is not also interpreted as a separate low fever. */
export const SYMPTOM_PHRASES: Record<AssistantLanguageCode, Record<string, string[]>> = {
  en: {
    "high-fever": ["high fever", "very high temperature"], "low-fever": ["fever"], "severe-headache": ["severe headache", "worst headache"], "mild-headache": ["headache"],
    "dizziness-vertigo": ["dizzy", "dizziness", "vertigo"], "chest-pain": ["chest pain", "pain in chest"], "shortness-of-breath": ["shortness of breath", "difficulty breathing", "cannot breathe", "not breathing", "breathless"],
    fainting: ["fainting", "unconscious", "fainted"], "cough-with-blood": ["cough with blood", "coughing blood"], cough: ["cough"], nausea: ["nausea"], vomiting: ["vomit", "vomiting"], diarrhea: ["diarrhea", "diarrhoea", "loose stools"],
    "severe-abdominal-pain": ["severe abdominal pain", "severe stomach pain"], "mild-stomach-ache": ["stomach ache", "stomach pain", "abdominal pain"], "fatigue-exhaustion": ["fatigue", "weakness", "tired"], "heavy-bleeding": ["heavy bleeding", "bleeding heavily"], "snake-bite": ["snake bite", "snakebite"],
  },
  hi: {
    "high-fever": ["तेज बुखार", "बहुत बुखार"], "low-fever": ["बुखार", "bukhar"], "severe-headache": ["तेज सिरदर्द", "बहुत सिर दर्द"], "mild-headache": ["सिरदर्द", "सिर दर्द", "सर दर्द", "sir dard"],
    "dizziness-vertigo": ["चक्कर", "chakkar"], "chest-pain": ["सीने में दर्द", "छाती में दर्द", "seene mein dard"], "shortness-of-breath": ["सांस की तकलीफ", "सांस लेने में दिक्कत", "सांस नहीं आ", "सांस नहीं ले", "saans nahi", "saans phool"],
    fainting: ["बेहोश", "बेहोशी", "behosh"], "cough-with-blood": ["खून वाली खांसी", "खांसी में खून"], cough: ["खांसी", "खाँसी", "खांसी", "khansi"], nausea: ["मतली"], vomiting: ["उल्टी", "ulti"], diarrhea: ["दस्त", "पेट चल", "dast"],
    "severe-abdominal-pain": ["तेज पेट दर्द", "बहुत पेट दर्द"], "mild-stomach-ache": ["पेट दर्द", "पेट में दर्द", "pet dard"], "fatigue-exhaustion": ["थकान", "कमजोरी", "कमज़ोरी"], "heavy-bleeding": ["भारी रक्तस्राव", "बहुत खून", "खून बह रहा"], "snake-bite": ["सांप ने काट", "साँप ने काट", "सांप का काट", "saanp ne kaat"],
  },
  mr: {
    "high-fever": ["जास्त ताप", "खूप ताप"], "low-fever": ["ताप"], "severe-headache": ["तीव्र डोकेदुखी", "खूप डोके दुख"], "mild-headache": ["डोकेदुखी", "डोके दुख"],
    "dizziness-vertigo": ["चक्कर"], "chest-pain": ["छातीत दुख", "छातीत वेदना"], "shortness-of-breath": ["श्वास घेण्यास त्रास", "श्वासाचा त्रास", "श्वास घेता येत नाही", "श्वास नाही"],
    fainting: ["बेशुद्ध", "बेशुद्धी"], "cough-with-blood": ["खोकल्यातून रक्त", "रक्ताचा खोकला"], cough: ["खोकला"], nausea: ["मळमळ"], vomiting: ["उलटी", "उलट्या"], diarrhea: ["जुलाब"],
    "severe-abdominal-pain": ["तीव्र पोटदुखी", "खूप पोट दुख"], "mild-stomach-ache": ["पोटदुखी", "पोट दुख"], "fatigue-exhaustion": ["थकवा", "अशक्तपणा"], "heavy-bleeding": ["जास्त रक्तस्राव", "खूप रक्त"], "snake-bite": ["साप चाव", "सर्पदंश"],
  },
  bn: {
    "high-fever": ["উচ্চ জ্বর", "খুব জ্বর"], "low-fever": ["জ্বর"], "severe-headache": ["তীব্র মাথাব্যথা", "প্রচণ্ড মাথা ব্যথা"], "mild-headache": ["মাথাব্যথা", "মাথা ব্যথা"],
    "dizziness-vertigo": ["মাথা ঘোর"], "chest-pain": ["বুকে ব্যথা", "বুক ব্যথা"], "shortness-of-breath": ["শ্বাসকষ্ট", "শ্বাস নিতে কষ্ট", "শ্বাস নিতে পারছে না", "শ্বাস নিচ্ছে না"],
    fainting: ["অজ্ঞান", "জ্ঞান হার"], "cough-with-blood": ["কাশির সঙ্গে রক্ত", "কাশিতে রক্ত"], cough: ["কাশি"], nausea: ["বমি বমি"], vomiting: ["বমি"], diarrhea: ["ডায়রিয়া", "পাতলা পায়খানা"],
    "severe-abdominal-pain": ["তীব্র পেট ব্যথা", "প্রচণ্ড পেট ব্যথা"], "mild-stomach-ache": ["পেট ব্যথা", "পেটে ব্যথা"], "fatigue-exhaustion": ["ক্লান্ত", "দুর্বলতা"], "heavy-bleeding": ["অতিরিক্ত রক্তপাত", "প্রচুর রক্তপাত"], "snake-bite": ["সাপে কামড়", "সাপের কামড়"],
  },
  te: {
    "high-fever": ["అధిక జ్వరం", "తీవ్రమైన జ్వరం"], "low-fever": ["జ్వరం"], "severe-headache": ["తీవ్రమైన తలనొప్పి"], "mild-headache": ["తలనొప్పి"],
    "dizziness-vertigo": ["తల తిరుగ"], "chest-pain": ["ఛాతీ నొప్పి", "ఛాతిలో నొప్పి"], "shortness-of-breath": ["శ్వాస తీసుకోవడంలో ఇబ్బంది", "ఊపిరి ఆడటం లేదు", "ఊపిరి తీసుకోవడం లేదు", "శ్వాస ఇబ్బంది"],
    fainting: ["స్పృహ కోల్పో", "అపస్మారక"], "cough-with-blood": ["దగ్గులో రక్తం", "రక్తంతో దగ్గు"], cough: ["దగ్గు"], nausea: ["వికారం"], vomiting: ["వాంతి", "వాంతులు"], diarrhea: ["విరేచనాలు"],
    "severe-abdominal-pain": ["తీవ్రమైన కడుపు నొప్పి"], "mild-stomach-ache": ["కడుపు నొప్పి"], "fatigue-exhaustion": ["అలసట", "బలహీనత"], "heavy-bleeding": ["అధిక రక్తస్రావం", "తీవ్ర రక్తస్రావం"], "snake-bite": ["పాము కాటు", "పాము కరిచ"],
  },
  ta: {
    "high-fever": ["அதிக காய்ச்சல்", "கடும் காய்ச்சல்"], "low-fever": ["காய்ச்சல்"], "severe-headache": ["கடும் தலைவலி", "கடுமையான தலைவலி"], "mild-headache": ["தலைவலி"],
    "dizziness-vertigo": ["தலைசுற்றல்", "தலை சுற்ற"], "chest-pain": ["நெஞ்சு வலி", "மார்பு வலி"], "shortness-of-breath": ["மூச்சுத் திணறல்", "மூச்சு திணறல்", "மூச்சு விட முடியவில்லை", "மூச்சு விடவில்லை"],
    fainting: ["மயக்கம்", "சுயநினைவு இல்லை"], "cough-with-blood": ["இரத்த இருமல்", "இருமலில் ரத்தம்"], cough: ["இருமல்"], nausea: ["குமட்டல்"], vomiting: ["வாந்தி"], diarrhea: ["வயிற்றுப்போக்கு"],
    "severe-abdominal-pain": ["கடும் வயிற்று வலி", "கடுமையான வயிற்று வலி"], "mild-stomach-ache": ["வயிற்று வலி", "வயிற்றுவலி"], "fatigue-exhaustion": ["சோர்வு", "பலவீனம்"], "heavy-bleeding": ["அதிக இரத்தப்போக்கு", "கடும் ரத்தப்போக்கு"], "snake-bite": ["பாம்பு கடி", "பாம்பு கடித்த"],
  },
  gu: {
    "high-fever": ["વધારે તાવ", "ખૂબ તાવ"], "low-fever": ["તાવ"], "severe-headache": ["ભારે માથાનો દુખાવો"], "mild-headache": ["માથાનો દુખાવો", "માથું દુખ"],
    "dizziness-vertigo": ["ચક્કર"], "chest-pain": ["છાતીમાં દુખાવો", "છાતીનો દુખાવો"], "shortness-of-breath": ["શ્વાસ લેવામાં તકલીફ", "શ્વાસ નથી આવતો", "શ્વાસની તકલીફ"],
    fainting: ["બેભાન", "બેહોશ"], "cough-with-blood": ["ખાંસીમાં લોહી", "લોહીવાળી ખાંસી"], cough: ["ખાંસી", "ઉધરસ"], nausea: ["ઉબકા"], vomiting: ["ઊલટી", "ઉલટી"], diarrhea: ["ઝાડા"],
    "severe-abdominal-pain": ["ભારે પેટનો દુખાવો"], "mild-stomach-ache": ["પેટમાં દુખાવો", "પેટનો દુખાવો"], "fatigue-exhaustion": ["થાક", "નબળાઈ"], "heavy-bleeding": ["વધારે લોહી", "ભારે રક્તસ્રાવ"], "snake-bite": ["સાપ કરડ", "સર્પદંશ"],
  },
  kn: {
    "high-fever": ["ಹೆಚ್ಚು ಜ್ವರ", "ತೀವ್ರ ಜ್ವರ"], "low-fever": ["ಜ್ವರ"], "severe-headache": ["ತೀವ್ರ ತಲೆನೋವು"], "mild-headache": ["ತಲೆನೋವು"],
    "dizziness-vertigo": ["ತಲೆಸುತ್ತು"], "chest-pain": ["ಎದೆ ನೋವು", "ಎದೆನೋವು"], "shortness-of-breath": ["ಉಸಿರಾಟದ ತೊಂದರೆ", "ಉಸಿರಾಡಲು ಆಗುತ್ತಿಲ್ಲ", "ಉಸಿರಾಡುತ್ತಿಲ್ಲ"],
    fainting: ["ಮೂರ್ಛೆ", "ಪ್ರಜ್ಞೆ ತಪ್ಪ"], "cough-with-blood": ["ಕೆಮ್ಮಿನಲ್ಲಿ ರಕ್ತ", "ರಕ್ತದ ಕೆಮ್ಮು"], cough: ["ಕೆಮ್ಮು"], nausea: ["ವಾಕರಿಕೆ"], vomiting: ["ವಾಂತಿ"], diarrhea: ["ಅತಿಸಾರ", "ಬೇಧಿ"],
    "severe-abdominal-pain": ["ತೀವ್ರ ಹೊಟ್ಟೆ ನೋವು"], "mild-stomach-ache": ["ಹೊಟ್ಟೆ ನೋವು", "ಹೊಟ್ಟೆನೋವು"], "fatigue-exhaustion": ["ಆಯಾಸ", "ದೌರ್ಬಲ್ಯ"], "heavy-bleeding": ["ಹೆಚ್ಚು ರಕ್ತಸ್ರಾವ", "ತೀವ್ರ ರಕ್ತಸ್ರಾವ"], "snake-bite": ["ಹಾವು ಕಚ್ಚ", "ಹಾವಿನ ಕಡಿತ"],
  },
  pa: {
    "high-fever": ["ਤੇਜ਼ ਬੁਖਾਰ", "ਬਹੁਤ ਬੁਖਾਰ"], "low-fever": ["ਬੁਖਾਰ"], "severe-headache": ["ਬਹੁਤ ਸਿਰ ਦਰਦ", "ਤੇਜ਼ ਸਿਰ ਦਰਦ"], "mild-headache": ["ਸਿਰ ਦਰਦ"],
    "dizziness-vertigo": ["ਚੱਕਰ"], "chest-pain": ["ਛਾਤੀ ਵਿੱਚ ਦਰਦ", "ਛਾਤੀ ਦਾ ਦਰਦ"], "shortness-of-breath": ["ਸਾਹ ਲੈਣ ਵਿੱਚ ਤਕਲੀਫ਼", "ਸਾਹ ਨਹੀਂ ਆ", "ਸਾਹ ਦੀ ਤਕਲੀਫ"],
    fainting: ["ਬੇਹੋਸ਼", "ਬੇਹੋਸ਼ੀ"], "cough-with-blood": ["ਖੰਘ ਵਿੱਚ ਖੂਨ", "ਖੂਨ ਵਾਲੀ ਖੰਘ"], cough: ["ਖੰਘ"], nausea: ["ਜੀ ਮਤਲਾਉ"], vomiting: ["ਉਲਟੀ", "ਉਲਟੀਆਂ"], diarrhea: ["ਦਸਤ"],
    "severe-abdominal-pain": ["ਤੇਜ਼ ਪੇਟ ਦਰਦ"], "mild-stomach-ache": ["ਪੇਟ ਦਰਦ", "ਪੇਟ ਵਿੱਚ ਦਰਦ"], "fatigue-exhaustion": ["ਥਕਾਵਟ", "ਕਮਜ਼ੋਰੀ"], "heavy-bleeding": ["ਭਾਰੀ ਖੂਨ", "ਬਹੁਤ ਖੂਨ"], "snake-bite": ["ਸੱਪ ਨੇ ਡੰਗ", "ਸੱਪ ਦਾ ਡੰਗ"],
  },
  or: {
    "high-fever": ["ଅଧିକ ଜ୍ୱର", "ଉଚ୍ଚ ଜ୍ୱର"], "low-fever": ["ଜ୍ୱର"], "severe-headache": ["ତୀବ୍ର ମୁଣ୍ଡ ବିନ୍ଧା"], "mild-headache": ["ମୁଣ୍ଡ ବିନ୍ଧା", "ମୁଣ୍ଡବିନ୍ଧା"],
    "dizziness-vertigo": ["ମୁଣ୍ଡ ବୁଲା", "ମୁଣ୍ଡବୁଲା"], "chest-pain": ["ଛାତି ଯନ୍ତ୍ରଣା", "ଛାତିରେ ଯନ୍ତ୍ରଣା"], "shortness-of-breath": ["ଶ୍ୱାସ କଷ୍ଟ", "ଶ୍ୱାସ ନେବାରେ କଷ୍ଟ", "ନିଶ୍ୱାସ ନେଉନାହିଁ"],
    fainting: ["ବେହୋଶ", "ଚେତାଶୂନ୍ୟ"], "cough-with-blood": ["କାଶରେ ରକ୍ତ", "ରକ୍ତ କାଶ"], cough: ["କାଶ"], nausea: ["ବାନ୍ତି ଲାଗ"], vomiting: ["ବାନ୍ତି"], diarrhea: ["ଝାଡ଼ା", "ଝାଡା"],
    "severe-abdominal-pain": ["ତୀବ୍ର ପେଟ ଯନ୍ତ୍ରଣା"], "mild-stomach-ache": ["ପେଟ ଯନ୍ତ୍ରଣା", "ପେଟ ବିନ୍ଧା"], "fatigue-exhaustion": ["ଥକା", "ଦୁର୍ବଳତା"], "heavy-bleeding": ["ଅଧିକ ରକ୍ତସ୍ରାବ", "ଭାରୀ ରକ୍ତସ୍ରାବ"], "snake-bite": ["ସାପ କାମୁଡ଼", "ସାପ କାମୁଡ"],
  },
  ml: {
    "high-fever": ["കടുത്ത പനി", "ഉയർന്ന പനി"], "low-fever": ["പനി"], "severe-headache": ["കടുത്ത തലവേദന"], "mild-headache": ["തലവേദന"],
    "dizziness-vertigo": ["തലകറക്കം"], "chest-pain": ["നെഞ്ചുവേദന", "നെഞ്ച് വേദന"], "shortness-of-breath": ["ശ്വാസംമുട്ടൽ", "ശ്വാസ തടസ്സം", "ശ്വസിക്കാൻ കഴിയുന്നില്ല", "ശ്വസിക്കുന്നില്ല"],
    fainting: ["ബോധക്ഷയം", "ബോധം നഷ്ട"], "cough-with-blood": ["ചുമയിൽ രക്തം", "രക്തം ചുമ"], cough: ["ചുമ"], nausea: ["ഓക്കാനം"], vomiting: ["ഛർദ്ദി"], diarrhea: ["വയറിളക്കം"],
    "severe-abdominal-pain": ["കടുത്ത വയറുവേദന"], "mild-stomach-ache": ["വയറുവേദന", "വയർ വേദന"], "fatigue-exhaustion": ["ക്ഷീണം", "തളർച്ച"], "heavy-bleeding": ["കടുത്ത രക്തസ്രാവം", "അധിക രക്തസ്രാവം"], "snake-bite": ["പാമ്പുകടി", "പാമ്പ് കടിച്ച"],
  },
  as: {
    "high-fever": ["বেছি জ্বৰ", "তীব্ৰ জ্বৰ"], "low-fever": ["জ্বৰ"], "severe-headache": ["তীব্ৰ মূৰৰ বিষ"], "mild-headache": ["মূৰৰ বিষ", "মূৰ বিষ"],
    "dizziness-vertigo": ["মূৰ ঘূৰ"], "chest-pain": ["বুকুৰ বিষ", "বুকুত বিষ"], "shortness-of-breath": ["উশাহ লোৱাত কষ্ট", "উশাহৰ কষ্ট", "উশাহ লব পৰা নাই", "উশাহ লৈ থকা নাই"],
    fainting: ["অচেতন", "চেতনা হেৰুৱা"], "cough-with-blood": ["কাহত তেজ", "তেজৰ কাহ"], cough: ["কাহ"], nausea: ["বমি ভাব"], vomiting: ["বমি"], diarrhea: ["পাতল পায়খানা", "ডায়েৰিয়া"],
    "severe-abdominal-pain": ["তীব্ৰ পেটৰ বিষ"], "mild-stomach-ache": ["পেটৰ বিষ", "পেট বিষ"], "fatigue-exhaustion": ["ভাগৰ", "দুৰ্বলতা"], "heavy-bleeding": ["বেছি তেজ", "তীব্ৰ ৰক্তপাত"], "snake-bite": ["সাপে কামোৰ", "সাপৰ কামোৰ"],
  },
  ur: {
    "high-fever": ["تیز بخار", "بہت بخار"], "low-fever": ["بخار"], "severe-headache": ["شدید سر درد"], "mild-headache": ["سر درد"],
    "dizziness-vertigo": ["چکر"], "chest-pain": ["سینے میں درد", "چھاتی میں درد"], "shortness-of-breath": ["سانس کی تکلیف", "سانس لینے میں مشکل", "سانس نہیں آ", "سانس نہیں لے"],
    fainting: ["بے ہوش", "بے ہوشی"], "cough-with-blood": ["کھانسی میں خون", "خون والی کھانسی"], cough: ["کھانسی"], nausea: ["متلی"], vomiting: ["الٹی", "قے"], diarrhea: ["دست", "اسہال"],
    "severe-abdominal-pain": ["شدید پیٹ درد"], "mild-stomach-ache": ["پیٹ درد", "پیٹ میں درد"], "fatigue-exhaustion": ["تھکاوٹ", "کمزوری"], "heavy-bleeding": ["بہت خون", "شدید خون بہنا"], "snake-bite": ["سانپ نے کاٹ", "سانپ کا کاٹ"],
  },
}
