import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  APPLICATION_STATUS_LABELS,
  CATEGORY_LABELS,
  EDUCATION_LEVEL_LABELS,
  EMPLOYMENT_STATUS_LABELS,
  GENDER_LABELS,
  INCOME_RANGE_LABELS,
  RESIDENCE_LABELS,
  SOCIAL_CATEGORY_LABELS,
  STATE_LABELS,
  VERIFICATION_STATUS_LABELS,
} from '../backend/data/domainTranslations.ts';
import { SCHEME_TRANSLATIONS, localizeScheme } from '../backend/data/schemeTranslations/index.ts';
import { INDIAN_STATES_AND_UTS, INITIAL_VERIFIED_SCHEMES } from '../backend/data/verifiedSchemes.ts';
import { evaluateEligibility } from '../backend/services/eligibilityEngine.ts';
import {
  APPLICATION_STATUSES,
  SCHEME_CATEGORIES,
  SUPPORTED_LANGUAGES,
  type LanguageCode,
  type VerificationStatus,
} from '../backend/types/index.ts';
import {
  createSessionToken,
  hashPassword,
  sanitizeText,
  verifyPassword,
  verifySessionToken,
} from '../backend/utils/security.ts';
import { LANGUAGE_OPTIONS, TRANSLATIONS, tKey } from '../src/frontend/translations/index.ts';

function collectKeys(obj: Record<string, unknown>, prefix = ''): string[] {
  const keys: string[] = [];
  for (const [k, v] of Object.entries(obj)) {
    const next = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      keys.push(...collectKeys(v as Record<string, unknown>, next));
    } else {
      keys.push(next);
    }
  }
  return keys.sort();
}

describe('Security Utilities', () => {
  it('hashes and verifies passwords with per-user salts', () => {
    const a = hashPassword('StrongPass!2026');
    const b = hashPassword('StrongPass!2026');
    assert.notEqual(a.salt, b.salt);
    assert.notEqual(a.hash, b.hash);
    assert.equal(verifyPassword('StrongPass!2026', a.hash, a.salt), true);
    assert.equal(verifyPassword('WrongPass!2026', a.hash, a.salt), false);
  });

  it('creates and verifies signed HMAC session tokens and rejects tampering or expiry', () => {
    const token = createSessionToken('usr_12345', 'citizen', 3600);
    const verified = verifySessionToken(token);
    assert.ok(verified);
    assert.equal(verified.uid, 'usr_12345');
    assert.equal(verified.role, 'citizen');

    // Tampered payload
    const [, sig] = token.split('.');
    const adminPayload = Buffer.from(
      JSON.stringify({ uid: 'usr_12345', role: 'admin', iat: 1000, exp: 9999999999 }),
      'utf8'
    ).toString('base64url');
    assert.equal(verifySessionToken(`${adminPayload}.${sig}`), null);

    // Expired token
    const expired = createSessionToken('usr_12345', 'citizen', -10);
    assert.equal(verifySessionToken(expired), null);
  });

  it('sanitizes arbitrary text inputs safely', () => {
    assert.equal(sanitizeText('  hello world  '), 'hello world');
    assert.equal(sanitizeText(null), '');
    assert.equal(sanitizeText('abcdef', 3), 'abc');
  });
});

