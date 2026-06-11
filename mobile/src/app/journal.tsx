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
  Modal,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { BookOpen, Plus, Heart, Calendar, Lock, Unlock, Eye, X } from 'lucide-react-native';

export default function JournalScreen() {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [couple, setCouple] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  // New entry modal form state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
      if (myProfile) setProfile(myProfile);

      // Fetch couple_id
      const { data: memberData } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData?.couple_id) {
        setCouple(memberData.couple_id);
        
        // Fetch diary entries
        const { data: diaryData, error: diaryErr } = await supabase
          .from('diary_entries')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('created_at', { ascending: false });

        if (diaryErr) {
          console.error('Error fetching diaries:', diaryErr);
        } else {
          setEntries(diaryData || []);
        }
      } else {
        setCouple(null);
        setEntries([]);
      }
    } catch (err) {
      console.error('Error in journal fetchData:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to diary entries realtime changes
    const channel = supabase
      .channel('journal-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'diary_entries' }, () => {
        fetchData();
      })
      .subscribe((status, err) => {
        console.log('[REALTIME] Journal channel status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleAddEntry = async () => {
    if (!newTitle.trim() || !newContent.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền đầy đủ tiêu đề và nội dung nhật ký.');
      return;
    }

    if (!couple) {
      Alert.alert('Thông báo', 'Bạn cần kết nối cặp đôi trước khi viết nhật ký chung.');
      return;
    }

    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('diary_entries').insert({
        couple_id: couple,
        author_id: user.id,
        title: newTitle.trim(),
        content: newContent.trim(),
        is_private: isPrivate,
      });

      if (error) {
        Alert.alert('Lỗi', `Không thể lưu nhật ký: ${error.message}`);
      } else {
        setNewTitle('');
        setNewContent('');
        setIsPrivate(false);
        setModalVisible(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a3496d" />
        <Text style={styles.loadingText}>Đang tải trang nhật ký...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>KÝ ỨC CỦA CHÚNG TA</Text>
          <Text style={styles.headerTitle}>Nhật ký chung</Text>
        </View>
        {couple && (
          <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addBtn}>
            <Plus size={18} color="#ffffff" />
            <Text style={styles.addBtnText}>Viết nhật ký</Text>
          </TouchableOpacity>
        )}
      </View>

      {!couple ? (
        <View style={styles.unconnectedBox}>
          <BookOpen size={48} color="#a39480" style={styles.unconnectedIcon} />
          <Text style={styles.unconnectedText}>
            Hai bạn chưa kết nối cặp đôi. Hãy vào mục Cài đặt để tạo mã mời hoặc liên kết với người ấy để bắt đầu viết nhật ký chung nhé! 🌸
          </Text>
        </View>
      ) : entries.length === 0 ? (
        <ScrollView contentContainerStyle={styles.emptyContainer}>
          <BookOpen size={48} color="#a39480" style={styles.unconnectedIcon} />
          <Text style={styles.emptyText}>Hành trình chưa ghi lại trang nhật ký nào.</Text>
          <Text style={styles.emptySubText}>Hãy bắt đầu ghi lại những ngày nhỏ bình yên bên nhau.</Text>
          <TouchableOpacity onPress={() => setModalVisible(true)} style={[styles.primaryButton, { marginTop: 20 }]}>
            <Text style={styles.primaryButtonText}>Viết trang nhật ký đầu tiên</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {entries.map((entry) => {
            const isMyEntry = entry.author_id === profile?.id;
            return (
              <View key={entry.id} style={styles.diaryCard}>
                <View style={styles.diaryHeader}>
                  <View style={styles.diaryAuthorTag}>
                    <Heart size={12} color="#a3496d" fill={isMyEntry ? '#a3496d' : 'transparent'} />
                    <Text style={styles.diaryAuthorText}>{isMyEntry ? 'Bạn viết' : 'Người ấy viết'}</Text>
                  </View>
                  <View style={styles.diaryMeta}>
                    {entry.is_private ? (
                      <View style={styles.privateBadge}>
                        <Lock size={10} color="#a3496d" />
                        <Text style={styles.privateBadgeText}>Cá nhân</Text>
                      </View>
                    ) : (
                      <View style={styles.sharedBadge}>
                        <Unlock size={10} color="#059669" />
                        <Text style={styles.sharedBadgeText}>Chung</Text>
                      </View>
                    )}
                  </View>
                </View>

                <Text style={styles.diaryTitle}>{entry.title}</Text>
                <Text style={styles.diaryContent}>{entry.content}</Text>
                
                <View style={styles.diaryFooter}>
                  <Calendar size={12} color="#a39480" />
                  <Text style={styles.diaryDate}>{formatDate(entry.created_at)}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Write New Diary Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Viết nhật ký mới</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#5a4c35" />
              </TouchableOpacity>
            </View>

            {/* Modal Body / Input Form */}
            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TIÊU ĐỀ</Text>
                <TextInput
                  value={newTitle}
                  onChangeText={setNewTitle}
                  placeholder="Hôm nay có gì vui..."
                  placeholderTextColor="#a39480"
                  style={styles.input}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>NỘI DUNG NHẬT KÝ</Text>
                <TextInput
                  value={newContent}
                  onChangeText={setNewContent}
                  placeholder="Kể chi tiết hành trình ngọt ngào hôm nay..."
                  placeholderTextColor="#a39480"
                  multiline
                  numberOfLines={8}
                  style={[styles.input, styles.textArea]}
                />
              </View>

              {/* Private Switch Toggle */}
              <View style={styles.privateToggleRow}>
                <View style={styles.toggleTextCol}>
                  <Text style={styles.toggleTitle}>Nhật ký riêng tư</Text>
                  <Text style={styles.toggleDesc}>
                    Chỉ một mình bạn đọc được. Tắt đi để chia sẻ chung với người ấy.
                  </Text>
                </View>
                <Switch
                  value={isPrivate}
                  onValueChange={setIsPrivate}
                  trackColor={{ false: '#ebdcb9', true: '#a3496d' }}
                  thumbColor="#ffffff"
                />
              </View>
            </ScrollView>

            {/* Modal Footer / Save Action */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleAddEntry}
                disabled={submitting}
                style={styles.primaryButton}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Lưu trang nhật ký</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dfd2bb30',
  },
  headerLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#a3496d',
    letterSpacing: 1.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#5a4c35',
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#a3496d',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  unconnectedBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  unconnectedIcon: {
    marginBottom: 16,
    opacity: 0.7,
  },
  unconnectedText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8c7e6b',
    lineHeight: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#5a4c35',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 12,
    color: '#8c7e6b',
    marginTop: 6,
    textAlign: 'center',
  },
  primaryButton: {
    height: 44,
    backgroundColor: '#a3496d',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  primaryButtonText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  diaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    padding: 18,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 1,
    marginBottom: 16,
  },
  diaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  diaryAuthorTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  diaryAuthorText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#8b6571',
  },
  diaryMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  privateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f8',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  privateBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#a3496d',
  },
  sharedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  sharedBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  diaryTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#3c2a2f',
    marginBottom: 8,
  },
  diaryContent: {
    fontSize: 13,
    fontWeight: '500',
    color: '#554348',
    lineHeight: 18,
    marginBottom: 12,
  },
  diaryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: '#dfd2bb30',
    paddingTop: 10,
  },
  diaryDate: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a39480',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(90, 76, 53, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: '90%',
    padding: 24,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#5a4c35',
  },
  closeBtn: {
    padding: 4,
  },
  modalForm: {
    maxHeight: 400,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 16,
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
  textArea: {
    height: 120,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  privateToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fdfcf9',
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },
  toggleTextCol: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#5a4c35',
  },
  toggleDesc: {
    fontSize: 10,
    color: '#8b6571',
    lineHeight: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  modalFooter: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
});
