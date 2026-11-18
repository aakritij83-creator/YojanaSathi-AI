import type {
  EligibilityClassification,
  EligibilityResult,
  GovernmentScheme,
  IncomeRange,
  LanguageCode,
  UserProfile,
} from '../types/index.ts';
import {
  translateEducationLevel,
  translateEmploymentStatus,
  translateGender,
  translateIncomeRange,
  translateResidence,
  translateSocialCategory,
  translateState,
} from '../data/domainTranslations.ts';
import { localizeScheme } from '../data/schemeTranslations/index.ts';

interface EngineTemplates {
  nationwideWithState: (state: string) => string;
  nationwideAll: string;
  missingState: (allowed: string) => string;
  stateMatches: (state: string) => string;
  stateNotMet: (allowed: string, actual: string) => string;
  missingAge: (min: number, max: string) => string;
  aboveLabel: string;
  minAgeFail: (age: number, min: number) => string;
  maxAgeFail: (age: number, max: number) => string;
  ageSatisfied: (age: number) => string;
  missingResidence: (allowed: string) => string;
  residenceMatches: (res: string) => string;
  residenceNotMet: (allowed: string, actual: string) => string;
  pmjaySeniorExempt: string;
  missingIncome: (maxInr: string) => string;
  incomeExceeds: (range: string, maxInr: string) => string;
  incomeWithin: (range: string, maxInr: string) => string;
  incomeOverlaps: (range: string, maxInr: string) => string;
  missingEducation: (reqList: string) => string;
  educationSatisfied: (edu: string) => string;
  educationNotMet: (edu: string, reqList: string) => string;
  standupWomanTrack: string;
  standupCategoryTrack: (cat: string) => string;
  standupMissingBoth: string;
  standupNotMet: string;
  standupConfirm: string;
  missingGender: (reqGender: string) => string;
  genderMet: (gender: string) => string;
  genderNotMet: (reqGender: string) => string;
  missingCategory: (cats: string) => string;
  categoryMatches: (cat: string) => string;
  categoryNotMet: (cats: string) => string;
  missingEmployment: (targets: string) => string;
  employmentMatches: (emp: string) => string;
  employmentNotMet: (emp: string, targets: string) => string;
  farmerConfirmed: string;
  farmerNotMet: string;
  missingFarmer: string;
  disabilityConfirmed: string;
  disabilityNotMet: string;
  missingDisability: string;
  reasonNotEligible: (count: number) => string;
  actionNotEligible: string;
  reasonPotential: (count: number) => string;
  actionPotential: string;
  reasonLikelyVerified: string;
  reasonLikelyUnverified: string;
  actionLikely: string;
}

