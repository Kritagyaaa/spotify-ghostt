import { Phone, Music } from 'lucide-react';

const SOCIAL_ICONS = {
  google: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  ),
  apple: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="white"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.05 20.28c-.98.95-2.05.78-3.08.35-1.09-.44-2.08-.48-3.24 0-1.44.62-2.2.44-3.12-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8.9-.07 1.82-.63 2.93-.76 1.4-.09 2.68.42 3.36 1.63-3.1 1.88-2.47 6.6.53 7.87-.36.95-.75 1.85-1.9 2.43l-.01-.01zM12.03 7.07c-.41-4.4 6.07-6.55 7.85-4.46.45.55.78 1.35.66 2.52-.98.07-1.98.65-2.6 1.22-.8.71-1.57.66-2.6.62-.59-.03-1.18-.33-1.38-.43-.36-.15-.74-.3-1.33-.47z" />
    </svg>
  ),
};

export function SocialButtons({ authType = 'login', onPhoneLoginClick, onGoogleClick, onCreatorSignUpClick }) {
  const loginText = authType === 'login' ? 'login with' : 'sign up with';

  return (
    <>
      {/* Phone Number Button */}
      <button className="social-btn phone-btn" onClick={onPhoneLoginClick}>
        <span className="social-icon">
          <Phone size={18} />
        </span>
        {authType === 'login' ? 'Continue with' : 'Sign up with'} phone number
      </button>

      {/* Google Button */}
      <button className="social-btn google-btn" onClick={onGoogleClick}>
        <span className="social-icon">{SOCIAL_ICONS.google}</span>
        {authType === 'login' ? 'Continue with' : 'Sign up with'} Google
      </button>

      {/* Apple Button */}
      <button className="social-btn apple-btn">
        <span className="social-icon">{SOCIAL_ICONS.apple}</span>
        {authType === 'login' ? 'Continue with' : 'Sign up with'} Apple
      </button>

      {authType === 'signup' && (
        <button className="social-btn add-songs-btn" onClick={onCreatorSignUpClick}>
          <span className="social-icon">
            <Music size={18} />
          </span>
          Sign up as creator
        </button>
      )}
    </>
  );
}
