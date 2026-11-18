import type { GovernmentScheme, LanguageCode } from '../../types/index.ts';
import type { LocalizedSchemeFields } from './types.ts';
import { SCHEME_TRANSLATIONS_HI } from './hi.ts';
import { SCHEME_TRANSLATIONS_BN } from './bn.ts';
import { SCHEME_TRANSLATIONS_TE } from './te.ts';
import { SCHEME_TRANSLATIONS_MR } from './mr.ts';
import { SCHEME_TRANSLATIONS_TA } from './ta.ts';
import { SCHEME_TRANSLATIONS_GU } from './gu.ts';

export type { LocalizedSchemeFields };

export const SCHEME_TRANSLATIONS: Record<Exclude<LanguageCode, 'en'>, Record<string, LocalizedSchemeFields>> = {
  hi: SCHEME_TRANSLATIONS_HI,
  bn: SCHEME_TRANSLATIONS_BN,
  te: SCHEME_TRANSLATIONS_TE,
  mr: SCHEME_TRANSLATIONS_MR,
  ta: SCHEME_TRANSLATIONS_TA,
  gu: SCHEME_TRANSLATIONS_GU,
};

export function localizeScheme(scheme: GovernmentScheme, lang: LanguageCode): GovernmentScheme {
  if (!lang || lang === 'en') {
    return scheme;
  }
  const map = SCHEME_TRANSLATIONS[lang];
  if (!map) return scheme;
  const tr = map[scheme.id];
  if (!tr) return scheme;

  return {
    ...scheme,
    name: tr.name || scheme.name,
    officialDescription: tr.officialDescription || scheme.officialDescription,
    department: tr.department || scheme.department,
    targetBeneficiaries:
      tr.targetBeneficiaries?.length ? tr.targetBeneficiaries : scheme.targetBeneficiaries,
    eligibilityRequirementsSummary:
      tr.eligibilityRequirementsSummary?.length
        ? tr.eligibilityRequirementsSummary
        : scheme.eligibilityRequirementsSummary,
    ageRestrictionsText: tr.ageRestrictionsText || scheme.ageRestrictionsText,
    incomeRestrictionsText: tr.incomeRestrictionsText || scheme.incomeRestrictionsText,
    educationRequirementsText: tr.educationRequirementsText || scheme.educationRequirementsText,
    categoryRestrictionsText: tr.categoryRestrictionsText || scheme.categoryRestrictionsText,
    benefits: tr.benefits?.length ? tr.benefits : scheme.benefits,
    requiredDocuments: tr.requiredDocuments?.length
      ? scheme.requiredDocuments.map((raw, idx) => tr.requiredDocuments[idx] ?? raw)
      : scheme.requiredDocuments,
    applicationProcedure: tr.applicationProcedure?.length
      ? tr.applicationProcedure
      : scheme.applicationProcedure,
    preparationTasks: tr.preparationTasks?.length
      ? scheme.preparationTasks.map((raw, idx) => tr.preparationTasks[idx] ?? raw)
      : scheme.preparationTasks,
    applicationDatesText: tr.applicationDatesText || scheme.applicationDatesText,
    faqs: tr.faqs?.length ? tr.faqs : scheme.faqs,
    grievanceResource: tr.grievanceResource || scheme.grievanceResource,
  };
}
