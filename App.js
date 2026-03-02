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
  Platform,
  AccessibilityInfo,
  Dimensions,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import * as StoreReview from 'expo-store-review';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  CONFIG,
  PLACEHOLDER,
  LOADING_MESSAGES,
  SPACING,
  RADIUS,
  FONT,
  PALETTE,
  LAYOUT,
} from './src/constants';
import { pickRandom, pickWeighted } from './src/utils';
import { EXCUSES, CATEGORIES } from './src/excuses';
import { Accelerometer } from 'expo-sensors';

const LOGO = require('./assets/logo.png');

// Detect if device is a tablet (iPad)
const { width, height } = Dimensions.get('window');
const isTablet = Math.min(width, height) >= 768;

// Responsive values for tablet vs phone
const responsiveValue = (phoneValue, tabletValue) => isTablet ? tabletValue : phoneValue;

export default function App() {
  const [excuse, setExcuse] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(() => LOADING_MESSAGES?.[0] ?? 'Loading…');
  const [generateCount, setGenerateCount] = useState(0);
  const [showReviewPrompt, setShowReviewPrompt] = useState(false);
  const [hasAskedReview, setHasAskedReview] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloading, setUpdateDownloading] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [isAppReady, setIsAppReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const loadingOpacity = useRef(new Animated.Value(1)).current;
  const splashOpacity = useRef(new Animated.Value(0.5)).current;
  const generateTimeoutRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const seenExcuses = useRef(new Set());

  useEffect(() => {
    const minMs = typeof CONFIG.SPLASH_MIN_MS === 'number' ? CONFIG.SPLASH_MIN_MS : 1000;
    const t = setTimeout(() => setIsAppReady(true), minMs);
    return () => clearTimeout(t);
  }, []);

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

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) return;
    (async () => {
      try {
        const result = await Updates.checkForUpdateAsync();
        if (result?.isAvailable) setUpdateAvailable(true);
      } catch (_) {}
    })();
  }, []);

  useEffect(() => {
    return () => {
      if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => {});
  }, []);

  // Filter excuses by active category
  const filteredExcuses = useMemo(() => {
    if (activeCategory === 'all') return EXCUSES;
    return EXCUSES.filter((e) => e.tags?.includes(activeCategory));
  }, [activeCategory]);

  // Reset seen set when category changes
  useEffect(() => {
    seenExcuses.current.clear();
  }, [activeCategory]);

  const handleGenerate = useCallback(() => {
    if (isGenerating) return;
    if (generateTimeoutRef.current) clearTimeout(generateTimeoutRef.current);
    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (_) {}
    setLoadingMsg((pickRandom(LOADING_MESSAGES) || LOADING_MESSAGES?.[0]) ?? 'Loading…');
    setIsGenerating(true);
    loadingOpacity.setValue(1);
    const picked = pickWeighted(filteredExcuses, seenExcuses.current);
    const newExcuse = typeof picked === 'string' ? picked : picked?.text ?? '';
    const delayMs = typeof CONFIG.GENERATE_DELAY_MS === 'number' ? CONFIG.GENERATE_DELAY_MS : 1100;
    generateTimeoutRef.current = setTimeout(() => {
      generateTimeoutRef.current = null;
      loadingOpacity.setValue(1);
      setExcuse(newExcuse || null);
      setIsGenerating(false);
      setGenerateCount((c) => c + 1);
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
    }, delayMs);
  }, [isGenerating, filteredExcuses]);

  // Ref to latest handleGenerate so shake listener doesn't need to re-subscribe
  const handleGenerateRef = useRef(handleGenerate);
  useEffect(() => { handleGenerateRef.current = handleGenerate; }, [handleGenerate]);

  // Shake-to-generate: listen for accelerometer shakes
  useEffect(() => {
    if (!isAppReady) return;
    let lastShake = 0;
    let sub;
    try {
      Accelerometer.setUpdateInterval(CONFIG.SHAKE_INTERVAL_MS ?? 150);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const force = Math.sqrt(x * x + y * y + z * z);
        const threshold = CONFIG.SHAKE_THRESHOLD ?? 2.5;
        const cooldown = CONFIG.SHAKE_COOLDOWN_MS ?? 1500;
        if (force > threshold && Date.now() - lastShake > cooldown) {
          lastShake = Date.now();
          handleGenerateRef.current();
        }
      });
    } catch (_) {
      // Accelerometer unavailable on this device
    }
    return () => { if (sub) sub.remove(); };
  }, [isAppReady]);

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
  }, [isGenerating, reduceMotion]);

  const displayText = !isGenerating && excuse ? excuse : null;

  const handleCopy = useCallback(async () => {
    if (!displayText) return;
    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    try {
      await Clipboard.setStringAsync(displayText);
      setCopied(true);
      setCopyFailed(false);
      const resetMs = typeof CONFIG.COPY_RESET_MS === 'number' ? CONFIG.COPY_RESET_MS : 1800;
      copyTimeoutRef.current = setTimeout(() => {
        copyTimeoutRef.current = null;
        setCopied(false);
      }, resetMs);
    } catch (_) {
      setCopyFailed(true);
      copyTimeoutRef.current = setTimeout(() => {
        copyTimeoutRef.current = null;
        setCopyFailed(false);
      }, 2000);
    }
  }, [displayText]);

  const getStoreUrl = useCallback(() => {
    const ios = CONFIG.APP_STORE_URL?.trim();
    const android = CONFIG.PLAY_STORE_URL?.trim();
    if (Platform.OS === 'ios' && ios) return ios;
    if (android) return android;
    return ios || android || '';
  }, []);

  const handleRequestReview = useCallback(async () => {
    setShowReviewPrompt(false);
    setHasAskedReview(true);
    try {
      const key = CONFIG.STORAGE_KEY_ASKED_REVIEW;
      if (key && typeof key === 'string') await AsyncStorage.setItem(key, 'true');
      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      } else {
        const url = getStoreUrl();
        if (url) Linking.openURL(url).catch(() => {});
      }
    } catch (_) {}
  }, [getStoreUrl]);

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
    } catch (_) {} finally {
      setUpdateDownloading(false);
    }
  }, []);

  const openStorePage = useCallback(() => {
    const url = getStoreUrl();
    if (url) Linking.openURL(url).catch(() => {});
  }, [getStoreUrl]);

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
        <View style={styles.splashRoot} accessibilityLabel="Loading Bogey Blamer">
          <View style={styles.splashContent}>
            <View style={styles.splashLogoWrap}>
              <Image source={LOGO} style={styles.splashLogo} resizeMode="cover" accessibilityLabel="Bogey Blamer logo" />
            </View>
            <Text style={styles.splashTitle}>
              <Text style={styles.splashTitlePart}>Bogey </Text>
              <Text style={[styles.splashTitlePart, styles.splashTitleAccent]}>Blamer</Text>
            </Text>
            <Text style={styles.splashSubtitle}>Blame it on anything.</Text>
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
              <Image source={LOGO} style={styles.logo} resizeMode="cover" accessibilityLabel="Bogey Blamer logo" />
            </View>
            <Text style={styles.title}>
              <Text style={styles.titlePart}>Bogey </Text>
              <Text style={[styles.titlePart, styles.titleAccent]}>Blamer</Text>
            </Text>
            <Text style={styles.subtitle}>Blame it on anything.</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
            style={styles.pillScroll}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.key}
                style={[styles.pill, activeCategory === cat.key && styles.pillActive]}
                onPress={() => setActiveCategory(cat.key)}
                accessibilityRole="button"
                accessibilityState={{ selected: activeCategory === cat.key }}
                accessibilityLabel={cat.label}
              >
                <Text style={[styles.pillText, activeCategory === cat.key && styles.pillTextActive]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Pressable
              onPress={handleGenerate}
              disabled={isGenerating}
              style={({ pressed }) => [
                styles.card,
                !displayText && !isGenerating && styles.cardEmpty,
                displayText && styles.cardWithCopy,
                pressed && !isGenerating && styles.cardPressed,
              ]}
              accessible
              accessibilityRole="button"
              accessibilityLabel={displayText ? 'Excuse card. Tap for a new excuse.' : 'Tap to get an excuse.'}
            >
              {displayText && (
                <View style={styles.cardCopyRow}>
                  {copied && (
                    <Text style={styles.copiedLabel} accessibilityRole="text">
                      Copied!
                    </Text>
                  )}
                  {copyFailed && (
                    <Text style={styles.copyFailedLabel} accessibilityRole="text">
                      Could not copy
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
                    <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color={PALETTE.text} />
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
            </Pressable>
          </ScrollView>

          <View style={styles.bottomBlock}>
            <Text style={styles.shakeHint}>Shake or tap the card for an excuse</Text>

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
              <Pressable onPress={openStorePage} style={styles.footerLink}>
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
    width: responsiveValue(120, 160),
    height: responsiveValue(120, 160),
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
    width: '120%',
    height: '120%',
  },
  splashTitle: {
    fontSize: responsiveValue(26, 38),
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
    fontSize: responsiveValue(FONT.subtitle, 20),
    lineHeight: responsiveValue(24, 28),
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
    maxWidth: responsiveValue('100%', 680),
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  logoWrap: {
    width: responsiveValue(96, 120),
    height: responsiveValue(96, 120),
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
  },
  logo: {
    width: '120%',
    height: '120%',
  },
  title: {
    fontSize: responsiveValue(FONT.title, 36),
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
    fontSize: responsiveValue(FONT.subtitle, 20),
    lineHeight: responsiveValue(24, 28),
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  pressed: {
    opacity: 0.88,
  },
  pillScroll: {
    flexGrow: 0,
    marginBottom: SPACING.md,
  },
  pillRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  pill: {
    paddingVertical: responsiveValue(SPACING.sm, SPACING.md),
    paddingHorizontal: responsiveValue(SPACING.lg, SPACING.xl),
    borderRadius: RADIUS.full,
    backgroundColor: PALETTE.surface,
    borderWidth: 2,
    borderColor: PALETTE.border,
  },
  pillActive: {
    borderColor: PALETTE.accent,
    borderWidth: 2,
    backgroundColor: PALETTE.surface,
  },
  pillText: {
    fontSize: responsiveValue(FONT.label, 17),
    fontWeight: '600',
    color: PALETTE.textMuted,
  },
  pillTextActive: {
    color: PALETTE.text,
    fontWeight: '700',
  },
  bottomBlock: {
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  shakeHint: {
    fontSize: FONT.caption,
    color: PALETTE.textMuted,
    textAlign: 'center',
    marginBottom: SPACING.sm,
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
    paddingHorizontal: responsiveValue(SPACING.xxl, SPACING.xxxl * 1.5),
    paddingVertical: responsiveValue(SPACING.xxl, SPACING.xxxl * 1.5),
    borderWidth: 2,
    borderColor: PALETTE.border,
    minHeight: responsiveValue(LAYOUT.cardMinHeight, 220),
    justifyContent: 'center',
    shadowColor: PALETTE.shadow,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  cardWithCopy: {
    paddingBottom: 48,
  },
  cardCopyRow: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
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
  copyFailedLabel: {
    fontSize: FONT.caption,
    fontWeight: '600',
    color: PALETTE.error,
    maxWidth: 120,
  },
  cardCopyBtn: {
    width: 36,
    height: 36,
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
    backgroundColor: PALETTE.cardEmptyBg,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  cardTextWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: LAYOUT.btnMinHeight,
  },
  cardText: {
    fontSize: responsiveValue(FONT.bodyLg, 24),
    lineHeight: responsiveValue(30, 36),
    color: PALETTE.text,
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardTextPlaceholder: {
    color: PALETTE.textMuted,
    textAlign: 'center',
    fontSize: responsiveValue(FONT.body, 20),
  },
  cardTextLoading: {
    fontSize: responsiveValue(FONT.bodyLg, 24),
    lineHeight: responsiveValue(30, 36),
    color: PALETTE.text,
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
