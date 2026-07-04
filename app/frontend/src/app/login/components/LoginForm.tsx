'use client';

import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import styles from '../login.module.css';

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

interface LoginFormProps {
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onGoogleLogin: () => void;
  onForgot: () => void;
  onSwitchToSignup: () => void;
}

export default function LoginForm({
  email, setEmail, password, setPassword,
  showPassword, setShowPassword,
  error, loading, onSubmit, onGoogleLogin, onForgot, onSwitchToSignup,
}: LoginFormProps) {
  const darkInputStyle: React.CSSProperties = {
    WebkitAppearance: 'none',
    appearance: 'none',
    backgroundColor: '#101728',
    color: '#ffffff',
    border: 'none',
    outline: 'none',
    boxShadow: 'inset 8px 8px 16px rgba(0,0,0,0.7), inset -3px -3px 8px rgba(255,255,255,0.03)',
    borderRadius: '30px',
    width: '100%',
    padding: '12px 14px 12px 42px',
    fontSize: '0.9rem',
    fontWeight: 500,
    fontFamily: "var(--font-body, 'Inter', sans-serif)",
    boxSizing: 'border-box' as const,
    WebkitTextFillColor: '#ffffff',
  };
  const darkPasswordStyle: React.CSSProperties = {
    ...darkInputStyle,
    padding: '12px 46px 12px 42px',
  };
  return (
    <>
      <style>{`
        #email, #password {
          background-color: #101728 !important;
          -webkit-text-fill-color: rgba(255,255,255,0.9) !important;
          color: #ffffff !important;
          border: none !important;
          -webkit-appearance: none !important;
          appearance: none !important;
          -webkit-box-shadow:
            inset 7px 7px 15px rgba(0, 0, 0, 0.75),
            inset -5px -5px 12px rgba(255, 255, 255, 0.05),
            inset 0 0 0 1000px #101728 !important;
          box-shadow:
            inset 7px 7px 15px rgba(0, 0, 0, 0.75),
            inset -5px -5px 12px rgba(255, 255, 255, 0.05),
            inset 0 0 0 1000px #101728 !important;
        }
        #email::placeholder, #password::placeholder {
          color: rgba(255, 255, 255, 0.3) !important;
          -webkit-text-fill-color: rgba(255, 255, 255, 0.3) !important;
        }
        #email:-webkit-autofill,
        #email:-webkit-autofill:hover,
        #email:-webkit-autofill:focus,
        #password:-webkit-autofill,
        #password:-webkit-autofill:hover,
        #password:-webkit-autofill:focus {
          -webkit-box-shadow:
            inset 7px 7px 15px rgba(0, 0, 0, 0.75),
            inset -5px -5px 12px rgba(255, 255, 255, 0.05),
            inset 0 0 0 1000px #101728 !important;
          box-shadow:
            inset 7px 7px 15px rgba(0, 0, 0, 0.75),
            inset -5px -5px 12px rgba(255, 255, 255, 0.05),
            inset 0 0 0 1000px #101728 !important;
          -webkit-text-fill-color: rgba(255,255,255,0.9) !important;
        }
      `}</style>
      <h1 className={styles.welcomeTitle}>Welcome Back</h1>
      <p className={styles.welcomeSubtitle}>Enter your credentials to continue</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="email">Email Address</label>
          <div className={styles.inputWithIconNew}>
            <span className={styles.inputIcon}><Mail size={16} /></span>
            <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com" required autoComplete="off" style={darkInputStyle}
              suppressHydrationWarning />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="password">Password</label>
          <div className={styles.passwordWrapperNew}>
            <span className={styles.lockIcon}><Lock size={16} /></span>
            <input id="password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password"
              required autoComplete="new-password" style={darkPasswordStyle}
              suppressHydrationWarning />
            <button type="button" className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className={styles.forgotRow}>
          <button type="button" className={styles.forgotLink} onClick={onForgot}>Forgot Password?</button>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? 'Authenticating...' : 'Sign In'}
        </button>
      </form>

      <div className={styles.divider}>
        <div className={styles.dividerLine} />
        <span className={styles.dividerText}>or continue with</span>
        <div className={styles.dividerLine} />
      </div>

      <button type="button" className={styles.googleButton}
        onClick={onGoogleLogin} aria-label="Sign in with Google">
        <GoogleIcon />
      </button>

      <div className={styles.securityNote}>
        <ShieldCheck size={12} />
        <span>Encrypted Session <span className={styles.blueDot}>•</span> Authorized Personnel Only</span>
      </div>

      <div className={styles.signupPrompt}>
        Don&apos;t have an account?{' '}
        <button type="button" className={styles.signupLink} onClick={onSwitchToSignup}>Sign Up</button>
      </div>
    </>
  );
}
