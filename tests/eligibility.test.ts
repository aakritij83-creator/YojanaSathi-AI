import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { INITIAL_VERIFIED_SCHEMES } from '../backend/data/verifiedSchemes.ts';
import {
  deriveAgeFromProfile,
  evaluateAllSchemes,
  evaluateEligibility,
  parseIncomeRangeBounds,
} from '../backend/services/eligibilityEngine.ts';
import type { GovernmentScheme, UserProfile } from '../backend/types/index.ts';

function getScheme(id: string): GovernmentScheme {
  const found = INITIAL_VERIFIED_SCHEMES.find((s) => s.id === id);
  assert.ok(found, `Expected verified scheme "${id}" to exist`);
  return found;
}

describe('Deterministic Eligibility Engine', () => {
  it('parses annual income brackets into accurate INR bounds', () => {
    assert.deepEqual(parseIncomeRangeBounds('Below ₹1,00,000'), { min: 0, max: 100000 });
    assert.deepEqual(parseIncomeRangeBounds('₹1,00,000 – ₹2,50,000'), { min: 100001, max: 250000 });
    assert.deepEqual(parseIncomeRangeBounds('Above ₹8,00,000'), { min: 800001, max: Number.MAX_SAFE_INTEGER });
    assert.equal(parseIncomeRangeBounds(''), null);
  });

  it('derives age accurately from numeric age or date of birth', () => {
    assert.equal(deriveAgeFromProfile({ age: 29 }), 29);
    const currentYear = new Date().getFullYear();
    const dob = `${currentYear - 30}-01-01`;
    assert.equal(deriveAgeFromProfile({ age: null, dateOfBirth: dob }), 30);
    assert.equal(deriveAgeFromProfile({ age: null, dateOfBirth: '' }), null);
  });

  it('classifies complete matching farmer profile as Likely Eligible for PM-KISAN', () => {
    const pmKisan = getScheme('pm-kisan');
    const profile: Partial<UserProfile> = {
      age: 35,
      state: 'Maharashtra',
      incomeRange: '₹1,00,000 – ₹2,50,000',
      isFarmer: true,
    };
    const res = evaluateEligibility(profile, pmKisan);
    assert.equal(res.classification, 'Likely Eligible');
    assert.equal(res.conditionsNotSatisfied.length, 0);
    assert.equal(res.missingInformation.length, 0);
    assert.ok(res.conditionsSatisfied.length >= 3);
  });

  it('NEVER classifies missing profile info as a failure — returns Potentially Eligible', () => {
    const nsp = getScheme('nsp-post-matric');
    const sparseProfile: Partial<UserProfile> = {
      state: 'Gujarat',
      employmentStatus: 'Student',
    };
    const res = evaluateEligibility(sparseProfile, nsp);
    assert.equal(res.classification, 'Potentially Eligible');
    assert.equal(res.conditionsNotSatisfied.length, 0);
    assert.ok(res.missingInformation.length >= 2);
  });

  it('detects age restriction failure for NSP Post-Matric Scholarship', () => {
    const nsp = getScheme('nsp-post-matric');
    const profile: Partial<UserProfile> = {
      age: 45,
      state: 'Karnataka',
      incomeRange: 'Below ₹1,00,000',
      educationLevel: 'Undergraduate',
      employmentStatus: 'Student',
    };
    const res = evaluateEligibility(profile, nsp);
    assert.equal(res.classification, 'Not Currently Eligible');
    assert.ok(res.conditionsNotSatisfied.some((c) => c.toLowerCase().includes('age')));
  });

  it('detects income restriction failure for low-income schemes', () => {
    const pmayGramin = getScheme('pmay-gramin');
    const profile: Partial<UserProfile> = {
      age: 32,
      state: 'Bihar',
      residence: 'Rural',
      incomeRange: 'Above ₹8,00,000',
    };
    const res = evaluateEligibility(profile, pmayGramin);
    assert.equal(res.classification, 'Not Currently Eligible');
    assert.ok(res.conditionsNotSatisfied.some((c) => c.toLowerCase().includes('income')));
  });

  it('detects state restriction failure for Maharashtra Ladki Bahin outside Maharashtra', () => {
    const ladkiBahin = getScheme('maharashtra-ladki-bahin');
    const profile: Partial<UserProfile> = {
      age: 28,
      gender: 'Female',
      state: 'Tamil Nadu',
      incomeRange: 'Below ₹1,00,000',
    };
    const res = evaluateEligibility(profile, ladkiBahin);
    assert.equal(res.classification, 'Not Currently Eligible');
    assert.ok(res.conditionsNotSatisfied.some((c) => c.includes('Maharashtra')));
  });

  it('applies AB-PMJAY universal senior citizen (70+) income exemption', () => {
    const pmjay = getScheme('ayushman-bharat-pmjay');
    const seniorProfile: Partial<UserProfile> = {
      age: 74,
      state: 'Kerala',
      incomeRange: 'Above ₹8,00,000',
    };
    const res = evaluateEligibility(seniorProfile, pmjay);
    assert.equal(res.classification, 'Likely Eligible');
    assert.ok(res.conditionsSatisfied.some((c) => c.includes('70+')));
  });

  it('handles Stand-Up India Woman OR SC/ST inclusive logic properly', () => {
    const standUp = getScheme('stand-up-india');
    const womanGeneral = evaluateEligibility(
      {
        age: 30,
        gender: 'Female',
        socialCategory: 'General',
        state: 'Delhi',
      },
      standUp
    );
    assert.equal(womanGeneral.classification, 'Likely Eligible');

    const maleSc = evaluateEligibility(
      {
        age: 30,
        gender: 'Male',
        socialCategory: 'SC',
        state: 'Delhi',
      },
      standUp
    );
    assert.equal(maleSc.classification, 'Likely Eligible');

    const maleGeneral = evaluateEligibility(
      {
        age: 30,
        gender: 'Male',
        socialCategory: 'General',
        state: 'Delhi',
      },
      standUp
    );
    assert.equal(maleGeneral.classification, 'Not Currently Eligible');
  });

  it('excludes Archived schemes during evaluateAllSchemes', () => {
    const archivedClone: GovernmentScheme = {
      ...getScheme('pm-kisan'),
      id: 'archived-test-scheme',
      verificationStatus: 'Archived',
    };
    const results = evaluateAllSchemes({ age: 30 }, [getScheme('pm-kisan'), archivedClone]);
    assert.equal(results.length, 1);
    assert.equal(results[0].schemeId, 'pm-kisan');
  });
});
