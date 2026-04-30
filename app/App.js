import { useState, useRef, useCallback, useMemo, useEffect, Component } from 'react';
import {
  View, Text, Pressable, StyleSheet, Animated, Linking, Platform,
  AccessibilityInfo, Dimensions, Share, Image,
} from 'react-native';
import Svg, { Path, Defs, Filter, FeTurbulence, Rect, G } from 'react-native-svg';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import * as Updates from 'expo-updates';
import { Accelerometer } from 'expo-sensors';
import * as WebBrowser from 'expo-web-browser';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from '@expo-google-fonts/inter';

import { CONFIG, PALETTE, CTA_FIRST, CTA_LABELS } from './src/constants';
import { EXCUSES, getDailyExcuse } from './src/excuses';
import { getExcuseText, pickDifferentWeighted } from './src/utils';
import { getExcuseId } from './src/excuse-ids';
import {
  fetchGeneratedTotal, trackGenerated, voteForExcuse, fetchLeaderboard,
} from './src/api';

const { width: SCREEN_W } = Dimensions.get('window');
const LOGO = require('./assets/logo.png');

// Type-style tokens — match webb/app/globals.css usage of Inter
const F = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semi: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extra: 'Inter_800ExtraBold',
};

function pickRandomLabel(prev) {
  if (CTA_LABELS.length <= 1) return CTA_LABELS[0];
  let next;
  do { next = CTA_LABELS[Math.floor(Math.random() * CTA_LABELS.length)]; } while (next === prev);
  return next;
}

function getExcuseNumber(text) {
  const i = EXCUSES.findIndex((e) => e.text === text);
  return i >= 0 ? i + 1 : null;
}

class ErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: PALETTE.fairway, justifyContent: 'center', alignItems: 'center', padding: 32 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: PALETTE.cream, marginBottom: 8 }}>Something went wrong</Text>
          <Pressable onPress={() => this.setState({ hasError: false })} style={{ backgroundColor: PALETTE.yellow, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 24 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: PALETTE.fairwayDeep }}>Try Again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  });

  if (!fontsLoaded) {
    // Mirror the splash bg so there's no flash
    return <View style={{ flex: 1, backgroundColor: PALETTE.fairway }} />;
  }

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const dailyExcuse = useMemo(() => getDailyExcuse(EXCUSES), []);

  const [excuse, setExcuse] = useState(null);
  const [currentExcuseId, setCurrentExcuseId] = useState(() => getExcuseId(dailyExcuse.text));
  const [vote, setVote] = useState(null);
  const [copied, setCopied] = useState(false);
  const [genCount, setGenCount] = useState(0);
  const [globalTotal, setGlobalTotal] = useState(null);
  const [ctaLabel, setCtaLabel] = useState(CTA_FIRST);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateDownloading, setUpdateDownloading] = useState(false);

  const seenExcuses = useRef(new Set());
  const cardOpacity = useRef(new Animated.Value(1)).current;
  const cardTranslate = useRef(new Animated.Value(0)).current;
  const thumbUpScale = useRef(new Animated.Value(1)).current;
  const thumbDnScale = useRef(new Animated.Value(1)).current;
  const copyTimeout = useRef(null);

  const cardText = excuse || dailyExcuse.text;

  // ── Effects ────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchGeneratedTotal().then((t) => setGlobalTotal(t > 0 ? t : 0)).catch(() => setGlobalTotal(0));
  }, []);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof __DEV__ !== 'undefined' && __DEV__) return;
    (async () => {
      try {
        const r = await Updates.checkForUpdateAsync();
        if (r?.isAvailable) setUpdateAvailable(true);
      } catch {}
    })();
  }, []);

  useEffect(() => () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
  }, []);

  // ── Actions ────────────────────────────────────────────────────────────
  const haptic = useCallback((style) => {
    try {
      if (style === 'light') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      else if (style === 'medium') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      else if (style === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {}
  }, []);

  const handleGenerate = useCallback(() => {
    haptic('medium');
    if (!reduceMotion) {
      Animated.parallel([
        Animated.timing(cardOpacity, { toValue: 0.0, duration: 90, useNativeDriver: true }),
        Animated.timing(cardTranslate, { toValue: -3, duration: 90, useNativeDriver: true }),
      ]).start(() => {
        const picked = pickDifferentWeighted(EXCUSES, cardText, seenExcuses.current);
        const txt = getExcuseText(picked);
        setExcuse(txt);
        setCurrentExcuseId(getExcuseId(txt));
        setVote(null);
        setGenCount((c) => c + 1);
        setCtaLabel((prev) => pickRandomLabel(prev));
        setGlobalTotal((cur) => (cur == null ? cur : cur + 1));
        cardTranslate.setValue(3);
        Animated.parallel([
          Animated.timing(cardOpacity, { toValue: 1, duration: 240, useNativeDriver: true }),
          Animated.timing(cardTranslate, { toValue: 0, duration: 240, useNativeDriver: true }),
        ]).start(() => haptic('success'));
      });
    } else {
      const picked = pickDifferentWeighted(EXCUSES, cardText, seenExcuses.current);
      const txt = getExcuseText(picked);
      setExcuse(txt);
      setCurrentExcuseId(getExcuseId(txt));
      setVote(null);
      setGenCount((c) => c + 1);
      setCtaLabel((prev) => pickRandomLabel(prev));
      setGlobalTotal((cur) => (cur == null ? cur : cur + 1));
    }
    trackGenerated().then((t) => { if (typeof t === 'number' && t > 0) setGlobalTotal(t); });
  }, [cardText, reduceMotion, haptic, cardOpacity, cardTranslate]);

  const genRef = useRef(handleGenerate);
  useEffect(() => { genRef.current = handleGenerate; }, [handleGenerate]);

  // Shake-to-generate
  useEffect(() => {
    let last = 0;
    let sub;
    try {
      Accelerometer.setUpdateInterval(CONFIG.SHAKE_INTERVAL_MS);
      sub = Accelerometer.addListener(({ x, y, z }) => {
        const m = Math.sqrt(x * x + y * y + z * z);
        if (m > CONFIG.SHAKE_THRESHOLD && Date.now() - last > CONFIG.SHAKE_COOLDOWN_MS) {
          last = Date.now();
          genRef.current();
        }
      });
    } catch {}
    return () => { if (sub) sub.remove(); };
  }, []);

  const handleVote = useCallback(async (direction) => {
    haptic('light');
    const scaleAnim = direction === 'up' ? thumbUpScale : thumbDnScale;
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.22, duration: 80, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start();

    setVote((prev) => prev === direction ? null : direction);
    if (currentExcuseId) {
      try {
        const res = await voteForExcuse(currentExcuseId, direction);
        if (res && 'vote' in res) setVote(res.vote);
      } catch {}
    }
  }, [currentExcuseId, haptic, thumbUpScale, thumbDnScale]);

  const excuseNumber = getExcuseNumber(cardText);
  const shareUrl = excuseNumber ? `${CONFIG.WEB_URL}/${excuseNumber}` : CONFIG.WEB_URL;
  const shareTextX = `"${cardText}" — my official ruling on that round.`;
  const redditTitle = `"${cardText}" — Excuse Caddie ruling #${excuseNumber || ''}`.trim();

  const xUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTextX)}&url=${encodeURIComponent(shareUrl)}`;
  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(`"${cardText}"`)}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(redditTitle)}`;

  // Open social share intents inside an in-app Safari View — sidesteps the
  // iOS universal-link redirect that would otherwise yank the user into the
  // Reddit/X/Facebook native app and drop the prefilled text params.
  const openShareIntent = useCallback(async (url) => {
    haptic('light');
    try {
      await WebBrowser.openBrowserAsync(url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: PALETTE.fairwayDeep,
        toolbarColor: PALETTE.cream,
      });
    } catch {
      Linking.openURL(url).catch(() => {});
    }
  }, [haptic]);

  // Platform-specific native share — iOS treats {url, message} as TWO items
  // (some receivers render both = duplicate URL), so we pass only `url` on
  // iOS (sheet auto-builds a rich preview from the page's OG tags) and let
  // Android keep everything in `message` since it ignores the url field.
  const handleNativeShare = useCallback(async () => {
    if (copyTimeout.current) clearTimeout(copyTimeout.current);
    haptic('light');
    try {
      if (Platform.OS === 'ios') {
        await Share.share(
          { url: shareUrl },
          { subject: `"${cardText}" — Excuse Caddie` }
        );
      } else {
        await Share.share({
          message: `"${cardText}" — Excuse Caddie\n${shareUrl}`,
        });
      }
      setCopied(true);
      copyTimeout.current = setTimeout(() => setCopied(false), CONFIG.COPY_RESET_MS);
    } catch {}
  }, [cardText, shareUrl, haptic]);

  const doUpdate = useCallback(async () => {
    setUpdateDownloading(true);
    try { await Updates.fetchUpdateAsync(); await Updates.reloadAsync(); }
    catch {} finally { setUpdateDownloading(false); }
  }, []);

  return (
    <AppShell
      updateAvailable={updateAvailable}
      updateDownloading={updateDownloading}
      doUpdate={doUpdate}
    >
      <View style={$.main}>
        <Image source={LOGO} style={$.logo} resizeMode="contain" accessibilityIgnoresInvertColors />
        <Text style={$.wordmark}>Excuse Caddie</Text>

        <View style={$.counterRow}>
          <CountUp value={globalTotal ?? 0} style={$.counterNum} duration={650} />
          <Text style={$.counterLabel}>ALIBIS ON THE CARD</Text>
        </View>

        <View style={$.panelWrap}>
          <View style={$.panel}>
            {/* Cream paper grain overlay (matches webb's feTurbulence noise) */}
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <PaperGrain />
            </View>
            <Animated.Text
              key={genCount}
              style={[$.cardText, {
                opacity: cardOpacity,
                transform: [{ translateY: cardTranslate }],
              }]}
            >
              {cardText}
            </Animated.Text>
          </View>

          <View style={$.thumbsRow} pointerEvents="box-none">
            <ThumbButton
              direction="down"
              active={vote === 'down'}
              scale={thumbDnScale}
              onPress={() => handleVote('down')}
            />
            <ThumbButton
              direction="up"
              active={vote === 'up'}
              scale={thumbUpScale}
              onPress={() => handleVote('up')}
            />
          </View>
        </View>

        <CTAButton label={ctaLabel} onPress={handleGenerate} />

        <View style={$.shareRow}>
          <SharePill bg={PALETTE.orange} label="Reddit" icon={<RedditIcon />} onPress={() => openShareIntent(redditUrl)} />
          <SharePill bg={PALETTE.black} label="X" icon={<XIcon />} onPress={() => openShareIntent(xUrl)} />
          <SharePill bg={PALETTE.blue} label="Facebook" icon={<FbIcon />} onPress={() => openShareIntent(fbUrl)} />
          <SharePill
            bg={PALETTE.red}
            label={copied ? 'Pocketed' : 'Share'}
            icon={copied ? <CheckIcon /> : <ShareIcon />}
            onPress={handleNativeShare}
          />
        </View>
      </View>

      <Footer />
    </AppShell>
  );
}

