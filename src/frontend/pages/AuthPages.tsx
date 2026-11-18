import React, { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Info } from 'lucide-react';
import type { LanguageCode } from '../../../backend/types/index.ts';
import { ErrorBanner } from '../components/UiPrimitives.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useLanguage } from '../context/LanguageContext.tsx';
import { PublicLayout } from '../layouts/PublicLayout.tsx';
import { apiRequest } from '../services/api.ts';
import { LANGUAGE_OPTIONS } from '../translations/index.ts';

type LoginFormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const loginSchema = useMemo(
    () =>
      z.object({
        email: z.string().trim().email(t.auth.validation.emailInvalid),
        password: z.string().min(1, t.auth.validation.passwordRequired),
      }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      await login(values.email, values.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t.common.errorGeneric);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h1 className="font-display text-2xl font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
            {t.auth.loginTitle}
          </h1>
          <p className="mt-1.5 text-sm text-[#465362] dark:text-[#A9B4C2]">
            {t.auth.loginSubtitle}
          </p>

          {apiError && (
            <div className="mt-5">
              <ErrorBanner message={apiError} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="login-email" className="block text-xs font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                {t.auth.email}
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs font-semibold text-[#0F1D2E] dark:text-[#F4F1EA]">
                  {t.auth.password}
                </label>
                <Link to="/forgot-password" className="text-xs font-medium text-[#1F6F78] hover:underline dark:text-[#CBB07A]">
                  {t.auth.forgotPasswordLink}
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#0F1D2E] px-5 py-3 text-sm font-semibold text-[#FAF8F4] transition-colors hover:bg-[#1C304A] disabled:opacity-60 dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {isSubmitting ? t.common.loading : t.auth.loginButton}
            </button>
          </form>

          <div className="mt-5 flex items-start gap-2 rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] p-3 text-xs text-[#5B6777] dark:border-[#1F2E42] dark:bg-[#0A121C] dark:text-[#A9B4C2]">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{t.auth.googleNote}</span>
          </div>

          <p className="mt-6 text-center text-sm text-[#465362] dark:text-[#A9B4C2]">
            {t.auth.noAccount}{' '}
            <Link to="/register" className="font-semibold text-[#1F6F78] hover:underline dark:text-[#CBB07A]">
              {t.nav.register}
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

type RegisterFormValues = {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  preferredLanguage: LanguageCode;
  acceptTerms: boolean;
};

export function RegisterPage() {
  const { register: registerAccount } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);

  const registerSchema = useMemo(
    () =>
      z
        .object({
          fullName: z.string().trim().min(2, t.auth.validation.nameRequired).max(120),
          email: z.string().trim().email(t.auth.validation.emailInvalid).max(180),
          password: z.string().min(8, t.auth.validation.passwordMin).max(128),
          confirmPassword: z.string().min(8, t.auth.validation.confirmPasswordRequired),
          preferredLanguage: z.enum(['en', 'hi', 'bn', 'te', 'mr', 'ta', 'gu']),
          acceptTerms: z.boolean().refine((v) => v === true, {
            message: t.auth.validation.termsRequired,
          }),
        })
        .refine((d) => d.password === d.confirmPassword, {
          message: t.auth.validation.passwordMismatch,
          path: ['confirmPassword'],
        }),
    [t]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      preferredLanguage: language,
      acceptTerms: false,
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    try {
      await registerAccount({
        fullName: values.fullName,
        email: values.email,
        password: values.password,
        confirmPassword: values.confirmPassword,
        preferredLanguage: values.preferredLanguage as LanguageCode,
        acceptTerms: true,
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setApiError(err instanceof Error ? err.message : t.common.errorGeneric);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h1 className="font-display text-2xl font-bold text-[#0F1D2E] dark:text-[#F4F1EA]">
            {t.auth.registerTitle}
          </h1>
          <p className="mt-1.5 text-sm text-[#465362] dark:text-[#A9B4C2]">
            {t.auth.registerSubtitle}
          </p>

          {apiError && (
            <div className="mt-5">
              <ErrorBanner message={apiError} />
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
            <div>
              <label htmlFor="reg-name" className="block text-xs font-semibold">
                {t.auth.fullName}
              </label>
              <input
                id="reg-name"
                type="text"
                autoComplete="name"
                {...register('fullName')}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              {errors.fullName && (
                <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-xs font-semibold">
                {t.auth.email}
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="reg-password" className="block text-xs font-semibold">
                  {t.auth.password}
                </label>
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  {...register('password')}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.password.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="reg-confirm" className="block text-xs font-semibold">
                  {t.auth.confirmPassword}
                </label>
                <input
                  id="reg-confirm"
                  type="password"
                  autoComplete="new-password"
                  {...register('confirmPassword')}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="reg-lang" className="block text-xs font-semibold">
                {t.auth.preferredLanguage}
              </label>
              <select
                id="reg-lang"
                {...register('preferredLanguage')}
                className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.label} ({opt.nativeLabel})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-start gap-2.5 text-xs text-[#465362] dark:text-[#A9B4C2]">
                <input
                  type="checkbox"
                  {...register('acceptTerms')}
                  className="mt-0.5 h-4 w-4 rounded border-[#CFC7B6] accent-[#0F1D2E]"
                />
                <span>
                  {t.auth.acceptTerms} (
                  <Link to="/privacy" className="underline hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">
                    {t.auth.privacyPolicyShort}
                  </Link>{' '}
                  &amp;{' '}
                  <Link to="/terms" className="underline hover:text-[#0F1D2E] dark:hover:text-[#F4F1EA]">
                    {t.auth.termsShort}
                  </Link>
                  )
                </span>
              </label>
              {errors.acceptTerms && (
                <p className="mt-1 text-xs text-[#9E3B3B] dark:text-[#E58A8A]">{errors.acceptTerms.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl bg-[#0F1D2E] px-5 py-3 text-sm font-semibold text-[#FAF8F4] transition-colors hover:bg-[#1C304A] disabled:opacity-60 dark:bg-[#CBB07A] dark:text-[#0A121C]"
            >
              {isSubmitting ? t.common.loading : t.auth.registerButton}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#465362] dark:text-[#A9B4C2]">
            {t.auth.haveAccount}{' '}
            <Link to="/login" className="font-semibold text-[#1F6F78] hover:underline dark:text-[#CBB07A]">
              {t.nav.login}
            </Link>
          </p>
        </div>
      </div>
    </PublicLayout>
  );
}

export function ForgotPasswordPage() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [localCode, setLocalCode] = useState<string | null>(null);
  const [errMsg, setErrMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setBusy(true);
    try {
      const res = await apiRequest<{ ok: boolean; message: string; localVerificationCode?: string }>(
        '/api/auth/forgot-password',
        { method: 'POST', body: JSON.stringify({ email }) }
      );
      setInfoMsg(res.message);
      if (res.localVerificationCode) {
        setLocalCode(res.localVerificationCode);
        setCode(res.localVerificationCode);
      }
      setStep('reset');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrMsg(null);
    setBusy(true);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token: code, newPassword, confirmPassword }),
      });
      navigate('/login');
    } catch (err) {
      setErrMsg(err instanceof Error ? err.message : t.common.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-md px-4 py-14 sm:px-6">
        <div className="rounded-2xl border border-[#E6E1D6] bg-white p-6 sm:p-8 dark:border-[#1F2E42] dark:bg-[#111C2B]">
          <h1 className="font-display text-2xl font-bold">{t.auth.forgotPasswordTitle}</h1>
          {errMsg && (
            <div className="mt-4">
              <ErrorBanner message={errMsg} />
            </div>
          )}
          {infoMsg && (
            <div className="mt-4 rounded-xl border border-[#1F6F78]/30 bg-[#1F6F78]/10 p-3 text-xs text-[#0F1D2E] dark:text-[#F4F1EA]">
              <p>{infoMsg}</p>
              {localCode && (
                <p className="mt-1.5 font-mono font-semibold">
                  {t.auth.resetCodeDisplayLabel}: {localCode}
                </p>
              )}
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fp-email" className="block text-xs font-semibold">
                  {t.auth.email}
                </label>
                <input
                  id="fp-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#0F1D2E] px-5 py-3 text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
              >
                {busy ? t.common.loading : t.auth.sendResetCodeButton}
              </button>
            </form>
          ) : (
            <form onSubmit={handleReset} className="mt-6 space-y-4">
              <div>
                <label htmlFor="fp-code" className="block text-xs font-semibold">
                  {t.auth.resetCodeLabel}
                </label>
                <input
                  id="fp-code"
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 font-mono text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
              </div>
              <div>
                <label htmlFor="fp-new" className="block text-xs font-semibold">
                  {t.auth.newPasswordLabel}
                </label>
                <input
                  id="fp-new"
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
              </div>
              <div>
                <label htmlFor="fp-confirm" className="block text-xs font-semibold">
                  {t.auth.confirmPassword}
                </label>
                <input
                  id="fp-confirm"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E6E1D6] bg-[#FAF8F4] px-3.5 py-2.5 text-sm dark:border-[#1F2E42] dark:bg-[#0A121C]"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-xl bg-[#0F1D2E] px-5 py-3 text-sm font-semibold text-[#FAF8F4] dark:bg-[#CBB07A] dark:text-[#0A121C]"
              >
                {busy ? t.common.loading : t.auth.resetPasswordButton}
              </button>
            </form>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}
