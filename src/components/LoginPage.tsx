import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { Lock, Mail, User, Eye, EyeOff, Loader2, GraduationCap, AlertCircle, Info } from 'lucide-react';

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

    // Create a timeout to alert if it's taking too long
    const timeout = setTimeout(() => {
      if (isLoading) setError('The server is taking longer than usual. Please check your connection.');
    }, 15000);

    try {
      console.log('🚀 Login attempt for:', username);
      await login(username, password);
      clearTimeout(timeout);
      console.log('✅ Login successful, navigating...');
      navigate('/dashboard');
    } catch (err: any) {
      clearTimeout(timeout);
      console.error('❌ Login failed:', err.message);
      setError(err.message || 'Invalid username or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-circle">
            <GraduationCap size={32} />
          </div>
          <h1>MEDEXAM</h1>
          <p>Access your medical education portal</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">Username or Email</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
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
          <p>Don't have an account? <Link to="/register">Register</Link></p>
          <div className="security-info">
            <Lock size={12} />
            <span>Secure Academic Data Portal</span>
          </div>
        </div>
      </div>

      <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top left, #eef2ff 0%, #e0f2fe 50%, #f1f5f9 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%);
          border-radius: 50%;
          top: -200px;
          right: -200px;
          filter: blur(80px);
          z-index: 0;
        }

        .login-card {
          background: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          padding: 3rem;
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl), 0 0 0 1px rgba(255, 255, 255, 0.5);
          width: 100%;
          max-width: 480px;
          z-index: 1;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .login-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .logo-circle {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
          color: white;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 15px -3px var(--primary-glow);
          transform: rotate(-5deg);
          transition: transform 0.3s ease;
        }

        .logo-circle:hover {
          transform: rotate(0deg) scale(1.05);
        }

        .login-header h1 {
          font-size: 2.25rem;
          font-weight: 900;
          color: var(--text-main);
          margin-bottom: 0.5rem;
          letter-spacing: -0.04em;
        }

        .login-header p {
          color: var(--text-muted);
          font-weight: 500;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group label {
          font-size: 0.875rem;
          font-weight: 700;
          color: var(--text-main);
          margin-left: 0.25rem;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-icon {
          position: absolute;
          left: 1.25rem;
          color: var(--text-dim);
          transition: color 0.2s;
        }

        .input-wrapper input {
          width: 100%;
          padding: 1rem 1.25rem 1rem 3.5rem;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 1rem;
          font-weight: 500;
          color: var(--text-main);
          transition: all 0.25s;
        }

        .input-wrapper input:focus {
          background: white;
          border-color: var(--primary);
          box-shadow: 0 0 0 4px var(--primary-light);
        }

        .input-wrapper input:focus + .input-icon {
          color: var(--primary);
        }

        .password-toggle {
          position: absolute;
          right: 1.25rem;
          background: none;
          border: none;
          color: var(--text-dim);
          display: flex;
          align-items: center;
          padding: 0.5rem;
          border-radius: 0.5rem;
        }

        .password-toggle:hover {
          color: var(--text-muted);
          background: var(--background);
        }

        .login-button {
          margin-top: 1rem;
          padding: 1rem;
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 800;
          font-size: 1.125rem;
          letter-spacing: 0.01em;
          box-shadow: 0 4px 6px -1px var(--primary-glow);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .login-button:hover:not(:disabled) {
          background: var(--primary-hover);
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px var(--primary-glow);
        }

        .error-message {
          color: var(--danger);
          background: #fef2f2;
          padding: 1rem;
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border: 1px solid #fee2e2;
          animation: shake 0.4s cubic-bezier(.36,.07,.19,.97) both;
        }

        @keyframes shake {
          10%, 90% { transform: translate3d(-1px, 0, 0); }
          20%, 80% { transform: translate3d(2px, 0, 0); }
          30%, 50%, 70% { transform: translate3d(-4px, 0, 0); }
          40%, 60% { transform: translate3d(4px, 0, 0); }
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .login-footer a {
          color: var(--primary);
          font-weight: 700;
          text-decoration: none;
          margin-left: 0.25rem;
        }

        .login-footer a:hover {
          text-decoration: underline;
        }

        .security-info {
          margin-top: 2rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: var(--text-dim);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
