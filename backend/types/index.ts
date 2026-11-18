export type LanguageCode = 'en' | 'hi' | 'bn' | 'te' | 'mr' | 'ta' | 'gu';

export const SUPPORTED_LANGUAGES: { code: LanguageCode; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
];

export const SCHEME_CATEGORIES = [
  'Education and Scholarships',
  'Women Empowerment',
  'Farmers and Agriculture',
  'Employment and Skill Development',
  'Financial Assistance',
  'Housing',
  'Healthcare and Insurance',
  'Senior Citizens',
  'Social Welfare',
  'Entrepreneurship and Business',
  'Disability Assistance',
  'Rural Development',
  'Central Government Schemes',
  'State Government Schemes',
] as const;

export type SchemeCategory = (typeof SCHEME_CATEGORIES)[number];

export type VerificationStatus =
  | 'Draft'
  | 'Verification Required'
  | 'Verified'
  | 'Needs Review'
  | 'Archived';

export type ApplicationStatus =
  | 'Interested'
  | 'Preparing Documents'
  | 'Ready to Apply'
  | 'Submitted'
  | 'Under Review'
  | 'Additional Information Required'
  | 'Approved'
  | 'Rejected'
  | 'Closed';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'Interested',
  'Preparing Documents',
  'Ready to Apply',
  'Submitted',
  'Under Review',
  'Additional Information Required',
  'Approved',
  'Rejected',
  'Closed',
];

export type EligibilityClassification =
  | 'Likely Eligible'
  | 'Potentially Eligible'
  | 'Not Currently Eligible';

export type UserRole = 'citizen' | 'admin';

export type ResidenceType = 'Rural' | 'Urban' | '';

export type IncomeRange =
  | 'Below ₹1,00,000'
  | '₹1,00,000 – ₹2,50,000'
  | '₹2,50,000 – ₹5,00,000'
  | '₹5,00,000 – ₹8,00,000'
  | 'Above ₹8,00,000'
  | '';

export type EducationLevel =
  | 'No Formal Education'
  | 'Primary / Secondary (Up to Class 10)'
  | 'Higher Secondary (Class 12)'
  | 'Diploma / ITI'
  | 'Undergraduate'
  | 'Postgraduate & Above'
  | '';

export type EmploymentStatus =
  | 'Student'
  | 'Unemployed'
  | 'Self-Employed / Entrepreneur'
  | 'Salaried'
  | 'Farmer / Agricultural Worker'
  | 'Homemaker'
  | 'Retired / Senior Citizen'
  | '';

export type SocialCategory =
  | 'General'
  | 'OBC'
  | 'SC'
  | 'ST'
  | 'EWS'
  | 'Minority'
  | 'Prefer Not to Say'
  | '';

export interface UserProfile {
  fullName: string;
  age?: number | null;
  dateOfBirth?: string;
  gender?: 'Female' | 'Male' | 'Other' | 'Prefer Not to Say' | '';
  state: string;
  district: string;
  residence: ResidenceType;
  incomeRange: IncomeRange;
  socialCategory: SocialCategory;
  educationLevel: EducationLevel;
  currentCourse: string;
  employmentStatus: EmploymentStatus;
  occupation: string;
  isFarmer: boolean | null;
  hasDisability: boolean | null;
  disabilityDetails: string;
  preferredLanguage: LanguageCode;
  updatedAt: string;
}

export interface NotificationPreferences {
  statusChanges: boolean;
  upcomingDeadlines: boolean;
  incompletePreparation: boolean;
  profileReminders: boolean;
  schemeUpdates: boolean;
}

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  role: UserRole;
  consentAccepted: boolean;
  consentTimestamp: string;
  preferredLanguage: LanguageCode;
  themePreference: 'light' | 'dark';
  profile: UserProfile;
  notificationPreferences: NotificationPreferences;
  recentlyViewedSchemeIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EligibilityCriteria {
  minAge?: number | null;
  maxAge?: number | null;
  maxAnnualIncomeInr?: number | null;
  allowedStates: string[]; // ['All India'] or specific state names
  allowedResidences: ('Rural' | 'Urban')[]; // empty = both
  requiredEducationLevels?: EducationLevel[]; // empty/undefined = any
  allowedEmploymentStatuses?: EmploymentStatus[]; // empty/undefined = any
  allowedSocialCategories?: SocialCategory[]; // empty/undefined = all
  requiresFarmer?: boolean;
  requiresDisability?: boolean;
  genderRestriction?: 'Female' | 'Male' | null;
  specificConditionsNote?: string;
}

