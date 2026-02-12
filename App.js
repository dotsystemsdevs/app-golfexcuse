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
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CONFIG,
  QUICK_OPTIONS,
  PLACEHOLDER,
  LOADING_MESSAGES,
  SPACING,
  RADIUS,
  FONT,
  PALETTE,
  LAYOUT,
} from './src/constants';
import { pickRandom } from './src/utils';
import { EXCUSES } from './src/excuses';

export default function App() {
  const [excuse, setExcuse] = useState(null);
  const [quickOption, setQuickOption] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(() => LOADING_MESSAGES?.[0] ?? 'Loading…');
  const [generateCount, setGenerateCount] = useState(0);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [hasAskedReview, setHasAskedReview] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(0.5)).current;
  const generateTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);

  // Inledande laddningsskärm: visa minst SPLASH_MIN_MS, sedan visa huvudvyn
  useEffect(() => {
    const minMs = typeof CONFIG.SPLASH_MIN_MS === 'number' ? CONFIG.SPLASH_MIN_MS : 1000;
    const t = setTimeout(() => setIsAppReady(true), minMs);
    return () => clearTimeout(t);
  }, []);

  // Pulsanimation på laddningsskärmens indikator (stoppas när isAppReady)
  useEffect(() => {
    if (isAppReady) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(splashOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(splashOpacity, { toValue: 0.4, duration: 500, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isAppReady, splashOpacity]);

  // Läs om vi redan frågat om betyg (AsyncStorage)
  useEffect(() => {
    (async () => {
      try {
        const key = CONFIG.STORAGE_KEY_ASKED_REVIEW;
        if (!key || typeof key !== 'string') return;
        const asked = await AsyncStorage.getItem(key);
        if (asked === 'true') setHasAskedReview(true);
      } catch (_) {}
    })();
  }, []);

  // Kontrollera om det finns en ny version (Expo Updates; hoppa över i __DEV__)
  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) return;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result?.isAvailable) setUpdateAvailable(true);
      } catch (_) {}
    })();
  }, []);

  // Städa timeouts vid unmount
  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  // Respektera systeminställning för reduce motion (mindre animationer)
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => {});
  }, []);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    setLoadingMsg(pickRandom(LOADING_MESSAGES) || LOADING_MESSAGES?.[0] ?? 'Loading…');
    setIsGenerating(true);
    loadingOpacity.setValue(1);
    const newExcuse = pickRandom(EXCUSES);
    const delayMs = typeof CONFIG.GENERATE_DELAY_MS === 'number' ? CONFIG.GENERATE_DELAY_MS : 1100;
    generateTimeoutRef.current = setTimeout(() => {
      generateTimeoutRef.current = null;
      loadingOpacity.setValue(1);
      setExcuse(newExcuse || null);
      setIsGenerating(false);
      setGenerateCount((c) => c + 1);
    }, delayMs);
  }, [isGenerating, loadingOpacity]);

  // Visa betygsprompt efter N genereringar (om vi inte redan frågat)
  useEffect(() => {
    const threshold = typeof CONFIG.REVIEW_PROMPT_AFTER_GENERATES === 'number' ? CONFIG.REVIEW_PROMPT_AFTER_GENERATES : 3;
    if (generateCount >= threshold && !hasAskedReview) {
      setShowReviewPrompt(true);
    }
  }, [generateCount, hasAskedReview]);

  useEffect(() => {
    if (!isGenerating || reduceMotion) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(loadingOpacity, { toValue: 0.5, duration: 400, useNativeDriver: true }),
        Animated.timing(loadingOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isGenerating, loadingOpacity, reduceMotion]);

  const displayText = useMemo(() => {
    if (isGenerating) return null;
    if (!excuse) return null;
    return quickOption ? `${quickOption}. ${excuse}` : excuse;
  }, [excuse, quickOption, isGenerating]);

  const handleCopy = useCallback(async () => {
    if (!displayText) return;
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    try {
      await Clipboard.setStringAsync(displayText);
      setCopied(true);
      const resetMs = typeof CONFIG.COPY_RESET_MS === 'number' ? CONFIG.COPY_RESET_MS : 1800;
      copyTimeoutRef.current = setTimeout(() => {
        copyTimeoutRef.current = null;
        setCopied(false);
      }, resetMs);
    } catch (_) {
      // Clipboard may be unavailable (e.g. permission)
    }
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
      const key = CONFIG.STORAGE_KEY_ASKED_REVIEW;
      if (key && typeof key === 'string') await AsyncStorage.setItem(key, 'true');
      if (await StoreReview.isAvailableAsync()) await StoreReview.requestReview();
    } catch (_) {}
  }, []);

  const handleDismissReview = useCallback(async () => {
    setShowReviewPrompt(false);
    setHasAskedReview(true);
    try {
      const key = CONFIG.STORAGE_KEY_ASKED_REVIEW;
      if (key && typeof key === 'string') await AsyncStorage.setItem(key, 'true');
    } catch (_) {}
  }, []);

  const handleReloadUpdate = useCallback(async () => {
    setUpdateDownloading(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (_) {
      // fetch or reload failed; user stays on current version
    } finally {
      setUpdateDownloading(false);
    }
  }, []);

  const openPrivacy = useCallback(() => {
    const url = CONFIG.LEGAL_BASE_URL?.trim();
    if (!url) return;
    Linking.openURL(`${url}/privacy.html`).catch(() => {});
  }, []);

  const openTerms = useCallback(() => {
    const url = CONFIG.LEGAL_BASE_URL?.trim();
    if (!url) return;
    Linking.openURL(`${url}/terms.html`).catch(() => {});
  }, []);

  if (!isAppReady) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={styles.splashRoot} accessibilityLabel="Loading Golf Excuse Generator">
          <View style={styles.splashContent}>
            <View style={styles.splashLogoWrap}>
              <Image source={require('./assets/logo.png')} style={styles.splashLogo} resizeMode="cover" accessibilityLabel="Golf Excuse Generator logo" />
            </View>
            <Text style={styles.splashTitle}>
              <Text style={styles.splashTitlePart}>Golf </Text>
              <Text style={[styles.splashTitlePart, styles.splashTitleAccent]}>Excuse</Text>
              <Text style={styles.splashTitlePart}> Generator</Text>
            </Text>
            <Text style={styles.splashSubtitle}>Your bad shot deserves a good excuse.</Text>
            <View style={styles.splashLoaderWrap}>
              <Animated.View style={[styles.splashLoaderBar, { opacity: splashOpacity }]} />
            </View>
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

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
              accessibilityLabel={displayText ? 'Excuse card' : 'Excuse card. No excuse yet. Tap Generate to get one.'}
            >
              {displayText && (
                <View style={styles.cardCopyRow}>
                  {copied && (
                    <Text style={styles.copiedLabel} accessibilityRole="text">
                      Copied!
                    </Text>
                  )}
                  <Pressable
                    style={({ pressed }) => [
                      styles.cardCopyBtn,
                      copied && styles.cardCopyBtnCopied,
                      pressed && styles.pressed,
                    ]}
                    onPress={handleCopy}
                    hitSlop={{ top: SPACING.lg, bottom: SPACING.lg, left: SPACING.lg, right: SPACING.lg }}
                    accessibilityLabel={copied ? 'Copied to clipboard' : 'Copy excuse to clipboard'}
                    accessibilityRole="button"
                  >
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={26} color={PALETTE.text} />
                  </Pressable>
                </View>
              )}
              {isGenerating ? (
                <Animated.Text
                  style={[styles.cardTextLoading, { opacity: loadingOpacity }]}
                  accessibilityRole="text"
                  accessibilityLabel={loadingMsg ?? 'Loading…'}
                  accessibilityState={{ busy: true }}
                >
                  {loadingMsg ?? 'Loading…'}
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
              {(QUICK_OPTIONS ?? []).map((opt) => (
                <Pressable
                  key={opt}
                  style={({ pressed }) => [
                    styles.chip,
                    quickOption === opt && styles.chipActive,
                    pressed && styles.pressed,
                  ]}
                  onPress={() => handleChipPress(opt)}
hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
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
              hitSlop={{ top: SPACING.md, bottom: SPACING.md, left: SPACING.md, right: SPACING.md }}
              accessibilityLabel={excuse ? 'Generate another random excuse' : 'Generate a random golf excuse'}
              accessibilityHint={isGenerating ? 'Please wait' : 'Double tap to generate'}
              accessibilityRole="button"
              accessibilityState={{ disabled: isGenerating, busy: isGenerating }}
            >
              <Text style={styles.generateBtnText}>
                {isGenerating ? '…' : (excuse ? 'Generate another' : 'Generate Excuse')}
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
  splashRoot: {
    flex: 1,
    backgroundColor: PALETTE.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  splashLogoWrap: {
    width: 120,
    height: 120,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderWidth: 3,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
    overflow: 'hidden',
  },
  splashLogo: {
    width: '100%',
    height: '100%',
  },
  splashTitle: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    textShadowColor: PALETTE.shadow,
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  splashTitlePart: {
    color: PALETTE.text,
  },
  splashTitleAccent: {
    color: PALETTE.accent,
  },
  splashSubtitle: {
    fontSize: FONT.subtitle,
    lineHeight: 24,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xxl,
  },
  splashLoaderWrap: {
    width: 120,
    height: 4,
    borderRadius: 2,
    backgroundColor: PALETTE.surface,
    overflow: 'hidden',
  },
  splashLoaderBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PALETTE.accent,
    borderRadius: 2,
  },
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
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoWrap: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '700',
    letterSpacing: 0.3,
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
    lineHeight: 24,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  inputLabel: {
    fontSize: FONT.label,
    lineHeight: 22,
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
    borderRadius: RADIUS.xxl,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
    minHeight: LAYOUT.touchTarget,
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
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  generateBtn: {
    backgroundColor: PALETTE.cta,
    borderWidth: 3,
    borderColor: PALETTE.ctaBorder,
    paddingVertical: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
    minHeight: LAYOUT.btnMinHeight,
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: FONT.btn,
    fontWeight: '700',
    letterSpacing: 0.2,
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
    minHeight: LAYOUT.scrollMinHeight,
  },
  cardScrollContent: {
    paddingVertical: SPACING.xl,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: PALETTE.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.xxl,
    paddingVertical: SPACING.xxl,
    borderWidth: 2,
    borderColor: PALETTE.border,
    minHeight: LAYOUT.cardMinHeight,
    justifyContent: 'center',
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardWithCopy: {
    paddingTop: LAYOUT.cardTopWithCopy,
  },
  cardCopyRow: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  copiedLabel: {
    fontSize: FONT.label,
    fontWeight: '600',
    color: PALETTE.accent,
    maxWidth: 80,
  },
  cardCopyBtn: {
    width: LAYOUT.touchTarget,
    height: LAYOUT.touchTarget,
    borderRadius: RADIUS.full,
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
    backgroundColor: 'rgba(47,94,60,0.88)',
  },
  cardTextWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: LAYOUT.btnMinHeight,
    paddingRight: LAYOUT.cardTextRight,
  },
  cardText: {
    fontSize: FONT.bodyLg,
    lineHeight: 30,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardTextPlaceholder: {
    color: PALETTE.textMuted,
    textAlign: 'center',
    fontSize: FONT.body,
  },
  cardTextLoading: {
    fontSize: FONT.bodyLg,
    lineHeight: 30,
    color: '#FFFFFF',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
    fontSize: FONT.caption,
    color: PALETTE.text,
  },
  updateBannerBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    backgroundColor: PALETTE.cta,
    borderRadius: RADIUS.sm,
  },
  updateBannerBtnText: {
    fontSize: FONT.caption,
    fontWeight: '600',
    color: PALETTE.ctaText,
  },
  reviewPrompt: {
    marginTop: SPACING.xl,
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
    gap: SPACING.lg,
  },
  reviewBtn: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: PALETTE.cta,
    borderRadius: RADIUS.sm,
  },
  reviewBtnText: {
    fontSize: FONT.label,
    fontWeight: '600',
    color: PALETTE.ctaText,
  },
  reviewBtnSecondary: {
    paddingVertical: SPACING.md,
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
    marginTop: SPACING.xxl,
    gap: SPACING.xs,
  },
  footerLink: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.sm,
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
