import React, { useState } from 'react';
import { DEMO_USER } from '../config/auth';
import { Lock, Mail, Eye, EyeOff, Loader2, GraduationCap } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    setTimeout(() => {
      if (email === DEMO_USER.email && password === DEMO_USER.password) {
        onLogin();
      } else {
        setError('Invalid email or password');
        setIsLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-circle">
            <GraduationCap size={32} />
          </div>
          <h1>MD Curriculum</h1>
          <p>Sign in to access your dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exam.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
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
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <label className="checkbox-label">
              <input type="checkbox" />
              <span>Remember me</span>
            </label>
            <a href="#" className="forgot-password">Forgot password?</a>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="spinner" size={20} />
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <p className="security-note">
          Note: This is a frontend-only access gate for static hosting.
        </p>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
          padding: 2rem;
        }
        .login-card {
          background: white;
          padding: 2.5rem;
          border-radius: 1.5rem;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          width: 100%;
          max-width: 450px;
        }
        .login-header {
          text-align: center;
          margin-bottom: 2rem;
        }
        .logo-circle {
          width: 64px;
          height: 64px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1rem;
        }
        .login-header h1 {
          font-size: 1.875rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 0.5rem;
        }
        .login-header p {
          color: var(--text-muted);
        }
        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-group label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
        }
        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }
        .input-icon {
          position: absolute;
          left: 1rem;
          color: #94a3b8;
        }
        .input-wrapper input {
          width: 100%;
          padding: 0.75rem 1rem 0.75rem 3rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          font-size: 1rem;
          transition: all 0.2s;
        }
        .input-wrapper input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
        }
        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: #94a3b8;
          display: flex;
          align-items: center;
        }
        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.875rem;
        }
        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #475569;
          cursor: pointer;
        }
        .forgot-password {
          color: var(--primary);
          font-weight: 600;
        }
        .login-button {
          margin-top: 1rem;
          padding: 0.875rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: 0.75rem;
          font-weight: 700;
          font-size: 1rem;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-button:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .error-message {
          color: var(--danger);
          background: #fef2f2;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          text-align: center;
          border: 1px solid #fee2e2;
        }
        .security-note {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.75rem;
          color: #94a3b8;
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