export interface SchemeFaq {
  question: string;
  answer: string;
}

export interface GovernmentScheme {
  id: string;
  name: string;
  shortCode: string;
  officialDescription: string;
  department: string;
  classification: 'Central' | 'State';
  applicableState: string;
  categories: SchemeCategory[];
  targetBeneficiaries: string[];
  eligibilityRequirementsSummary: string[];
  ageRestrictionsText: string;
  incomeRestrictionsText: string;
  educationRequirementsText: string;
  categoryRestrictionsText: string;
  benefits: string[];
  requiredDocuments: string[];
  applicationProcedure: string[];
  preparationTasks: string[];
  applicationDatesText: string;
  applicationDeadlineIso?: string | null;
  applicationAvailability: 'Open Year-Round' | 'Seasonal Window' | 'Check Official Portal';
  officialApplicationUrl: string;
  officialSourceUrl: string;
  lastVerifiedDate: string;
  verificationStatus: VerificationStatus;
  criteria: EligibilityCriteria;
  faqs: SchemeFaq[];
  grievanceResource?: string;
}

export interface EligibilityResult {
  schemeId: string;
  schemeName: string;
  classification: EligibilityClassification;
  conditionsSatisfied: string[];
  conditionsNotSatisfied: string[];
  missingInformation: string[];
  reason: string;
  requiredDocuments: string[];
  officialSourceUrl: string;
  lastVerifiedDate: string;
  verificationStatus: VerificationStatus;
  nextRecommendedAction: string;
}

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  changedAt: string;
  note: string;
  source: 'Self-Reported' | 'System';
}

export interface ApplicationRecord {
  id: string;
  userId: string;
  schemeId: string;
  schemeName: string;
  applicationReference: string;
  applicationDate: string;
  currentStatus: ApplicationStatus;
  statusSource: 'Self-Reported';
  collectedDocuments: string[];
  completedTasks: string[];
  notes: string;
  statusHistory: StatusHistoryEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface SavedSchemeRecord {
  id: string;
  userId: string;
  schemeId: string;
  savedAt: string;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  type:
    | 'status_change'
    | 'upcoming_deadline'
    | 'incomplete_preparation'
    | 'missing_profile'
    | 'scheme_update'
    | 'personal_reminder';
  title: string;
  message: string;
  relatedSchemeId?: string;
  isRead: boolean;
  createdAt: string;
}

export interface ReminderRecord {
  id: string;
  userId: string;
  title: string;
  dueDate: string;
  schemeId?: string;
  completed: boolean;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  userId: string;
  title: string;
  language: LanguageCode;
  createdAt: string;
  updatedAt: string;
}

export interface GroundedSourceCitation {
  schemeName: string;
  officialSourceUrl: string;
  lastVerifiedDate: string;
  verificationStatus: string;
}

export interface ChatMessageRecord {
  id: string;
  conversationId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: GroundedSourceCitation[];
  createdAt: string;
}

export interface RejectionAnalysisResult {
  summary: string;
  explicitlyStatedReason: string;
  confirmedReasons: string[];
  possibleContributingReasons: string[];
  missingInformation: string[];
  documentsRequiringCorrection: string[];
  suggestedCorrectiveSteps: string[];
  possibleNextActions: string[];
  verifiedGrievanceResources: string[];
  disclaimer: string;
}

export interface RejectionAnalysisRecord {
  id: string;
  userId: string;
  fileName?: string;
  inputType: 'pdf' | 'image' | 'text';
  schemeNameHint?: string;
  result: RejectionAnalysisResult;
  createdAt: string;
}

export interface FeedbackRecord {
  id: string;
  userId: string | null;
  userEmail?: string;
  category: 'Scheme Accuracy' | 'Bug Report' | 'Translation' | 'General Feedback';
  schemeId?: string;
  message: string;
  status: 'Open' | 'Reviewed' | 'Resolved';
  adminNote?: string;
  createdAt: string;
}

export interface AdminAuditLogRecord {
  id: string;
  adminUserId: string;
  adminEmail: string;
  action: string;
  targetType: 'scheme' | 'category' | 'feedback';
  targetId: string;
  details: string;
  createdAt: string;
}