const TEMPLATES: Record<LanguageCode, EngineTemplates> = {
  en: {
    nationwideWithState: (s) => `Applicable nationwide (Resident state: ${s}).`,
    nationwideAll: 'Applicable across all Indian states and union territories.',
    missingState: (a) => `State of residence (Scheme is restricted to: ${a}).`,
    stateMatches: (s) => `State of residence matches (${s}).`,
    stateNotMet: (a, p) => `State requirement not met: Scheme applies to ${a}, whereas profile state is ${p}.`,
    missingAge: (min, max) => `Age or Date of Birth (Required range: ${min} to ${max} years).`,
    aboveLabel: 'above',
    minAgeFail: (age, min) => `Minimum age requirement not met (Age ${age} is below minimum ${min}).`,
    maxAgeFail: (age, max) => `Maximum age requirement exceeded (Age ${age} exceeds maximum ${max}).`,
    ageSatisfied: (age) => `Age requirement satisfied (${age} years).`,
    missingResidence: (a) => `Residence type (${a} required).`,
    residenceMatches: (r) => `Residence area matches (${r}).`,
    residenceNotMet: (a, p) => `Residence requirement not met: Scheme targets ${a} areas (profile: ${p}).`,
    pmjaySeniorExempt: 'Senior Citizen universal cover applies (Age 70+ exempt from income limit under AB-PMJAY).',
    missingIncome: (m) => `Annual household income range (Scheme threshold: up to ₹${m}).`,
    incomeExceeds: (r, m) => `Annual household income (${r}) exceeds scheme limit of ₹${m}.`,
    incomeWithin: (r, m) => `Annual household income (${r}) is within the ₹${m} limit.`,
    incomeOverlaps: (r, m) => `Exact household income verification needed: selected bracket (${r}) overlaps the ₹${m} ceiling.`,
    missingEducation: (l) => `Education level (Required: ${l}).`,
    educationSatisfied: (e) => `Education requirement satisfied (${e}).`,
    educationNotMet: (e, l) => `Education requirement not met (${e} is outside ${l}).`,
    standupWomanTrack: 'Eligible under Women Entrepreneur track.',
    standupCategoryTrack: (c) => `Eligible under ${c} Entrepreneur track.`,
    standupMissingBoth: 'Gender or Social Category (Stand-Up India requires Woman or SC/ST applicant).',
    standupNotMet: 'Stand-Up India is restricted to Women or SC/ST entrepreneurs.',
    standupConfirm: 'Confirmation of Woman or SC/ST entrepreneur eligibility.',
    missingGender: (g) => `Gender confirmation (Scheme is restricted to ${g} beneficiaries).`,
    genderMet: (g) => `Beneficiary gender criterion met (${g}).`,
    genderNotMet: (g) => `Scheme is restricted to ${g} beneficiaries.`,
    missingCategory: (c) => `Social category (if applicable: ${c}).`,
    categoryMatches: (c) => `Social category matches (${c}).`,
    categoryNotMet: (c) => `Social category requirement not met (${c} required).`,
    missingEmployment: (t) => `Employment status (Target group: ${t}).`,
    employmentMatches: (e) => `Employment/beneficiary status matches (${e}).`,
    employmentNotMet: (e, t) => `Employment status (${e}) does not match target group (${t}).`,
    farmerConfirmed: 'Farmer / agricultural cultivation status confirmed.',
    farmerNotMet: 'Scheme is restricted to farmers/cultivators.',
    missingFarmer: 'Farmer / landholding cultivation status.',
    disabilityConfirmed: 'Disability eligibility criterion indicated (benchmark 40%+ certificate required at application).',
    disabilityNotMet: 'Scheme is restricted to Persons with Disabilities (PwD).',
    missingDisability: 'Voluntary disability eligibility confirmation.',
    reasonNotEligible: (c) =>
      `One or more verified eligibility requirements are not satisfied (${c} condition${c > 1 ? 's' : ''} unmet).`,
    actionNotEligible: 'Review other matching schemes or update your profile if your details have changed.',
    reasonPotential: (c) =>
      `No disqualifying criteria found, but ${c} profile detail${c > 1 ? 's' : ''} require confirmation before confirming eligibility.`,
    actionPotential: 'Complete the missing profile fields above and verify official portal guidelines before applying.',
    reasonLikelyVerified:
      'All evaluated scheme criteria match your current profile. Final approval always rests with the official government authority.',
    reasonLikelyUnverified:
      'All evaluated criteria match your profile, though this scheme record is marked for additional source verification on the official portal.',
    actionLikely: 'Review the required document checklist and proceed to the official government application portal.',
  },
  hi: {
    nationwideWithState: (s) => `पूरे भारत में लागू (निवासी राज्य: ${s})।`,
    nationwideAll: 'सभी भारतीय राज्यों और केंद्र शासित प्रदेशों में लागू।',
    missingState: (a) => `निवास का राज्य (योजना केवल इनके लिए है: ${a})।`,
    stateMatches: (s) => `निवास राज्य मेल खाता है (${s})।`,
    stateNotMet: (a, p) => `राज्य आवश्यकता पूरी नहीं हुई: योजना ${a} के लिए है, जबकि प्रोफ़ाइल राज्य ${p} है।`,
    missingAge: (min, max) => `आयु या जन्म तिथि (आवश्यक सीमा: ${min} से ${max} वर्ष)।`,
    aboveLabel: 'उससे अधिक',
    minAgeFail: (age, min) => `न्यूनतम आयु आवश्यकता पूरी नहीं हुई (आयु ${age}, न्यूनतम ${min} से कम है)।`,
    maxAgeFail: (age, max) => `अधिकतम आयु सीमा पार हो गई (आयु ${age}, अधिकतम ${max} से अधिक है)।`,
    ageSatisfied: (age) => `आयु आवश्यकता पूरी हुई (${age} वर्ष)।`,
    missingResidence: (a) => `निवास प्रकार (${a} आवश्यक)।`,
    residenceMatches: (r) => `निवास क्षेत्र मेल खाता है (${r})।`,
    residenceNotMet: (a, p) => `निवास आवश्यकता पूरी नहीं हुई: योजना ${a} क्षेत्रों के लिए है (प्रोफ़ाइल: ${p})।`,
    pmjaySeniorExempt: 'वरिष्ठ नागरिक सार्वभौमिक कवर लागू (AB-PMJAY के तहत 70+ आयु के लिए आय सीमा से छूट)।',
    missingIncome: (m) => `वार्षिक पारिवारिक आय वर्ग (योजना सीमा: ₹${m} तक)।`,
    incomeExceeds: (r, m) => `वार्षिक पारिवारिक आय (${r}) योजना की ₹${m} सीमा से अधिक है।`,
    incomeWithin: (r, m) => `वार्षिक पारिवारिक आय (${r}) ₹${m} की सीमा के भीतर है।`,
    incomeOverlaps: (r, m) => `सटीक पारिवारिक आय सत्यापन आवश्यक: चुना गया वर्ग (${r}) ₹${m} सीमा को ओवरलैप करता है।`,
    missingEducation: (l) => `शिक्षा स्तर (आवश्यक: ${l})।`,
    educationSatisfied: (e) => `शिक्षा आवश्यकता पूरी हुई (${e})।`,
    educationNotMet: (e, l) => `शिक्षा आवश्यकता पूरी नहीं हुई (${e}, ${l} के अंतर्गत नहीं है)।`,
    standupWomanTrack: 'महिला उद्यमी ट्रैक के अंतर्गत पात्र।',
    standupCategoryTrack: (c) => `${c} उद्यमी ट्रैक के अंतर्गत पात्र।`,
    standupMissingBoth: 'लिंग या सामाजिक श्रेणी (स्टैंड-अप इंडिया के लिए महिला या SC/ST आवेदक आवश्यक है)।',
    standupNotMet: 'स्टैंड-अप इंडिया केवल महिलाओं या SC/ST उद्यमियों तक सीमित है।',
    standupConfirm: 'महिला या SC/ST उद्यमी पात्रता की पुष्टि।',
    missingGender: (g) => `लिंग पुष्टि (योजना केवल ${g} लाभार्थियों के लिए है)।`,
    genderMet: (g) => `लाभार्थी लिंग मानदंड पूरा हुआ (${g})।`,
    genderNotMet: (g) => `योजना केवल ${g} लाभार्थियों तक सीमित है।`,
    missingCategory: (c) => `सामाजिक श्रेणी (यदि लागू हो: ${c})।`,
    categoryMatches: (c) => `सामाजिक श्रेणी मेल खाती है (${c})।`,
    categoryNotMet: (c) => `सामाजिक श्रेणी आवश्यकता पूरी नहीं हुई (${c} आवश्यक)।`,
    missingEmployment: (t) => `रोजगार स्थिति (लक्षित समूह: ${t})।`,
    employmentMatches: (e) => `रोजगार/लाभार्थी स्थिति मेल खाती है (${e})।`,
    employmentNotMet: (e, t) => `रोजगार स्थिति (${e}) लक्षित समूह (${t}) से मेल नहीं खाती।`,
    farmerConfirmed: 'किसान / कृषि खेती स्थिति की पुष्टि हो गई।',
    farmerNotMet: 'योजना किसानों/खेतिहरों तक सीमित है।',
    missingFarmer: 'किसान / भूमिधारक खेती स्थिति।',
    disabilityConfirmed: 'दिव्यांगजन पात्रता मानदंड इंगित (आवेदन के समय 40%+ प्रमाणपत्र आवश्यक)।',
    disabilityNotMet: 'योजना दिव्यांग व्यक्तियों (PwD) तक सीमित है।',
    missingDisability: 'स्वैच्छिक दिव्यांगता पात्रता पुष्टि।',
    reasonNotEligible: (c) => `एक या अधिक सत्यापित पात्रता आवश्यकताएं पूरी नहीं हुई हैं (${c} शर्तें पूरी नहीं)।`,
    actionNotEligible: 'अन्य मेल खाने वाली योजनाओं की समीक्षा करें या यदि आपका विवरण बदल गया है तो प्रोफ़ाइल अपडेट करें।',
    reasonPotential: (c) => `कोई अयोग्यता मानदंड नहीं मिला, लेकिन पात्रता की पुष्टि से पहले ${c} प्रोफ़ाइल विवरण की पुष्टि आवश्यक है।`,
    actionPotential: 'ऊपर छूटे हुए प्रोफ़ाइल फ़ील्ड भरें और आवेदन करने से पहले आधिकारिक पोर्टल दिशानिर्देश जांचें।',
    reasonLikelyVerified: 'सभी मूल्यांकित योजना मानदंड आपकी वर्तमान प्रोफ़ाइल से मेल खाते हैं। अंतिम स्वीकृति हमेशा आधिकारिक सरकारी प्राधिकारी पर निर्भर करती है।',
    reasonLikelyUnverified: 'सभी मूल्यांकित मानदंड आपकी प्रोफ़ाइल से मेल खाते हैं, हालांकि यह योजना रिकॉर्ड आधिकारिक पोर्टल पर अतिरिक्त स्रोत सत्यापन के लिए चिह्नित है।',
    actionLikely: 'आवश्यक दस्तावेज़ चेकलिस्ट की समीक्षा करें और आधिकारिक सरकारी आवेदन पोर्टल पर जाएं।',
  },
  bn: {
    nationwideWithState: (s) => `সারা ভারতে প্রযোজ্য (বাসিন্দার রাজ্য: ${s})।`,
    nationwideAll: 'ভারতের সমস্ত রাজ্য ও কেন্দ্রশাসিত অঞ্চলে প্রযোজ্য।',
    missingState: (a) => `বাসস্থানের রাজ্য (প্রকল্পটি শুধুমাত্র এদের জন্য সীমাবদ্ধ: ${a})।`,
    stateMatches: (s) => `বাসস্থানের রাজ্য মিলে গেছে (${s})।`,
    stateNotMet: (a, p) => `রাজ্যের শর্ত পূরণ হয়নি: প্রকল্পটি ${a}-এর জন্য, কিন্তু প্রোফাইলে রাজ্য ${p}।`,
    missingAge: (min, max) => `বয়স বা জন্ম তারিখ (প্রয়োজনীয় সীমা: ${min} থেকে ${max} বছর)।`,
    aboveLabel: 'উপরে',
    minAgeFail: (age, min) => `ন্যূনতম বয়সের শর্ত পূরণ হয়নি (বয়স ${age}, ন্যূনতম ${min}-এর কম)।`,
    maxAgeFail: (age, max) => `সর্বোচ্চ বয়সের সীমা অতিক্রম করেছে (বয়স ${age}, সর্বোচ্চ ${max}-এর বেশি)।`,
    ageSatisfied: (age) => `বয়সের শর্ত পূরণ হয়েছে (${age} বছর)।`,
    missingResidence: (a) => `বাসস্থানের ধরন (${a} প্রয়োজন)।`,
    residenceMatches: (r) => `বাসস্থান এলাকা মিলে গেছে (${r})।`,
    residenceNotMet: (a, p) => `বাসস্থানের শর্ত পূরণ হয়নি: প্রকল্পটি ${a} এলাকার জন্য (প্রোফাইল: ${p})।`,
    pmjaySeniorExempt: 'প্রবীণ নাগরিক সার্বজনীন কভার প্রযোজ্য (AB-PMJAY-এর অধীনে ৭০+ বয়সের জন্য আয়ের সীমা থেকে ছাড়)।',
    missingIncome: (m) => `বার্ষিক পারিবারিক আয়ের সীমা (প্রকল্পের সীমা: ₹${m} পর্যন্ত)।`,
    incomeExceeds: (r, m) => `বার্ষিক পারিবারিক আয় (${r}) প্রকল্পের ₹${m} সীমা অতিক্রম করেছে।`,
    incomeWithin: (r, m) => `বার্ষিক পারিবারিক আয় (${r}) ₹${m} সীমার মধ্যে রয়েছে।`,
    incomeOverlaps: (r, m) => `সঠিক পারিবারিক আয় যাচাই প্রয়োজন: নির্বাচিত বন্ধনী (${r}) ₹${m} সীমার সাথে ওভারল্যাপ করে।`,
    missingEducation: (l) => `শিক্ষাগত যোগ্যতা (প্রয়োজনীয়: ${l})।`,
    educationSatisfied: (e) => `শিক্ষার শর্ত পূরণ হয়েছে (${e})।`,
    educationNotMet: (e, l) => `শিক্ষার শর্ত পূরণ হয়নি (${e}, ${l}-এর মধ্যে নেই)।`,
    standupWomanTrack: 'মহিলা উদ্যোক্তা বিভাগে যোগ্য।',
    standupCategoryTrack: (c) => `${c} উদ্যোক্তা বিভাগে যোগ্য।`,
    standupMissingBoth: 'লিঙ্গ বা সামাজিক শ্রেণি (স্ট্যান্ড-আপ ইন্ডিয়ার জন্য মহিলা বা SC/ST আবেদনকারী প্রয়োজন)।',
    standupNotMet: 'স্ট্যান্ড-আপ ইন্ডিয়া শুধুমাত্র মহিলা বা SC/ST উদ্যোক্তাদের জন্য সীমাবদ্ধ।',
    standupConfirm: 'মহিলা বা SC/ST উদ্যোক্তা যোগ্যতার নিশ্চিতকরণ।',
    missingGender: (g) => `লিঙ্গ নিশ্চিতকরণ (প্রকল্পটি ${g} সুবিধাভোগীদের জন্য সীমাবদ্ধ)।`,
    genderMet: (g) => `সুবিধাভোগীর লিঙ্গ শর্ত পূরণ হয়েছে (${g})।`,
    genderNotMet: (g) => `প্রকল্পটি শুধুমাত্র ${g} সুবিধাভোগীদের জন্য সীমাবদ্ধ।`,
    missingCategory: (c) => `সামাজিক শ্রেণি (প্রযোজ্য হলে: ${c})।`,
    categoryMatches: (c) => `সামাজিক শ্রেণি মিলে গেছে (${c})।`,
    categoryNotMet: (c) => `সামাজিক শ্রেণির শর্ত পূরণ হয়নি (${c} প্রয়োজন)।`,
    missingEmployment: (t) => `কর্মসংস্থানের অবস্থা (লক্ষ্য গোষ্ঠী: ${t})।`,
    employmentMatches: (e) => `কর্মসংস্থান/সুবিধাভোগীর অবস্থা মিলে গেছে (${e})।`,
    employmentNotMet: (e, t) => `কর্মসংস্থানের অবস্থা (${e}) লক্ষ্য গোষ্ঠীর (${t}) সাথে মেলে না।`,
    farmerConfirmed: 'কৃষক / কৃষি চাষাবাদের অবস্থা নিশ্চিত হয়েছে।',
    farmerNotMet: 'প্রকল্পটি কৃষক/চাষীদের জন্য সীমাবদ্ধ।',
    missingFarmer: 'কৃষক / জমি চাষাবাদের অবস্থা।',
    disabilityConfirmed: 'প্রতিবন্ধী যোগ্যতার মানদণ্ড নির্দেশিত (আবেদনের সময় ৪০%+ সার্টিফিকেট প্রয়োজন)।',
    disabilityNotMet: 'প্রকল্পটি প্রতিবন্ধী ব্যক্তিদের (PwD) জন্য সীমাবদ্ধ।',
    missingDisability: 'স্বেচ্ছায় প্রতিবন্ধী যোগ্যতার নিশ্চিতকরণ।',
    reasonNotEligible: (c) => `এক বা একাধিক যাচাইকৃত যোগ্যতার শর্ত পূরণ হয়নি (${c}টি শর্ত অপূর্ণ)।`,
    actionNotEligible: 'অন্যান্য উপযুক্ত প্রকল্প পর্যালোচনা করুন বা আপনার তথ্য পরিবর্তিত হলে প্রোফাইল আপডেট করুন।',
    reasonPotential: (c) => `কোনো অযোগ্যতার মানদণ্ড পাওয়া যায়নি, তবে যোগ্যতা নিশ্চিত করার আগে ${c}টি প্রোফাইল তথ্য নিশ্চিত করা প্রয়োজন।`,
    actionPotential: 'উপরের অনুপস্থিত প্রোফাইল ক্ষেত্রগুলি সম্পূর্ণ করুন এবং আবেদনের আগে সরকারি পোর্টালের নির্দেশিকা যাচাই করুন।',
    reasonLikelyVerified: 'মূল্যায়নকৃত সমস্ত প্রকল্পের মানদণ্ড আপনার বর্তমান প্রোফাইলের সাথে মিলে গেছে। চূড়ান্ত অনুমোদন সর্বদা সরকারি কর্তৃপক্ষের উপর নির্ভর করে।',
    reasonLikelyUnverified: 'মূল্যায়নকৃত সমস্ত মানদণ্ড আপনার প্রোফাইলের সাথে মিলে গেছে, তবে এই প্রকল্প রেকর্ডটি সরকারি পোর্টালে অতিরিক্ত উৎস যাচাইয়ের জন্য চিহ্নিত রয়েছে।',
    actionLikely: 'প্রয়োজনীয় নথিপত্রের তালিকা পর্যালোচনা করুন এবং সরকারি আবেদন পোর্টালে এগিয়ে যান।',
  },
  te: {
    nationwideWithState: (s) => `దేశవ్యాప్తంగా వర్తిస్తుంది (నివాస రాష్ట్రం: ${s}).`,
    nationwideAll: 'భారతదేశంలోని అన్ని రాష్ట్రాలు మరియు కేంద్రపాలిత ప్రాంతాలకు వర్తిస్తుంది.',
    missingState: (a) => `నివాస రాష్ట్రం (పథకం వీరికి మాత్రమే పరిమితం: ${a}).`,
    stateMatches: (s) => `నివాస రాష్ట్రం సరిపోలింది (${s}).`,
    stateNotMet: (a, p) => `రాష్ట్ర నిబంధన నెరవేరలేదు: పథకం ${a} కు వర్తిస్తుంది, కానీ ప్రొఫైల్ రాష్ట్రం ${p}.`,
    missingAge: (min, max) => `వయస్సు లేదా పుట్టిన తేదీ (అవసరమైన పరిధి: ${min} నుండి ${max} సంవత్సరాలు).`,
    aboveLabel: 'పైన',
    minAgeFail: (age, min) => `కనీస వయస్సు నిబంధన నెరవేరలేదు (వయస్సు ${age}, కనీసం ${min} కంటే తక్కువ).`,
    maxAgeFail: (age, max) => `గరిష్ట వయస్సు పరిమితి దాటింది (వయస్సు ${age}, గరిష్టం ${max} కంటే ఎక్కువ).`,
    ageSatisfied: (age) => `వయస్సు నిబంధన నెరవేరింది (${age} సంవత్సరాలు).`,
    missingResidence: (a) => `నివాస రకం (${a} అవసరం).`,
    residenceMatches: (r) => `నివాస ప్రాంతం సరిపోలింది (${r}).`,
    residenceNotMet: (a, p) => `నివాస నిబంధన నెరవేరలేదు: పథకం ${a} ప్రాంతాలకు ఉద్దేశించబడింది (ప్రొఫైల్: ${p}).`,
    pmjaySeniorExempt: 'సీనియర్ సిటిజన్ సార్వత్రిక కవర్ వర్తిస్తుంది (AB-PMJAY కింద 70+ వయస్సు వారికి ఆదాయ పరిమితి నుండి మినహాయింపు).',
    missingIncome: (m) => `వార్షిక కుటుంబ ఆదాయ శ్రేణి (పథకం పరిమితి: ₹${m} వరకు).`,
    incomeExceeds: (r, m) => `వార్షిక కుటుంబ ఆదాయం (${r}) పథకం పరిమితి ₹${m} ను మించిపోయింది.`,
    incomeWithin: (r, m) => `వార్షిక కుటుంబ ఆదాయం (${r}) ₹${m} పరిమితిలోపు ఉంది.`,
    incomeOverlaps: (r, m) => `ఖచ్చితమైన కుటుంబ ఆదాయ ధృవీకరణ అవసరం: ఎంచుకున్న శ్రేణి (${r}) ₹${m} పరిమితితో అతివ్యాప్తి చెందుతోంది.`,
    missingEducation: (l) => `విద్యా స్థాయి (అవసరం: ${l}).`,
    educationSatisfied: (e) => `విద్యా నిబంధన నెరవేరింది (${e}).`,
    educationNotMet: (e, l) => `విద్యా నిబంధన నెరవేరలేదు (${e}, ${l} లో లేదు).`,
    standupWomanTrack: 'మహిళా పారిశ్రామికవేత్త విభాగంలో అర్హులు.',
    standupCategoryTrack: (c) => `${c} పారిశ్రామికవేత్త విభాగంలో అర్హులు.`,
    standupMissingBoth: 'లింగం లేదా సామాజిక వర్గం (స్టాండ్-అప్ ఇండియాకు మహిళ లేదా SC/ST దరఖాస్తుదారు అవసరం).',
    standupNotMet: 'స్టాండ్-అప్ ఇండియా మహిళలు లేదా SC/ST పారిశ్రామికవేత్తలకు మాత్రమే పరిమితం.',
    standupConfirm: 'మహిళ లేదా SC/ST పారిశ్రామికవేత్త అర్హత నిర్ధారణ.',
    missingGender: (g) => `లింగ నిర్ధారణ (పథకం ${g} లబ్ధిదారులకు మాత్రమే పరిమితం).`,
    genderMet: (g) => `లబ్ధిదారుని లింగ ప్రమాణం నెరవేరింది (${g}).`,
    genderNotMet: (g) => `పథకం ${g} లబ్ధిదారులకు మాత్రమే పరిమితం.`,
    missingCategory: (c) => `సామాజిక వర్గం (వర్తిస్తే: ${c}).`,
    categoryMatches: (c) => `సామాజిక వర్గం సరిపోలింది (${c}).`,
    categoryNotMet: (c) => `సామాజిక వర్గం నిబంధన నెరవేరలేదు (${c} అవసరం).`,
    missingEmployment: (t) => `ఉపాధి స్థితి (లక్ష్య సమూహం: ${t}).`,
    employmentMatches: (e) => `ఉపాధి/లబ్ధిదారుని స్థితి సరిపోలింది (${e}).`,
    employmentNotMet: (e, t) => `ఉపాధి స్థితి (${e}) లక్ష్య సమూహం (${t}) తో సరిపోలడం లేదు.`,
    farmerConfirmed: 'రైతు / వ్యవసాయ సాగు స్థితి నిర్ధారించబడింది.',
    farmerNotMet: 'పథకం రైతులు/సాగుదారులకు మాత్రమే పరిమితం.',
    missingFarmer: 'రైతు / భూమి సాగు స్థితి.',
    disabilityConfirmed: 'దివ్యాంగుల అర్హత ప్రమాణం సూచించబడింది (దరఖాస్తు సమయంలో 40%+ సర్టిఫికేట్ అవసరం).',
    disabilityNotMet: 'పథకం దివ్యాంగులకు (PwD) మాత్రమే పరిమితం.',
    missingDisability: 'స్వచ్ఛంద దివ్యాంగుల అర్హత నిర్ధారణ.',
    reasonNotEligible: (c) => `ఒకటి లేదా అంతకంటే ఎక్కువ ధృవీకరించబడిన అర్హత నిబంధనలు నెరవేరలేదు (${c} షరతులు నెరవేరలేదు).`,
    actionNotEligible: 'ఇతర సరిపోయే పథకాలను సమీక్షించండి లేదా మీ వివరాలు మారితే మీ ప్రొఫైల్‌ను నవీకరించండి.',
    reasonPotential: (c) => `అనర్హత ప్రమాణాలు ఏవీ లేవు, కానీ అర్హతను నిర్ధారించే ముందు ${c} ప్రొఫైల్ వివరాల నిర్ధారణ అవసరం.`,
    actionPotential: 'పైన ఉన్న ఖాళీ ప్రొఫైల్ ఫీల్డ్‌లను పూర్తి చేసి, దరఖాస్తు చేయడానికి ముందు అధికారిక పోర్టల్ మార్గదర్శకాలను తనిఖీ చేయండి.',
    reasonLikelyVerified: 'మూల్యాంకనం చేయబడిన అన్ని పథక ప్రమాణాలు మీ ప్రస్తుత ప్రొఫైల్‌తో సరిపోలుతున్నాయి. తుది ఆమోదం ఎల్లప్పుడూ అధికారిక ప్రభుత్వ అధికారి వద్ద ఉంటుంది.',
    reasonLikelyUnverified: 'మూల్యాంకనం చేయబడిన అన్ని ప్రమాణాలు మీ ప్రొఫైల్‌తో సరిపోలుతున్నాయి, అయితే ఈ పథకం రికార్డు అధికారిక పోర్టల్‌లో అదనపు మూల ధృవీకరణ కోసం గుర్తించబడింది.',
    actionLikely: 'అవసరమైన పత్రాల చెక్‌లిస్ట్‌ను సమీక్షించి, అధికారిక ప్రభుత్వ దరఖాస్తు పోర్టల్‌కు వెళ్లండి.',
  },
  mr: {
    nationwideWithState: (s) => `संपूर्ण भारतात लागू (रहिवासी राज्य: ${s}).`,
    nationwideAll: 'सर्व भारतीय राज्ये आणि केंद्रशासित प्रदेशांमध्ये लागू.',
    missingState: (a) => `रहिवासी राज्य (योजना यापुरती मर्यादित आहे: ${a}).`,
    stateMatches: (s) => `रहिवासी राज्य जुळते (${s}).`,
    stateNotMet: (a, p) => `राज्याची अट पूर्ण नाही: योजना ${a} साठी आहे, तर प्रोफाइल राज्य ${p} आहे.`,
    missingAge: (min, max) => `वय किंवा जन्मतारीख (आवश्यक मर्यादा: ${min} ते ${max} वर्षे).`,
    aboveLabel: 'पुढे',
    minAgeFail: (age, min) => `किमान वयाची अट पूर्ण नाही (वय ${age}, किमान ${min} पेक्षा कमी आहे).`,
    maxAgeFail: (age, max) => `कमाल वयोमर्यादा ओलांडली (वय ${age}, कमाल ${max} पेक्षा जास्त आहे).`,
    ageSatisfied: (age) => `वयाची अट पूर्ण (${age} वर्षे).`,
    missingResidence: (a) => `निवास प्रकार (${a} आवश्यक).`,
    residenceMatches: (r) => `निवास क्षेत्र जुळते (${r}).`,
    residenceNotMet: (a, p) => `निवास अट पूर्ण नाही: योजना ${a} क्षेत्रांसाठी आहे (प्रोफाइल: ${p}).`,
    pmjaySeniorExempt: 'ज्येष्ठ नागरिक सार्वत्रिक संरक्षण लागू (AB-PMJAY अंतर्गत ७०+ वयासाठी उत्पन्न मर्यादेतून सूट).',
    missingIncome: (m) => `वार्षिक कौटुंबिक उत्पन्न मर्यादा (योजना मर्यादा: ₹${m} पर्यंत).`,
    incomeExceeds: (r, m) => `वार्षिक कौटुंबिक उत्पन्न (${r}) योजनेच्या ₹${m} मर्यादेपेक्षा जास्त आहे.`,
    incomeWithin: (r, m) => `वार्षिक कौटुंबिक उत्पन्न (${r}) ₹${m} मर्यादेत आहे.`,
    incomeOverlaps: (r, m) => `अचूक कौटुंबिक उत्पन्न पडताळणी आवश्यक: निवडलेला गट (${r}) ₹${m} मर्यादेशी ओव्हरलॅप होतो.`,
    missingEducation: (l) => `शिक्षण स्तर (आवश्यक: ${l}).`,
    educationSatisfied: (e) => `शिक्षण अट पूर्ण (${e}).`,
    educationNotMet: (e, l) => `शिक्षण अट पूर्ण नाही (${e}, ${l} मध्ये नाही).`,
    standupWomanTrack: 'महिला उद्योजक गटात पात्र.',
    standupCategoryTrack: (c) => `${c} उद्योजक गटात पात्र.`,
    standupMissingBoth: 'लिंग किंवा सामाजिक प्रवर्ग (स्टँड-अप इंडियासाठी महिला किंवा SC/ST अर्जदार आवश्यक).',
    standupNotMet: 'स्टँड-अप इंडिया केवळ महिला किंवा SC/ST उद्योजकांसाठी मर्यादित आहे.',
    standupConfirm: 'महिला किंवा SC/ST उद्योजक पात्रतेची पुष्टी.',
    missingGender: (g) => `लिंग पुष्टी (योजना ${g} लाभार्थ्यांसाठी मर्यादित आहे).`,
    genderMet: (g) => `लाभार्थी लिंग निकष पूर्ण (${g}).`,
    genderNotMet: (g) => `योजना केवळ ${g} लाभार्थ्यांसाठी मर्यादित आहे.`,
    missingCategory: (c) => `सामाजिक प्रवर्ग (लागू असल्यास: ${c}).`,
    categoryMatches: (c) => `सामाजिक प्रवर्ग जुळतो (${c}).`,
    categoryNotMet: (c) => `सामाजिक प्रवर्ग अट पूर्ण नाही (${c} आवश्यक).`,
    missingEmployment: (t) => `रोजगार स्थिती (लक्ष्य गट: ${t}).`,
    employmentMatches: (e) => `रोजगार/लाभार्थी स्थिती जुळते (${e}).`,
    employmentNotMet: (e, t) => `रोजगार स्थिती (${e}) लक्ष्य गटाशी (${t}) जुळत नाही.`,
    farmerConfirmed: 'शेतकरी / कृषी लागवड स्थिती निश्चित झाली.',
    farmerNotMet: 'योजना शेतकऱ्यांसाठी/लागवडदारांसाठी मर्यादित आहे.',
    missingFarmer: 'शेतकरी / जमीनधारक लागवड स्थिती.',
    disabilityConfirmed: 'दिव्यांग पात्रता निकष सूचित (अर्जाच्या वेळी ४०%+ प्रमाणपत्र आवश्यक).',
    disabilityNotMet: 'योजना दिव्यांग व्यक्तींसाठी (PwD) मर्यादित आहे.',
    missingDisability: 'ऐच्छिक दिव्यांगता पात्रता पुष्टी.',
    reasonNotEligible: (c) => `एक किंवा अधिक सत्यापित पात्रता अटी पूर्ण झालेल्या नाहीत (${c} अटी अपूर्ण).`,
    actionNotEligible: 'इतर जुळणाऱ्या योजना पहा किंवा तुमचा तपशील बदलला असल्यास प्रोफाइल अद्यतनित करा.',
    reasonPotential: (c) => `कोणताही अपात्रता निकष आढळला नाही, परंतु पात्रता निश्चित करण्यापूर्वी ${c} प्रोफाइल तपशीलांची पुष्टी आवश्यक आहे.`,
    actionPotential: 'वरील उर्वरित प्रोफाइल फील्ड पूर्ण करा आणि अर्ज करण्यापूर्वी अधिकृत पोर्टल मार्गदर्शक तत्त्वे तपासा.',
    reasonLikelyVerified: 'मूल्यमापन केलेले सर्व योजना निकष तुमच्या सध्याच्या प्रोफाइलशी जुळतात. अंतिम मंजुरी नेहमी अधिकृत सरकारी प्राधिकरणाकडे असते.',
    reasonLikelyUnverified: 'सर्व मूल्यमापन केलेले निकष तुमच्या प्रोफाइलशी जुळतात, तथापि ही योजना नोंद अधिकृत पोर्टलवर अतिरिक्त स्रोत पडताळणीसाठी चिन्हांकित आहे.',
    actionLikely: 'आवश्यक कागदपत्रांची यादी तपासा आणि अधिकृत सरकारी अर्ज पोर्टलवर पुढे जा.',
  },
  ta: {
    nationwideWithState: (s) => `இந்தியா முழுவதும் பொருந்தும் (வசிக்கும் மாநிலம்: ${s}).`,
    nationwideAll: 'இந்தியாவின் அனைத்து மாநிலங்கள் மற்றும் யூனியன் பிரதேசங்களுக்கும் பொருந்தும்.',
    missingState: (a) => `வசிக்கும் மாநிலம் (திட்டம் இவற்றுக்கு மட்டுமே: ${a}).`,
    stateMatches: (s) => `வசிக்கும் மாநிலம் பொருந்துகிறது (${s}).`,
    stateNotMet: (a, p) => `மாநில நிபந்தனை பூர்த்தி செய்யப்படவில்லை: திட்டம் ${a}-க்கு பொருந்தும், ஆனால் சுயவிவர மாநிலம் ${p}.`,
    missingAge: (min, max) => `வயது அல்லது பிறந்த தேதி (தேவையான வரம்பு: ${min} முதல் ${max} ஆண்டுகள்).`,
    aboveLabel: 'மேல்',
    minAgeFail: (age, min) => `குறைந்தபட்ச வயது நிபந்தனை பூர்த்தியாகவில்லை (வயது ${age}, குறைந்தபட்சம் ${min}-க்கு கீழ்).`,
    maxAgeFail: (age, max) => `அதிகபட்ச வயது வரம்பு தாண்டியது (வயது ${age}, அதிகபட்சம் ${max}-க்கு மேல்).`,
    ageSatisfied: (age) => `வயது நிபந்தனை பூர்த்தியாகியது (${age} ஆண்டுகள்).`,
    missingResidence: (a) => `வசிப்பிட வகை (${a} தேவை).`,
    residenceMatches: (r) => `வசிப்பிட பகுதி பொருந்துகிறது (${r}).`,
    residenceNotMet: (a, p) => `வசிப்பிட நிபந்தனை பூர்த்தியாகவில்லை: திட்டம் ${a} பகுதிகளுக்கானது (சுயவிவரம்: ${p}).`,
    pmjaySeniorExempt: 'மூத்த குடிமக்கள் உலகளாவிய காப்பீடு பொருந்தும் (AB-PMJAY கீழ் 70+ வயதினருக்கு வருமான வரம்பிலிருந்து விலக்கு).',
    missingIncome: (m) => `ஆண்டு குடும்ப வருமான வரம்பு (திட்ட வரம்பு: ₹${m} வரை).`,
    incomeExceeds: (r, m) => `ஆண்டு குடும்ப வருமானம் (${r}) திட்ட வரம்பான ₹${m}-ஐ விட அதிகமாக உள்ளது.`,
    incomeWithin: (r, m) => `ஆண்டு குடும்ப வருமானம் (${r}) ₹${m} வரம்பிற்குள் உள்ளது.`,
    incomeOverlaps: (r, m) => `துல்லியமான குடும்ப வருமான சரிபார்ப்பு தேவை: தேர்ந்தெடுக்கப்பட்ட வரம்பு (${r}) ₹${m} வரம்புடன் ஒன்றுகிறது.`,
    missingEducation: (l) => `கல்வி நிலை (தேவை: ${l}).`,
    educationSatisfied: (e) => `கல்வி நிபந்தனை பூர்த்தியாகியது (${e}).`,
    educationNotMet: (e, l) => `கல்வி நிபந்தனை பூர்த்தியாகவில்லை (${e}, ${l}-க்குள் இல்லை).`,
    standupWomanTrack: 'பெண் தொழில்முனைவோர் பிரிவின் கீழ் தகுதியானவர்.',
    standupCategoryTrack: (c) => `${c} தொழில்முனைவோர் பிரிவின் கீழ் தகுதியானவர்.`,
    standupMissingBoth: 'பாலினம் அல்லது சமூகப் பிரிவு (ஸ்டாண்ட்-அப் இந்தியா திட்டத்திற்கு பெண் அல்லது SC/ST விண்ணப்பதாரர் தேவை).',
    standupNotMet: 'ஸ்டாண்ட்-அப் இந்தியா பெண்கள் அல்லது SC/ST தொழில்முனைவோருக்கு மட்டுமே.',
    standupConfirm: 'பெண் அல்லது SC/ST தொழில்முனைவோர் தகுதி உறுதிப்படுத்தல்.',
    missingGender: (g) => `பாலின உறுதிப்படுத்தல் (திட்டம் ${g} பயனாளர்களுக்கு மட்டுமே).`,
    genderMet: (g) => `பயனாளர் பாலின விதி பொருந்துகிறது (${g}).`,
    genderNotMet: (g) => `திட்டம் ${g} பயனாளர்களுக்கு மட்டுமே.`,
    missingCategory: (c) => `சமூகப் பிரிவு (பொருந்தினால்: ${c}).`,
    categoryMatches: (c) => `சமூகப் பிரிவு பொருந்துகிறது (${c}).`,
    categoryNotMet: (c) => `சமூகப் பிரிவு நிபந்தனை பூர்த்தியாகவில்லை (${c} தேவை).`,
    missingEmployment: (t) => `வேலைவாய்ப்பு நிலை (இலக்கு குழு: ${t}).`,
    employmentMatches: (e) => `வேலைவாய்ப்பு/பயனாளர் நிலை பொருந்துகிறது (${e}).`,
    employmentNotMet: (e, t) => `வேலைவாய்ப்பு நிலை (${e}) இலக்கு குழுவுடன் (${t}) பொருந்தவில்லை.`,
    farmerConfirmed: 'விவசாயி / வேளாண் சாகுபடி நிலை உறுதிப்படுத்தப்பட்டது.',
    farmerNotMet: 'திட்டம் விவசாயிகள்/சாகுபடியாளர்களுக்கு மட்டுமே.',
    missingFarmer: 'விவசாயி / நில சாகுபடி நிலை.',
    disabilityConfirmed: 'மாற்றுத்திறனாளி தகுதி விதி குறிப்பிடப்பட்டது (விண்ணப்பிக்கும்போது 40%+ சான்றிதழ் தேவை).',
    disabilityNotMet: 'திட்டம் மாற்றுத்திறனாளிகளுக்கு (PwD) மட்டுமே.',
    missingDisability: 'தன்னார்வ மாற்றுத்திறன் தகுதி உறுதிப்படுத்தல்.',
    reasonNotEligible: (c) => `ஒன்று அல்லது அதற்கு மேற்பட்ட சரிபார்க்கப்பட்ட தகுதி நிபந்தனைகள் பூர்த்தியாகவில்லை (${c} நிபந்தனைகள் பூர்த்தியாகவில்லை).`,
    actionNotEligible: 'பொருத்தமான பிற திட்டங்களை மதிப்பாய்வு செய்யவும் அல்லது உங்கள் விவரங்கள் மாறியிருந்தால் சுயவிவரத்தைப் புதுப்பிக்கவும்.',
    reasonPotential: (c) => `தகுதியற்ற விதிகள் எதுவும் இல்லை, ஆனால் தகுதியை உறுதிப்படுத்துவதற்கு முன் ${c} சுயவிவர விவரங்களை உறுதிப்படுத்த வேண்டும்.`,
    actionPotential: 'மேலே விடுபட்ட சுயவிவர புலங்களை நிரப்பி, விண்ணப்பிப்பதற்கு முன் அதிகாரப்பூர்வ இணையதள வழிகாட்டுதல்களைச் சரிபார்க்கவும்.',
    reasonLikelyVerified: 'மதிப்பீடு செய்யப்பட்ட அனைத்து திட்ட விதிகளும் உங்கள் தற்போதைய சுயவிவரத்துடன் பொருந்துகின்றன. இறுதி ஒப்புதல் எப்போதும் அதிகாரப்பூர்வ அரசு அதிகாரியிடமே உள்ளது.',
    reasonLikelyUnverified: 'மதிப்பீடு செய்யப்பட்ட அனைத்து விதிகளும் உங்கள் சுயவிவரத்துடன் பொருந்துகின்றன, இருப்பினும் இந்தத் திட்டப் பதிவு அதிகாரப்பூர்வ இணையதளத்தில் கூடுதல் மூலச் சரிபார்ப்புக்காகக் குறிக்கப்பட்டுள்ளது.',
    actionLikely: 'தேவையான ஆவணப் பட்டியலை மதிப்பாய்வு செய்து அதிகாரப்பூர்வ அரசு விண்ணப்ப இணையதளத்திற்குச் செல்லவும்.',
  },
  gu: {
    nationwideWithState: (s) => `સમગ્ર ભારતમાં લાગુ (રહેઠાણનું રાજ્ય: ${s}).`,
    nationwideAll: 'ભારતના તમામ રાજ્યો અને કેન્દ્રશાસિત પ્રદેશોમાં લાગુ.',
    missingState: (a) => `રહેઠાણનું રાજ્ય (યોજના આના પૂરતી મર્યાદિત છે: ${a}).`,
    stateMatches: (s) => `રહેઠાણનું રાજ્ય મેળ ખાય છે (${s}).`,
    stateNotMet: (a, p) => `રાજ્યની જરૂરિયાત પૂર્ણ થઈ નથી: યોજના ${a} માટે છે, જ્યારે પ્રોફાઇલ રાજ્ય ${p} છે.`,
    missingAge: (min, max) => `ઉંમર અથવા જન્મ તારીખ (જરૂરી શ્રેણી: ${min} થી ${max} વર્ષ).`,
    aboveLabel: 'વધુ',
    minAgeFail: (age, min) => `લઘુતમ ઉંમરની જરૂરિયાત પૂર્ણ થઈ નથી (ઉંમર ${age}, લઘુતમ ${min} થી ઓછી છે).`,
    maxAgeFail: (age, max) => `મહત્તમ ઉંમર મર્યાદા ઓળંગી છે (ઉંમર ${age}, મહત્તમ ${max} થી વધુ છે).`,
    ageSatisfied: (age) => `ઉંમરની જરૂરિયાત પૂર્ણ થઈ (${age} વર્ષ).`,
    missingResidence: (a) => `રહેઠાણનો પ્રકાર (${a} જરૂરી).`,
    residenceMatches: (r) => `રહેઠાણ વિસ્તાર મેળ ખાય છે (${r}).`,
    residenceNotMet: (a, p) => `રહેઠાણની જરૂરિયાત પૂર્ણ થઈ નથી: યોજના ${a} વિસ્તારો માટે છે (પ્રોફાઇલ: ${p}).`,
    pmjaySeniorExempt: 'વરિષ્ઠ નાગરિક સાર્વત્રિક કવર લાગુ (AB-PMJAY હેઠળ 70+ વય માટે આવક મર્યાદામાંથી મુક્તિ).',
    missingIncome: (m) => `વાર્ષિક કૌટુંબિક આવક શ્રેણી (યોજના મર્યાદા: ₹${m} સુધી).`,
    incomeExceeds: (r, m) => `વાર્ષિક કૌટુંબિક આવક (${r}) યોજનાની ₹${m} મર્યાદા કરતાં વધુ છે.`,
    incomeWithin: (r, m) => `વાર્ષિક કૌટુંબિક આવક (${r}) ₹${m} મર્યાદાની અંદર છે.`,
    incomeOverlaps: (r, m) => `ચોક્કસ કૌટુંબિક આવક ચકાસણી જરૂરી: પસંદ કરેલ શ્રેણી (${r}) ₹${m} મર્યાદાને ઓવરલેપ કરે છે.`,
    missingEducation: (l) => `શિક્ષણ સ્તર (જરૂરી: ${l}).`,
    educationSatisfied: (e) => `શિક્ષણની જરૂરિયાત પૂર્ણ થઈ (${e}).`,
    educationNotMet: (e, l) => `શિક્ષણની જરૂરિયાત પૂર્ણ થઈ નથી (${e}, ${l} માં નથી).`,
    standupWomanTrack: 'મહિલા ઉદ્યોગસાહસિક વિભાગ હેઠળ પાત્ર.',
    standupCategoryTrack: (c) => `${c} ઉદ્યોગસાહસિક વિભાગ હેઠળ પાત્ર.`,
    standupMissingBoth: 'જાતિ અથવા સામાજિક વર્ગ (સ્ટેન્ડ-અપ ઇન્ડિયા માટે મહિલા અથવા SC/ST અરજદાર જરૂરી છે).',
    standupNotMet: 'સ્ટેન્ડ-અપ ઇન્ડિયા માત્ર મહિલાઓ અથવા SC/ST ઉદ્યોગસાહસિકો પૂરતી મર્યાદિત છે.',
    standupConfirm: 'મહિલા અથવા SC/ST ઉદ્યોગસાહસિક પાત્રતાની પુષ્ટિ.',
    missingGender: (g) => `જાતિ પુષ્ટિ (યોજના ${g} લાભાર્થીઓ પૂરતી મર્યાદિત છે).`,
    genderMet: (g) => `લાભાર્થી જાતિ માપદંડ પૂર્ણ (${g}).`,
    genderNotMet: (g) => `યોજના માત્ર ${g} લાભાર્થીઓ પૂરતી મર્યાદિત છે.`,
    missingCategory: (c) => `સામાજિક વર્ગ (જો લાગુ હોય તો: ${c}).`,
    categoryMatches: (c) => `સામાજિક વર્ગ મેળ ખાય છે (${c}).`,
    categoryNotMet: (c) => `સામાજિક વર્ગની જરૂરિયાત પૂર્ણ થઈ નથી (${c} જરૂરી).`,
    missingEmployment: (t) => `રોજગાર સ્થિતિ (લક્ષ્ય જૂથ: ${t}).`,
    employmentMatches: (e) => `રોજગાર/લાભાર્થી સ્થિતિ મેળ ખાય છે (${e}).`,
    employmentNotMet: (e, t) => `રોજગાર સ્થિતિ (${e}) લક્ષ્ય જૂથ (${t}) સાથે મેળ ખાતી નથી.`,
    farmerConfirmed: 'ખેડૂત / કૃષિ ખેતી સ્થિતિની પુષ્ટિ થઈ.',
    farmerNotMet: 'યોજના ખેડૂતો/ખેતી કરનારાઓ પૂરતી મર્યાદિત છે.',
    missingFarmer: 'ખેડૂત / જમીનધારક ખેતી સ્થિતિ.',
    disabilityConfirmed: 'દિવ્યાંગ પાત્રતા માપદંડ સૂચવેલ (અરજી સમયે 40%+ પ્રમાણપત્ર જરૂરી).',
    disabilityNotMet: 'યોજના દિવ્યાંગ વ્યક્તિઓ (PwD) પૂરતી મર્યાદિત છે.',
    missingDisability: 'સ્વૈચ્છિક દિવ્યાંગતા પાત્રતા પુષ્ટિ.',
    reasonNotEligible: (c) => `એક અથવા વધુ ચકાસાયેલ પાત્રતા જરૂરિયાતો પૂર્ણ થઈ નથી (${c} શરતો અપૂર્ણ).`,
    actionNotEligible: 'અન્ય મેળ ખાતી યોજનાઓની સમીક્ષા કરો અથવા જો તમારી વિગતો બદલાઈ હોય તો પ્રોફાઇલ અપડેટ કરો.',
    reasonPotential: (c) => `કોઈ અયોગ્યતા માપદંડ મળ્યો નથી, પરંતુ પાત્રતાની પુષ્ટિ કરતા પહેલા ${c} પ્રોફાઇલ વિગતોની પુષ્ટિ જરૂરી છે.`,
    actionPotential: 'ઉપરના ખૂટતા પ્રોફાઇલ ફીલ્ડ્સ પૂર્ણ કરો અને અરજી કરતા પહેલા સત્તાવાર પોર્ટલ માર્ગદર્શિકા ચકાસો.',
    reasonLikelyVerified: 'મૂલ્યાંકન કરાયેલા તમામ યોજના માપદંડો તમારી વર્તમાન પ્રોફાઇલ સાથે મેળ ખાય છે. અંતિમ મંજૂરી હંમેશા સત્તાવાર સરકારી અધિકારી પાસે રહે છે.',
    reasonLikelyUnverified: 'મૂલ્યાંકન કરાયેલા તમામ માપદંડો તમારી પ્રોફાઇલ સાથે મેળ ખાય છે, જોકે આ યોજના રેકોર્ડ સત્તાવાર પોર્ટલ પર વધારાની સ્રોત ચકાસણી માટે ચિહ્નિત થયેલ છે.',
    actionLikely: 'જરૂરી દસ્તાવેજ ચેકલિસ્ટની સમીક્ષા કરો અને સત્તાવાર સરકારી અરજી પોર્ટલ પર આગળ વધો.',
  },
};