describe('7-Language Localization Integrity', () => {
  it('supports the exact 7 required languages and no extras', () => {
    const expected: LanguageCode[] = ['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu'];
    assert.deepEqual(
      SUPPORTED_LANGUAGES.map((l) => l.code),
      expected
    );
    assert.deepEqual(
      LANGUAGE_OPTIONS.map((o) => o.code),
      expected
    );
    assert.equal(Object.keys(TRANSLATIONS).length, 7);
  });

  it('maintains 100% translation key parity across all 7 languages', () => {
    const baseKeys = collectKeys(TRANSLATIONS.en as unknown as Record<string, unknown>);
    assert.ok(baseKeys.length > 50);
    for (const lang of SUPPORTED_LANGUAGES) {
      const code: LanguageCode = lang.code;
      const langKeys = collectKeys(TRANSLATIONS[code] as unknown as Record<string, unknown>);
      assert.deepEqual(
        langKeys,
        baseKeys,
        `Language "${code}" dictionary keys must match English base dictionary`
      );
      for (const k of langKeys) {
        const val = tKey(code, k);
        assert.ok(val.trim().length > 0, `Empty translation string at ${code}.${k}`);
      }
    }
  });

  it('provides complete non-empty domain enum translations across all 7 languages', () => {
    const verificationStatuses: VerificationStatus[] = [
      'Draft',
      'Verification Required',
      'Verified',
      'Needs Review',
      'Archived',
    ];
    const allMaps: Array<[string, readonly string[], Record<string, Record<LanguageCode, string>>]> = [
      ['categories', SCHEME_CATEGORIES, CATEGORY_LABELS],
      ['states', ['All India', ...INDIAN_STATES_AND_UTS], STATE_LABELS],
      ['applicationStatuses', APPLICATION_STATUSES, APPLICATION_STATUS_LABELS],
      ['verificationStatuses', verificationStatuses, VERIFICATION_STATUS_LABELS],
      ['residence', ['Rural', 'Urban'], RESIDENCE_LABELS],
      [
        'income',
        [
          'Below ₹1,00,000',
          '₹1,00,000 – ₹2,50,000',
          '₹2,50,000 – ₹5,00,000',
          '₹5,00,000 – ₹8,00,000',
          'Above ₹8,00,000',
        ],
        INCOME_RANGE_LABELS,
      ],
      [
        'education',
        [
          'No Formal Education',
          'Primary / Secondary (Up to Class 10)',
          'Higher Secondary (Class 12)',
          'Diploma / ITI',
          'Undergraduate',
          'Postgraduate & Above',
        ],
        EDUCATION_LEVEL_LABELS,
      ],
      [
        'employment',
        [
          'Student',
          'Unemployed',
          'Self-Employed / Entrepreneur',
          'Salaried',
          'Farmer / Agricultural Worker',
          'Homemaker',
          'Retired / Senior Citizen',
        ],
        EMPLOYMENT_STATUS_LABELS,
      ],
      ['gender', ['Female', 'Male', 'Other', 'Prefer Not to Say'], GENDER_LABELS],
      ['socialCategory', ['General', 'OBC', 'SC', 'ST', 'EWS', 'Minority'], SOCIAL_CATEGORY_LABELS],
    ];

    for (const [label, keys, map] of allMaps) {
      for (const key of keys) {
        assert.ok(map[key], `Missing ${label} translation entry for "${key}"`);
        for (const { code } of SUPPORTED_LANGUAGES) {
          assert.ok(map[key][code]?.trim().length > 0, `Empty ${label}.${key}.${code}`);
        }
      }
    }
  });

  it('localizes all 16 verified schemes in hi, bn, te, mr, ta, and gu with aligned checklist lengths', () => {
    const nonEn: Exclude<LanguageCode, 'en'>[] = ['hi', 'bn', 'te', 'mr', 'ta', 'gu'];
    for (const scheme of INITIAL_VERIFIED_SCHEMES) {
      for (const lang of nonEn) {
        const entry = SCHEME_TRANSLATIONS[lang]?.[scheme.id];
        assert.ok(entry, `Missing scheme translation ${lang}.${scheme.id}`);
        const localized = localizeScheme(scheme, lang);
        assert.notEqual(localized.name, scheme.name, `Expected translated name for ${lang}.${scheme.id}`);
        assert.notEqual(
          localized.officialDescription,
          scheme.officialDescription,
          `Expected translated description for ${lang}.${scheme.id}`
        );
        assert.equal(
          localized.requiredDocuments.length,
          scheme.requiredDocuments.length,
          `Document length mismatch at ${lang}.${scheme.id}`
        );
        assert.equal(
          localized.preparationTasks.length,
          scheme.preparationTasks.length,
          `Task length mismatch at ${lang}.${scheme.id}`
        );
      }
    }
  });

  it('returns localized deterministic eligibility criteria while preserving canonical classification', () => {
    const pmKisan = INITIAL_VERIFIED_SCHEMES.find((s) => s.id === 'pm-kisan')!;
    const farmerProfile = {
      age: 35,
      state: 'Maharashtra',
      residence: 'Rural' as const,
      incomeRange: 'Below ₹1,00,000' as const,
      isFarmer: true,
    };

    const enRes = evaluateEligibility(farmerProfile, pmKisan, 'en');
    assert.equal(enRes.classification, 'Likely Eligible');

    for (const lang of ['hi', 'ta', 'gu'] as const) {
      const locRes = evaluateEligibility(farmerProfile, pmKisan, lang);
      assert.equal(locRes.classification, 'Likely Eligible');
      assert.notEqual(locRes.schemeName, enRes.schemeName);
      assert.notEqual(locRes.reason, enRes.reason);
      assert.notEqual(locRes.nextRecommendedAction, enRes.nextRecommendedAction);
      assert.equal(locRes.conditionsSatisfied.length, enRes.conditionsSatisfied.length);
      assert.notEqual(locRes.conditionsSatisfied[0], enRes.conditionsSatisfied[0]);
    }
  });
});

