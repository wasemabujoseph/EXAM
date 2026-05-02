import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useVault } from '../context/VaultContext';
import { Lock, Mail, User, Eye, EyeOff, Loader2, GraduationCap, AlertCircle, ShieldCheck, Info } from 'lucide-react';

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
      console.log('✅ Registration successful, navigating...');
      navigate('/dashboard');
    } catch (err: any) {
      console.error('❌ Registration failed:', err.message);
      setError(err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card animate-fade-in">
        <div className="login-header">
          <div className="logo-circle">
            <ShieldCheck size={32} />
          </div>
          <h1>Create Account</h1>
          <p>Join the cloud exam platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Username</label>
            <div className="input-wrapper">
              <User className="input-icon" size={20} />
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

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
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
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
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

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="confirmPassword"
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
                required
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? <Loader2 className="spinner" size={20} /> : 'Register'}
          </button>
        </form>

        <div className="login-footer">
          <p>Already have an account? <Link to="/login">Sign in</Link></p>
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
          max-width: 480px;
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
          background: var(--success);
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
          gap: 1.1rem;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .form-group label {
          font-size: 0.8rem;
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
          padding: 0.7rem 1rem 0.7rem 2.75rem;
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          font-size: 0.95rem;
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
          background: var(--success);
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
          background: #059669;
          transform: translateY(-1px);
        }
        .warning-box {
          background: #fffbeb;
          border: 1px solid #fef3c7;
          border-radius: 0.75rem;
          padding: 1rem;
          display: flex;
          gap: 0.75rem;
          color: #92400e;
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .warning-box strong {
          color: #b45309;
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

export default RegisterPage;
