import type { LanguageCode, NotificationRecord } from '../../../backend/types/index.ts';
import {
  APPLICATION_STATUS_LABELS,
  AVAILABILITY_LABELS,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  GENDER_LABELS,
  INCOME_RANGE_LABELS,
  PROFILE_FIELD_LABELS,
  RESIDENCE_LABELS,
  SOCIAL_CATEGORY_LABELS,
  STATE_LABELS,
  STATUS_SOURCE_LABELS,
  VERIFICATION_STATUS_LABELS,
  translateApplicationStatus,
  translateAvailability,
  translateCategory,
  translateClassification,
  translateDomain,
  translateEducationLevel,
  translateEmploymentStatus,
  translateFeedbackCategory,
  translateFeedbackStatus,
  translateGender,
  translateIncomeRange,
  translateProfileField,
  translateResidence,
  translateSocialCategory,
  translateState,
  translateStatusSource,
  translateVerificationStatus,
} from '../../../backend/data/domainTranslations.ts';
import { SCHEME_TRANSLATIONS, localizeScheme } from '../../../backend/data/schemeTranslations/index.ts';

export {
  APPLICATION_STATUS_LABELS,
  AVAILABILITY_LABELS,
  CATEGORY_LABELS,
  CLASSIFICATION_LABELS,
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  GENDER_LABELS,
  INCOME_RANGE_LABELS,
  PROFILE_FIELD_LABELS,
  RESIDENCE_LABELS,
  SOCIAL_CATEGORY_LABELS,
  STATE_LABELS,
  STATUS_SOURCE_LABELS,
  VERIFICATION_STATUS_LABELS,
  SCHEME_TRANSLATIONS,
  localizeScheme,
  translateApplicationStatus,
  translateAvailability,
  translateCategory,
  translateClassification,
  translateDomain,
  translateEducationLevel,
  translateEmploymentStatus,
  translateFeedbackCategory,
  translateFeedbackStatus,
  translateGender,
  translateIncomeRange,
  translateProfileField,
  translateResidence,
  translateSocialCategory,
  translateState,
  translateStatusSource,
  translateVerificationStatus,
};

const SYSTEM_NOTIF_COPY: Record<
  LanguageCode,
  {
    completeProfileTitle: string;
    completeProfileMsg: string;
    clearedTitle: string;
    clearedMsg: string;
    trackingStarted: (code: string) => string;
    trackingStartedMsg: (schemeName: string, status: string) => string;
    statusUpdated: (schemeName: string) => string;
    statusUpdatedMsg: (status: string) => string;
    reminderScheduled: (title: string) => string;
    reminderScheduledMsg: (date: string) => string;
  }
