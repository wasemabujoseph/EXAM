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
          background: radial-gradient(circle at top right, var(--primary-soft), transparent),
                      radial-gradient(circle at bottom left, var(--bg-soft), transparent),
                      var(--bg);
          padding: 1rem;
        }

        .auth-card {
          background: var(--surface-glass);
          backdrop-filter: blur(20px);
          padding: clamp(1.5rem, 8vw, 3rem);
          border-radius: 2.5rem;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.1);
          border: 1px solid var(--border-soft);
          width: 100%;
          max-width: 440px;
          animation: card-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes card-appear {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-header { text-align: center; margin-bottom: 2.5rem; }
        .auth-header h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
        .auth-header p { color: var(--text-muted); font-size: 0.95rem; font-weight: 600; }

        .auth-form { display: flex; flex-direction: column; gap: 1.5rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .form-group label { font-size: 0.8rem; font-weight: 800; color: var(--text-soft); text-transform: uppercase; letter-spacing: 0.05em; padding-left: 0.25rem; }

        .input-field { 
          position: relative; 
          display: flex; 
          align-items: center; 
          background: var(--bg-soft);
          border-radius: 1rem;
          border: 1px solid var(--border);
          transition: all 0.2s;
        }
        .input-field:focus-within { border-color: var(--primary); box-shadow: 0 0 0 4px var(--primary-soft-fade); background: var(--surface); }
        
        .field-icon { position: absolute; left: 1.25rem; color: var(--text-soft); }
        .input-field input { 
          width: 100%;
          padding: 0.875rem 1.25rem 0.875rem 3.25rem; 
          background: transparent;
          border: none;
          font-weight: 600;
          color: var(--text-strong);
        }
        .input-field input::placeholder { color: var(--text-muted); font-weight: 500; }

        .eye-toggle {
          position: absolute; right: 0.75rem;
          background: var(--surface); color: var(--text-soft);
          width: 32px; height: 32px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          transition: all 0.2s;
        }
        .eye-toggle:hover { color: var(--primary); background: var(--primary-soft-fade); }

        .auth-error {
          color: var(--danger); background: var(--danger-soft-fade);
          padding: 1rem; border-radius: 1rem;
          font-size: 0.85rem; font-weight: 700;
          display: flex; align-items: center; gap: 0.75rem;
          border: 1px solid var(--danger-soft);
        }

        .auth-submit {
          margin-top: 1rem; width: 100%; height: 52px;
          background: var(--primary); color: white;
          font-weight: 900; font-size: 1.1rem;
          border-radius: 1rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          transition: all 0.2s;
        }
        .auth-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); }
        .auth-submit:active { transform: translateY(0); }

        .auth-footer { margin-top: 2.5rem; text-align: center; color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }
        .auth-footer a { color: var(--primary); font-weight: 800; text-decoration: none; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .auth-footer a:hover { border-bottom-color: var(--primary); }

        @media (max-width: 480px) {
          .auth-card { padding: 2rem 1.5rem; border-radius: 2rem; border: none; box-shadow: none; background: transparent; backdrop-filter: none; }
          .auth-page { background: var(--bg); align-items: flex-start; padding-top: 10vh; }
          .auth-header h1 { font-size: 1.75rem; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
