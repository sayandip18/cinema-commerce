import { useState } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuthStore } from '@/stores/auth-store';
import { Colors, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { AgeGroup, Gender } from '@/lib/auth-api';

const AGE_GROUP_OPTIONS: { value: AgeGroup; label: string }[] = [
  { value: 'under_18', label: 'Under 18' },
  { value: '18_24', label: '18–24' },
  { value: '25_34', label: '25–34' },
  { value: '35_44', label: '35–44' },
  { value: '45_54', label: '45–54' },
  { value: '55_plus', label: '55+' },
];

const GENDER_OPTIONS: { value: Gender; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

function ChipGroup<T extends string>({
  options,
  value,
  onSelect,
  theme,
}: {
  options: { value: T; label: string }[];
  value: T | null;
  onSelect: (v: T) => void;
  theme: ReturnType<typeof useTheme>;
}) {
  return (
    <ThemedView style={styles.chipContainer}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            style={[
              styles.chip,
              {
                backgroundColor: selected
                  ? Colors.light.text
                  : theme.backgroundElement,
                borderColor: selected
                  ? Colors.light.text
                  : theme.backgroundSelected,
              },
            ]}
            onPress={() => onSelect(option.value)}
          >
            <ThemedText
              style={[
                styles.chipText,
                {
                  color: selected ? Colors.light.background : theme.text,
                },
              ]}
            >
              {option.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </ThemedView>
  );
}

export default function ProfileScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [ageGroup, setAgeGroup] = useState<AgeGroup | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const { signupComplete, isLoading, error, clearError } = useAuthStore();
  const theme = useTheme();

  const handleComplete = async () => {
    if (!ageGroup || !gender) return;
    clearError();
    await signupComplete(name.trim(), ageGroup, gender, email.trim() || undefined);
  };

  const isValid = name.trim().length > 0 && ageGroup !== null && gender !== null;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <ThemedText type="title" style={styles.title}>
              Complete your profile
            </ThemedText>

            <ThemedText style={styles.subtitle}>
              Tell us a bit about yourself
            </ThemedText>

            <ThemedView style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Name *</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}
                placeholder="Your name"
                placeholderTextColor={theme.textSecondary}
                value={name}
                onChangeText={(text) => {
                  setName(text);
                  clearError();
                }}
                autoCapitalize="words"
              />
            </ThemedView>

            <ThemedView style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Email (optional)</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.text,
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.backgroundSelected,
                  },
                ]}
                placeholder="you@example.com"
                placeholderTextColor={theme.textSecondary}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  clearError();
                }}
              />
            </ThemedView>

            <ThemedView style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Age group *</ThemedText>
              <ChipGroup
                options={AGE_GROUP_OPTIONS}
                value={ageGroup}
                onSelect={(v) => {
                  setAgeGroup(v);
                  clearError();
                }}
                theme={theme}
              />
            </ThemedView>

            <ThemedView style={styles.fieldGroup}>
              <ThemedText style={styles.label}>Gender *</ThemedText>
              <ChipGroup
                options={GENDER_OPTIONS}
                value={gender}
                onSelect={(v) => {
                  setGender(v);
                  clearError();
                }}
                theme={theme}
              />
            </ThemedView>

            {error && <ThemedText style={styles.error}>{error}</ThemedText>}

            <Pressable
              style={[styles.button, !isValid && styles.buttonDisabled]}
              onPress={handleComplete}
              disabled={!isValid || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <ThemedText style={styles.buttonText}>Get started</ThemedText>
              )}
            </Pressable>
          </ScrollView>
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
  keyboardView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  fieldGroup: {
    gap: Spacing.one,
  },
  label: {
    fontSize: 14,
    opacity: 0.7,
    paddingLeft: Spacing.one,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  chip: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
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
});
