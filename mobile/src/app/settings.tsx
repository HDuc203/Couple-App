import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  User,
  Heart,
  Calendar,
  Sparkles,
  Link,
  Plus,
  Trash2,
  LogOut,
  AlertTriangle,
  Copy,
  Check,
} from 'lucide-react-native';
import { createInviteCode } from '@/lib/invite';

export default function SettingsScreen() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [copied, setCopied] = useState(false);

  // User details
  const [profile, setProfile] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [gender, setGender] = useState('prefer-not-to-say');
  const [birthday, setBirthday] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Couple status
  const [couple, setCouple] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [inviteInput, setInviteInput] = useState('');
  const [loveStartDate, setLoveStartDate] = useState('');

  // Danger zone
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (myProfile) {
        setProfile(myProfile);
        setDisplayName(myProfile.display_name || '');
        setGender(myProfile.gender || 'prefer-not-to-say');
        setBirthday(myProfile.birthday || '');
        setAvatarUrl(myProfile.avatar_url || '');
      }

      // Fetch couple
      const { data: memberData } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData?.couple_id) {
        const { data: coupleDetails } = await supabase
          .from('couples')
          .select('*')
          .eq('id', memberData.couple_id)
          .single();

        if (coupleDetails) {
          setCouple(coupleDetails);
          setLoveStartDate(coupleDetails.love_start_date || '');
        }

        const { data: partnerMember } = await supabase
          .from('couple_members')
          .select('user_id')
          .eq('couple_id', memberData.couple_id)
          .neq('user_id', user.id)
          .maybeSingle();

        if (partnerMember?.user_id) {
          const { data: partnerProfile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerMember.user_id)
            .single();
          if (partnerProfile) setPartner(partnerProfile);
        } else {
          setPartner(null);
        }
      } else {
        // Look if I own an empty couple
        const { data: ownedCouple } = await supabase
          .from('couples')
          .select('*')
          .eq('owner_id', user.id)
          .maybeSingle();
        setCouple(ownedCouple || null);
        setPartner(null);
      }
    } catch (err: any) {
      console.error('Error loading settings data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    // Setup real-time listener for settings updates
    const channel = supabase
      .channel('settings-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_members' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couples' }, () => {
        fetchData();
      })
      .subscribe((status, err) => {
        console.log('[REALTIME] Settings channel status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleUpdateProfile = async () => {
    if (!displayName.trim()) {
      Alert.alert('Thông báo', 'Tên hiển thị không được để trống.');
      return;
    }

    if (birthday) {
      const birthDate = new Date(birthday);
      if (isNaN(birthDate.getTime()) || birthDate > new Date()) {
        Alert.alert('Thông báo', 'Ngày sinh không hợp lệ.');
        return;
      }
    }

    setSavingProfile(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        email: user.email || '',
        display_name: displayName.trim(),
        gender,
        birthday: birthday || null,
        avatar_url: avatarUrl.trim() || null,
        theme_preference: profile?.theme_preference || 'pink',
      }, { onConflict: 'id' });

      if (error) {
        Alert.alert('Lỗi', `Không thể lưu hồ sơ: ${error.message}`);
      } else {
        Alert.alert('Thành công', 'Hồ sơ đã được lưu.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleCreateCouple = async () => {
    setConnecting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const code = createInviteCode();
      const { data: newCouple, error: coupleError } = await supabase
        .from('couples')
        .insert({
          owner_id: user.id,
          invite_code: code,
          love_start_date: loveStartDate || null,
        })
        .select('*')
        .single();

      if (coupleError) {
        Alert.alert('Lỗi', `Không thể tạo mã mời: ${coupleError.message}`);
        return;
      }

      const { error: memberError } = await supabase
        .from('couple_members')
        .insert({
          couple_id: newCouple.id,
          user_id: user.id,
          role: 'owner',
        });

      if (memberError) {
        Alert.alert('Lỗi', `Lỗi thêm thành viên: ${memberError.message}`);
      } else {
        setCouple(newCouple);
        Alert.alert('Mã mời của bạn', `Mã kết nối của bạn là: ${code}`);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleJoinCouple = async () => {
    const code = inviteInput.trim().toUpperCase();
    if (!code) {
      Alert.alert('Thông báo', 'Vui lòng nhập mã của người ấy.');
      return;
    }

    setConnecting(true);
    try {
      const { error } = await supabase.rpc('join_couple_by_invite_code', {
        invite_code_input: code,
      });

      if (error) {
        Alert.alert('Lỗi kết nối', error.message || 'Mã kết nối không hợp lệ.');
      } else {
        setInviteInput('');
        Alert.alert('Thành công', 'Chúc mừng hai bạn đã kết nối thành công!');
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleUpdateLoveStartDate = async () => {
    if (!couple?.id) return;

    if (loveStartDate) {
      const lDate = new Date(loveStartDate);
      if (isNaN(lDate.getTime()) || lDate > new Date()) {
        Alert.alert('Thông báo', 'Ngày kỷ niệm không hợp lệ.');
        return;
      }
    }

    setSavingProfile(true);
    try {
      const { error } = await supabase
        .from('couples')
        .update({
          love_start_date: loveStartDate || null,
        })
        .eq('id', couple.id);

      if (error) {
        Alert.alert('Lỗi', `Không thể lưu ngày yêu: ${error.message}`);
      } else {
        Alert.alert('Thành công', 'Đã cập nhật ngày kỷ niệm.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleDisconnectCouple = async () => {
    Alert.alert(
      'Hủy kết nối',
      'Bạn có chắc chắn muốn hủy kết nối cặp đôi? Tất cả nhật ký, album chung sẽ không hiển thị nữa.',
      [
        { text: 'Quay lại', style: 'cancel' },
        {
          text: 'Hủy kết nối',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!couple?.id) return;
              
              // 1. Delete couple memberships
              const { error: memberDelErr } = await supabase
                .from('couple_members')
                .delete()
                .eq('couple_id', couple.id);

              if (memberDelErr) {
                Alert.alert('Lỗi', memberDelErr.message);
                return;
              }

              // 2. Delete couple record
              await supabase.from('couples').delete().eq('id', couple.id);
              
              setCouple(null);
              setPartner(null);
              Alert.alert('Đã hủy kết nối', 'Hai bạn đã quay về trạng thái độc lập.');
              fetchData();
            } catch (err: any) {
              Alert.alert('Lỗi', err.message);
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'XÓA TÀI KHOẢN') {
      Alert.alert('Thông báo', 'Vui lòng nhập đúng cụm từ "XÓA TÀI KHOẢN"');
      return;
    }

    setDeletingAccount(true);
    try {
      // Call Supabase RPC delete_user_account
      const { error } = await supabase.rpc('delete_user_account');
      if (error) {
        Alert.alert('Lỗi', `Không thể xóa tài khoản: ${error.message}`);
      } else {
        await supabase.auth.signOut();
        Alert.alert('Thành công', 'Tài khoản của bạn đã được xóa.');
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setDeletingAccount(false);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Đăng xuất', 'Bạn có muốn đăng xuất tài khoản?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
        },
      },
    ]);
  };

  const handleCopyCode = async () => {
    if (!couple?.invite_code) return;
    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(couple.invite_code);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a3496d" />
        <Text style={styles.loadingText}>Đang tải cài đặt...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Glow Effects */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        {/* Header Title */}
        <View style={styles.header}>
          <Text style={styles.title}>Cài đặt</Text>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <LogOut size={18} color="#f43f5e" />
            <Text style={styles.signOutBtnText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>

        {/* ───── PROFILE SETTINGS CARD ───── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <User size={18} color="#a3496d" />
            <Text style={styles.cardTitle}>Thông tin cá nhân</Text>
          </View>

          <View style={styles.form}>
            {/* Display name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>TÊN HIỂN THỊ</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Tên hiển thị của bạn"
                placeholderTextColor="#a39480"
                style={styles.input}
              />
            </View>

            {/* Avatar URL */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>AVATAR URL</Text>
              <TextInput
                value={avatarUrl}
                onChangeText={setAvatarUrl}
                placeholder="Đường dẫn ảnh đại diện"
                placeholderTextColor="#a39480"
                style={styles.input}
              />
            </View>

            {/* Birthday */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>NGÀY SINH (YYYY-MM-DD)</Text>
              <TextInput
                value={birthday}
                onChangeText={setBirthday}
                placeholder="Ví dụ: 1999-05-20"
                placeholderTextColor="#a39480"
                style={styles.input}
              />
            </View>

            {/* Gender */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>GIỚI TÍNH</Text>
              <View style={styles.genderRow}>
                {['male', 'female', 'prefer-not-to-say'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    onPress={() => setGender(g)}
                    style={[
                      styles.genderButton,
                      gender === g && styles.activeGenderButton,
                    ]}
                  >
                    <Text style={[styles.genderText, gender === g && styles.activeGenderText]}>
                      {g === 'male' ? 'Nam' : g === 'female' ? 'Nữ' : 'Khác'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Save profile button */}
            <TouchableOpacity
              onPress={handleUpdateProfile}
              disabled={savingProfile}
              style={styles.primaryButton}
            >
              {savingProfile ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.primaryButtonText}>Lưu hồ sơ</Text>
                  <Sparkles size={16} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ───── COUPLE CONNECTION CARD ───── */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Heart size={18} color="#a3496d" />
            <Text style={styles.cardTitle}>Kết nối cặp đôi</Text>
          </View>

          {/* Case 1: Already connected with partner */}
          {couple && partner ? (
            <View style={styles.connectPanel}>
              {/* Partner row */}
              <View style={styles.partnerRow}>
                {partner.avatar_url ? (
                  <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>
                      {(partner.display_name || '?').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partner.display_name}</Text>
                  <Text style={styles.partnerEmail}>{partner.email}</Text>
                </View>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>Đã kết nối</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Love Start Date Editor */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NGÀY BẮT ĐẦU YÊU (YYYY-MM-DD)</Text>
                <View style={styles.dateInputWrapper}>
                  <TextInput
                    value={loveStartDate}
                    onChangeText={setLoveStartDate}
                    placeholder="Ví dụ: 2026-05-21"
                    placeholderTextColor="#a39480"
                    style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  />
                  <TouchableOpacity
                    onPress={handleUpdateLoveStartDate}
                    disabled={savingProfile}
                    style={styles.saveDateBtn}
                  >
                    <Text style={styles.saveDateBtnText}>Cập nhật</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Disconnect button */}
              <TouchableOpacity onPress={handleDisconnectCouple} style={styles.disconnectBtn}>
                <Trash2 size={16} color="#ffffff" />
                <Text style={styles.disconnectBtnText}>Hủy kết nối cặp đôi</Text>
              </TouchableOpacity>
            </View>
          ) : couple && !partner ? (
            /* Case 2: Created couple but partner has not joined yet (showing invite code) */
            <View style={styles.invitePanel}>
              <Text style={styles.inviteLabel}>Gửi mã mời này cho người ấy:</Text>
              <View style={styles.codeContainer}>
                <Text style={styles.inviteCode}>{couple.invite_code}</Text>
                <TouchableOpacity onPress={handleCopyCode} style={styles.copyBtn}>
                  {copied ? <Check size={18} color="#059669" /> : <Copy size={18} color="#8c7e6b" />}
                </TouchableOpacity>
              </View>
              <Text style={styles.inviteHint}>
                Khi người ấy tải ứng dụng và nhập mã này ở màn hình Cài đặt của họ, hai bạn sẽ được kết nối.
              </Text>
              <TouchableOpacity onPress={handleDisconnectCouple} style={styles.disconnectBtn}>
                <Trash2 size={16} color="#ffffff" />
                <Text style={styles.disconnectBtnText}>Hủy mã kết nối này</Text>
              </TouchableOpacity>
            </View>
          ) : (
            /* Case 3: Totally unconnected (show options to create or join) */
            <View style={styles.unconnectedPanel}>
              <Text style={styles.unconnectedText}>
                Kết nối với người ấy để mở khóa các tính năng couple như đếm ngược ngày yêu, nhật ký chung, album ảnh và gửi lời nhắn ngọt ngào.
              </Text>

              {/* Action 1: Create Couple (Get Invite Code) */}
              <View style={styles.unconnectedActionBox}>
                <Text style={styles.actionBoxTitle}>Tùy chọn 1: Bạn là người mời</Text>
                <Text style={styles.actionBoxDesc}>Tạo một không gian đôi mới và nhận mã gửi cho người ấy.</Text>
                <TouchableOpacity
                  onPress={handleCreateCouple}
                  disabled={connecting}
                  style={styles.primaryButton}
                >
                  {connecting ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <Plus size={16} color="#ffffff" />
                      <Text style={styles.primaryButtonText}>Tạo mã mời mới</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              <View style={styles.unconnectedActionBox}>
                <Text style={styles.actionBoxTitle}>Tùy chọn 2: Người ấy gửi mã mời cho bạn</Text>
                <Text style={styles.actionBoxDesc}>Nhập mã kết nối gồm 8 ký tự do người ấy gửi cho bạn.</Text>
                <View style={styles.joinForm}>
                  <TextInput
                    value={inviteInput}
                    onChangeText={setInviteInput}
                    placeholder="MÃ MỜI 8 KÝ TỰ"
                    placeholderTextColor="#a39480"
                    autoCapitalize="characters"
                    style={[styles.input, styles.joinInput]}
                  />
                  <TouchableOpacity
                    onPress={handleJoinCouple}
                    disabled={connecting}
                    style={styles.joinBtn}
                  >
                    {connecting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <View style={styles.buttonContent}>
                        <Link size={16} color="#ffffff" />
                        <Text style={styles.joinBtnText}>Kết nối</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* ───── DANGER ZONE CARD ───── */}
        <View style={[styles.card, styles.dangerCard]}>
          <View style={styles.cardHeader}>
            <AlertTriangle size={18} color="#ef4444" />
            <Text style={[styles.cardTitle, styles.dangerTitle]}>Vùng nguy hiểm</Text>
          </View>
          <Text style={styles.dangerDesc}>
            Xóa tài khoản sẽ xóa vĩnh viễn toàn bộ dữ liệu cá nhân, thông tin kết nối và lịch sử của bạn trên hệ thống. Hành động này không thể hoàn tác.
          </Text>

          {showDeleteConfirm ? (
            <View style={styles.deleteConfirmBox}>
              <Text style={styles.deleteConfirmLabel}>
                Nhập chính xác cụm từ <Text style={styles.boldDangerText}>XÓA TÀI KHOẢN</Text> để xác nhận:
              </Text>
              <TextInput
                value={deleteConfirmText}
                onChangeText={setDeleteConfirmText}
                placeholder="XÓA TÀI KHOẢN"
                placeholderTextColor="#ef444450"
                style={[styles.input, styles.deleteInput]}
              />
              <View style={styles.deleteBtnRow}>
                <TouchableOpacity
                  onPress={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  style={styles.cancelDeleteBtn}
                >
                  <Text style={styles.cancelDeleteText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDeleteAccount}
                  disabled={deletingAccount}
                  style={styles.confirmDeleteBtn}
                >
                  {deletingAccount ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.confirmDeleteText}>Xóa vĩnh viễn</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => setShowDeleteConfirm(true)} style={styles.deleteAccountBtn}>
              <Trash2 size={16} color="#ef4444" />
              <Text style={styles.deleteAccountText}>Xóa tài khoản</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fdfaf2', // Ivory background
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fdfaf2',
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b6571',
    marginTop: 12,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  glowOrb1: {
    position: 'absolute',
    top: -60,
    left: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(163, 73, 109, 0.05)',
  },
  glowOrb2: {
    position: 'absolute',
    top: 400,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(224, 184, 106, 0.06)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#5a4c35',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#ffe4e6',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  signOutBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f43f5e',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    padding: 20,
    marginBottom: 20,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5a4c35',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8c754d',
    letterSpacing: 1,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#3c2a2f',
    backgroundColor: '#fcfbf9',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcfbf9',
  },
  activeGenderButton: {
    backgroundColor: '#fff5f8',
    borderColor: '#a3496d',
  },
  genderText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  activeGenderText: {
    color: '#a3496d',
    fontWeight: '800',
  },
  primaryButton: {
    height: 46,
    backgroundColor: '#a3496d',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a3496d',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  connectPanel: {
    gap: 16,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#a3496d',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff5f8',
    borderWidth: 1,
    borderColor: '#a3496d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#a3496d',
  },
  partnerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3c2a2f',
  },
  partnerEmail: {
    fontSize: 11,
    color: '#8c7e6b',
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  connectedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  divider: {
    height: 1,
    backgroundColor: '#dfd2bb50',
  },
  dateInputWrapper: {
    flexDirection: 'row',
    gap: 8,
  },
  saveDateBtn: {
    width: 80,
    backgroundColor: '#8c754d',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDateBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  disconnectBtn: {
    flexDirection: 'row',
    height: 44,
    backgroundColor: '#8c7e6b',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  disconnectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  invitePanel: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  inviteLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcfaf7',
    borderWidth: 1.5,
    borderColor: '#ebdcb9',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
  },
  inviteCode: {
    fontSize: 26,
    fontWeight: '900',
    color: '#a3496d',
    letterSpacing: 4,
  },
  copyBtn: {
    padding: 4,
  },
  inviteHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b6571',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  unconnectedPanel: {
    gap: 16,
  },
  unconnectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8c7e6b',
    lineHeight: 18,
    textAlign: 'center',
  },
  unconnectedActionBox: {
    backgroundColor: '#fdfcfb',
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 18,
    padding: 16,
    gap: 10,
  },
  actionBoxTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5a4c35',
  },
  actionBoxDesc: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b6571',
    lineHeight: 15,
  },
  joinForm: {
    flexDirection: 'row',
    gap: 8,
  },
  joinInput: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '900',
    letterSpacing: 2,
    fontSize: 14,
  },
  joinBtn: {
    width: 90,
    backgroundColor: '#059669',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  dangerCard: {
    borderColor: '#fca5a5',
    backgroundColor: '#fffafb',
  },
  dangerTitle: {
    color: '#ef4444',
  },
  dangerDesc: {
    fontSize: 11,
    color: '#991b1b',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    height: 44,
    borderWidth: 1,
    borderColor: '#fca5a5',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  deleteAccountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ef4444',
  },
  deleteConfirmBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  deleteConfirmLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f1d1d',
  },
  boldDangerText: {
    fontWeight: '900',
    color: '#ef4444',
  },
  deleteInput: {
    borderColor: '#fca5a5',
    color: '#ef4444',
    fontWeight: '800',
    textAlign: 'center',
  },
  deleteBtnRow: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelDeleteBtn: {
    flex: 1,
    height: 38,
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fcfbf9',
  },
  cancelDeleteText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  confirmDeleteBtn: {
    flex: 1,
    height: 38,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
