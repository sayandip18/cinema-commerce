import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function OtpScreen() {
  const [otp, setOtp] = useState('');
  const { mode } = useLocalSearchParams<{ mode: 'signin' | 'signup' }>();
  const { signinVerifyOtp, signupVerifyOtp, phone, isLoading, error, clearError } =
    useAuthStore();
  const router = useRouter();
  const theme = useTheme();

  const handleVerify = async () => {
    clearError();
    if (mode === 'signin') {
      await signinVerifyOtp(otp);
    } else {
      await signupVerifyOtp(otp);
    }
    const currentStep = useAuthStore.getState().step;
    if (currentStep === 'profile-form') {
      router.replace('/(auth)/profile');
    }
  };

  const isValid = /^\d{6}$/.test(otp);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.content}
        >
          <ThemedText type="title" style={styles.title}>
            Verify OTP
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Enter the 6-digit code sent to {phone}
          </ThemedText>

          <TextInput
            style={[
              styles.input,
              {
                color: theme.text,
                backgroundColor: theme.backgroundElement,
                borderColor: theme.backgroundSelected,
              },
            ]}
            placeholder="123456"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={6}
            value={otp}
            onChangeText={(text) => {
              setOtp(text.replace(/\D/g, ''));
              clearError();
            }}
          />

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Pressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleVerify}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Verify</ThemedText>
            )}
          </Pressable>

          <Pressable onPress={() => router.back()}>
            <ThemedText style={styles.backText}>
              Change phone number
            </ThemedText>
          </Pressable>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 24,
    letterSpacing: 8,
    textAlign: 'center',
  },
  error: {
    color: '#EF4444',
    textAlign: 'center',
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.light.text,
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: Colors.light.background,
    fontWeight: '600',
    fontSize: 16,
  },
  backText: {
    textAlign: 'center',
    opacity: 0.6,
    fontSize: 14,
  },
});
