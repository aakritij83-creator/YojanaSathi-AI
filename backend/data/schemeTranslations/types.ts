import type { SchemeFaq } from '../../types/index.ts';

export interface LocalizedSchemeFields {
  name: string;
  officialDescription: string;
  department: string;
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
  faqs: SchemeFaq[];
  grievanceResource?: string;
}
