import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  createdAt: string;
  updatedAt: string;
}

interface SendOtpResponse {
  data: { message: string };
}

interface SignupVerifyResponse {
  data: { signupToken: string };
}

interface SignupCompleteResponse {
  data: { user: UserData; tokens: TokenPair };
}

interface SigninVerifyResponse {
  data: { user: UserData; tokens: TokenPair };
}

const authHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const authApi = {
  signupSendOtp: (phone: string) =>
    authHttp.post<SendOtpResponse>('/auth/signup/send-otp', { phone }),

  signupVerifyOtp: (phone: string, otp: string) =>
    authHttp.post<SignupVerifyResponse>('/auth/signup/verify-otp', {
      phone,
      otp,
    }),

  signupComplete: (
    signupToken: string,
    name: string,
    email?: string,
  ) =>
    authHttp.post<SignupCompleteResponse>(
      '/auth/signup/complete',
      { name, email },
      { headers: { Authorization: `Bearer ${signupToken}` } },
    ),

  signinSendOtp: (phone: string) =>
    authHttp.post<SendOtpResponse>('/auth/signin/send-otp', { phone }),

  signinVerifyOtp: (phone: string, otp: string) =>
    authHttp.post<SigninVerifyResponse>('/auth/signin/verify-otp', {
      phone,
      otp,
    }),

  logout: (accessToken: string, refreshToken: string) =>
    authHttp.post(
      '/auth/logout',
      { refreshToken },
      { headers: { Authorization: `Bearer ${accessToken}` } },
    ),
};

export type { TokenPair, UserData };
