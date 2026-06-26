import { useState } from 'react';
import './auth.css';
import { FaSpotify } from 'react-icons/fa';
import { SocialButtons } from './SocialButtons';

function Login({ onShowSignUp, onLoginSuccess }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email', 'phone', 'otp', 'forgot_email', 'forgot_reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [dummyOtp, setDummyOtp] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed.');
      }
      onLoginSuccess?.(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!phone) {
      setError('Please enter your phone number.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, purpose: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send OTP.');
      }
      setDummyOtp(data.otp);
      setMessage(`OTP sent! Testing OTP: ${data.otp}`);
      setLoginMethod('otp');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_number: phone, otp_code: otp, purpose: 'login' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid OTP.');
      }
      onLoginSuccess?.(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'reset' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset OTP.');
      }
      setDummyOtp(data.otp);
      setMessage(`Reset OTP sent! Testing OTP: ${data.otp}`);
      setLoginMethod('forgot_reset');
      setOtp('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!email || !otp || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otp, new_password: password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reset password.');
      }
      alert('Password reset successfully! Please log in with your new password.');
      setLoginMethod('email');
      setPassword('');
      setOtp('');
      setDummyOtp('');
      setError('');
      setMessage('Password reset successful. Please log in.');
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
          {/* Spotify Logo */}
          <div className="logo">
            <FaSpotify size={40} color="#1ED760" aria-label="Spotify" />
          </div>

          <h1>Welcome back</h1>

          {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}
          {message && <div style={{ color: '#1db954', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{message}</div>}

          {/* Email Login Flow */}
          {loginMethod === 'email' && (
            <form onSubmit={handleEmailLogin}>
              <div style={{ textAlign: 'left' }}>
                <label>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                />

                <label>Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                />

                <div style={{ textAlign: 'right', marginTop: '-12px', marginBottom: '18px' }}>
                  <a
                    href="#"
                    style={{ color: '#b3b3b3', fontSize: '12px', textDecoration: 'none', fontWeight: 'bold' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setLoginMethod('forgot_email');
                      setError('');
                      setMessage('');
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </form>
          )}

          {/* Phone Number Entry Flow */}
          {loginMethod === 'phone' && (
            <form onSubmit={handleSendOtp}>
              <div style={{ textAlign: 'left' }}>
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1234567890"
                  required
                />
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <p style={{ marginTop: '10px', fontSize: '13px' }}>
                <a
                  href="#"
                  style={{ color: '#b3b3b3', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginMethod('email');
                    setError('');
                    setMessage('');
                  }}
                >
                  Back to Email Login
                </a>
              </p>
            </form>
          )}

          {/* OTP Entry Flow */}
          {loginMethod === 'otp' && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ textAlign: 'left' }}>
                <label>Enter 6-Digit OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                />
              </div>

              {dummyOtp && (
                <div style={{
                  background: 'rgba(29, 185, 84, 0.1)',
                  border: '1px solid #1db954',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#1db954',
                  textAlign: 'left'
                }}>
                  <strong>Testing Box:</strong> Dummy OTP generated is <strong>{dummyOtp}</strong>. You can enter it above to log in.
                </div>
              )}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify & Log In'}
              </button>

              <p style={{ marginTop: '10px', fontSize: '13px' }}>
                <a
                  href="#"
                  style={{ color: '#b3b3b3', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginMethod('phone');
                    setError('');
                    setMessage('');
                  }}
                >
                  Change Phone Number
                </a>
              </p>
            </form>
          )}

          {/* Forgot Password - Email Entry Flow */}
          {loginMethod === 'forgot_email' && (
            <form onSubmit={handleSendResetOtp}>
              <div style={{ textAlign: 'left' }}>
                <label>Registered Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com"
                  required
                />
              </div>

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Requesting OTP...' : 'Send Reset OTP'}
              </button>

              <p style={{ marginTop: '10px', fontSize: '13px' }}>
                <a
                  href="#"
                  style={{ color: '#b3b3b3', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginMethod('email');
                    setError('');
                    setMessage('');
                  }}
                >
                  Back to Login
                </a>
              </p>
            </form>
          )}

          {/* Forgot Password - OTP Verification and Password Reset Flow */}
          {loginMethod === 'forgot_reset' && (
            <form onSubmit={handleResetPasswordSubmit}>
              <div style={{ textAlign: 'left' }}>
                <label>Email Address</label>
                <input
                  type="email"
                  value={email}
                  disabled
                  placeholder="name@domain.com"
                />

                <label>Enter 6-Digit Reset OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  required
                />

                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password"
                  required
                />
              </div>

              {dummyOtp && (
                <div style={{
                  background: 'rgba(29, 185, 84, 0.1)',
                  border: '1px solid #1db954',
                  borderRadius: '4px',
                  padding: '10px',
                  marginBottom: '20px',
                  fontSize: '12px',
                  color: '#1db954',
                  textAlign: 'left'
                }}>
                  <strong>Testing Box:</strong> Reset OTP generated is <strong>{dummyOtp}</strong>. You can enter it above to reset password.
                </div>
              )}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
              </button>

              <p style={{ marginTop: '10px', fontSize: '13px' }}>
                <a
                  href="#"
                  style={{ color: '#b3b3b3', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginMethod('forgot_email');
                    setError('');
                    setMessage('');
                  }}
                >
                  Change Email or Resend OTP
                </a>
              </p>
            </form>
          )}

          {loginMethod === 'email' && (
            <>
              <div className="divider">
                <span>or</span>
              </div>

              <SocialButtons
                authType="login"
                onPhoneLoginClick={() => {
                  setLoginMethod('phone');
                  setError('');
                  setMessage('');
                }}
              />
            </>
          )}

          <p className="auth-footer-text">
            Don't have an account?
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onShowSignUp?.();
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
