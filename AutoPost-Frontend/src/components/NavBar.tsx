import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Menu, X, Sun, Moon, Monitor } from 'lucide-react';

export const NavBar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => { void logout(); };
  const handleLogoutMobile = () => { setMobileMenuOpen(false); void logout(); };

  const toggleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const getThemeIcon = () => {
    if (theme === 'light') return <Sun size={20} color="var(--c-ink)" />;
    if (theme === 'dark') return <Moon size={20} color="var(--c-ink)" />;
    return <Monitor size={20} color="var(--c-ink)" />;
  };

  return (
    <nav style={{
      height: '64px',
      backgroundColor: 'var(--c-canvas)',
      borderBottom: '1px solid var(--c-hairline)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0 var(--s-lg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
    }}>
      <Link to={user ? "/dashboard" : "/"} className="t-display-sm" style={{ color: 'var(--c-ink)', textDecoration: 'none', fontWeight: 700, letterSpacing: '-0.02em' }}>AutoPost</Link>

      {/* Desktop Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-lg)' }} className="desktop-only">
        {user ? (
          <>
            <div style={{ display: 'flex', gap: 'var(--s-md)' }}>
              <Link to="/dashboard" className="t-body-sm" style={{ color: 'var(--c-body)' }}>Dashboard</Link>
              <Link to="/history" className="t-body-sm" style={{ color: 'var(--c-body)' }}>History</Link>
              <Link to="/notes" className="t-body-sm" style={{ color: 'var(--c-body)' }}>Notes</Link>
              <Link to="/settings" className="t-body-sm" style={{ color: 'var(--c-body)' }}>Settings</Link>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-sm)' }}>
              <span className="t-body-sm">{user.email}</span>
              <button onClick={handleLogout} className="button-secondary-sm">Log out</button>
              <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', padding: '4px' }} title={`Theme: ${theme}`}>
                {getThemeIcon()}
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-sm)' }}>
            <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', padding: '4px' }} title={`Theme: ${theme}`}>
              {getThemeIcon()}
            </button>
            <Link to="/login" className="button-secondary-sm" style={{ height: '28px' }}>Log In</Link>
            <Link to="/signup" className="button-primary-sm" style={{ height: '28px' }}>Sign Up</Link>
          </div>
        )}
      </div>

      {/* Mobile Toggle */}
      <div className="mobile-only" style={{ display: 'flex', alignItems: 'center', gap: 'var(--s-md)' }}>
        <button onClick={toggleTheme} style={{ display: 'flex', alignItems: 'center', padding: '4px' }}>
          {getThemeIcon()}
        </button>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={24} color="var(--c-ink)" /> : <Menu size={24} color="var(--c-ink)" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="mobile-only" style={{
          position: 'absolute', top: '64px', left: 0, right: 0,
          backgroundColor: 'var(--c-canvas)',
          borderBottom: '1px solid var(--c-hairline)',
          padding: 'var(--s-md)',
          display: 'flex', flexDirection: 'column', gap: 'var(--s-md)',
          boxShadow: 'var(--shadow-5)'
        }}>
          {user ? (
            <>
              <Link to="/dashboard" className="t-body-sm" style={{ color: 'var(--c-body)' }} onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
              <Link to="/history" className="t-body-sm" style={{ color: 'var(--c-body)' }} onClick={() => setMobileMenuOpen(false)}>History</Link>
              <Link to="/notes" className="t-body-sm" style={{ color: 'var(--c-body)' }} onClick={() => setMobileMenuOpen(false)}>Notes</Link>
              <Link to="/settings" className="t-body-sm" style={{ color: 'var(--c-body)' }} onClick={() => setMobileMenuOpen(false)}>Settings</Link>
              <div style={{ borderTop: '1px solid var(--c-hairline)', paddingTop: 'var(--s-sm)' }}>
                <span className="t-body-sm" style={{ display: 'block', marginBottom: 'var(--s-sm)' }}>{user.email}</span>
                <button onClick={handleLogoutMobile} className="button-secondary-sm">Log out</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
              <Link to="/login" className="button-secondary" style={{ width: '100%', height: '40px' }} onClick={() => setMobileMenuOpen(false)}>Log In</Link>
              <Link to="/signup" className="button-primary" style={{ width: '100%', height: '40px' }} onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};
