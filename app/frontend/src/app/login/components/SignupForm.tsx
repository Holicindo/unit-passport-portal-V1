'use client';

import { Mail, Lock, Eye, EyeOff, User, ChevronLeft } from 'lucide-react';
import styles from '../login.module.css';

interface SignupFormProps {
  signupName: string;
  setSignupName: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  signupPasswordConfirm: string;
  setSignupPasswordConfirm: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
}

export default function SignupForm({
  signupName, setSignupName, email, setEmail,
  password, setPassword, signupPasswordConfirm, setSignupPasswordConfirm,
  showPassword, setShowPassword, error, loading, onSubmit, onBack,
}: SignupFormProps) {
  return (
    <>
      <button className={styles.backButton} onClick={onBack} aria-label="Go back">
        <ChevronLeft size={20} />
      </button>

      <h1 className={styles.welcomeTitle}>Create Account</h1>
      <p className={styles.welcomeSubtitle}>Sign up to access the Unit Passport Portal.</p>

      <form onSubmit={onSubmit} className={styles.form}>
        <div className={styles.inputGroup}>
          <label htmlFor="signup-name">Full Name</label>
          <div className={styles.inputWithIconNew}>
            <span className={styles.inputIcon}><User size={16} /></span>
            <input id="signup-name" type="text" value={signupName}
              onChange={(e) => setSignupName(e.target.value)} placeholder="John Doe" required
              autoComplete="off" />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="signup-email">Email Address</label>
          <div className={styles.inputWithIconNew}>
            <span className={styles.inputIcon}><Mail size={16} /></span>
            <input id="signup-email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" required
              autoComplete="off" />
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="signup-password">Password</label>
          <div className={styles.passwordWrapperNew}>
            <span className={styles.lockIcon}><Lock size={16} /></span>
            <input id="signup-password" type={showPassword ? 'text' : 'password'} value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" required
              autoComplete="new-password" />
            <button type="button" className={styles.eyeBtn}
              onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="signup-confirm-password">Confirm Password</label>
          <div className={styles.passwordWrapperNew}>
            <span className={styles.lockIcon}><Lock size={16} /></span>
            <input id="signup-confirm-password" type={showPassword ? 'text' : 'password'}
              value={signupPasswordConfirm}
              onChange={(e) => setSignupPasswordConfirm(e.target.value)}
              placeholder="Confirm your password" required
              autoComplete="new-password" />
          </div>
        </div>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <button type="submit" className={styles.loginButton} disabled={loading}>
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <div className={styles.signupPrompt}>
        Already have an account?{' '}
        <button type="button" className={styles.signupLink} onClick={onBack}>Sign In</button>
      </div>
    </>
  );
}
