import React, { useState } from 'react';
import { NavBar } from '../components/NavBar';
import { FormInput } from '../components/FormInput';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export const SignUp: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const { user, token } = await api.auth.signup(email, password);
      login(user, token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--c-canvas-soft)' }}>
      <NavBar />
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--s-lg)' }}>
        <div className="card" style={{ padding: 'var(--s-xl)', width: '100%', maxWidth: '400px', boxShadow: 'var(--shadow-4)' }}>
          <h1 className="t-display-md" style={{ marginBottom: 'var(--s-xl)' }}>Create your account.</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)' }}>
            <FormInput label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            <div>
              <FormInput label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
              <p className="t-caption" style={{ color: 'var(--c-mute)', marginTop: '4px' }}>Must be at least 8 characters.</p>
            </div>
            <FormInput label="Confirm Password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
            
            {error && (
              <div className="t-caption" style={{ color: 'var(--c-error)' }}>
                {error.includes('already in use') ? (
                  <>That email's already in use &mdash; <Link to="/login" style={{ color: 'var(--c-error)', textDecoration: 'underline' }}>log in instead?</Link></>
                ) : error}
              </div>
            )}
            
            <button type="submit" className="button-primary" style={{ width: '100%', marginTop: 'var(--s-sm)' }} disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>
          <div className="t-body-sm" style={{ marginTop: 'var(--s-lg)', textAlign: 'center' }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--c-link)' }}>Log in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};