> = {
  en: {
    completeProfileTitle: 'Complete your Beneficiary Profile',
    completeProfileMsg:
      'Add your state, age, and household income bracket to unlock deterministic scheme eligibility matching.',
    clearedTitle: 'Personal activity records cleared',
    clearedMsg:
      'Your saved schemes, applications, AI chats, and rejection analysis records have been erased.',
    trackingStarted: (c) => `Tracking started: ${c}`,
    trackingStartedMsg: (s, st) =>
      `Added ${s} to your Application Tracker with self-reported status "${st}".`,
    statusUpdated: (s) => `Status updated: ${s}`,
    statusUpdatedMsg: (st) => `Self-reported status changed to "${st}".`,
    reminderScheduled: (t) => `Reminder scheduled: ${t}`,
    reminderScheduledMsg: (d) => `Scheduled for ${d} (in-app reminder).`,
  },
  hi: {
    completeProfileTitle: 'अपना लाभार्थी प्रोफ़ाइल पूरा करें',
    completeProfileMsg:
      'नियम-आधारित योजना पात्रता मिलान अनलॉक करने के लिए अपना राज्य, आयु और पारिवारिक आय वर्ग जोड़ें।',
    clearedTitle: 'व्यक्तिगत गतिविधि रिकॉर्ड साफ़ किए गए',
    clearedMsg: 'आपकी सहेजी गई योजनाएं, आवेदन, एआई चैट और अस्वीकृति विश्लेषण रिकॉर्ड मिटा दिए गए हैं।',
    trackingStarted: (c) => `ट्रैकिंग शुरू: ${c}`,
    trackingStartedMsg: (s, st) =>
      `${s} को स्व-घोषित स्थिति "${st}" के साथ आपके आवेदन ट्रैकर में जोड़ा गया।`,
    statusUpdated: (s) => `स्थिति अपडेट: ${s}`,
    statusUpdatedMsg: (st) => `स्व-घोषित स्थिति "${st}" में बदल गई।`,
    reminderScheduled: (t) => `रिमाइंडर निर्धारित: ${t}`,
    reminderScheduledMsg: (d) => `${d} के लिए निर्धारित (इन-ऐप रिमाइंडर)।`,
  },
  bn: {
    completeProfileTitle: 'আপনার সুবিধাভোগী প্রোফাইল সম্পূর্ণ করুন',
    completeProfileMsg:
      'নিয়ম-ভিত্তিক প্রকল্পের যোগ্যতা যাচাই আনলক করতে আপনার রাজ্য, বয়স এবং পারিবারিক আয় যোগ করুন।',
    clearedTitle: 'ব্যক্তিগত কার্যকলাপের রেকর্ড মুছে ফেলা হয়েছে',
    clearedMsg: 'আপনার সংরক্ষিত প্রকল্প, আবেদন, এআই চ্যাট এবং প্রত্যাখ্যান বিশ্লেষণ রেকর্ড মুছে ফেলা হয়েছে।',
    trackingStarted: (c) => `ট্র্যাকিং শুরু হয়েছে: ${c}`,
    trackingStartedMsg: (s, st) =>
      `স্ব-রিপোর্টেড অবস্থা "${st}" সহ ${s} আপনার আবেদন ট্র্যাকারে যোগ করা হয়েছে।`,
    statusUpdated: (s) => `অবস্থা আপডেট হয়েছে: ${s}`,
    statusUpdatedMsg: (st) => `স্ব-রিপোর্টেড অবস্থা "${st}"-এ পরিবর্তিত হয়েছে।`,
    reminderScheduled: (t) => `অনুস্মারক নির্ধারিত: ${t}`,
    reminderScheduledMsg: (d) => `${d}-এর জন্য নির্ধারিত (ইন-অ্যাপ অনুস্মারক)।`,
  },
  te: {
    completeProfileTitle: 'మీ లబ్ధిదారుని ప్రొఫైల్‌ను పూర్తి చేయండి',
    completeProfileMsg:
      'నియమ-ఆధారిత పథక అర్హత సరిపోలికను అన్‌లాక్ చేయడానికి మీ రాష్ట్రం, వయస్సు మరియు కుటుంబ ఆదాయ శ్రేణిని జోడించండి.',
    clearedTitle: 'వ్యక్తిగత కార్యాచరణ రికార్డులు క్లియర్ చేయబడ్డాయి',
    clearedMsg: 'మీ సేవ్ చేసిన పథకాలు, దరఖాస్తులు, AI చాట్‌లు మరియు తిరస్కరణ విశ్లేషణ రికార్డులు తొలగించబడ్డాయి.',
    trackingStarted: (c) => `ట్రాకింగ్ ప్రారంభమైంది: ${c}`,
    trackingStartedMsg: (s, st) =>
      `స్వీయ-నివేదిత స్థితి "${st}" తో ${s} మీ దరఖాస్తు ట్రాకర్‌కు జోడించబడింది.`,
    statusUpdated: (s) => `స్థితి నవీకరించబడింది: ${s}`,
    statusUpdatedMsg: (st) => `స్వీయ-నివేదిత స్థితి "${st}" కు మార్చబడింది.`,
    reminderScheduled: (t) => `రిమైండర్ షెడ్యూల్ చేయబడింది: ${t}`,
    reminderScheduledMsg: (d) => `${d} కోసం షెడ్యూల్ చేయబడింది (యాప్-లోపల రిమైండర్).`,
  },
  mr: {
    completeProfileTitle: 'तुमची लाभार्थी प्रोफाइल पूर्ण करा',
    completeProfileMsg:
      'नियम-आधारित योजना पात्रता जुळवणी सुरू करण्यासाठी तुमचे राज्य, वय आणि कौटुंबिक उत्पन्न गट जोडा.',
    clearedTitle: 'वैयक्तिक क्रियाकलाप नोंदी साफ केल्या',
    clearedMsg: 'तुमच्या जतन केलेल्या योजना, अर्ज, AI संवाद आणि नकार विश्लेषण नोंदी पुसल्या गेल्या आहेत.',
    trackingStarted: (c) => `ट्रॅकिंग सुरू: ${c}`,
    trackingStartedMsg: (s, st) =>
      `स्व-नोंदवलेली स्थिती "${st}" सह ${s} तुमच्या अर्ज ट्रॅकरमध्ये जोडले.`,
    statusUpdated: (s) => `स्थिती अद्यतनित: ${s}`,
    statusUpdatedMsg: (st) => `स्व-नोंदवलेली स्थिती "${st}" वर बदलली.`,
    reminderScheduled: (t) => `स्मरणपत्र नियोजित: ${t}`,
    reminderScheduledMsg: (d) => `${d} साठी नियोजित (अॅप-मधील स्मरणपत्र).`,
  },
  ta: {
    completeProfileTitle: 'உங்கள் பயனாளர் சுயவிவரத்தை நிறைவு செய்யவும்',
    completeProfileMsg:
      'விதி-அடிப்படையிலான திட்டத் தகுதிப் பொருத்தத்தைத் திறக்க உங்கள் மாநிலம், வயது மற்றும் குடும்ப வருமான வரம்பைச் சேர்க்கவும்.',
    clearedTitle: 'தனிப்பட்ட செயல்பாட்டுப் பதிவுகள் அழிக்கப்பட்டன',
    clearedMsg:
      'உங்கள் சேமித்த திட்டங்கள், விண்ணப்பங்கள், AI உரையாடல்கள் மற்றும் நிராகரிப்பு பகுப்பாய்வு பதிவுகள் அழிக்கப்பட்டன.',
    trackingStarted: (c) => `கண்காணிப்பு தொடங்கியது: ${c}`,
    trackingStartedMsg: (s, st) =>
      `சுய-அறிவிப்பு நிலை "${st}" உடன் ${s} உங்கள் விண்ணப்ப கண்காணிப்பியில் சேர்க்கப்பட்டது.`,
    statusUpdated: (s) => `நிலை புதுப்பிக்கப்பட்டது: ${s}`,
    statusUpdatedMsg: (st) => `சுய-அறிவிப்பு நிலை "${st}" ஆக மாற்றப்பட்டது.`,
    reminderScheduled: (t) => `நினைவூட்டல் திட்டமிடப்பட்டது: ${t}`,
    reminderScheduledMsg: (d) => `${d} அன்று திட்டமிடப்பட்டது (செயலி-உள் நினைவூட்டல்).`,
  },
  gu: {
    completeProfileTitle: 'તમારી લાભાર્થી પ્રોફાઇલ પૂર્ણ કરો',
    completeProfileMsg:
      'નિયમ-આધારિત યોજના પાત્રતા મેચિંગ અનલોક કરવા માટે તમારું રાજ્ય, ઉંમર અને કૌટુંબિક આવક શ્રેણી ઉમેરો.',
    clearedTitle: 'વ્યક્તિગત પ્રવૃત્તિ રેકોર્ડ્સ સાફ કરાયા',
    clearedMsg: 'તમારી સાચવેલી યોજનાઓ, અરજીઓ, AI ચેટ્સ અને અસ્વીકાર વિશ્લેષણ રેકોર્ડ્સ ભૂંસી નાખવામાં આવ્યા છે.',
    trackingStarted: (c) => `ટ્રેકિંગ શરૂ: ${c}`,
    trackingStartedMsg: (s, st) =>
      `સ્વ-જાહેર સ્થિતિ "${st}" સાથે ${s} તમારા અરજી ટ્રેકરમાં ઉમેરાયું.`,
    statusUpdated: (s) => `સ્થિતિ અપડેટ થઈ: ${s}`,
    statusUpdatedMsg: (st) => `સ્વ-જાહેર સ્થિતિ "${st}" પર બદલાઈ.`,
    reminderScheduled: (t) => `રિમાઇન્ડર સુનિશ્ચિત: ${t}`,
    reminderScheduledMsg: (d) => `${d} માટે સુનિશ્ચિત (એપ્લિકેશનમાં રિમાઇન્ડર).`,
  },
};

