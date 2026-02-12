import { useState, useRef } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { StatusBar } from 'expo-status-bar';
import { useFonts, DancingScript_400Regular, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { EXCUSES } from './src/excuses';

const QUICK_OPTIONS = ['Windy', 'Rain', 'Cold', 'Hot'];

function pickRandom() {
  return EXCUSES[Math.floor(Math.random() * EXCUSES.length)];
}

const PLACEHOLDER = 'No excuse yet — tap Generate and we\'ll fix that.';

const LOADING_MESSAGES = [
  'Generating…',
  'Loading…',
  'One moment…',
  'Preparing your excuse…',
  'Please wait…',
  'Almost there…',
];

function pickLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
}

export default function App() {
  const [fontsLoaded] = useFonts({ DancingScript_400Regular, DancingScript_700Bold });
  const [excuse, setExcuse] = useState(null);
  const [quickOption, setQuickOption] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  if (!fontsLoaded) {
    return (
      <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]} />
    );
  }

  const handleGenerate = () => {
    if (isGenerating) return;
    setLoadingMsg(pickLoadingMessage());
    setIsGenerating(true);
    const newExcuse = pickRandom();
    setTimeout(() => {
      setExcuse(newExcuse);
      setIsGenerating(false);
      fadeAnim.setValue(0);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }).start();
    }, 1100);
  };

  const buildDisplayText = () => {
    if (isGenerating) return null;
    if (!excuse) return null;
    const parts = [];
    if (quickOption) parts.push(quickOption + '.');
    parts.push(excuse);
    return parts.join(' ');
  };
  const displayText = buildDisplayText();

  const handleCopy = async () => {
    if (!displayText) return;
    await Clipboard.setStringAsync(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar style="light" />
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Golf Excuse Generator</Text>
            <Text style={styles.subtitle}>Your bad shot deserves a good excuse.</Text>
          </View>

          <ScrollView
            style={styles.cardScroll}
            contentContainerStyle={styles.cardScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={[
              styles.card,
              !displayText && !isGenerating && styles.cardEmpty,
              displayText && styles.cardWithCopy,
            ]}>
              {displayText && (
                <Pressable
                  style={({ pressed }) => [
                    styles.cardCopyBtn,
                    copied && styles.cardCopyBtnCopied,
                    pressed && styles.pressed,
                  ]}
                  onPress={handleCopy}
                  accessibilityLabel="Copy excuse"
                >
                  <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={20} color="#fff" />
                </Pressable>
              )}
              {isGenerating ? (
                <Text style={styles.cardTextLoading}>{loadingMsg}</Text>
              ) : (
                <Animated.Text style={[styles.cardText, !displayText && styles.cardTextPlaceholder, { opacity: fadeAnim }]}>
                  {displayText || PLACEHOLDER}
                </Animated.Text>
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
                  onPress={() => {
                  const next = quickOption === opt ? null : opt;
                  setQuickOption(next);
                  if (next !== quickOption) setExcuse(null);
                }}
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
            >
              <Text style={styles.generateBtnText}>
                {isGenerating ? '…' : 'Generate Excuse'}
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#2d6a2f',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    marginTop: 12,
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontFamily: 'DancingScript_700Bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'DancingScript_400Regular',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginTop: 6,
  },
  pressed: {
    opacity: 0.88,
  },
  inputLabel: {
    fontSize: 15,
    fontFamily: 'DancingScript_400Regular',
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 10,
    textAlign: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 16,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    minHeight: 46,
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: '#1e4d20',
    borderWidth: 2,
    borderColor: '#e6b422',
  },
  chipText: {
    fontSize: 16,
    fontFamily: 'DancingScript_400Regular',
    color: 'rgba(255,255,255,0.95)',
  },
  chipTextActive: {
    color: '#fff',
  },
  bottomBlock: {
    paddingTop: 24,
    paddingBottom: 28,
  },
  generateBtn: {
    backgroundColor: '#e6b422',
    paddingVertical: 20,
    borderRadius: 18,
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 60,
    justifyContent: 'center',
  },
  generateBtnText: {
    fontSize: 22,
    fontFamily: 'DancingScript_700Bold',
    color: '#1a3d1c',
  },
  generateBtnPressed: {
    opacity: 0.82,
  },
  generateBtnBusy: {
    opacity: 0.9,
  },
  cardScroll: {
    flex: 1,
    minHeight: 100,
  },
  cardScrollContent: {
    paddingVertical: 16,
    flexGrow: 1,
    justifyContent: 'center',
  },
  card: {
    backgroundColor: '#1e4d20',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    minHeight: 120,
    justifyContent: 'center',
  },
  cardWithCopy: {
    paddingTop: 42,
  },
  cardCopyBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCopyBtnCopied: {},
  cardEmpty: {
    backgroundColor: 'rgba(30,77,32,0.85)',
  },
  cardText: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'DancingScript_400Regular',
    color: '#fff',
  },
  cardTextPlaceholder: {
    fontFamily: 'DancingScript_400Regular',
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 17,
  },
  cardTextLoading: {
    fontSize: 18,
    lineHeight: 28,
    fontFamily: 'DancingScript_400Regular',
    color: 'rgba(255,255,255,0.95)',
    textAlign: 'center',
  },
});