// ── AppShell ───────────────────────────────────────────────────────────
// Wraps the screen so the dark fairway-deep band of the ticker extends
// all the way up through the status bar / notch area.
function AppShell({ children, updateAvailable, updateDownloading, doUpdate }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={$.root}>
      <StatusBar style="light" />

      <View style={[$.tickerWrap, { paddingTop: insets.top }]}>
        {updateAvailable && (
          <Pressable onPress={doUpdate} disabled={updateDownloading} style={$.updateBanner}>
            <Text style={$.updateText}>
              {updateDownloading ? 'Installing…' : 'Update available — tap to install'}
            </Text>
          </Pressable>
        )}
        <TopTicker />
      </View>

      <View style={[$.body, { paddingLeft: insets.left, paddingRight: insets.right }]}>
        {children}
      </View>
    </View>
  );
}

// ── CountUp ────────────────────────────────────────────────────────────
function CountUp({ value, duration = 650, style }) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);
  const startRef = useRef(0);
  const rafRef = useRef(null);

  useEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    fromRef.current = display;
    startRef.current = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startRef.current;
      const t = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out cubic
      const next = Math.round(fromRef.current + (value - fromRef.current) * eased);
      setDisplay(next);
      if (t < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, duration]);

  return <Text style={style}>{display.toLocaleString('en-US')}</Text>;
}

