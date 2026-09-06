import { useState } from 'react';
import logo from '../../assets/logo.svg';
import './auth.css';
import { SocialButtons } from './SocialButtons';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleNameModal } from './GoogleNameModal';
import { authenticateWithNativeGoogle, isNativeGoogleAuth } from '../../services/nativeGoogleAuth';
import Loader from '../ui/Loader.jsx';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

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
  const [loadingAction, setLoadingAction] = useState('');
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const [loginRole, setLoginRole] = useState('user'); // 'user' or 'creator'

  const triggerGoogleAuth = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        });
        const profile = await res.json();
        if (!res.ok || !profile.email || !profile.sub) {
          throw new Error(profile.error_description || 'Google did not return a valid profile.');
        }
        setPendingGoogleUser({
          email: profile.email,
          name: profile.name || 'Google User',
          google_id: profile.sub,
          profile_picture: profile.picture,
          access_token: tokenResponse.access_token,
        });
      } catch (err) {
        setError('Failed to fetch Google user profile.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError('Google Sign-In was cancelled or failed.');
    },
  });

  const handleGoogleLogin = async () => {
    setError('');
    if (!isNativeGoogleAuth()) {
      triggerGoogleAuth();
      return;
    }

    setLoading(true);
    try {
      const data = await authenticateWithNativeGoogle(loginRole);
      onLoginSuccess?.(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleModalConfirm = async ({ displayName, shareName }) => {
    if (!pendingGoogleUser) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/social-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingGoogleUser.email,
          name: displayName,
          google_id: pendingGoogleUser.google_id,
          profile_picture: pendingGoogleUser.profile_picture,
          share_name: shareName,
          access_token: pendingGoogleUser.access_token,
          role: loginRole,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Login failed.');
      }
      setPendingGoogleUser(null);
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
        body: JSON.stringify({ email, password, role: loginRole }),
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
      setMessage('OTP sent successfully!');
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
        body: JSON.stringify({ phone_number: phone, otp_code: otp, purpose: 'login', role: loginRole }),
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
    setLoadingAction('reset_link');
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
      setLoadingAction('');
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
    setLoadingAction('reset_otp');
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
      setMessage('Reset OTP sent! Please check your email.');
      setLoginMethod('forgot_reset');
      setOtp('');
      setPassword('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingAction('');
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

  const handleResendSignupOtp = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, purpose: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to resend code.');
      }
      setDummyOtp(data.otp || '');
      alert('Verification code resent successfully!');
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
          <div className="logo">
            <img src={logo} alt="Echord Logo" />
          </div>

          <h1>Music Awaits</h1>
          {loading && <Loader text="Logging in..." />}

          {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}
          {message && <div style={{ color: '#E19FC7', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{message}</div>}

          {(loginMethod === 'email' || loginMethod === 'phone' || loginMethod === 'otp') && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '30px', marginBottom: '25px' }}>
              <button
                type="button"
                onClick={() => {
                  setLoginRole('user');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: loginRole === 'user' ? '#E19FC7' : '#b3b3b3',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderBottom: loginRole === 'user' ? '2px solid #E19FC7' : 'none',
                  paddingBottom: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                User Login
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginRole('creator');
                  setError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: loginRole === 'creator' ? '#E19FC7' : '#b3b3b3',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  borderBottom: loginRole === 'creator' ? '2px solid #E19FC7' : 'none',
                  paddingBottom: '5px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                Creator Login
              </button>
            </div>
          )}

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
                  {loadingAction === 'reset_link' ? 'Sending Reset Link...' : 'Send Reset Link'}
                </button>
                
                <button
                  className="auth-btn"
                  onClick={handleSendResetOtp}
                  disabled={loading}
                  style={{ marginBottom: 0 }}
                >
                  {loadingAction === 'reset_otp' ? 'Requesting OTP...' : 'Send Reset OTP'}
                </button>
              </div>

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

              <button className="auth-btn" type="submit" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <a
                  href="#"
                  style={{ color: '#E19FC7', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={handleResendSignupOtp}
                >
                  Resend Verification Code
                </a>
                <a
                  href="#"
                  style={{ color: '#b3b3b3', fontSize: '13px', textDecoration: 'none' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setLoginMethod('email');
                    setError('');
                    setMessage('');
                  }}
                >
                  Back to Login
                </a>
              </div>
            </form>
          )}

          {loginMethod === 'email' && (
            <>
              <div className="divider">
                <span>or</span>
              </div>

              <SocialButtons
                authType="login"
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

      {pendingGoogleUser && (
        <GoogleNameModal
          googleUser={pendingGoogleUser}
          onConfirm={handleGoogleModalConfirm}
          onCancel={() => {
            setPendingGoogleUser(null);
            setError('');
          }}
          error={error}
        />
      )}
    </div>
  );
}

export default Login;

