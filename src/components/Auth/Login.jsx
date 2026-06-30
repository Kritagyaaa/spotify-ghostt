import { useState } from 'react';
import './auth.css';
import { FaSpotify } from 'react-icons/fa';
import { SocialButtons } from './SocialButtons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'dummygoogle@example.com',
          name: 'Dummy Google User',
          google_id: 'g-123456',
          profile_picture: 'https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg'
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Login failed.');
      }
      onLoginSuccess?.(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'UNVERIFIED_ACCOUNT') {
          setDummyOtp(data.otp || '');
          setError('Your email is not verified yet. We sent a verification code to your email.');
          setLoginMethod('verify_signup_otp');
          setOtp('');
          return;
        }
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
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
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
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
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

  const handleSendResetLink = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send reset link.');
      }
      setDummyOtp(data.token ? `Link Token: ${data.token}` : '');
      setMessage('Password reset link sent successfully! Please check your email.');
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
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
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

  const handleVerifySignupOtp = async (e) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the OTP.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: otp, purpose: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }
      alert('Verification successful! You can now log in.');
      setLoginMethod('email');
      setError('');
      setMessage('Account verified successfully. Please enter your password to log in.');
      setOtp('');
      setDummyOtp('');
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
      const res = await fetch(`${API_URL}/auth/reset-password`, {
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

          {/* Forgot Password - Choice of Reset Link or Reset OTP */}
          {loginMethod === 'forgot_email' && (
            <div>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  className="auth-btn"
                  onClick={handleSendResetLink}
                  disabled={loading}
                  style={{ marginBottom: 0 }}
                >
                  {loading ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>
                
                <button
                  className="auth-btn"
                  onClick={handleSendResetOtp}
                  disabled={loading}
                  style={{ background: 'transparent', border: '1px solid #1db954', color: '#1db954', marginBottom: 0 }}
                >
                  {loading ? 'Requesting OTP...' : 'Send Reset OTP'}
                </button>
              </div>

              {dummyOtp && (
                <div style={{
                  background: 'rgba(29, 185, 84, 0.1)',
                  border: '1px solid #1db954',
                  borderRadius: '4px',
                  padding: '10px',
                  marginTop: '20px',
                  fontSize: '12px',
                  color: '#1db954',
                  textAlign: 'left'
                }}>
                  <strong>Testing Box:</strong> {dummyOtp}
                </div>
              )}

              <p style={{ marginTop: '20px', fontSize: '13px' }}>
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
            </div>
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

          {/* Unverified Account Verification Flow */}
          {loginMethod === 'verify_signup_otp' && (
            <form onSubmit={handleVerifySignupOtp}>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '20px', textAlign: 'left' }}>
                Please enter the 6-digit verification code sent to <strong>{email}</strong> to activate your account.
              </p>
              
              <div style={{ textAlign: 'left' }}>
                <label>Enter 6-Digit Code</label>
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
                  <strong>Testing Box:</strong> Dummy verification OTP is <strong>{dummyOtp}</strong>.
                </div>
              )}

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
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
                onGoogleClick={handleGoogleLogin}
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
