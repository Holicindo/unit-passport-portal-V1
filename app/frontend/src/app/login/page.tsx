'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Mail, ChevronLeft, Unlock } from 'lucide-react';
import styles from './login.module.css';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';

/* ── Holic Logo SVG ── */
function HolicIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 120" fill="none" stroke="#ffffff" strokeWidth="5"
      strokeLinecap="square" strokeLinejoin="miter" xmlns="http://www.w3.org/2000/svg">
      <polygon points="60,5 10,95 20,110 60,110" />
      <line x1="70" y1="15" x2="70" y2="110" />
      <polyline points="70,15 110,90 100,110 70,110" />
      <polyline points="80,110 80,55 125,45" />
      <polyline points="90,110 90,85 135,75" />
    </svg>
  );
}

export default function LoginPage() {
  const [view, setView] = useState<'login' | 'forgot' | 'otp' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);
  const [loginHint, setLoginHint] = useState<'partner' | null>(null);
  const [signupName, setSignupName] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectUrl(params.get('redirect'));
      const initialView = params.get('view');
      if (initialView === 'signup') setView('signup');

      // Baca role hint dari QR scan
      const role = params.get('role');
      if (role === 'partner') setLoginHint('partner');

      // Handle Google OAuth callback
      const token = params.get('token');
      const userRaw = params.get('user');
      if (token) {
        localStorage.setItem('token', token);
        let userRole = 'CLIENT';
        if (userRaw) {
          try {
            const userObj = JSON.parse(decodeURIComponent(userRaw));
            localStorage.setItem('user', JSON.stringify(userObj));
            userRole = userObj.role;
          } catch {}
        }
        const redir = params.get('redirect');
        if (redir) router.push(redir);
        else if (userRole === 'CLIENT') router.push('/client-portal/dashboard');
        else if (userRole === 'PARTNER') router.push('/partner-portal');
        else router.push('/dashboard');
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      if (redirectUrl) router.push(redirectUrl);
      else if (data.user.role === 'CLIENT') router.push('/client-portal/dashboard');
      else if (data.user.role === 'PARTNER') router.push('/partner-portal');
      else router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== signupPasswordConfirm) { setError('Password tidak cocok.'); return; }
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.register({ email, password, name: signupName });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(redirectUrl || '/dashboard');
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.response?.data?.message || 'Pendaftaran gagal. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
    const callbackUrl = encodeURIComponent(`${window.location.origin}/login`);
    window.location.href = `${API_URL}/auth/google?redirect=${callbackUrl}`;
  };

  const switchToLogin = () => { setError(''); setView('login'); };

  return (
    <div className={styles.container}>
      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.dotGridRight} aria-hidden="true" />

      <div className={styles.loginBox}>
        <div className={styles.brandHeader}>
          <HolicIcon className={styles.logoMark} />
          <div className={styles.brandName}>HOLIC</div>
          <div className={styles.brandTagline}>Service Portal</div>
        </div>

        {/* Banner kontekstual untuk teknisi yang scan QR */}
        {loginHint === 'partner' && (
          <div style={{
            background: 'rgba(5,150,105,0.12)',
            border: '1px solid rgba(5,150,105,0.3)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
          }}>
            <span style={{ fontSize: '1.2rem', flexShrink: 0 }}>🔧</span>
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#059669', marginBottom: '2px' }}>
                Login sebagai Teknisi
              </div>
              <div style={{ fontSize: '0.75rem', color: '#065f46', lineHeight: 1.5 }}>
                Masukkan akun teknisi / mitra servis Holicindo untuk mengakses data teknis unit yang sedang Anda perbaiki.
              </div>
            </div>
          </div>
        )}

        <div className={styles.formArea}>
          {view === 'login' && (
            <LoginForm
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              showPassword={showPassword} setShowPassword={setShowPassword}
              error={error} loading={loading}
              onSubmit={handleLogin} onGoogleLogin={handleGoogleLogin}
              onForgot={() => { setError(''); setView('forgot'); }}
              onSwitchToSignup={() => { setError(''); setView('signup'); }}
            />
          )}

          {view === 'forgot' && (
            <>
              <button className={styles.backButton} onClick={switchToLogin} aria-label="Go back">
                <ChevronLeft size={20} />
              </button>
              <h1 className={styles.welcomeTitle}>Forgot Password</h1>
              <p className={styles.welcomeSubtitle}>Enter your email address to receive a reset code.</p>
              <form onSubmit={(e) => { e.preventDefault(); setView('otp'); }} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="reset-email">Email Address</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon}><Mail size={16} /></span>
                    <input id="reset-email" type="email" placeholder="name@company.com" required />
                  </div>
                </div>
                <button type="submit" className={styles.loginButton}>Send OTP</button>
              </form>
            </>
          )}

          {view === 'otp' && (
            <>
              <button className={styles.backButton} onClick={() => setView('forgot')} aria-label="Go back">
                <ChevronLeft size={20} />
              </button>
              <div className={styles.otpIconWrapper}>
                <Unlock size={32} color="#2e5bff" />
              </div>
              <h1 className={styles.welcomeTitle}>OTP Verification</h1>
              <p className={styles.welcomeSubtitle}>We sent a verification code to your email.</p>
              <form onSubmit={(e) => { e.preventDefault(); alert('Verifying OTP...'); }} className={styles.form}>
                <div className={styles.otpContainer}>
                  <input type="text" maxLength={1} className={styles.otpInput} required />
                  <input type="text" maxLength={1} className={styles.otpInput} required />
                  <input type="text" maxLength={1} className={styles.otpInput} required />
                  <input type="text" maxLength={1} className={styles.otpInput} required />
                </div>
                <button type="submit" className={styles.loginButton}>Verify OTP</button>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <button type="button" className={styles.forgotLink}>Resend OTP code</button>
                </div>
              </form>
            </>
          )}

          {view === 'signup' && (
            <SignupForm
              signupName={signupName} setSignupName={setSignupName}
              email={email} setEmail={setEmail}
              password={password} setPassword={setPassword}
              signupPasswordConfirm={signupPasswordConfirm} setSignupPasswordConfirm={setSignupPasswordConfirm}
              showPassword={showPassword} setShowPassword={setShowPassword}
              error={error} loading={loading}
              onSubmit={handleSignup} onBack={switchToLogin}
            />
          )}
        </div>
      </div>
    </div>
  );
}
