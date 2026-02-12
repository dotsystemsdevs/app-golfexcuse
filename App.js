import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EXCUSES } from './src/excuses';

const REVIEW_PROMPT_AFTER_GENERATES = 3;
const STORAGE_KEY_ASKED_REVIEW = 'golf_excuse_asked_review';
const LEGAL_BASE_URL = 'https://dotsystemsdevs.github.io/app-legal-docs/golf-excuse-generator';

// Design tokens – spacing, radius, typography
const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 };
const RADIUS = { sm: 12, md: 16, lg: 20, xl: 24, full: 9999 };
const FONT = { label: 15, body: 17, bodyLg: 18, subtitle: 16, title: 26, btn: 23 };

// Färgpalett – matchar logotypen: mörk/mittgrön, kepsgrön, gul accent (Excuse), golfboll vit/skugga
const PALETTE = {
  bg: '#4F755E',
  surface: '#2F5E3C',
  border: '#5F8E73',
  accent: '#E8B923',
  cta: '#E8B923',
  ctaBorder: '#F5C542',
  ctaText: '#111111',
  text: '#E6E6E6',
  textMuted: '#CFCFCF',
  shadow: '#111111',
};

const QUICK_OPTIONS = ['Windy', 'Rain', 'Cold', 'Hot'];
const PLACEHOLDER = 'Tap "Generate Excuse" below to get one.';
const LOADING_MESSAGES = [
  'Generating…',
  'Loading…',
  'One moment…',
  'Preparing your excuse…',
  'Please wait…',
  'Almost there…',
];
const GENERATE_DELAY_MS = 1100;
const FADE_DURATION_MS = 280;
const COPY_RESET_MS = 1800;

function pickRandom() {
  return EXCUSES[Math.floor(Math.random() * EXCUSES.length)];
}

function pickLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

