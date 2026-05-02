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
          <div className="form-group full">
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

          <div className="form-group full">
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
                placeholder="Min. 8 characters"
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
                placeholder="Repeat password"
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
          background: radial-gradient(circle at top left, #f0fdf4 0%, #ecfdf5 50%, #f8fafc 100%);
          padding: 2rem;
          position: relative;
          overflow: hidden;
        }

        .login-container::before {
          content: '';
          position: absolute;
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(99, 102, 241, 0.05) 100%);
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
          max-width: 520px;
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
          background: linear-gradient(135deg, var(--success) 0%, #059669 100%);
          color: white;
          border-radius: 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem;
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
          transform: rotate(5deg);
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
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .form-group.full {
          grid-column: span 2;
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
          left: 1rem;
          color: var(--text-dim);
          transition: color 0.2s;
        }

        .input-wrapper input {
          width: 100%;
          padding: 0.875rem 1rem 0.875rem 3rem;
          background: rgba(255, 255, 255, 0.5);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          font-size: 0.95rem;
          font-weight: 500;
          color: var(--text-main);
          transition: all 0.25s;
        }

        .input-wrapper input:focus {
          background: white;
          border-color: var(--success);
          box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.1);
        }

        .password-toggle {
          position: absolute;
          right: 1rem;
          background: none;
          border: none;
          color: var(--text-dim);
          display: flex;
          align-items: center;
        }

        .login-button {
          grid-column: span 2;
          margin-top: 1rem;
          padding: 1rem;
          background: var(--success);
          color: white;
          border: none;
          border-radius: var(--radius);
          font-weight: 800;
          font-size: 1.125rem;
          box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
        }

        .login-button:hover:not(:disabled) {
          background: #059669;
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(16, 185, 129, 0.4);
        }

        .error-message {
          grid-column: span 2;
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
        }

        .login-footer {
          margin-top: 2.5rem;
          text-align: center;
          font-size: 0.95rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .login-footer a {
          color: var(--success);
          font-weight: 700;
          text-decoration: none;
        }

        @media (max-width: 640px) {
          .login-form { grid-template-columns: 1fr; }
          .form-group.full { grid-column: span 1; }
          .login-button { grid-column: span 1; }
          .error-message { grid-column: span 1; }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
