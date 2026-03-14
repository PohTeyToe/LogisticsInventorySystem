import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToastSimple';
import ToastContainer from '../components/shared/ToastContainer';
import styles from './Login.module.css';

export default function Register() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toasts, addToast, dismiss } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmError, setConfirmError] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      await register(email, password, fullName || undefined);
      addToast('Account created successfully!', 'success');
      navigate('/', { replace: true });
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { error?: string; errors?: string[] } } })?.response?.data;
      const msg = resp?.error || resp?.errors?.join(', ') || 'Registration failed. Please try again.';
      setError(msg);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.brandIcon}>LP</div>
          <div className={styles.brandText}>
            Logistics<span>Pulse</span>
          </div>
        </div>

        <h1 className={styles.title}>Create an account</h1>
        <p className={styles.subtitle}>Get started with LogisticsPulse</p>

        {error && <div className={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label className={styles.label} htmlFor="fullName">Full Name</label>
            <input
              id="fullName"
              className={styles.input}
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="John Doe"
              autoComplete="name"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="email">Email</label>
            <input
              id="email"
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="password">Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="password"
                className={styles.input}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 6 characters, must include a digit"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button type="button" className={styles.togglePasswordBtn} onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <div className={styles.passwordWrap}>
              <input
                id="confirmPassword"
                className={styles.input}
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setConfirmError(''); }}
                onBlur={() => { if (confirmPassword && confirmPassword !== password) setConfirmError('Passwords do not match'); }}
                placeholder="Confirm your password"
                required
                minLength={6}
                autoComplete="new-password"
              />
              <button type="button" className={styles.togglePasswordBtn} onClick={() => setShowConfirm(!showConfirm)} aria-label={showConfirm ? 'Hide password' : 'Show password'}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {confirmError && <div className={styles.fieldError}>{confirmError}</div>}
          </div>

          <button className={styles.submit} type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </div>
  );
}
