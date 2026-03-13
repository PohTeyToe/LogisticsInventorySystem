import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import styles from './Register.module.css';

export default function Register() {
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
            <input
              id="password"
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min. 6 characters, must include a digit"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              className={styles.input}
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button className={styles.submit} type="submit" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <div className={styles.footer}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
