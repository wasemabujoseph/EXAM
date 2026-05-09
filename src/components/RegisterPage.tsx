import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { Lock, Mail, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import BrandLogo from './BrandLogo';

const RegisterPage: React.FC = () => {
  const { register } = useVault();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      await register(name, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <BrandLogo variant="full" size="lg" className="justify-center mb-8" />
          <h1>Create Account</h1>
          <p>Join the MEDEXAM academic portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form register-form">
          <div className="form-group full">
            <label htmlFor="name">Username</label>
            <div className="input-field">
              <User className="field-icon" size={20} />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="your_username"
                required
              />
            </div>
          </div>

          <div className="form-group full">
            <label htmlFor="email">Email Address</label>
            <div className="input-field">
              <Mail className="field-icon" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-field">
              <Lock className="field-icon" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                required
              />
              <button
                type="button"
                className="eye-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-field">
              <Lock className="field-icon" size={20} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Register'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          padding: 1.5rem;
        }

        .auth-card {
          background: var(--surface);
          padding: clamp(1.5rem, 5vw, 3rem);
          border-radius: var(--radius-2xl);
          box-shadow: var(--shadow-xl);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 520px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 2rem;
        }

        .auth-logo {
          height: clamp(60px, 10vw, 84px);
          margin: 0 auto 1.5rem;
          display: block;
          object-fit: contain;
        }

        .auth-header h1 { font-size: 1.75rem; margin-bottom: 0.5rem; white-space: normal; }
        .auth-header p { color: var(--text-muted); font-size: 1rem; white-space: normal; }

        .auth-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .form-group.full { grid-column: span 2; }
        .form-group label { font-size: 0.875rem; font-weight: 700; color: var(--text-strong); }

        .input-field { position: relative; display: flex; align-items: center; }
        .field-icon { position: absolute; left: 1rem; color: var(--text-soft); }
        .input-field input { padding-left: 3rem; }

        .eye-toggle {
          position: absolute; right: 1rem;
          background: transparent; color: var(--text-soft);
          display: flex; align-items: center; padding: 4px;
        }

        .auth-error {
          grid-column: span 2;
          color: var(--danger); background: var(--danger-soft);
          padding: 0.875rem; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 600;
          display: flex; align-items: center; gap: 0.75rem;
          border: 1px solid var(--danger);
        }

        .auth-submit {
          grid-column: span 2;
          margin-top: 1rem; width: 100%;
          background: var(--primary); color: white;
          font-weight: 800; font-size: 1.1rem;
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-md);
        }

        .auth-submit:hover:not(:disabled) { background: var(--primary-hover); transform: translateY(-1px); }

        .auth-footer { margin-top: 2rem; text-align: center; color: var(--text-muted); font-weight: 600; }
        .auth-footer a { color: var(--primary); font-weight: 800; text-decoration: none; margin-left: 4px; }
        .auth-footer a:hover { text-decoration: underline; }

        @media (max-width: 640px) {
          .auth-form { grid-template-columns: 1fr; }
          .form-group.full { grid-column: span 1; }
          .auth-submit { grid-column: span 1; }
          .auth-error { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
