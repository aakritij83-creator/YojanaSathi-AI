import assert from 'node:assert/strict';
import type { Server } from 'node:http';
import { after, before, describe, it } from 'node:test';
import { mutateDb } from '../backend/db/store.ts';
import { createApp } from '../server.ts';

let server: Server;
let baseUrl = '';
const testEmail = `citizen.test.${Date.now()}@example.com`;
let authToken = '';
let applicationId = '';

before(async () => {
  const app = createApp();
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        baseUrl = `http://127.0.0.1:${addr.port}`;
      }
      resolve();
    });
  });
});

after(async () => {
  if (authToken) {
    await fetch(`${baseUrl}/api/auth/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
  }
  await mutateDb((db) => {
    db.feedback = db.feedback.filter((f) => !f.message.startsWith('[AUTOMATED_TEST]'));
  });
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe('API Integration & RBAC Tests', () => {
  it('returns healthy status from /api/health', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const data = (await res.json()) as { status: string; service: string };
    assert.equal(data.status, 'ok');
    assert.equal(data.service, 'YojanaSathi AI');
  });

  it('blocks unauthenticated access to protected citizen and admin endpoints', async () => {
    const dash = await fetch(`${baseUrl}/api/dashboard`);
    assert.equal(dash.status, 401);

    const adminRes = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(adminRes.status, 401);
  });

  it('registers a citizen user, enforces citizen role (anti-escalation), and blocks duplicate emails', async () => {
    const reg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Aarav Integration Test',
        email: testEmail,
        password: 'TestPassword!123',
        confirmPassword: 'TestPassword!123',
        preferredLanguage: 'hi',
        acceptTerms: true,
        role: 'admin',
      }),
    });
    assert.equal(reg.status, 201);
    const regData = (await reg.json()) as {
      token: string;
      user: { role: string; preferredLanguage: string; profile: { fullName: string } };
    };
    assert.ok(regData.token);
    assert.equal(regData.user.role, 'citizen');
    assert.equal(regData.user.preferredLanguage, 'hi');
    assert.equal(regData.user.profile.fullName, 'Aarav Integration Test');
    authToken = regData.token;

    const dup = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate User',
        email: testEmail,
        password: 'TestPassword!123',
        confirmPassword: 'TestPassword!123',
        preferredLanguage: 'en',
        acceptTerms: true,
      }),
    });
    assert.equal(dup.status, 409);

    const forbidden = await fetch(`${baseUrl}/api/admin/overview`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(forbidden.status, 403);
  });

  it('rejects wrong password on login and accepts valid login', async () => {
    const bad = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' }),
    });
    assert.equal(bad.status, 401);

    const good = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'TestPassword!123' }),
    });
    assert.equal(good.status, 200);
  });

  it('persists beneficiary profile and returns deterministic eligibility evaluations', async () => {
    const put = await fetch(`${baseUrl}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        fullName: 'Aarav Integration Test',
        age: 21,
        state: 'Maharashtra',
        residence: 'Urban',
        incomeRange: '₹1,00,000 – ₹2,50,000',
        educationLevel: 'Undergraduate',
        employmentStatus: 'Student',
      }),
    });
    assert.equal(put.status, 200);
    const putData = (await put.json()) as { completion: { percentage: number } };
    assert.ok(putData.completion.percentage >= 70);

    const elig = await fetch(`${baseUrl}/api/schemes/eligibility/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ useSavedProfile: true }),
    });
    assert.equal(elig.status, 200);
    const eligData = (await elig.json()) as {
      summary: { likelyEligible: number; potentiallyEligible: number; notCurrentlyEligible: number };
      results: { schemeId: string; classification: string }[];
    };
    assert.ok(eligData.results.length >= 10);
    assert.ok(eligData.summary.likelyEligible >= 1);
    const nsp = eligData.results.find((r) => r.schemeId === 'nsp-post-matric');
    assert.equal(nsp?.classification, 'Likely Eligible');
  });

  it('searches schemes, bookmarks, creates an application, and updates status history', async () => {
    const search = await fetch(`${baseUrl}/api/schemes?q=PM-KISAN`);
    assert.equal(search.status, 200);
    const searchData = (await search.json()) as { items: { id: string }[] };
    assert.ok(searchData.items.some((s) => s.id === 'pm-kisan'));

    const save = await fetch(`${baseUrl}/api/saved-schemes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ schemeId: 'nsp-post-matric' }),
    });
    assert.equal(save.status, 201);

    const appCreate = await fetch(`${baseUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        schemeId: 'nsp-post-matric',
        currentStatus: 'Preparing Documents',
        notes: 'Gathering bonafide letter.',
      }),
    });
    assert.equal(appCreate.status, 201);
    const appData = (await appCreate.json()) as { item: { id: string; currentStatus: string } };
    applicationId = appData.item.id;
    assert.equal(appData.item.currentStatus, 'Preparing Documents');

    const appUpdate = await fetch(`${baseUrl}/api/applications/${applicationId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        currentStatus: 'Submitted',
        notes: 'Submitted on NSP portal.',
      }),
    });
    assert.equal(appUpdate.status, 200);
    const updatedData = (await appUpdate.json()) as {
      item: { currentStatus: string; statusHistory: unknown[] };
    };
    assert.equal(updatedData.item.currentStatus, 'Submitted');
    assert.equal(updatedData.item.statusHistory.length, 2);

    const dash = await fetch(`${baseUrl}/api/dashboard`, {
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(dash.status, 200);
    const dashData = (await dash.json()) as {
      metrics: { savedSchemesCount: number; applicationsInProgressCount: number };
    };
    assert.equal(dashData.metrics.savedSchemesCount, 1);
    assert.equal(dashData.metrics.applicationsInProgressCount, 1);

    const delSave = await fetch(`${baseUrl}/api/saved-schemes/nsp-post-matric`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    assert.equal(delSave.status, 200);
  });

  it('validates rejection analyzer input cleanly and submits feedback', async () => {
    const emptyForm = new FormData();
    const rejErr = await fetch(`${baseUrl}/api/ai/analyze-rejection`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
      body: emptyForm,
    });
    assert.equal(rejErr.status, 400);

    const fb = await fetch(`${baseUrl}/api/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({
        category: 'General Feedback',
        message: '[AUTOMATED_TEST] Verification check passed.',
      }),
    });
    assert.equal(fb.status, 201);
  });
});
