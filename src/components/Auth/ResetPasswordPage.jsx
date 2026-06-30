import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FaSpotify } from 'react-icons/fa';
import './auth.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [isValidToken, setIsValidToken] = useState(null); // null = checking, true = valid, false = invalid
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setIsValidToken(false);
      setError('Invalid reset link. Missing token.');
      return;
    }

    const verifyToken = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/verify-reset-token?token=${token}`);
        const data = await res.json();
        if (res.ok) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          setError(data.error || 'This reset link has expired or is invalid.');
        }
      } catch (err) {
        setIsValidToken(false);
        setError('Failed to connect to the authentication server.');
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter a new password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/auth/reset-password-with-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setMessage('Password reset successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="logo">
            <FaSpotify size={40} color="#1ED760" aria-label="Spotify" />
          </div>

          <h1>Reset Password</h1>

          {isValidToken === null && (
            <div style={{ color: '#b3b3b3', margin: '20px 0', fontSize: '16px' }}>
              Verifying your reset link...
            </div>
          )}

          {isValidToken === false && (
            <div>
              <div style={{ color: '#ff4444', marginBottom: '20px', fontSize: '14px', fontWeight: 'bold' }}>
                {error}
              </div>
              <button className="auth-btn" onClick={() => navigate('/login')}>
                Back to Login
              </button>
            </div>
          )}

          {isValidToken === true && (
            <form onSubmit={handleSubmit}>
              {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}
              {message && <div style={{ color: '#1db954', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{message}</div>}

              <div style={{ textAlign: 'left' }}>
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  required
                  disabled={loading || !!message}
                />

                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  required
                  disabled={loading || !!message}
                />
              </div>

              <button className="auth-btn" type="submit" disabled={loading || !!message}>
                {loading ? 'Updating Password...' : 'Save New Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
