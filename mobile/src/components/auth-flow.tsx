import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { supabase } from '@/lib/supabase';
import { Heart, Mail, Lock, Eye, EyeOff, Sparkles } from 'lucide-react-native';

export default function AuthFlow() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';

  const handleAuth = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      Alert.alert('Thông báo', 'Mật khẩu xác nhận không khớp.');
      return;
    }

    if (!isLogin && password.length < 6) {
      Alert.alert('Thông báo', 'Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          Alert.alert('Lỗi đăng nhập', error.message || 'Đăng nhập thất bại.');
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
        });
        if (error) {
          Alert.alert('Lỗi đăng ký', error.message || 'Đăng ký thất bại.');
        } else {
          Alert.alert(
            'Đăng ký thành công',
            'Một liên kết xác nhận đã được gửi về email của bạn. Vui lòng kiểm tra hộp thư để kích hoạt tài khoản.'
          );
          setMode('login');
        }
      }
    } catch (err: any) {
      Alert.alert('Lỗi kết nối', err.message || 'Đã xảy ra lỗi hệ thống.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardContainer}
    >
      {/* 1. Base Ivory/Gold Gradient Background */}
      <View style={styles.backgroundBase} />

      {/* 2. Lotus Illustration Background Image */}
      <Image
        source={require('@/assets/images/lotus_hero_bg.png')}
        style={styles.backgroundImage}
        resizeMode="cover"
      />

      {/* 3. Soft Gold Glow Overlay */}
      <View style={styles.goldGlowOverlay} />

      {/* 4. Seamless Transparent Ivory Overlay */}
      <View style={styles.ivoryOverlay} />

      {/* 5. Twinkling Gold Particles */}
      <View style={styles.particlesContainer} pointerEvents="none">
        {[
          { left: '8%', top: '28%', size: 4 },
          { left: '22%', top: '65%', size: 6 },
          { left: '38%', top: '18%', size: 3 },
          { left: '55%', top: '72%', size: 5 },
          { left: '75%', top: '32%', size: 4 },
          { left: '88%', top: '50%', size: 6 },
        ].map((p, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: p.left as any,
                top: p.top as any,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
              },
            ]}
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Active Form Card */}
        <View style={styles.cardContainer}>
          {/* Header Branding */}
          <View style={styles.logoWrapper}>
            <View style={styles.logoFrame}>
              <Image
                source={require('@/assets/images/couple_app_logo.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.logoText}>COUPLE APP</Text>
            <Text style={styles.tagline}>Không gian hạnh phúc của hai bạn ❤️</Text>
          </View>

          {/* Form Selection Tabs */}
          <View style={styles.tabContainer}>
            <Pressable
              onPress={() => {
                setMode('login');
                setPassword('');
                setConfirmPassword('');
              }}
              style={[styles.tabButton, isLogin && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, isLogin && styles.activeTabText]}>Đăng nhập</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setMode('register');
                setPassword('');
                setConfirmPassword('');
              }}
              style={[styles.tabButton, !isLogin && styles.activeTabButton]}
            >
              <Text style={[styles.tabText, !isLogin && styles.activeTabText]}>Đăng ký</Text>
            </Pressable>
          </View>

          {/* Input Fields */}
          <View style={styles.fieldsContainer}>
            {/* Email field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>EMAIL</Text>
              <View style={styles.inputWrapper}>
                <Mail size={16} color="#8b6571" style={styles.inputIcon} />
                <TextInput
                  placeholder="ten@example.com"
                  placeholderTextColor="#b0a0a5"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.textInput}
                />
              </View>
            </View>

            {/* Password field */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>MẬT KHẨU</Text>
              <View style={styles.inputWrapper}>
                <Lock size={16} color="#8b6571" style={styles.inputIcon} />
                <TextInput
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#b0a0a5"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.textInput}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={16} color="#8b6571" /> : <Eye size={16} color="#8b6571" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password field (Register only) */}
            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>XÁC NHẬN MẬT KHẨU</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={16} color="#8b6571" style={styles.inputIcon} />
                  <TextInput
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#b0a0a5"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                  <TouchableOpacity
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                  >
                    {showConfirmPassword ? <EyeOff size={16} color="#8b6571" /> : <Eye size={16} color="#8b6571" />}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.9}
              style={styles.submitButton}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.submitButtonContent}>
                  <Text style={styles.submitButtonText}>
                    {isLogin ? 'Đăng nhập vào không gian' : 'Tạo tài khoản mới'}
                  </Text>
                  <Sparkles size={16} color="#ffffff" style={styles.sparkleIcon} />
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Footer toggle note */}
          <View style={styles.footerContainer}>
            <TouchableOpacity
              onPress={() => setMode(isLogin ? 'register' : 'login')}
              style={styles.toggleLink}
            >
              <Text style={styles.toggleLinkText}>
                {isLogin ? (
                  <>
                    Chưa có tài khoản? <Text style={styles.accentText}>Đăng ký ngay</Text>
                  </>
                ) : (
                  <>
                    Đã có tài khoản? <Text style={styles.accentText}>Đăng nhập</Text>
                  </>
                )}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  backgroundBase: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fdfaf2', // Base color
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.55, // 55% visibility matching the web app
  },
  goldGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(196, 161, 90, 0.08)', // radial-like gold overlay
  },
  ivoryOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(253, 250, 242, 0.4)', // Ivory translucent screen overlay
  },
  particlesContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  particle: {
    position: 'absolute',
    backgroundColor: '#e0b86a',
    opacity: 0.45,
    shadowColor: '#e0b86a',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  cardContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)', // Near-opaque white card
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(196, 161, 90, 0.45)', // Gold border
    padding: 24,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoFrame: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ebdcb9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  logoImage: {
    width: 44,
    height: 44,
  },
  logoText: {
    fontSize: 16,
    fontFamily: Platform.OS === 'ios' ? 'System' : 'normal',
    fontWeight: '900',
    color: '#5a4c35',
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8c7e6b',
    marginTop: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ebdcb9',
    marginBottom: 24,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderColor: '#a3496d',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#a39480',
  },
  activeTabText: {
    color: '#5a4c35',
  },
  fieldsContainer: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#8c754d',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#1a1a1a',
    height: '100%',
  },
  eyeIcon: {
    padding: 6,
  },
  submitButton: {
    height: 48,
    borderRadius: 16,
    backgroundColor: '#a3496d', // Sweet pink primary color
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#a3496d',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  sparkleIcon: {
    marginLeft: 2,
  },
  footerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  toggleLink: {
    padding: 6,
  },
  toggleLinkText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a39480',
  },
  accentText: {
    color: '#a3496d',
    fontWeight: '800',
  },
});
