import React, { useEffect, useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { ArrowLeft, CheckCircle2, Eye, EyeOff, KeyRound, LogIn, Mail, RefreshCw, Sparkles, UserPlus } from 'lucide-react';
import { TermsModal } from './TermsModal';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register' | 'google';
}

// Password field with a show / hide toggle.
const PasswordInput: React.FC<{
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  minLength?: number;
  className: string;
}> = ({ value, onChange, autoComplete, minLength, className }) => {
  const [visible, setVisible] = useState(false);
  return (
    <span className="relative block">
      <input
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${className} pr-10`}
      />
      <button
        type="button"
        onClick={() => setVisible((shown) => !shown)}
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
        title={visible ? 'Hide password' : 'Show password'}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#8A7969] hover:text-[#24201C]"
      >
        {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </span>
  );
};

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, defaultMode = 'google' }) => {
  const { login, register, sendVerificationCode, loginWithGoogle, error, clearError } = useDiary();
  const [mode, setMode] = useState<'login' | 'register' | 'google'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  // Mandatory Terms & Email Opt-in states
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  // Email verification flow states
  const [verificationStep, setVerificationStep] = useState<'form' | 'verify'>('form');
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [isRealEmail, setIsRealEmail] = useState<boolean>(false);
  const [pendingRegistration, setPendingRegistration] = useState<{
    username: string;
    displayName: string;
    bio: string;
    email: string;
    password: string;
    termsAccepted: boolean;
    emailOptIn: boolean;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get('auth_error');
    if (authError) {
      setLocalError(authError);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  if (!isOpen) return null;

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setLocalError('');
    clearError();
    try {
      await task();
    } catch (reason: any) {
      setLocalError(reason?.message || 'Sign-in could not be completed.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogin = (event: React.FormEvent) => {
    event.preventDefault();
    void run(() => login(email.trim(), password));
  };

  const handleRegister = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');
    setInfoMessage('');

    if (displayName.trim().length < 2 || displayName.trim().length > 80) {
      setLocalError('Please enter a display name between 2 and 80 characters.');
      return;
    }
    if (!/^[a-z0-9_]{3,24}$/.test(username.trim().toLowerCase())) {
      setLocalError('Username must be 3-24 characters using lowercase letters, numbers, or underscores.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setLocalError('Use a password with at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setLocalError('Those passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setLocalError('You must agree to the Terms & Conditions and Privacy Policy to create an account.');
      return;
    }

    if (!emailOptIn) {
      setLocalError('You must opt in to receive platform updates via email (Mandatory for account creation).');
      return;
    }

    const payload = {
      username: username.trim().toLowerCase(),
      displayName: displayName.trim(),
      bio: bio.trim(),
      email: email.trim(),
      password,
      termsAccepted: true,
      emailOptIn: true,
    };

    setPendingRegistration(payload);

    // Call backend API to dispatch verification email
    void run(async () => {
      const response = await sendVerificationCode(email.trim(), displayName.trim());
      setIsRealEmail(Boolean(response.realEmail));
      setGeneratedCode(response.devCode || '');
      setVerificationCode('');
      setVerificationStep('verify');
      setInfoMessage(
        response.realEmail
          ? `We sent a 6-digit verification code to ${email.trim()}. Please check your email inbox.`
          : `Verification code generated. Check below or configure backend/.env for real email delivery.`
      );
    });
  };

  const handleVerifyCode = (event: React.FormEvent) => {
    event.preventDefault();
    setLocalError('');

    if (!pendingRegistration) {
      setLocalError('Registration session expired. Please fill the form again.');
      setVerificationStep('form');
      return;
    }

    if (verificationCode.trim().length !== 6) {
      setLocalError('Please enter the full 6-digit verification code.');
      return;
    }

    // Call register with verificationCode to complete registration!
    void run(async () => {
      await register({
        ...pendingRegistration,
        verificationCode: verificationCode.trim(),
      });
    });
  };

  const handleResendCode = () => {
    const targetEmail = pendingRegistration?.email || email.trim();
    const targetName = pendingRegistration?.displayName || displayName.trim();
    void run(async () => {
      const response = await sendVerificationCode(targetEmail, targetName);
      setIsRealEmail(Boolean(response.realEmail));
      setGeneratedCode(response.devCode || '');
      setVerificationCode('');
      setLocalError('');
      setInfoMessage(
        response.realEmail
          ? `A new verification code has been dispatched to ${targetEmail}.`
          : `A new code has been generated.`
      );
    });
  };

  const switchTab = (option: 'google' | 'login' | 'register') => {
    setMode(option);
    setLocalError('');
    setInfoMessage('');
    clearError();
    setVerificationStep('form');
  };

  const message = localError || error;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <section className="bg-[#FAF8F5] border border-[#E3DCCF] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6">
        <header>
          <div className="flex items-center gap-1.5 text-xs font-mono-type uppercase tracking-wider text-[#8A7969]">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Typing Diary</span>
          </div>
          <h1 className="font-serif-display text-2xl font-bold text-[#24201C] mt-2">
            {mode === 'register'
              ? verificationStep === 'verify'
                ? 'Verify your email address'
                : 'Create your writer profile'
              : 'Return to your diary'}
          </h1>
          <p className="text-xs text-[#736558] mt-1">
            {mode === 'register' && verificationStep === 'verify'
              ? 'Enter the 6-digit code sent to your email to activate your account.'
              : 'Sign in to keep private pages private, share selected entries, and meet other writers.'}
          </p>
        </header>

        <div className="grid grid-cols-3 gap-1 p-1 bg-[#EFE9DF] rounded-xl text-xs font-medium text-[#6B5E52]">
          {(['google', 'login', 'register'] as const).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => switchTab(option)}
              className={`py-2 px-2 rounded-lg capitalize transition-colors ${mode === option ? 'bg-[#FAF8F5] text-[#24201C] font-semibold shadow-xs' : 'hover:text-[#24201C]'}`}
            >
              {option === 'google' ? 'Google' : option === 'login' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {infoMessage && (
          <div role="status" className="flex items-start gap-2 text-xs text-[#1F6B54] bg-[#E6F4F0] p-3 rounded-lg border border-[#A8D8CC]">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {message && (
          <p role="alert" className="text-xs text-[#A63A2B] bg-[#FDEAE8] p-3 rounded-lg border border-[#F2C4BE]">
            {message}
          </p>
        )}

        {mode === 'google' && (
          <div className="space-y-4">
            <div className="p-4 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white border border-[#EAE4DC] flex items-center justify-center">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                </div>
                <div>
                  <h2 className="font-serif-display text-sm font-bold text-[#24201C]">Continue with Google</h2>
                  <p className="text-[11px] text-[#736558]">Google verifies your sign-in; your diary stays in your app account.</p>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] disabled:opacity-60 rounded-xl transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>Continue with Google</span>
            </button>
            <p className="text-[11px] leading-relaxed text-[#8A7969]">
              Google sign-in needs OAuth credentials configured on the backend deployment. Email and password sign-in remains available below.
            </p>
          </div>
        )}

        {mode === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <label className="block text-xs font-semibold text-[#4A3E33]">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full px-3 py-2.5 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-xs font-semibold text-[#4A3E33]">
              Password
              <PasswordInput autoComplete="current-password" value={password} onChange={setPassword} className="mt-1 w-full px-3 py-2.5 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]" />
            </label>
            <button disabled={busy} className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] disabled:opacity-60 rounded-xl transition-colors">
              <LogIn className="w-4 h-4" />{busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}

        {mode === 'register' && verificationStep === 'form' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-[#4A3E33]">
                Username
                <input
                  required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-mono-type font-normal focus:outline-none focus:border-[#8C765E]"
                  placeholder="writer_name"
                />
              </label>
              <label className="block text-xs font-semibold text-[#4A3E33]">
                Display name
                <input
                  required minLength={2} maxLength={80}
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]"
                  placeholder="Your pen name"
                />
              </label>
            </div>
            <label className="block text-xs font-semibold text-[#4A3E33]">
              Email
              <input
                type="email" autoComplete="email" required
                value={email} onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]"
                placeholder="you@example.com"
              />
            </label>
            <label className="block text-xs font-semibold text-[#4A3E33]">
              Short bio <span className="font-normal text-[#8A7969]">(optional)</span>
              <textarea
                maxLength={280} rows={2} value={bio} onChange={(event) => setBio(event.target.value)}
                className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]"
                placeholder="A line about what you like to write."
              />
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block text-xs font-semibold text-[#4A3E33]">
                Password
                <PasswordInput autoComplete="new-password" minLength={8} value={password} onChange={setPassword} className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]" />
              </label>
              <label className="block text-xs font-semibold text-[#4A3E33]">
                Confirm password
                <PasswordInput autoComplete="new-password" minLength={8} value={confirmPassword} onChange={setConfirmPassword} className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg text-[#24201C] font-normal focus:outline-none focus:border-[#8C765E]" />
              </label>
            </div>

            {/* Mandatory Terms & Conditions and Email Opt-in Checkboxes */}
            <div className="space-y-2.5 pt-2 border-t border-[#EAE4DC]">
              <label className="flex items-start gap-2.5 text-xs text-[#4A3E33] cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#DDD6CB] accent-[#2B2621] shrink-0"
                />
                <span className="leading-snug">
                  I have read and agree to the{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsOpen(true)}
                    className="font-semibold text-[#24201C] underline hover:text-[#8C765E]"
                  >
                    Terms & Conditions and Privacy Policy
                  </button>{' '}
                  <span className="text-[#B3402C] font-bold">*</span>
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-xs text-[#4A3E33] cursor-pointer select-none">
                <input
                  type="checkbox"
                  required
                  checked={emailOptIn}
                  onChange={(e) => setEmailOptIn(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-[#DDD6CB] accent-[#2B2621] shrink-0"
                />
                <span className="leading-snug">
                  I opt in to receive platform updates, announcements, and product news via email.{' '}
                  <span className="font-semibold text-[#8C765E]">(Mandatory to create account)</span>{' '}
                  <span className="text-[#B3402C] font-bold">*</span>
                </span>
              </label>
            </div>

            <button
              disabled={busy || !agreeTerms || !emailOptIn}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
            >
              <Mail className="w-4 h-4" />{busy ? 'Sending verification email…' : 'Continue to Email Verification'}
            </button>
          </form>
        )}

        {mode === 'register' && verificationStep === 'verify' && (
          <form onSubmit={handleVerifyCode} className="space-y-4">
            <div className="p-4 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-[#EFE9DF] text-[#6B5E52] flex items-center justify-center mx-auto">
                <Mail className="w-5 h-5 text-[#8C765E]" />
              </div>
              <p className="text-xs text-[#594C3F]">
                Verification code sent to <span className="font-semibold text-[#24201C]">{pendingRegistration?.email || email}</span>
              </p>

              {isRealEmail ? (
                <p className="text-[11px] text-[#4A6B3D] bg-[#EAF5EC] border border-[#BDE0C4] p-2 rounded-lg">
                  ✉️ Real email sent! Please check your inbox (and spam/junk folder) for the 6-digit code.
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="bg-[#FAF8F5] border border-[#E0D7C9] rounded-lg p-2.5 max-w-xs mx-auto">
                    <span className="text-[11px] text-[#8A7969] block mb-0.5 font-medium">Test code (SMTP not in .env yet):</span>
                    <span className="font-mono-type text-lg font-bold tracking-widest text-[#2B2621]">
                      {generatedCode}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#8A7969]">
                    To deliver to real inboxes, add Gmail App Password or Resend key to <code className="bg-[#EFE9DF] px-1 py-0.5 rounded">backend/.env</code>.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#4A3E33] text-center">
                Enter 6-digit code from email
              </label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                required
                autoFocus
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-3 py-3 bg-white border border-[#DDD6CB] rounded-xl text-[#24201C] text-center font-mono-type text-xl font-bold tracking-[0.35em] focus:outline-none focus:border-[#8C765E]"
                placeholder="••••••"
              />
            </div>

            <button
              type="submit"
              disabled={busy || verificationCode.trim().length !== 6}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
            >
              <UserPlus className="w-4 h-4" />
              {busy ? 'Verifying & Creating…' : 'Verify Email & Create Account'}
            </button>

            <div className="flex items-center justify-between text-xs text-[#736558] pt-2">
              <button
                type="button"
                onClick={() => { setVerificationStep('form'); setLocalError(''); setInfoMessage(''); }}
                className="inline-flex items-center gap-1 hover:text-[#24201C] underline-offset-2 hover:underline"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to details
              </button>
              <button
                type="button"
                onClick={handleResendCode}
                className="inline-flex items-center gap-1 hover:text-[#24201C] underline-offset-2 hover:underline"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Resend code
              </button>
            </div>
          </form>
        )}
      </section>
      <TermsModal isOpen={isTermsOpen} onClose={() => setIsTermsOpen(false)} />
    </div>
  );
};
