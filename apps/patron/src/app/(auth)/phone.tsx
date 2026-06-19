import { useState } from "react";
import {
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useAuthStore } from "@/stores/auth-store";
import { Colors, Spacing } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

type Mode = "signin" | "signup";

export default function PhoneScreen() {
  const [phone, setPhone] = useState("");
  const [mode, setMode] = useState<Mode>("signin");
  const { signinSendOtp, signupSendOtp, isLoading, error, clearError } =
    useAuthStore();
  const router = useRouter();
  const theme = useTheme();

  const handleSubmit = async () => {
    clearError();
    if (mode === "signin") {
      await signinSendOtp(phone);
    } else {
      await signupSendOtp(phone);
    }
    const currentStep = useAuthStore.getState().step;
    if (currentStep === "otp-sent") {
      router.push({ pathname: "/(auth)/otp", params: { mode } });
    }
  };

  const isValid = /^\d{10}$/.test(phone);

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.content}
        >
          <ThemedText type="title" style={styles.title}>
            {mode === "signin" ? "Welcome back" : "Create account"}
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Enter your 10-digit mobile number
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
            placeholder="9876543210"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            maxLength={10}
            value={phone}
            onChangeText={(text) => {
              setPhone(text.replace(/\D/g, ""));
              clearError();
            }}
          />

          {error && <ThemedText style={styles.error}>{error}</ThemedText>}

          <Pressable
            style={[styles.button, !isValid && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={!isValid || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ThemedText style={styles.buttonText}>Send OTP</ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              clearError();
            }}
          >
            <ThemedText style={styles.toggleText}>
              {mode === "signin"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
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
    justifyContent: "center",
    paddingHorizontal: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.7,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
  },
  error: {
    color: "#EF4444",
    textAlign: "center",
    fontSize: 14,
  },
  button: {
    backgroundColor: Colors.light.text,
    height: 56,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    color: Colors.light.background,
    fontWeight: "600",
    fontSize: 16,
  },
  toggleText: {
    textAlign: "center",
    opacity: 0.6,
    fontSize: 14,
  },
});
