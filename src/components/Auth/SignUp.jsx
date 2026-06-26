import { useState } from 'react';
import './auth.css';
import { FaSpotify } from 'react-icons/fa';
import { SocialButtons } from './SocialButtons';

function SignUp({ onShowLogin, onSignUpSuccess }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/register', {
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
      alert('Registration successful! Please log in.');
      onSignUpSuccess?.();
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
            onPhoneLoginClick={() => {
              alert('Please sign up by filling out the form. Phone OTP is currently supported for login verification.');
            }}
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
        </div>
      </div>
    </div>
  );
}

export default SignUp;
