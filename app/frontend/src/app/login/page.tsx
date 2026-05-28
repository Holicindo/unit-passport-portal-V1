'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Mail, Lock, ShieldCheck, ChevronLeft, Unlock, User } from 'lucide-react';
import styles from './login.module.css';

/* ── Holic Logo SVG — matching Image 2 ── */
function HolicIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 120"
      fill="none"
      stroke="#ffffff"
      strokeWidth="5"
      strokeLinecap="square"
      strokeLinejoin="miter"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left triangle half (chamfered bottom left) */}
      <polygon points="60,5 10,95 20,110 60,110" />
      
      {/* Right vertical line */}
      <line x1="70" y1="15" x2="70" y2="110" />

      {/* Outer right diagonal (chamfered bottom right) */}
      <polyline points="70,15 110,90 100,110 70,110" />

      {/* Bent line 1 (Top) - extends outside */}
      <polyline points="80,110 80,55 125,45" />

      {/* Bent line 2 (Bottom) - extends outside */}
      <polyline points="90,110 90,85 135,75" />
    </svg>
  );
}

/* ── Google G icon ── */
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function LoginPage() {
  const [view, setView]                 = useState<'login' | 'forgot' | 'otp' | 'signup'>('login');
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [redirectUrl, setRedirectUrl]   = useState<string | null>(null);
  const [signupName, setSignupName]     = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectUrl(params.get('redirect'));

      // Check if there's a view param to open a specific form (like signup)
      const initialView = params.get('view');
      if (initialView === 'signup') {
        setView('signup');
      }

      // Handle Google OAuth callback — token passed as query param
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
        if (redir) {
          router.push(redir);
        } else if (userRole === 'CLIENT') {
          router.push('/client-portal/dashboard');
        } else if (userRole === 'PARTNER') {
          router.push('/partner-portal');
        } else {
          router.push('/dashboard');
        }
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
      
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (data.user.role === 'CLIENT') {
        router.push('/client-portal/dashboard');
      } else if (data.user.role === 'PARTNER') {
        router.push('/partner-portal');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== signupPasswordConfirm) {
      setError('Password tidak cocok.');
      return;
    }
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
    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    // Redirect to backend Google OAuth — backend will redirect back with token
    const callbackUrl = encodeURIComponent(`${window.location.origin}/login`);
    window.location.href = `${API_URL}/auth/google?redirect=${callbackUrl}`;
  };

  const handleForgotPassword = () => {
    // Placeholder — can be wired to a reset flow later
    alert('Hubungi administrator untuk reset password.');
  };

  return (
    <div className={styles.container}>
      {/* Dot grid decorations */}
      <div className={styles.dotGrid} aria-hidden="true" />
      <div className={styles.dotGridRight} aria-hidden="true" />

      <div className={styles.loginBox}>

        {/* ── Brand header ── */}
        <div className={styles.brandHeader}>
          <HolicIcon className={styles.logoMark} />
          <div className={styles.brandName}>HOLICINDO</div>
          <div className={styles.brandTagline}>Unit Passport Portal</div>
        </div>

        {/* ── Form Area (White bottom sheet on mobile, transparent on desktop) ── */}
        <div className={styles.formArea}>

          {view === 'login' && (
            <>
              {/* ── Welcome text ── */}
              <h1 className={styles.welcomeTitle}>Welcome Back</h1>
              <p className={styles.welcomeSubtitle}>Enter your credentials to continue</p>

          {/* ── Form ── */}
          <form onSubmit={handleLogin} className={styles.form}>

            {/* Email */}
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWithIcon}>
                <span className={styles.inputIcon}>
                  <Mail size={16} />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.passwordWrapper}>
                <span className={styles.lockIcon}>
                  <Lock size={16} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Forgot password */}
            <div className={styles.forgotRow}>
              <button
                type="button"
                className={styles.forgotLink}
                onClick={() => { setError(''); setView('forgot'); }}
              >
                Forgot Password?
              </button>
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            {/* Sign In */}
            <button type="submit" className={styles.loginButton} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* ── Divider ── */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>or continue with</span>
            <div className={styles.dividerLine} />
          </div>

          {/* ── Google login ── */}
          <button
            type="button"
            className={styles.googleButton}
            onClick={handleGoogleLogin}
            aria-label="Sign in with Google"
          >
            <GoogleIcon />
          </button>

          {/* ── Security note ── */}
          <div className={styles.securityNote}>
            <ShieldCheck size={12} />
            <span>Encrypted Session <span className={styles.blueDot}>•</span> Authorized Personnel Only</span>
          </div>
          
          {/* ── Sign Up Prompt ── */}
          <div className={styles.signupPrompt}>
            Don't have an account?{' '}
            <button type="button" className={styles.signupLink} onClick={() => { setError(''); setView('signup'); }}>
              Sign Up
            </button>
          </div>
          </>
          )}

          {view === 'forgot' && (
            <>
              <button className={styles.backButton} onClick={() => setView('login')} aria-label="Go back">
                <ChevronLeft size={20} />
              </button>
              
              <h1 className={styles.welcomeTitle}>Forgot Password</h1>
              <p className={styles.welcomeSubtitle}>Enter your email address to receive a reset code.</p>

              <form onSubmit={(e) => { e.preventDefault(); setView('otp'); }} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="reset-email">Email Address</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon}>
                      <Mail size={16} />
                    </span>
                    <input
                      id="reset-email"
                      type="email"
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>
                
                <button type="submit" className={styles.loginButton}>
                  Send OTP
                </button>
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
                
                <button type="submit" className={styles.loginButton}>
                  Verify OTP
                </button>
                
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                  <button type="button" className={styles.forgotLink}>
                    Resend OTP code
                  </button>
                </div>
              </form>
            </>
          )}

          {view === 'signup' && (
            <>
              <button className={styles.backButton} onClick={() => setView('login')} aria-label="Go back">
                <ChevronLeft size={20} />
              </button>
              
              <h1 className={styles.welcomeTitle}>Create Account</h1>
              <p className={styles.welcomeSubtitle}>Sign up to access the Unit Passport Portal.</p>

              <form onSubmit={handleSignup} className={styles.form}>
                <div className={styles.inputGroup}>
                  <label htmlFor="signup-name">Full Name</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon}>
                      <User size={16} />
                    </span>
                    <input
                      id="signup-name"
                      type="text"
                      value={signupName}
                      onChange={(e) => setSignupName(e.target.value)}
                      placeholder="John Doe"
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="signup-email">Email Address</label>
                  <div className={styles.inputWithIcon}>
                    <span className={styles.inputIcon}>
                      <Mail size={16} />
                    </span>
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@company.com"
                      required
                    />
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="signup-password">Password</label>
                  <div className={styles.passwordWrapper}>
                    <span className={styles.lockIcon}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                      required
                    />
                    <button
                      type="button"
                      className={styles.eyeBtn}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="signup-confirm-password">Confirm Password</label>
                  <div className={styles.passwordWrapper}>
                    <span className={styles.lockIcon}>
                      <Lock size={16} />
                    </span>
                    <input
                      id="signup-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={signupPasswordConfirm}
                      onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                </div>

                {error && <p className={styles.errorMessage}>{error}</p>}

                <button type="submit" className={styles.loginButton} disabled={loading}>
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>
              </form>

              <div className={styles.signupPrompt}>
                Already have an account?{' '}
                <button type="button" className={styles.signupLink} onClick={() => { setError(''); setView('login'); }}>
                  Sign In
                </button>
              </div>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
