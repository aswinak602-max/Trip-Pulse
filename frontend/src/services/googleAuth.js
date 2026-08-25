import api, { getRawApiUrl, getApiBaseUrl } from './api';

/**
 * Normalizes and extracts the Google Client ID from frontend environment
 * or backend server config fallback.
 */
export const getGoogleClientId = (serverConfig = null) => {
  const rawEnv = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const rawServer = serverConfig?.google_client_id;
  const raw = (rawEnv !== undefined && rawEnv !== null && rawEnv !== '') ? rawEnv : (rawServer || '');
  return (typeof raw === 'string' ? raw : '').replace(/^["']|["']$/g, '').trim();
};

/**
 * Validates Google Client ID format and detects placeholders or missing credentials.
 */
export const validateGoogleClientId = (clientId) => {
  if (!clientId || clientId.trim() === '') {
    return {
      valid: false,
      isMissing: true,
      isPlaceholder: false,
      error: 'Google login is not configured. Please configure VITE_GOOGLE_CLIENT_ID in frontend/.env and GOOGLE_CLIENT_ID in backend/.env.'
    };
  }

  const lower = clientId.toLowerCase();
  const placeholders = [
    'your_real_google_web_client_id',
    'your_real_google_client_id',
    'your_web_client_id',
    'your-google-client-id',
    'your_google_client_id',
    'your-client-id',
    'your_client_id',
    'placeholder',
    'example',
    'your-google-web-client-id',
    'xxxxxxxxxxxx',
    'test_client',
    'dummy'
  ];

  const hasPlaceholder = placeholders.some((p) => lower.includes(p));

  if (hasPlaceholder) {
    return {
      valid: false,
      isMissing: false,
      isPlaceholder: true,
      error: `Placeholder detected in Google Client ID ("${clientId}"). Please replace it with your real Google Web Client ID from Google Cloud Console in frontend/.env and backend/.env.`
    };
  }

  if (!lower.endsWith('.apps.googleusercontent.com')) {
    return {
      valid: false,
      isMissing: false,
      isPlaceholder: true,
      error: 'Invalid Google Client ID format. A valid Google OAuth 2.0 Web Client ID must end with ".apps.googleusercontent.com".'
    };
  }

  // Check that the client ID has standard Google format (e.g. 1085952608505-s9le2citfoihqa7cq78pkik29qin0vdb.apps.googleusercontent.com)
  const prefixMatch = clientId.match(/^([0-9]+)-([a-zA-Z0-9_-]+)\.apps\.googleusercontent\.com$/);
  if (!prefixMatch) {
    return {
      valid: false,
      isMissing: false,
      isPlaceholder: true,
      error: `The configured Google Client ID ("${clientId}") is not a valid Google Cloud Web Client ID.`
    };
  }

  return {
    valid: true,
    isMissing: false,
    isPlaceholder: false,
    error: null
  };
};

/**
 * Performs Google Sign-In using Google Identity Services (GIS) Popup / Token mode
 * with seamless fallback to OAuth 2.0 redirect mode.
 */
export const initiateGoogleSignIn = async ({
  serverConfig = null,
  onStart = () => {},
  onSuccess = () => {},
  onError = () => {},
  onEnd = () => {}
}) => {
  try {
    const clientId = getGoogleClientId(serverConfig);
    const validation = validateGoogleClientId(clientId);

    if (!validation.valid) {
      onError(validation.error, validation);
      return;
    }

    onStart();

    // 1. Check if Google Identity Services (GIS) Token Client is available
    if (window.google?.accounts?.oauth2?.initTokenClient) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'openid email profile',
          prompt: 'select_account',
          callback: async (tokenResponse) => {
            if (tokenResponse.error) {
              onEnd();
              if (tokenResponse.error === 'access_denied') {
                onError('Google sign-in was cancelled.');
              } else {
                onError(`Google authentication error: ${tokenResponse.error_description || tokenResponse.error}`);
              }
              return;
            }

            if (tokenResponse.access_token) {
              try {
                const res = await api.post('/auth/google', {
                  provider: 'google',
                  access_token: tokenResponse.access_token
                });

                if (res && res.success && res.data) {
                  onSuccess(res.data);
                } else {
                  onError(res?.message || 'Google authentication failed.');
                }
              } catch (apiErr) {
                console.error('[Google Auth] Verification error:', apiErr);
                onError(apiErr.message || 'Failed to establish TripPulse session with Google credentials.');
              } finally {
                onEnd();
              }
            } else {
              onEnd();
              onError('No access token received from Google.');
            }
          },
          error_callback: (nonOAuthErr) => {
            onEnd();
            console.warn('[TripPulse GIS] Popup notice:', nonOAuthErr);
            if (nonOAuthErr?.type === 'popup_closed') {
              onError('Google sign-in popup was closed.');
            } else {
              onError(nonOAuthErr?.message || 'Google Sign-In popup unavailable. Retrying with full redirect...');
              // Fallback to redirect flow
              const backendOAuthUrl = `${getApiBaseUrl()}/auth/google`;
              window.location.href = backendOAuthUrl;
            }
          }
        });

        // Request access token from Google with select_account prompt
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (gisInitErr) {
        console.warn('[TripPulse GIS] Token client initialization failed, falling back to redirect:', gisInitErr);
      }
    }

    // 2. Fallback to Backend-Initiated OAuth 2.0 Redirection Flow
    const backendOAuthUrl = `${getApiBaseUrl()}/auth/google`;
    window.location.href = backendOAuthUrl;
  } catch (err) {
    onEnd();
    onError(err.message || 'Unable to initiate Google sign-in.');
  }
};

/**
 * Exchanges an OAuth 2.0 authorization code for user data and a TripPulse JWT token.
 */
export const exchangeOAuthCode = async (code, redirectUri = null) => {
  const payload = {
    provider: 'google',
    code: code
  };
  if (redirectUri) {
    payload.redirect_uri = redirectUri;
  }
  return await api.post('/auth/google', payload);
};

/**
 * Diagnostic logger for development mode.
 */
export const logOAuthDiagnostics = (serverConfig = null) => {
  if (!import.meta.env.DEV) return;

  const clientId = getGoogleClientId(serverConfig);
  const validation = validateGoogleClientId(clientId);
  const backendUrl = getApiBaseUrl();
  const frontendUrl = window.location.origin;
  const callbackUrl = `${frontendUrl}/login`;

  let clientStatus = 'NOT CONFIGURED (Missing in .env)';
  if (validation.valid) {
    clientStatus = `CONFIGURED (${clientId.substring(0, 10)}...${clientId.slice(-20)})`;
  } else if (validation.isPlaceholder) {
    clientStatus = `PLACEHOLDER / INVALID: "${clientId}"`;
  }

  console.groupCollapsed('%c[TripPulse Auth] Diagnostics', 'color: #3b82f6; font-weight: bold;');
  console.log('%cFrontend URL        :', 'font-weight: bold;', frontendUrl);
  console.log('%cBackend API URL     :', 'font-weight: bold;', backendUrl);
  console.log('%cVITE_GOOGLE_CLIENT_ID:', 'font-weight: bold;', clientStatus);
  console.log('%cOAuth Callback URL  :', 'font-weight: bold;', callbackUrl);
  console.log('%cGoogle OAuth Ready  :', 'font-weight: bold;', validation.valid ? 'YES' : 'NO');
  console.groupEnd();
};

export default {
  getGoogleClientId,
  validateGoogleClientId,
  initiateGoogleSignIn,
  exchangeOAuthCode,
  logOAuthDiagnostics
};

