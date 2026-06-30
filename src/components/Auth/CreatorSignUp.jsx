import { useState } from 'react';
import './auth.css';
import { FaSpotify } from 'react-icons/fa';
import { SocialButtons } from './SocialButtons';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function CreatorSignUp({ onShowLogin, onSignUpSuccess, onLoginSuccess, onShowUserSignUp }) {
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

  const handleGoogleSignUp = async () => {
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
          profile_picture: 'https://i.pinimg.com/736x/6c/41/cb/6c41cb3ae4d97eeb68ee2279fe0e0c6f.jpg',
          role: 'creator'
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Google Sign Up failed.');
      }
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
          password,
          role: 'creator' // Explicitly registering as creator!
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }
      setDummyOtp(data.otp || '');
      setIsVerifying(true);
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
      alert('Creator account verified successfully! You can now log in.');
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
          {/* Spotify Logo */}
          <div className="logo">
            <FaSpotify size={40} color="#1ED760" aria-label="Spotify" />
          </div>

          {isVerifying ? (
            <>
              <h1>Verify creator account</h1>
              <p style={{ color: '#b3b3b3', fontSize: '14px', marginBottom: '20px', textAlign: 'center' }}>
                We sent a 6-digit verification code to <strong>{email}</strong>. Please enter it below to activate your creator account.
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
                    <strong>Testing Box:</strong> Dummy Verification OTP is <strong>{dummyOtp}</strong>.
                  </div>
                )}

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                <a
                  href="#"
                  style={{ color: '#1db954', fontSize: '14px', textDecoration: 'none', fontWeight: 'bold' }}
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
              <h1>Sign up as creator</h1>

              {error && <div style={{ color: '#ff4444', marginBottom: '15px', fontSize: '14px', fontWeight: 'bold' }}>{error}</div>}

              <form onSubmit={handleSignUp}>
                <div style={{ textAlign: 'left' }}>
                  <label>Name *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your stage/brand name"
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
                    placeholder="Create a strong password"
                    required
                  />
                </div>

                <button className="auth-btn" type="submit" disabled={loading}>
                  {loading ? 'Creating creator account...' : 'Sign Up as Creator'}
                </button>
              </form>

              <div className="divider">
                <span>or</span>
              </div>

              <SocialButtons
                authType="signup"
                onPhoneLoginClick={() => {
                  alert('Please sign up by filling out the form. Phone OTP is currently supported for login verification.');
                }}
                onGoogleClick={handleGoogleSignUp}
              />

              <p className="auth-footer-text">
                Not a creator?
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    onShowUserSignUp?.();
                  }}
                >
                  Sign up as listener
                </a>
              </p>

              <p className="auth-footer-text" style={{ marginTop: '12px' }}>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default CreatorSignUp;
