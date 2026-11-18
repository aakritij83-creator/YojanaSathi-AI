import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { SUPPORTED_LANGUAGES, type LanguageCode } from '../backend/types/index.ts';
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
});