export function localizeSystemNotification(
  n: NotificationRecord,
  lang: LanguageCode
): NotificationRecord {
  if (!lang || lang === 'en') return n;
  const copy = SYSTEM_NOTIF_COPY[lang] || SYSTEM_NOTIF_COPY.en;
  const schemeTranslatedName =
    n.relatedSchemeId && SCHEME_TRANSLATIONS[lang]?.[n.relatedSchemeId]?.name;

  if (n.title === 'Complete your Beneficiary Profile') {
    return { ...n, title: copy.completeProfileTitle, message: copy.completeProfileMsg };
  }
  if (n.title === 'Personal activity records cleared') {
    return { ...n, title: copy.clearedTitle, message: copy.clearedMsg };
  }
  if (n.title.startsWith('Tracking started: ')) {
    const code = n.title.slice('Tracking started: '.length);
    const match = n.message.match(/^Added (.+?) to your Application Tracker with self-reported status "(.+?)"\.$/);
    const rawScheme = match?.[1] || code;
    const rawStatus = match?.[2] || 'Interested';
    return {
      ...n,
      title: copy.trackingStarted(code),
      message: copy.trackingStartedMsg(
        schemeTranslatedName || rawScheme,
        translateApplicationStatus(rawStatus, lang)
      ),
    };
  }
  if (n.title.startsWith('Status updated: ')) {
    const rawScheme = n.title.slice('Status updated: '.length);
    const match = n.message.match(/^Self-reported status changed to "(.+?)"\.$/);
    const rawStatus = match?.[1] || '';
    return {
      ...n,
      title: copy.statusUpdated(schemeTranslatedName || rawScheme),
      message: rawStatus ? copy.statusUpdatedMsg(translateApplicationStatus(rawStatus, lang)) : n.message,
    };
  }
  if (n.title.startsWith('Reminder scheduled: ')) {
    const remTitle = n.title.slice('Reminder scheduled: '.length);
    const match = n.message.match(/^Scheduled for (.+?) \(in-app reminder\)\.$/);
    const dueDate = match?.[1] || '';
    return {
      ...n,
      title: copy.reminderScheduled(remTitle),
      message: dueDate ? copy.reminderScheduledMsg(dueDate) : n.message,
    };
  }

  return n;
}

