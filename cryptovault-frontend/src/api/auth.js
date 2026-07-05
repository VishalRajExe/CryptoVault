import client from './client';

// Maps 1:1 to com.vishal.controller.AuthController and UserController

export const signup = (payload) =>
  // payload: { fullName, email, mobile, password }
  client.post('/auth/signup', payload).then((r) => r.data);

export const signin = (payload) =>
  // payload: { email, password }
  client.post('/auth/signin', payload).then((r) => r.data);

export const verifyTwoFactorOtp = (otp, sessionId) =>
  client
    .post(`/auth/two-factor/otp/${otp}`, null, { params: { id: sessionId } })
    .then((r) => r.data);

export const googleLoginUrl = (apiBaseUrl) => `${apiBaseUrl}/auth/login/google`;

export const sendForgotPasswordOtp = (payload) =>
  // payload: { sendTo, verificationType: 'EMAIL' }
  client.post('/auth/users/reset-password/send-otp', payload).then((r) => r.data);

export const resetPassword = (sessionId, payload) =>
  // payload: { otp, password }
  client
    .patch('/auth/users/reset-password/verify-otp', payload, { params: { id: sessionId } })
    .then((r) => r.data);

export const getProfile = () => client.get('/api/users/profile').then((r) => r.data);

export const sendVerificationOtp = (verificationType) =>
  client.post(`/api/users/verification/${verificationType}/send-otp`).then((r) => r.data);

export const verifyAccountOtp = (otp) =>
  client.patch(`/api/users/verification/verify-otp/${otp}`).then((r) => r.data);

export const enableTwoFactor = (otp) =>
  client.patch(`/api/users/enable-two-factor/verify-otp/${otp}`).then((r) => r.data);

export const updateMobile = (mobile) =>
  client.patch('/api/users/mobile', { mobile }).then((r) => r.data);

// ---- Notifications (NotificationController) ----
export const getMyNotifications = () => client.get('/api/notifications').then((r) => r.data);

export const markNotificationsRead = () =>
  client.patch('/api/notifications/mark-read').then((r) => r.data);
