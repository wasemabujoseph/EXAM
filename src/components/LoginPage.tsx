import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { Lock, User, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-react';
import BrandLogo from './BrandLogo';

const LoginPage: React.FC = () => {
  const { login } = useVault();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const timeout = setTimeout(() => {
      if (isLoading) setError('Server response is slow. Please check your connection.');
    }, 15000);

    try {
      await login(username, password);
      clearTimeout(timeout);
      navigate('/dashboard');
    } catch (err: any) {
      clearTimeout(timeout);
      setError(err.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <BrandLogo variant="full" size="lg" className="justify-center mb-8" />
          <h1>Sign In</h1>
          <p>Access your medical education portal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <div className="input-field">
              <User className="field-icon" size={20} />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="your_username"
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
                placeholder="••••••••"
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

          {error && (
            <div className="auth-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Register now</Link></p>
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
          max-width: 480px;
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

        .auth-form { display: flex; flex-direction: column; gap: 1.25rem; }
        
        .form-group { display: flex; flex-direction: column; gap: 0.5rem; }
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
          color: var(--danger); background: var(--danger-soft);
          padding: 0.875rem; border-radius: var(--radius-md);
          font-size: 0.875rem; font-weight: 600;
          display: flex; align-items: center; gap: 0.75rem;
          border: 1px solid var(--danger);
        }

        .auth-submit {
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
      `}</style>
    </div>
  );
};

export default LoginPage;