/**
 * Converts user's selected income bracket to a conservative upper-bound and lower-bound INR estimate.
 * Never invents numbers if incomeRange is empty.
 */
export function parseIncomeRangeBounds(range: IncomeRange): { min: number; max: number } | null {
  switch (range) {
    case 'Below ₹1,00,000':
      return { min: 0, max: 100000 };
    case '₹1,00,000 – ₹2,50,000':
      return { min: 100001, max: 250000 };
    case '₹2,50,000 – ₹5,00,000':
      return { min: 250001, max: 500000 };
    case '₹5,00,000 – ₹8,00,000':
      return { min: 500001, max: 800000 };
    case 'Above ₹8,00,000':
      return { min: 800001, max: Number.MAX_SAFE_INTEGER };
    default:
      return null;
  }
}

export function deriveAgeFromProfile(profile: Partial<UserProfile>): number | null {
  if (typeof profile.age === 'number' && Number.isFinite(profile.age) && profile.age >= 0 && profile.age <= 120) {
    return Math.floor(profile.age);
  }
  if (profile.dateOfBirth) {
    const dob = new Date(profile.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age >= 0 && age <= 120) {
        return age;
      }
    }
  }
  return null;
}

/**
 * Deterministic backend eligibility evaluator.
 * Strict rule: Missing profile fields are NEVER classified as confirmed failures.
 * Never guarantees approval; classifies into Likely Eligible, Potentially Eligible, or Not Currently Eligible.
 */
