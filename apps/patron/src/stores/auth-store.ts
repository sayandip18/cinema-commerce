import { create } from 'zustand';
import { tokenStorage } from '@/lib/token-storage';
import { authApi, type UserData } from '@/lib/auth-api';

type AuthStep =
  | 'idle'
  | 'otp-sent'
  | 'otp-verified'
  | 'profile-form'
  | 'authenticated';

interface AuthState {
  user: UserData | null;
  step: AuthStep;
  phone: string;
  signupToken: string | null;
  isLoading: boolean;
  error: string | null;
  isHydrated: boolean;

  hydrate: () => Promise<void>;

  signupSendOtp: (phone: string) => Promise<void>;
  signupVerifyOtp: (otp: string) => Promise<void>;
  signupComplete: (name: string, email?: string) => Promise<void>;

  signinSendOtp: (phone: string) => Promise<void>;
  signinVerifyOtp: (otp: string) => Promise<void>;

  logout: () => Promise<void>;
  clearError: () => void;
  resetFlow: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  step: 'idle',
  phone: '',
  signupToken: null,
  isLoading: false,
  error: null,
  isHydrated: false,

  hydrate: async () => {
    const token = await tokenStorage.getAccessToken();
    set({ isHydrated: true, step: token ? 'authenticated' : 'idle' });
  },

  signupSendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.signupSendOtp(phone);
      set({ phone, step: 'otp-sent', isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  signupVerifyOtp: async (otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.signupVerifyOtp(get().phone, otp);
      set({
        signupToken: data.data.signupToken,
        step: 'profile-form',
        isLoading: false,
      });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  signupComplete: async (name: string, email?: string) => {
    set({ isLoading: true, error: null });
    const { signupToken } = get();
    if (!signupToken) {
      set({ error: 'Missing signup token', isLoading: false });
      return;
    }
    try {
      const { data } = await authApi.signupComplete(signupToken, name, email);
      const { user, tokens } = data.data;
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      set({
        user,
        step: 'authenticated',
        signupToken: null,
        isLoading: false,
      });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  signinSendOtp: async (phone: string) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.signinSendOtp(phone);
      set({ phone, step: 'otp-sent', isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  signinVerifyOtp: async (otp: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await authApi.signinVerifyOtp(get().phone, otp);
      const { user, tokens } = data.data;
      await tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
      set({ user, step: 'authenticated', isLoading: false });
    } catch (err) {
      set({ error: extractError(err), isLoading: false });
    }
  },

  logout: async () => {
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();
      if (accessToken && refreshToken) {
        await authApi.logout(accessToken, refreshToken);
      }
    } catch {
      // Proceed with local logout even if backend call fails
    }
    await tokenStorage.clearTokens();
    set({
      user: null,
      step: 'idle',
      phone: '',
      signupToken: null,
      error: null,
    });
  },

  clearError: () => set({ error: null }),

  resetFlow: () =>
    set({ step: 'idle', phone: '', signupToken: null, error: null }),
}));

function extractError(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err &&
    err.response &&
    typeof err.response === 'object' &&
    'data' in err.response &&
    err.response.data &&
    typeof err.response.data === 'object' &&
    'message' in err.response.data
  ) {
    const message = (err.response.data as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message[0];
  }
  return 'Something went wrong';
}
