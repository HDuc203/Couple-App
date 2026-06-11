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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import { Mail, Send, Heart, Sparkles, MessageCircle } from 'lucide-react-native';

export default function LoveScreen() {
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Send message form state
  const [newNote, setNewNote] = useState('');
  const [sending, setSending] = useState(false);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: myProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (myProfile) setProfile(myProfile);

      const { data: memberData } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData?.couple_id) {
        setCoupleId(memberData.couple_id);

        // Fetch partner user_id
        const { data: partnerMember } = await supabase
          .from('couple_members')
          .select('user_id')
          .eq('couple_id', memberData.couple_id)
          .neq('user_id', user.id)
          .maybeSingle();
        
        if (partnerMember) setPartnerId(partnerMember.user_id);

        // Fetch love notes
        const { data: notesData } = await supabase
          .from('love_notes')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('created_at', { ascending: true }); // chronological order for conversation flow
        setNotes(notesData || []);
      } else {
        setCoupleId(null);
        setPartnerId(null);
        setNotes([]);
      }
    } catch (err) {
      console.error('Error fetching love notes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to love notes database changes in real-time
    const channel = supabase
      .channel('love-notes-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'love_notes' }, () => {
        fetchData();
      })
      .subscribe((status, err) => {
        console.log('[REALTIME] Love channel status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleSendNote = async () => {
    if (!newNote.trim()) return;

    if (!coupleId || !partnerId) {
      Alert.alert('Thông báo', 'Bạn cần kết nối cặp đôi trước khi gửi lời nhắn ngọt ngào.');
      return;
    }

    setSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('love_notes').insert({
        couple_id: coupleId,
        sender_id: user.id,
        receiver_id: partnerId,
        message: newNote.trim(),
      });

      if (error) {
        Alert.alert('Lỗi', `Không thể gửi lời nhắn: ${error.message}`);
      } else {
        setNewNote('');
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSending(false);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a3496d" />
        <Text style={styles.loadingText}>Đang mở hộp thư...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header View */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>HỘP THƯ BÍ MẬT</Text>
          <Text style={styles.headerTitle}>Tình yêu</Text>
        </View>
        <View style={styles.sparkleIcon}>
          <Sparkles size={20} color="#e0b86a" />
        </View>
      </View>

      {!coupleId ? (
        <View style={styles.unconnectedBox}>
          <Mail size={48} color="#a39480" style={styles.unconnectedIcon} />
          <Text style={styles.unconnectedText}>
            Hai bạn chưa kết nối cặp đôi. Hãy vào mục Cài đặt để tạo mã mời hoặc liên kết với người ấy để bắt đầu gửi thư tình ngọt ngào nhé! ✉️
          </Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            ref={(ref) => ref?.scrollToEnd({ animated: true })}
          >
            {notes.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Heart size={48} color="#a39480" style={styles.unconnectedIcon} />
                <Text style={styles.emptyText}>Chưa có bức thư nào trong hộp thư chung.</Text>
                <Text style={styles.emptySubText}>Hãy gửi lời nhắn yêu thương ngọt ngào đầu tiên bên dưới.</Text>
              </View>
            ) : (
              notes.map((note) => {
                const isSentByMe = note.sender_id === profile?.id;
                return (
                  <View
                    key={note.id}
                    style={[
                      styles.noteBubbleContainer,
                      isSentByMe ? styles.myBubbleContainer : styles.partnerBubbleContainer,
                    ]}
                  >
                    <View
                      style={[
                        styles.noteBubble,
                        isSentByMe ? styles.myBubble : styles.partnerBubble,
                      ]}
                    >
                      <Text
                        style={[
                          styles.noteText,
                          isSentByMe ? styles.myNoteText : styles.partnerNoteText,
                        ]}
                      >
                        {note.message}
                      </Text>
                      <Text
                        style={[
                          styles.noteDate,
                          isSentByMe ? styles.myNoteDate : styles.partnerNoteDate,
                        ]}
                      >
                        {formatDate(note.created_at)}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Message input bar */}
          <View style={styles.inputBar}>
            <TextInput
              value={newNote}
              onChangeText={setNewNote}
              placeholder="Nhập lời nhắn ngọt ngào gửi người ấy..."
              placeholderTextColor="#a39480"
              style={styles.textInput}
              multiline
            />
            <TouchableOpacity
              onPress={handleSendNote}
              disabled={sending || !newNote.trim()}
              style={[
                styles.sendBtn,
                (!newNote.trim() || sending) && styles.sendBtnDisabled,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Send size={16} color="#ffffff" />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
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
  sparkleIcon: {
    padding: 6,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'flex-end',
    gap: 12,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#5a4c35',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 11,
    color: '#8c7e6b',
    marginTop: 6,
    textAlign: 'center',
  },
  noteBubbleContainer: {
    flexDirection: 'row',
    width: '100%',
    marginVertical: 4,
  },
  myBubbleContainer: {
    justifyContent: 'flex-end',
  },
  partnerBubbleContainer: {
    justifyContent: 'flex-start',
  },
  noteBubble: {
    maxWidth: '75%',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  myBubble: {
    backgroundColor: '#a3496d',
    borderTopRightRadius: 4,
    borderWidth: 1,
    borderColor: '#913f60',
  },
  partnerBubble: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#dfd2bb',
  },
  noteText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  myNoteText: {
    color: '#ffffff',
  },
  partnerNoteText: {
    color: '#3c2a2f',
  },
  noteDate: {
    fontSize: 9,
    marginTop: 6,
    alignSelf: 'flex-end',
    fontWeight: '600',
  },
  myNoteDate: {
    color: '#fff0f3',
    opacity: 0.8,
  },
  partnerNoteDate: {
    color: '#a39480',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#dfd2bb40',
    backgroundColor: '#ffffff',
    gap: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 13,
    color: '#3c2a2f',
    backgroundColor: '#fcfbf9',
    textAlignVertical: 'center',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#a3496d',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a3496d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  sendBtnDisabled: {
    backgroundColor: '#ebdcb9',
    shadowOpacity: 0,
    elevation: 0,
  },
});