export function evaluateEligibility(
  profile: Partial<UserProfile>,
  scheme: GovernmentScheme,
  lang: LanguageCode = 'en'
): EligibilityResult {
  const tpl = TEMPLATES[lang] || TEMPLATES.en;
  const localizedScheme = localizeScheme(scheme, lang);
  const criteria = scheme.criteria;
  const conditionsSatisfied: string[] = [];
  const conditionsNotSatisfied: string[] = [];
  const missingInformation: string[] = [];

  // 1. State evaluation
  const isAllIndia = criteria.allowedStates.includes('All India');
  const allowedStatesText = criteria.allowedStates.map((s) => translateState(s, lang)).join(', ');
  if (isAllIndia) {
    if (profile.state && profile.state.trim() !== '') {
      conditionsSatisfied.push(tpl.nationwideWithState(translateState(profile.state, lang)));
    } else {
      conditionsSatisfied.push(tpl.nationwideAll);
    }
  } else {
    if (!profile.state || profile.state.trim() === '') {
      missingInformation.push(tpl.missingState(allowedStatesText));
    } else if (criteria.allowedStates.some((s) => s.toLowerCase() === profile.state!.trim().toLowerCase())) {
      conditionsSatisfied.push(tpl.stateMatches(translateState(profile.state, lang)));
    } else {
      conditionsNotSatisfied.push(
        tpl.stateNotMet(allowedStatesText, translateState(profile.state, lang))
      );
    }
  }

  // 2. Age evaluation
  const age = deriveAgeFromProfile(profile);
  if ((criteria.minAge !== null && criteria.minAge !== undefined) || (criteria.maxAge !== null && criteria.maxAge !== undefined)) {
    if (age === null) {
      const minLabel = criteria.minAge ?? 0;
      const maxLabel = criteria.maxAge !== null && criteria.maxAge !== undefined ? String(criteria.maxAge) : tpl.aboveLabel;
      missingInformation.push(tpl.missingAge(minLabel, maxLabel));
    } else {
      const failsMin = criteria.minAge !== null && criteria.minAge !== undefined && age < criteria.minAge;
      const failsMax = criteria.maxAge !== null && criteria.maxAge !== undefined && age > criteria.maxAge;
      if (failsMin) {
        conditionsNotSatisfied.push(tpl.minAgeFail(age, criteria.minAge!));
      } else if (failsMax) {
        conditionsNotSatisfied.push(tpl.maxAgeFail(age, criteria.maxAge!));
      } else {
        conditionsSatisfied.push(tpl.ageSatisfied(age));
      }
    }
  }

  // 3. Residence (Rural / Urban) evaluation
  if (criteria.allowedResidences && criteria.allowedResidences.length > 0) {
    const allowedResText = criteria.allowedResidences.map((r) => translateResidence(r, lang)).join(' / ');
    const allowedResCompact = criteria.allowedResidences.map((r) => translateResidence(r, lang)).join('/');
    if (!profile.residence) {
      missingInformation.push(tpl.missingResidence(allowedResText));
    } else if (criteria.allowedResidences.includes(profile.residence)) {
      conditionsSatisfied.push(tpl.residenceMatches(translateResidence(profile.residence, lang)));
    } else {
      conditionsNotSatisfied.push(
        tpl.residenceNotMet(allowedResCompact, translateResidence(profile.residence, lang))
      );
    }
  }

  // 4. Annual household income evaluation
  if (criteria.maxAnnualIncomeInr !== null && criteria.maxAnnualIncomeInr !== undefined) {
    const incomeBounds = parseIncomeRangeBounds(profile.incomeRange || '');
    const isPmjaySeniorException = scheme.id === 'ayushman-bharat-pmjay' && age !== null && age >= 70;
    const maxInrFormatted = criteria.maxAnnualIncomeInr.toLocaleString('en-IN');
    const incomeRangeLabel = profile.incomeRange ? translateIncomeRange(profile.incomeRange, lang) : '';

    if (isPmjaySeniorException) {
      conditionsSatisfied.push(tpl.pmjaySeniorExempt);
    } else if (!incomeBounds) {
      missingInformation.push(tpl.missingIncome(maxInrFormatted));
    } else if (incomeBounds.min > criteria.maxAnnualIncomeInr) {
      conditionsNotSatisfied.push(tpl.incomeExceeds(incomeRangeLabel, maxInrFormatted));
    } else if (incomeBounds.max <= criteria.maxAnnualIncomeInr) {
      conditionsSatisfied.push(tpl.incomeWithin(incomeRangeLabel, maxInrFormatted));
    } else {
      missingInformation.push(tpl.incomeOverlaps(incomeRangeLabel, maxInrFormatted));
    }
  }

  // 5. Education evaluation
  if (criteria.requiredEducationLevels && criteria.requiredEducationLevels.length > 0) {
    const reqEduText = criteria.requiredEducationLevels.map((e) => translateEducationLevel(e, lang)).join(', ');
    if (!profile.educationLevel) {
      missingInformation.push(tpl.missingEducation(reqEduText));
    } else if (criteria.requiredEducationLevels.includes(profile.educationLevel)) {
      conditionsSatisfied.push(tpl.educationSatisfied(translateEducationLevel(profile.educationLevel, lang)));
    } else {
      conditionsNotSatisfied.push(
        tpl.educationNotMet(translateEducationLevel(profile.educationLevel, lang), reqEduText)
      );
    }
  }

  // 6. Employment & Farmer & Disability & Gender / Category conditions
  if (scheme.id === 'stand-up-india') {
    const isFemale = profile.gender === 'Female';
    const isScSt = profile.socialCategory === 'SC' || profile.socialCategory === 'ST';
    if (isFemale || isScSt) {
      conditionsSatisfied.push(
        isFemale
          ? tpl.standupWomanTrack
          : tpl.standupCategoryTrack(translateSocialCategory(profile.socialCategory!, lang))
      );
    } else if (!profile.gender && (!profile.socialCategory || profile.socialCategory === 'Prefer Not to Say')) {
      missingInformation.push(tpl.standupMissingBoth);
    } else if (profile.gender && profile.socialCategory && profile.socialCategory !== 'Prefer Not to Say') {
      conditionsNotSatisfied.push(tpl.standupNotMet);
    } else {
      missingInformation.push(tpl.standupConfirm);
    }
  } else {
    if (criteria.genderRestriction) {
      const reqGenderText = translateGender(criteria.genderRestriction, lang);
      if (!profile.gender || profile.gender === 'Prefer Not to Say') {
        missingInformation.push(tpl.missingGender(reqGenderText));
      } else if (profile.gender === criteria.genderRestriction) {
        conditionsSatisfied.push(tpl.genderMet(translateGender(profile.gender, lang)));
      } else {
        conditionsNotSatisfied.push(tpl.genderNotMet(reqGenderText));
      }
    }

    if (criteria.allowedSocialCategories && criteria.allowedSocialCategories.length > 0) {
      const catsText = criteria.allowedSocialCategories.map((c) => translateSocialCategory(c, lang)).join(', ');
      if (!profile.socialCategory || profile.socialCategory === 'Prefer Not to Say') {
        missingInformation.push(tpl.missingCategory(catsText));
      } else if (criteria.allowedSocialCategories.includes(profile.socialCategory)) {
        conditionsSatisfied.push(tpl.categoryMatches(translateSocialCategory(profile.socialCategory, lang)));
      } else {
        conditionsNotSatisfied.push(tpl.categoryNotMet(catsText));
      }
    }
  }

  if (criteria.allowedEmploymentStatuses && criteria.allowedEmploymentStatuses.length > 0) {
    const targetsText = criteria.allowedEmploymentStatuses.map((e) => translateEmploymentStatus(e, lang)).join(', ');
    if (!profile.employmentStatus) {
      missingInformation.push(tpl.missingEmployment(targetsText));
    } else if (criteria.allowedEmploymentStatuses.includes(profile.employmentStatus)) {
      conditionsSatisfied.push(tpl.employmentMatches(translateEmploymentStatus(profile.employmentStatus, lang)));
    } else {
      conditionsNotSatisfied.push(
        tpl.employmentNotMet(translateEmploymentStatus(profile.employmentStatus, lang), targetsText)
      );
    }
  }

  if (criteria.requiresFarmer) {
    const isFarmerByEmployment = profile.employmentStatus === 'Farmer / Agricultural Worker';
    if (profile.isFarmer === true || isFarmerByEmployment) {
      conditionsSatisfied.push(tpl.farmerConfirmed);
    } else if (profile.isFarmer === false && !isFarmerByEmployment) {
      conditionsNotSatisfied.push(tpl.farmerNotMet);
    } else {
      missingInformation.push(tpl.missingFarmer);
    }
  }

  if (criteria.requiresDisability) {
    if (profile.hasDisability === true) {
      conditionsSatisfied.push(tpl.disabilityConfirmed);
    } else if (profile.hasDisability === false) {
      conditionsNotSatisfied.push(tpl.disabilityNotMet);
    } else {
      missingInformation.push(tpl.missingDisability);
    }
  }

  // Final deterministic classification
  let classification: EligibilityClassification;
  let reason: string;
  let nextRecommendedAction: string;

  if (conditionsNotSatisfied.length > 0) {
    classification = 'Not Currently Eligible';
    reason = tpl.reasonNotEligible(conditionsNotSatisfied.length);
    nextRecommendedAction = tpl.actionNotEligible;
  } else if (missingInformation.length > 0) {
    classification = 'Potentially Eligible';
    reason = tpl.reasonPotential(missingInformation.length);
    nextRecommendedAction = tpl.actionPotential;
  } else {
    classification = 'Likely Eligible';
    reason =
      scheme.verificationStatus === 'Verified'
        ? tpl.reasonLikelyVerified
        : tpl.reasonLikelyUnverified;
    nextRecommendedAction = tpl.actionLikely;
  }

  return {
    schemeId: scheme.id,
    schemeName: localizedScheme.name,
    classification,
    conditionsSatisfied,
    conditionsNotSatisfied,
    missingInformation,
    reason,
    requiredDocuments: localizedScheme.requiredDocuments,
    officialSourceUrl: scheme.officialSourceUrl,
    lastVerifiedDate: scheme.lastVerifiedDate,
    verificationStatus: scheme.verificationStatus,
    nextRecommendedAction,
  };
}

export function evaluateAllSchemes(
  profile: Partial<UserProfile>,
  schemes: GovernmentScheme[],
  lang: LanguageCode = 'en'
): EligibilityResult[] {
  return schemes
    .filter((s) => s.verificationStatus !== 'Archived')
    .map((scheme) => evaluateEligibility(profile, scheme, lang));
}
