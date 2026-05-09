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
          max-width: 520px;
          animation: card-appear 0.6s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes card-appear {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-header { text-align: center; margin-bottom: 2.5rem; }
        .auth-header h1 { font-size: 2rem; font-weight: 900; letter-spacing: -0.03em; margin-bottom: 0.5rem; }
        .auth-header p { color: var(--text-muted); font-size: 0.95rem; font-weight: 600; }

        .auth-form { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
        .form-group { display: flex; flex-direction: column; gap: 0.6rem; }
        .form-group.full { grid-column: span 2; }
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
          grid-column: span 2;
          color: var(--danger); background: var(--danger-soft-fade);
          padding: 1rem; border-radius: 1rem;
          font-size: 0.85rem; font-weight: 700;
          display: flex; align-items: center; gap: 0.75rem;
          border: 1px solid var(--danger-soft);
        }

        .auth-submit {
          grid-column: span 2;
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

        @media (max-width: 640px) {
          .auth-form { grid-template-columns: 1fr; }
          .form-group.full { grid-column: span 1; }
          .auth-submit { grid-column: span 1; }
          .auth-error { grid-column: span 1; }
          .auth-card { padding: 2rem 1.5rem; border-radius: 2rem; border: none; box-shadow: none; background: transparent; backdrop-filter: none; }
          .auth-page { background: var(--bg); align-items: flex-start; padding-top: 5vh; }
          .auth-header h1 { font-size: 1.75rem; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
