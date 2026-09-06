import { useState, useEffect } from 'react';
import logo from '../../assets/logo.svg';
import './auth.css';
import { SocialButtons } from './SocialButtons';
import { useGoogleLogin } from '@react-oauth/google';
import { GoogleNameModal } from './GoogleNameModal';
import { authenticateWithNativeGoogle, isNativeGoogleAuth } from '../../services/nativeGoogleAuth';
import Loader from '../ui/Loader.jsx';

const API_URL = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

function SignUp({ onShowLogin, onSignUpSuccess, onLoginSuccess, onCreatorSignUpClick }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Verification states
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const [dummyOtp, setDummyOtp] = useState('');
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);

  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => document.body.classList.remove('auth-page');
  }, []);

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
      setError('Google Sign-Up was cancelled or failed.');
    },
  });

  const handleGoogleSignUp = async () => {
    setError('');
    if (!isNativeGoogleAuth()) {
      triggerGoogleAuth();
      return;
    }

    setLoading(true);
    try {
      const data = await authenticateWithNativeGoogle('user');
      onLoginSuccess?.(data.token, data.user);
    } catch (err) {
      setError(err.message || 'Google Sign-Up failed.');
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
          role: 'user',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Sign Up failed.');
      }
      setPendingGoogleUser(null);
      onLoginSuccess?.(data.token, data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          phone_number: phone,
          password
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      alert('Registration successful! Please log in to verify your email and activate your account.');
      onSignUpSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!verificationOtp) {
      setError('Please enter the verification code.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp_code: verificationOtp, purpose: 'verify' }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid verification code.');
      }
      alert('Email verified successfully! You can now log in.');
      onSignUpSuccess?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async (e) => {
    e.preventDefault();
    setError('');
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

  return (
    <div className="auth-container">
      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="logo">
            <img src={logo} alt="Echord Logo" />
          </div>
          {loading && <Loader text="Creating Account..." />}

          {isVerifying ? (
            <>
              <h1>Verify your email</h1>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                We sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below to activate your account.
              </p>

              {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}

              <form onSubmit={handleVerifyOtp}>
                <div style={{ textAlign: 'left' }}>
                  <label>Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verificationOtp}
                    onChange={(e) => setVerificationOtp(e.target.value)}
                    placeholder="123456"
                    required
                  />
                </div>

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <a
                  href="#"
                  style={{ color: '#E19FC7', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}
                  onClick={handleResendOtp}
                >
                  Resend Verification Code
                </a>
                <a
                  href="#"
                  style={{ color: '#b3b3b3', fontSize: '13px', textDecoration: 'none' }}
                  onClick={(e) => {
                    e.preventDefault();
                    setIsVerifying(false);
                    setDummyOtp('');
                    setError('');
                  }}
                >
                  Back to Sign Up
                </a>
              </div>
            </>
          ) : (
            <>
              <h1>Sign up to start listening</h1>

              {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}

              <form onSubmit={handleSignUp}>
                <div style={{ textAlign: 'left' }}>
                  <label>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="What should we call you?"
                    required
                  />

                  <label>Email address *</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    required
                  />

                  <label>Phone Number (Optional)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />

                  <label>Password *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a password"
                    required
                  />
                </div>

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </button>
              </form>

              <div className="divider">
                <span>or</span>
              </div>

              <SocialButtons
                authType="signup"
                onGoogleClick={handleGoogleSignUp}
                onCreatorSignUpClick={onCreatorSignUpClick}
              />

              <p className="auth-footer-text">
                Already have an account?
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onShowLogin?.();
                  }}
                >
                  Log in
                </a>
              </p>

              {/* Footer */}
              <div className="auth-extra-footer">
                <p>
                  This site is protected by reCAPTCHA and the Google
                  <a href="#"> Privacy Policy</a> and
                  <a href="#"> Terms of Service</a> apply.
                </p>
              </div>
            </>
          )}
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

export default SignUp;

