import axios from 'axios';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

type AgeGroup = 'under_18' | '18_24' | '25_34' | '35_44' | '45_54' | '55_plus';
type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';

interface UserData {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  ageGroup: AgeGroup;
  gender: Gender;
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
    ageGroup: AgeGroup,
    gender: Gender,
    email?: string,
  ) =>
    authHttp.post<SignupCompleteResponse>(
      '/auth/signup/complete',
      { name, ageGroup, gender, email },
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

export type { TokenPair, UserData, AgeGroup, Gender };
