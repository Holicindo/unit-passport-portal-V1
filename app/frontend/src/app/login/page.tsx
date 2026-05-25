'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import styles from './login.module.css';

/* SVG removed, using the real logo image as requested */

export default function LoginPage() {
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [redirectUrl, setRedirectUrl]   = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      setRedirectUrl(params.get('redirect'));
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login({ email, password });
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      router.push(redirectUrl || '/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login gagal. Periksa koneksi atau kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>

      {/* ── LEFT PANEL — Brand ── */}
      <div className={styles.leftPanel}>
        <img src="/holic-logo-gold.png" alt="Holic Logo" className={styles.brandLogo} />
        <div className={styles.brandName}>HOLICINDO</div>
        <div className={styles.brandTagline}>UNIT PASSPORT PORTAL</div>
      </div>

      {/* ── RIGHT PANEL — Form ── */}
      <div className={styles.rightPanel}>
        <div className={styles.formWrapper}>

          <div className={styles.formHeader}>
            <div className={styles.formEyebrow}>Login your account</div>
            <h1 className={styles.formTitle}>Welcome Back!</h1>
            <p className={styles.formSubtitle}>Enter your email and password</p>
          </div>

          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="email">Email Address</label>
              <div className={styles.inputWrapper}>
                <Mail className={styles.inputIcon} size={18} />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                  className={styles.withIcon}
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password">Password</label>
              <div className={styles.inputWrapper}>
                <Lock className={styles.inputIcon} size={18} />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                  className={styles.withIcon}
                />
                <button
                  type="button"
                  className={styles.eyeBtn}
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <p className={styles.errorMessage}>{error}</p>}

            <div className={styles.forgotPassword}>
              <a href="#">Forgot Password?</a>
            </div>

            <button type="submit" className={styles.loginButton} disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign in'}
            </button>
          </form>

        </div>
      </div>

    </div>
  );
}