const STATUS_HISTORY_COPY: Record<
  LanguageCode,
  {
    created: string;
    manualUpdate: (status: string) => string;
  }
> = {
  en: {
    created: 'Application preparation created by user.',
    manualUpdate: (s) => `Status updated manually to ${s}.`,
  },
  hi: {
    created: 'उपयोगकर्ता द्वारा आवेदन तैयारी प्रारंभ की गई।',
    manualUpdate: (s) => `स्थिति मैन्युअल रूप से "${s}" पर अपडेट की गई।`,
  },
  bn: {
    created: 'ব্যবহারকারী কর্তৃক আবেদন প্রস্তুতি তৈরি হয়েছে।',
    manualUpdate: (s) => `অবস্থা ম্যানুয়ালি "${s}"-এ আপডেট করা হয়েছে।`,
  },
  te: {
    created: 'వినియోగదారు ద్వారా దరఖాస్తు తయారీ ప్రారంభించబడింది.',
    manualUpdate: (s) => `స్థితి మాన్యువల్‌గా "${s}" కు నవీకరించబడింది.`,
  },
  mr: {
    created: 'वापरकर्त्याने अर्ज तयारी सुरू केली.',
    manualUpdate: (s) => `स्थिती स्वतः "${s}" वर अद्यतनित केली.`,
  },
  ta: {
    created: 'பயனரால் விண்ணப்பத் தயாரிப்பு தொடங்கப்பட்டது.',
    manualUpdate: (s) => `நிலை கைமுறையாக "${s}" எனப் புதுப்பிக்கப்பட்டது.`,
  },
  gu: {
    created: 'વપરાશકર્તા દ્વારા અરજી તૈયારી શરૂ કરવામાં આવી.',
    manualUpdate: (s) => `સ્થિતિ મેન્યુઅલી "${s}" પર અપડેટ કરવામાં આવી.`,
  },
};

export function translateStatusHistoryNote(note: string, lang: LanguageCode): string {
  if (!lang || lang === 'en') return note;
  const copy = STATUS_HISTORY_COPY[lang] || STATUS_HISTORY_COPY.en;
  if (note === 'Application preparation created by user.') {
    return copy.created;
  }
  const match = note.match(/^Status updated manually to (.+?)\.$/);
  if (match) {
    return copy.manualUpdate(translateApplicationStatus(match[1], lang));
  }
  return note;
}