// ── PaperGrain (SVG noise overlay) ────────────────────────────────────
function PaperGrain() {
  return (
    <Svg style={StyleSheet.absoluteFill} preserveAspectRatio="none" opacity={0.08}>
      <Defs>
        <Filter id="grain" x="0" y="0" width="100%" height="100%">
          <FeTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        </Filter>
      </Defs>
      <G>
        <Rect width="100%" height="100%" fill="#000" filter="url(#grain)" />
      </G>
    </Svg>
  );
}

// ── TopTicker ──────────────────────────────────────────────────────────
function TopTicker() {
  const [items, setItems] = useState(null);
  const [trackWidth, setTrackWidth] = useState(0);
  const translate = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    fetchLeaderboard('all')
      .then((rows) => setItems((rows || []).slice(0, 20)))
      .catch(() => setItems([]));
  }, []);

  // Animate ticker once we know real width — ~65 px/sec (matches the web)
  useEffect(() => {
    if (!items || items.length === 0 || trackWidth === 0) return;
    translate.setValue(0);
    const duration = Math.max(6000, (trackWidth / 65) * 1000);
    const loop = Animated.loop(
      Animated.timing(translate, {
        toValue: 1,
        duration,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [items, trackWidth, translate]);

  return (
    <View style={$.ticker}>
      {items === null ? (
        <Text style={$.tickerLoading}>Loading…</Text>
      ) : items.length === 0 ? (
        <View style={$.tickerEmpty}>
          <ThumbsUpInline color={PALETTE.cream} size={11} />
          <Text style={$.tickerEmptyText}>Be the first to vote</Text>
        </View>
      ) : (
        <View style={$.tickerMask}>
          <Animated.View
            style={[
              $.tickerRow,
              {
                transform: [{
                  translateX: translate.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -trackWidth],
                  }),
                }],
              },
            ]}
          >
            {/* First copy — measured */}
            <View
              style={$.tickerCopy}
              onLayout={(e) => {
                const w = e.nativeEvent.layout.width;
                if (w && Math.abs(w - trackWidth) > 1) setTrackWidth(w);
              }}
            >
              {items.map((item, idx) => (
                <TickerItem key={`a-${item.id}-${idx}`} item={item} rank={idx + 1} />
              ))}
            </View>
            {/* Second copy — invisible to onLayout, just for seamless loop */}
            <View style={$.tickerCopy}>
              {items.map((item, idx) => (
                <TickerItem key={`b-${item.id}-${idx}`} item={item} rank={idx + 1} />
              ))}
            </View>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function TickerItem({ item, rank }) {
  return (
    <View style={$.tickerItem}>
      <Text style={$.tickerRank}>#{rank}</Text>
      <Text style={$.tickerText} numberOfLines={1}>{item.text}</Text>
      <View style={$.tickerVotes}>
        <ThumbsUpInline color="rgba(245,241,232,0.7)" size={10} />
        <Text style={$.tickerVoteNum}>{item.votes}</Text>
      </View>
      <Text style={$.tickerDot}>·</Text>
    </View>
  );
}

// ── CTAButton ──────────────────────────────────────────────────────────
function CTAButton({ label, onPress }) {
  // Two-layer approach to fake CSS inset shadow: outer = darker base,
  // inner = lighter on top, offset 3px → reveals dark "lip" at the bottom.
  const [pressed, setPressed] = useState(false);
  return (
    <Pressable
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={$.ctaOuter}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={[$.ctaInner, pressed && $.ctaInnerPressed]}>
        <Text style={$.ctaLabel}>{label.toUpperCase()}</Text>
      </View>
    </Pressable>
  );
}

// ── ThumbButton ────────────────────────────────────────────────────────
function ThumbButton({ direction, active, scale, onPress }) {
  const isUp = direction === 'up';
  const baseColor = isUp ? PALETTE.green : PALETTE.red;
  const bg = active ? baseColor : mix(baseColor, '#FFFFFF', 0.62);
  const fg = active ? '#FFFFFF' : mix(baseColor, PALETTE.ink, 0.15);

  return (
    <Pressable
      onPress={onPress}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={isUp ? 'Pure' : 'Shanked'}
      accessibilityState={{ selected: !!active }}
      style={({ pressed }) => [
        $.thumb,
        { backgroundColor: bg, borderColor: active ? 'transparent' : 'rgba(26,25,22,0.16)' },
        pressed && $.thumbPressed,
      ]}
    >
      <Animated.View style={{ transform: [{ scale }, { rotate: isUp ? '0deg' : '180deg' }] }}>
        <ThumbIcon color={fg} />
      </Animated.View>
    </Pressable>
  );
}

// ── SharePill ──────────────────────────────────────────────────────────
function SharePill({ bg, label, icon, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        $.pill,
        { backgroundColor: bg },
        pressed && $.pillPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={$.pillInner}>
        {icon}
        <Text style={$.pillLabel}>{label}</Text>
      </View>
    </Pressable>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────
function Footer() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[$.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <Pressable onPress={() => Linking.openURL(CONFIG.GITHUB_URL).catch(() => {})} style={$.footerLink}>
        <GitHubIcon />
        <Text style={$.footerText}>GitHub</Text>
      </Pressable>
      <Text style={$.footerDot}>·</Text>
      <Pressable onPress={() => Linking.openURL(CONFIG.BMC_URL).catch(() => {})} style={$.footerLink}>
        <CoffeeIcon />
        <Text style={[$.footerText, { color: PALETTE.yellow }]}>Tip the caddie</Text>
      </Pressable>
    </View>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────
function mix(hex1, hex2, t) {
  const a = hexToRgb(hex1), b = hexToRgb(hex2);
  const r = Math.round(a.r * t + b.r * (1 - t));
  const g = Math.round(a.g * t + b.g * (1 - t));
  const bl = Math.round(a.b * t + b.b * (1 - t));
  return `rgb(${r},${g},${bl})`;
}
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

// ── Icons (SVG) ────────────────────────────────────────────────────────
function ThumbIcon({ color = '#fff', size = 16 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M2 11v9a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-9a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1zm20.5-1.5h-6.65l.6-3.16c.04-.21.06-.42.06-.64 0-.4-.16-.78-.44-1.06L15.17 4l-6.59 6.59c-.36.36-.58.86-.58 1.41v8c0 1.1.9 2 2 2h8.51c.71 0 1.37-.39 1.71-1.02l3.18-7.42c.07-.16.1-.34.1-.52v-1.96c0-.83-.67-1.5-1.5-1.5z"
      />
    </Svg>
  );
}
function ThumbsUpInline({ color = '#fff', size = 11 }) {
  return <ThumbIcon color={color} size={size} />;
}
function RedditIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path fill="#fff" d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </Svg>
  );
}
function XIcon() {
  return (
    <Svg width={12} height={12} viewBox="0 0 24 24">
      <Path fill="#fff" d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </Svg>
  );
}
function FbIcon() {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24">
      <Path fill="#fff" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </Svg>
  );
}
function ShareIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M4 12v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-7M16 6L12 2M12 2L8 6M12 2v13"
        stroke="#fff" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}
function CheckIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path d="M20 6L9 17l-5-5" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}
function GitHubIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path fill="rgba(245,241,232,0.85)" d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </Svg>
  );
}
function CoffeeIcon() {
  return (
    <Svg width={13} height={13} viewBox="0 0 24 24">
      <Path
        d="M18 8h1a4 4 0 0 1 0 8h-1M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8zM6 2v2M10 2v2M14 2v2"
        stroke={PALETTE.yellow} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none"
      />
    </Svg>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────
const $ = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: PALETTE.fairway,
  },
  tickerWrap: {
    backgroundColor: PALETTE.fairwayDeep,
  },
  body: {
    flex: 1,
  },

  updateBanner: {
    backgroundColor: PALETTE.green,
    paddingVertical: 8,
    alignItems: 'center',
  },
  updateText: { fontSize: 13, color: '#fff', fontWeight: '600', fontFamily: F.semi },

  // Top ticker
  ticker: {
    backgroundColor: PALETTE.fairwayDeep,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    overflow: 'hidden',
    minHeight: 36,
    justifyContent: 'center',
  },
  tickerLoading: { color: 'rgba(245,241,232,0.6)', fontSize: 11, textAlign: 'center', fontFamily: F.medium },
  tickerEmpty: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  tickerEmptyText: { color: 'rgba(245,241,232,0.75)', fontSize: 12, fontFamily: F.medium },
  tickerMask: { overflow: 'hidden' },
  tickerRow: { flexDirection: 'row', alignItems: 'center' },
  tickerCopy: { flexDirection: 'row', alignItems: 'center' },
  tickerItem: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 10 },
  tickerRank: { color: PALETTE.yellow, fontSize: 12, fontFamily: F.bold },
  tickerText: { color: 'rgba(245,241,232,0.95)', fontSize: 12, fontFamily: F.medium, maxWidth: 240 },
  tickerVotes: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  tickerVoteNum: { color: 'rgba(245,241,232,0.7)', fontSize: 12, fontFamily: F.medium, fontVariant: ['tabular-nums'] },
  tickerDot: { color: 'rgba(245,241,232,0.2)', fontSize: 14, paddingHorizontal: 4 },

  // Main column
  main: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 640,
    alignSelf: 'center',
    width: '100%',
  },

  logo: {
    width: 64,
    height: 64,
    marginBottom: 10,
  },
  wordmark: {
    fontSize: 36,
    lineHeight: 36,
    color: PALETTE.cream,
    letterSpacing: -1.2,
    textAlign: 'center',
    fontFamily: F.extra,
  },

  counterRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  counterNum: {
    color: PALETTE.yellow,
    fontSize: 18,
    fontFamily: F.bold,
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.2,
  },
  counterLabel: {
    color: 'rgba(245,241,232,0.55)',
    fontSize: 11,
    fontFamily: F.semi,
    letterSpacing: 2.0,
  },

  // Excuse panel
  panelWrap: {
    width: '100%',
    marginTop: 22,
    position: 'relative',
  },
  panel: {
    backgroundColor: PALETTE.panelCream,
    borderRadius: 18,
    paddingHorizontal: 26,
    paddingVertical: 32,
    minHeight: 160,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(26,25,22,0.10)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 10,
  },
  cardText: {
    color: PALETTE.ink,
    fontSize: 22,
    lineHeight: 30,
    fontFamily: F.bold,
    textAlign: 'center',
    letterSpacing: -0.2,
  },

  thumbsRow: {
    position: 'absolute',
    top: -16,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  thumbPressed: { transform: [{ translateY: 2 }] },

  // CTA — two-layer to fake the inset bottom shadow
  ctaOuter: {
    marginTop: 22,
    width: '100%',
    backgroundColor: PALETTE.yellowDark,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 16,
    elevation: 10,
  },
  ctaInner: {
    backgroundColor: PALETTE.yellow,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaInnerPressed: {
    marginBottom: 0,
    marginTop: 3,
    paddingVertical: 16,
  },
  ctaLabel: {
    color: PALETTE.fairwayDeep,
    fontSize: 15,
    fontFamily: F.extra,
    letterSpacing: 1.6,
  },

  // Share row
  shareRow: {
    marginTop: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
    borderBottomWidth: 2,
    borderBottomColor: 'rgba(0,0,0,0.22)',
  },
  pillPressed: { transform: [{ translateY: 1 }], borderBottomWidth: 1 },
  pillInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pillLabel: { color: '#fff', fontSize: 13, fontFamily: F.bold },

  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  footerLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: 'rgba(245,241,232,0.85)', fontSize: 12, fontFamily: F.bold },
  footerDot: { color: 'rgba(245,241,232,0.4)', fontSize: 14 },
});
