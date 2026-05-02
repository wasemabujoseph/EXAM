import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { Lock, Mail, Eye, EyeOff, Loader2, GraduationCap, AlertCircle, Info } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login, isApiMode } = useVault();
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

    try {
      await login(username, password);
      console.log('✅ Login successful, navigating...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Login failed:', err.message);
      setError(err.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        {!isApiMode && (
          <div className="api-notice">
            <Info size={16} />
            <span>Running in <strong>Local Mode</strong>. Connect to Google Sheets in <code>.env</code> for cloud storage.</span>
          </div>
        )}

        <div className="login-header">
          <div className="logo-circle">
            <GraduationCap size={32} />
          </div>
          <h1>MD Exam Hub</h1>
          <p>{isApiMode ? 'Sign in to your account' : 'Login to your local encrypted vault'}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">{isApiMode ? 'Username' : 'Email Address'}</label>
            <div className="input-wrapper">
              {isApiMode ? <GraduationCap className="input-icon" size={20} /> : <Mail className="input-icon" size={20} />}
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={isApiMode ? "your_username" : "you@example.com"}
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

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? <Loader2 className="spinner" size={20} /> : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Don't have an account? <Link to="/register">{isApiMode ? 'Register' : 'Register locally'}</Link></p>
          <div className="security-info">
            <Lock size={12} />
            <span>{isApiMode ? 'Secure cloud storage via Google Apps Script' : 'Data is encrypted locally using AES-GCM. We never see your password.'}</span>
          </div>
        </div>
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
          position: relative;
        }
        .api-notice {
          position: absolute;
          top: -3rem;
          left: 0;
          right: 0;
          background: #fffbeb;
          border: 1px solid #fef3c7;
          color: #92400e;
          padding: 0.75rem;
          border-radius: 0.75rem;
          font-size: 0.75rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
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
        }
        .login-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .error-message {
          color: var(--danger);
          background: #fef2f2;
          padding: 0.75rem;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          border: 1px solid #fee2e2;
        }
        .login-footer {
          margin-top: 2rem;
          text-align: center;
          font-size: 0.875rem;
          color: var(--text-muted);
        }
        .login-footer a {
          color: var(--primary);
          font-weight: 600;
        }
        .security-info {
          margin-top: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.7rem;
          color: #94a3b8;
        }
        .spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