export default function App() {
  const [excuse, setExcuse] = useState(null);
  const [quickOption, setQuickOption] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [generateCount, setGenerateCount] = useState(0);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [hasAskedReview, setHasAskedReview] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const generateTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const asked = await AsyncStorage.getItem(STORAGE_KEY_ASKED_REVIEW);
        if (asked === 'true') setHasAskedReview(true);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    if (!__DEV__) {
      (async () => {
        try {
          const result = await Updates.checkForUpdateAsync();
          if (result?.isAvailable) setUpdateAvailable(true);
        } catch (_) {}
      })();
    }
  }, []);

  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    setLoadingMsg(pickLoadingMessage());
    setIsGenerating(true);
    loadingOpacity.setValue(1);
    const newExcuse = pickRandom();
    generateTimeoutRef.current = setTimeout(() => {
      generateTimeoutRef.current = null;
      loadingOpacity.setValue(1);
      setExcuse(newExcuse);
      setIsGenerating(false);
      setGenerateCount((c) => c + 1);
      fadeAnim.setValue(1);
    }, GENERATE_DELAY_MS);
  }, [isGenerating, fadeAnim, loadingOpacity]);

  useEffect(() => {
    if (generateCount >= REVIEW_PROMPT_AFTER_GENERATES && !hasAskedReview) {
      setShowReviewPrompt(true);
    }
  }, [generateCount, hasAskedReview]);

  useEffect(() => {
    if (!isGenerating) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingOpacity, { toValue: 0.5, duration: 400, useNativeDriver: true }),
        Animated.timing(loadingOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isGenerating, loadingOpacity]);

  const displayText = useMemo(() => {
    if (isGenerating) return null;
    if (!excuse) return null;
    return quickOption ? `${quickOption}. ${excuse}` : excuse;
  }, [excuse, quickOption, isGenerating]);

  const handleCopy = useCallback(async () => {
    if (!displayText) return;
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    await Clipboard.setStringAsync(displayText);
    setCopied(true);
    copyTimeoutRef.current = setTimeout(() => {
      copyTimeoutRef.current = null;
      setCopied(false);
    }, COPY_RESET_MS);
  }, [displayText]);

  const handleChipPress = useCallback((opt) => {
    const next = quickOption === opt ? null : opt;
    setQuickOption(next);
    if (next !== quickOption) setExcuse(null);
  }, [quickOption]);

  const handleRequestReview = useCallback(async () => {
    setShowReviewPrompt(false);
    setHasAskedReview(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ASKED_REVIEW, 'true');
      if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
    } catch (_) {}
  }, []);

  const handleDismissReview = useCallback(async () => {
    setShowReviewPrompt(false);
    setHasAskedReview(true);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_ASKED_REVIEW, 'true');
    } catch (_) {}
  }, []);

  const handleReloadUpdate = useCallback(async () => {
    try {
      setUpdateDownloading(true);
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (_) {
      setUpdateDownloading(false);
    }
  }, []);

  const openPrivacy = useCallback(() => {
    Linking.openURL(`${LEGAL_BASE_URL}/privacy.html`);
  }, []);

  const openTerms = useCallback(() => {
    Linking.openURL(`${LEGAL_BASE_URL}/terms.html`);
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        {updateAvailable && (
          <View style={styles.updateBanner}>
            <Text style={styles.updateBannerText}>Update available</Text>
            <Pressable
              onPress={handleReloadUpdate}
              disabled={updateDownloading}
              style={styles.updateBannerBtn}
            >
              <Text style={styles.updateBannerBtnText}>{updateDownloading ? '…' : 'Reload'}</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.logoWrap}>
              <Image source={require('./assets/logo.png')} style={styles.logo} resizeMode="cover" accessibilityLabel="Golf Excuse Generator logo" />
            </View>
            <Text style={styles.title}>
              <Text style={styles.titlePart}>Golf </Text>
              <Text style={[styles.titlePart, styles.titleAccent]}>Excuse</Text>
              <Text style={styles.titlePart}> Generator</Text>
            </Text>
            <Text style={styles.subtitle}>Your bad shot deserves a good excuse.</Text>
          </View>

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View
              style={[
                styles.card,
                !displayText && !isGenerating && styles.cardEmpty,
                displayText && styles.cardWithCopy,
              ]}
              accessible
              accessibilityRole="none"
              accessibilityLabel={displayText ? `Excuse: ${displayText}` : 'Excuse card. No excuse yet.'}
            >
              {displayText && (
                <Pressable
                  style={({ pressed }) => [
                    styles.cardCopyBtn,
                    copied && styles.cardCopyBtnCopied,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleCopy}
                  hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
                  accessibilityLabel={copied ? 'Copied' : 'Copy excuse'}
                  accessibilityRole="button"
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={26} color={PALETTE.text} />
                </Pressable>
              )}
              {isGenerating ? (
                <Animated.Text style={[styles.cardTextLoading, { opacity: loadingOpacity }]}>
                  {loadingMsg}
                </Animated.Text>
              ) : (
                <View style={styles.cardTextWrap}>
                  <Text style={[styles.cardText, !displayText && styles.cardTextPlaceholder]}>
                    {displayText || PLACEHOLDER}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={styles.bottomBlock}>
            <Text style={styles.inputLabel}>Let the weather decide (optional)</Text>
            <View style={styles.chipRow}>
              {QUICK_OPTIONS.map((opt) => (
                <Pressable
                  key={opt}
                  style={({ pressed }) => [
                    styles.chip,
                    quickOption === opt && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleChipPress(opt)}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityLabel={`Weather: ${opt}. ${quickOption === opt ? 'Selected. Tap to deselect.' : 'Tap to select.'}`}
                  accessibilityRole="button"
                >
                  <Text style={[styles.chipText, quickOption === opt && styles.chipTextActive]}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.generateBtn,
                pressed && styles.generateBtnPressed,
                isGenerating && styles.generateBtnBusy,
              ]}
              onPress={handleGenerate}
              disabled={isGenerating}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityLabel="Generate a random golf excuse"
              accessibilityHint={isGenerating ? 'Please wait' : 'Double tap to generate'}
              accessibilityRole="button"
              accessibilityState={{ disabled: isGenerating, busy: isGenerating }}
            >
              <Text style={styles.generateBtnText}>
                {isGenerating ? '…' : 'Generate Excuse'}
              </Text>
            </Pressable>

            {showReviewPrompt && (
              <View style={styles.reviewPrompt}>
                <Text style={styles.reviewPromptText}>Enjoying the app? Rate us!</Text>
                <View style={styles.reviewPromptRow}>
                  <Pressable style={styles.reviewBtn} onPress={handleRequestReview}>
                    <Text style={styles.reviewBtnText}>Rate app</Text>
                  </Pressable>
                  <Pressable style={styles.reviewBtnSecondary} onPress={handleDismissReview}>
                    <Text style={styles.reviewBtnSecondaryText}>Maybe later</Text>
                  </Pressable>
                </View>
              </View>
            )}

            <View style={styles.footerLinks}>
              <Pressable onPress={handleRequestReview} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Rate the app</Text>
              </Pressable>
              <Text style={styles.footerDot}> · </Text>
              <Pressable onPress={openPrivacy} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Privacy</Text>
              </Pressable>
              <Text style={styles.footerDot}> · </Text>
              <Pressable onPress={openTerms} style={styles.footerLink}>
                <Text style={styles.footerLinkText}>Terms</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Design: tokens + PALETTE. Slate/teal bakgrund, coral CTA, bra kontrast.
const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: PALETTE.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xxl,
  },
  header: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    alignItems: 'center',
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '700',
    textAlign: 'center',
    textShadowColor: PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  titlePart: {
    color: PALETTE.text,
  },
  titleAccent: {
    color: PALETTE.accent,
    textShadowColor: PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  subtitle: {
    fontSize: FONT.subtitle,
    lineHeight: 22,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  inputLabel: {
    fontSize: FONT.label,
    lineHeight: 20,
    color: PALETTE.text,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    justifyContent: 'space-between',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  chip: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.xl,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: PALETTE.surface,
    borderWidth: 3,
    borderColor: PALETTE.accent,
  },
  chipText: {
    fontSize: FONT.label,
    fontWeight: '600',
    color: PALETTE.text,
  },
  chipTextActive: {
    color: PALETTE.text,
    fontWeight: '700',
  },
  bottomBlock: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxxl,
  },
  generateBtn: {
    backgroundColor: PALETTE.cta,
    borderWidth: 3,
    borderColor: PALETTE.ctaBorder,
    paddingVertical: 22,
    borderRadius: RADIUS.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    minHeight: 64,
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: FONT.btn,
    fontWeight: '700',
    color: PALETTE.ctaText,
  },
  generateBtnPressed: {
    opacity: 0.85,
  },
  generateBtnBusy: {
    opacity: 0.95,
  },
  cardScroll: {
    flex: 1,
    minHeight: 100,
  },
  cardScrollContent: {
    paddingVertical: SPACING.lg,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.xxl,
    borderWidth: 2,
    borderColor: PALETTE.border,
    minHeight: 140,
    justifyContent: 'center',
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardWithCopy: {
    paddingTop: 56,
  },
  cardCopyBtn: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopyBtnCopied: {
    backgroundColor: PALETTE.border,
  },
  cardEmpty: {
    backgroundColor: 'rgba(47,94,60,0.92)',
  },
  cardTextWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 60,
  },
  cardText: {
    fontSize: FONT.bodyLg,
    lineHeight: 28,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardTextPlaceholder: {
    color: PALETTE.textMuted,
    textAlign: 'center',
    fontSize: FONT.body,
  },
  cardTextLoading: {
    fontSize: FONT.bodyLg,
    lineHeight: 28,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  updateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PALETTE.surface,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: PALETTE.border,
  },
  updateBannerText: {
    fontSize: FONT.label,
    color: PALETTE.text,
  },
  updateBannerBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: PALETTE.cta,
    borderRadius: RADIUS.sm,
  },
  updateBannerBtnText: {
    fontSize: FONT.label,
    fontWeight: '600',
    color: PALETTE.ctaText,
  },
  reviewPrompt: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  reviewPromptText: {
    fontSize: FONT.body,
    color: PALETTE.text,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  reviewPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  reviewBtn: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    backgroundColor: PALETTE.cta,
    borderRadius: RADIUS.sm,
  },
  reviewBtnText: {
    fontSize: FONT.label,
    fontWeight: '600',
    color: PALETTE.ctaText,
  },
  reviewBtnSecondary: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  reviewBtnSecondaryText: {
    fontSize: FONT.label,
    color: PALETTE.textMuted,
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: SPACING.lg,
  },
  footerLink: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.xs,
  },
  footerLinkText: {
    fontSize: FONT.label,
    color: PALETTE.accent,
    textDecorationLine: 'underline',
  },
  footerDot: {
    fontSize: FONT.label,
    color: PALETTE.textMuted,
  },
});
