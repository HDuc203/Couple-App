import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import {
  Heart,
  Calendar,
  Sparkles,
  Settings,
  Smile,
  Mail,
  BookOpen,
  Plus,
  Cake,
  CalendarDays,
  Droplet,
  HeartHandshake,
  AlertCircle,
  X,
  Send,
  MessageCircle,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');

const MOODS = [
  { key: 'Vui', emoji: '😊', label: 'Vui', color: '#ffd56b', supportText: 'Thật tuyệt khi thấy người ấy đang vui vẻ hôm nay! 🥰' },
  { key: 'Yêu', emoji: '🥰', label: 'Yêu', color: '#ff8da1', supportText: 'Không gian của hai bạn đang ngập tràn mật ngọt yêu đương! 🌸' },
  { key: 'Mệt', emoji: '😴', label: 'Mệt', color: '#a3b7f9', supportText: 'Người ấy hôm nay hơi mệt mỏi... Gửi một cái ôm vỗ về nhé 🫂' },
  { key: 'Buồn', emoji: '😔', label: 'Buồn', color: '#8ca2c4', supportText: 'Có vẻ người ấy đang có chút tâm sự buồn. Hãy lắng nghe họ nhé ❤️' },
  { key: 'Cáu', emoji: '😡', label: 'Cáu', color: '#fca5a5', supportText: 'Người ấy hôm nay có chút cáu kỉnh. Hãy dành sự dịu dàng xoa dịu họ 🫂' },
  { key: 'Nhớ', emoji: '❤️', label: 'Nhớ', color: '#fcd3de', supportText: 'Người ấy đang rất nhớ bạn! Gửi lời nhắn đáp lại ngay nào 💬' },
  { key: 'Stress', emoji: '😵', label: 'Stress', color: '#e9d5ff', supportText: 'Người ấy đang bị căng thẳng áp lực. Hãy khích lệ họ nhé ☕' },
];

function formatDate(value: string | null) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));
}

function formatMoodTime(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${hours}:${minutes} ${day}/${month}/${year}`;
}

function daysTogether(startDate: string | null) {
  if (!startDate) return null;
  const start = new Date(`${startDate}T00:00:00`);
  const diff = Date.now() - start.getTime();
  return Math.max(1, Math.floor(diff / 86_400_000) + 1);
}

function daysUntilBirthday(birthdayStr: string | null) {
  if (!birthdayStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const bdate = new Date(birthdayStr);
  const nextBirth = new Date(today.getFullYear(), bdate.getMonth(), bdate.getDate());
  if (nextBirth < today) nextBirth.setFullYear(today.getFullYear() + 1);
  const diff = nextBirth.getTime() - today.getTime();
  return Math.ceil(diff / 86_400_000);
}

function getNextSpecialDate(dates: any[]) {
  if (!dates || dates.length === 0) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parsed = dates.map((d) => {
    const nextOccur = new Date(d.date);
    if (d.repeat_yearly) {
      nextOccur.setFullYear(today.getFullYear());
      if (nextOccur < today) nextOccur.setFullYear(today.getFullYear() + 1);
    }
    return { ...d, nextOccur };
  });

  parsed.sort((a, b) => a.nextOccur.getTime() - b.nextOccur.getTime());
  const upcoming = parsed.find((p) => p.nextOccur >= today);
  if (!upcoming) return null;

  const diff = upcoming.nextOccur.getTime() - today.getTime();
  return { ...upcoming, daysLeft: Math.ceil(diff / 86_400_000) };
}

function getPeriodStatus(
  logs: any[],
  myId: string,
  partnerId: string | undefined,
  partnerName: string,
  profile: any,
  partnerProfile: any
) {
  const showMyPeriod = profile?.gender === 'female' || profile?.period_tracking_enabled === true;
  const showPartnerPeriod = partnerProfile
    ? (partnerProfile.gender === 'female' || partnerProfile.period_tracking_enabled === true)
    : false;

  if (!showMyPeriod && !showPartnerPeriod) {
    return null;
  }

  const myLog = showMyPeriod ? logs.find((l) => l.user_id === myId) : null;
  const partnerLog = (partnerId && showPartnerPeriod)
    ? logs.find((l) => l.user_id === partnerId && l.share_with_partner)
    : null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (myLog) {
    const lastDate = new Date(myLog.last_period_date);
    const cycle = myLog.cycle_length || 28;
    const len = myLog.period_length || 5;

    let nextStart = new Date(lastDate);
    while (nextStart < today) {
      nextStart.setTime(nextStart.getTime() + cycle * 86_400_000);
    }

    const diffDays = Math.ceil((nextStart.getTime() - today.getTime()) / 86_400_000);

    for (let i = -1; i < 3; i++) {
      const pStart = new Date(lastDate.getTime() + i * cycle * 86_400_000);
      const pEnd = new Date(pStart.getTime() + len * 86_400_000);
      if (today >= pStart && today < pEnd) {
        return { status: 'active', daysLeft: 0, message: 'Đang trong chu kỳ 🌸', subMessage: 'Hãy nghỉ ngơi nhé! 🍵' };
      }
    }

    return { status: 'predicted', daysLeft: diffDays, message: `Còn ${diffDays} ngày tới kỳ 🌸`, subMessage: `Dự báo: ${nextStart.toLocaleDateString('vi-VN')}` };
  }

  if (partnerLog) {
    const lastDate = new Date(partnerLog.last_period_date);
    const cycle = partnerLog.cycle_length || 28;
    let nextStart = new Date(lastDate);
    while (nextStart < today) {
      nextStart.setTime(nextStart.getTime() + cycle * 86_400_000);
    }
    const diffDays = Math.ceil((nextStart.getTime() - today.getTime()) / 86_400_000);

    if (diffDays <= 4 && diffDays >= 0) {
      return { status: 'partner-near', daysLeft: diffDays, message: `Kỳ dâu của ${partnerName} sắp tới`, subMessage: `🌸 Còn ${diffDays} ngày. Hãy ngọt ngào nhé! 🫂` };
    }
    return { status: 'partner-shared', daysLeft: diffDays, message: `Dự báo chu kỳ của ${partnerName}`, subMessage: 'Đang kết nối bảo mật nhẹ nhàng.' };
  }

  return { status: 'not-setup', daysLeft: 0, message: '', subMessage: '' };
}

function CountdownRing({
  days,
  maxDays = 30,
  color = '#a3496d',
}: {
  days: number;
  maxDays?: number;
  color?: string;
}) {
  return (
    <View style={[styles.ringBadge, { borderColor: color }]}>
      <Text style={[styles.ringDaysText, { color }]}>{days}</Text>
      <Text style={styles.ringDaysSubText}>ngày</Text>
    </View>
  );
}

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [myMood, setMyMood] = useState<string | null>(null);
  const [myMoodNote, setMyMoodNote] = useState<string | null>(null);
  const [partnerMood, setPartnerMood] = useState<string | null>(null);
  const [partnerMoodNote, setPartnerMoodNote] = useState<string | null>(null);
  const [submittingMood, setSubmittingMood] = useState(false);
  const [notification, setNotification] = useState<{ message: string; emoji: string } | null>(null);

  const [selectedMoodKey, setSelectedMoodKey] = useState<string | null>(null);
  const [note, setNote] = useState<string>('');
  const [showNoteInput, setShowNoteInput] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [reactionNote, setReactionNote] = useState<string>('');
  const [reactionSuccess, setReactionSuccess] = useState<'hug' | 'care' | 'chat' | null>(null);
  const [myMoodTime, setMyMoodTime] = useState<string | null>(null);
  const [partnerMoodTime, setPartnerMoodTime] = useState<string | null>(null);

  // Missing features state
  const [latestLoveNote, setLatestLoveNote] = useState<any>(null);
  const [notebookNotes, setNotebookNotes] = useState<any[]>([]);
  const [specialDates, setSpecialDates] = useState<any[]>([]);
  const [periodLogs, setPeriodLogs] = useState<any[]>([]);

  const partnerRef = useRef<any>(null);
  useEffect(() => {
    partnerRef.current = partner;
  }, [partner]);

  const profileRef = useRef<any>(null);
  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch my profile
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (myProfile) setProfile(myProfile);

      // 2. Fetch my couple membership
      const { data: memberData } = await supabase
        .from('couple_members')
        .select('couple_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (memberData?.couple_id) {
        // Fetch couple details (anniversary / start date)
        const { data: coupleDetails } = await supabase
          .from('couples')
          .select('*')
          .eq('id', memberData.couple_id)
          .single();
        if (coupleDetails) setCouple(coupleDetails);

        // 3. Fetch partner profile
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

          // 4. Fetch partner's mood of the day
          const todayStr = new Date().toISOString().split('T')[0];
          const { data: pMood } = await supabase
            .from('mood_logs')
            .select('*')
            .eq('user_id', partnerMember.user_id)
            .eq('date_key', todayStr)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          if (pMood) {
            setPartnerMood(pMood.mood);
            setPartnerMoodNote(pMood.note);
            setPartnerMoodTime(pMood.created_at);
          } else {
            setPartnerMood(null);
            setPartnerMoodNote(null);
            setPartnerMoodTime(null);
          }
        }

        // 5. Fetch Notebook Space (Habits / Likes / Gift sizes)
        const { data: notes } = await supabase
          .from('partner_notes')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('created_at', { ascending: false })
          .limit(5);
        if (notes) setNotebookNotes(notes);

        // 6. Fetch Love Notes
        const { data: loveNote } = await supabase
          .from('love_notes')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        setLatestLoveNote(loveNote || null);

        // 7. Fetch Special Dates
        const { data: dates } = await supabase
          .from('special_dates')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('date', { ascending: true });
        if (dates) setSpecialDates(dates);

        // 8. Fetch Period configuration (For me & partner)
        const { data: periods } = await supabase
          .from('period_tracking')
          .select('*')
          .or(`user_id.eq.${user.id},user_id.eq.${partnerMember?.user_id || user.id}`);
        if (periods) setPeriodLogs(periods);
      }

      // 9. Fetch my mood of the day
      const todayStr = new Date().toISOString().split('T')[0];
      const { data: mMood } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user.id)
        .eq('date_key', todayStr)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (mMood) {
        setMyMood(mMood.mood);
        setMyMoodNote(mMood.note);
        setMyMoodTime(mMood.created_at);
      } else {
        setMyMood(null);
        setMyMoodNote(null);
        setMyMoodTime(null);
      }

    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to realtime database changes (realtime syncing connection & updates)
    const channel = supabase
      .channel('schema-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'mood_logs' }, (payload: any) => {
        fetchData();

        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newMood = payload.new;
          const currentPartner = partnerRef.current;
          const currentProfile = profileRef.current;
          if (currentPartner && newMood.user_id === currentPartner.id) {
            const foundMood = MOODS.find((m) => m.key === newMood.mood);
            const emoji = foundMood?.emoji || '😊';
            const label = foundMood?.label || newMood.mood;
            const noteText = newMood.note ? `: "${newMood.note}"` : '';
            
            // Cập nhật state ngay lập tức để đồng bộ nhanh không phụ thuộc độ trễ mạng
            setPartnerMood(newMood.mood);
            setPartnerMoodNote(newMood.note);
            setPartnerMoodTime(newMood.created_at);

            setNotification({
              message: `${currentPartner.display_name} vừa cập nhật tâm trạng mới: ${emoji} ${label}${noteText}`,
              emoji,
            });
          } else if (currentProfile && newMood.user_id === currentProfile.id) {
            setMyMood(newMood.mood);
            setMyMoodNote(newMood.note);
            setMyMoodTime(newMood.created_at);
          }
        } else if (payload.eventType === 'DELETE') {
          const oldMood = payload.old;
          const currentPartner = partnerRef.current;
          const currentProfile = profileRef.current;
          if (currentPartner && oldMood.user_id === currentPartner.id) {
            setPartnerMood(null);
            setPartnerMoodNote(null);
            setPartnerMoodTime(null);
          } else if (currentProfile && oldMood.user_id === currentProfile.id) {
            setMyMood(null);
            setMyMoodNote(null);
            setMyMoodTime(null);
          }
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'couple_members' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'love_notes' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_notes' }, () => {
        fetchData();
      })
      .subscribe((status, err) => {
        console.log('[REALTIME] Home channel status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleSelectMood = (moodKey: string) => {
    setSelectedMoodKey(moodKey);
    setShowNoteInput(true);
  };

  const handleSaveMood = async () => {
    if (!selectedMoodKey) return;
    setSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const todayStr = new Date().toISOString().split('T')[0];

      const { error } = await supabase.from('mood_logs').upsert({
        user_id: user.id,
        couple_id: couple?.id || null,
        mood: selectedMoodKey,
        note: note.trim() || null,
        date_key: todayStr,
      }, { onConflict: 'user_id,couple_id,date_key' });

      if (error) {
        setSaveStatus('error');
        Alert.alert('Lỗi', 'Không thể cập nhật tâm trạng của bạn.');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('success');
        setMyMood(selectedMoodKey);
        setMyMoodNote(note.trim() || null);
        setMyMoodTime(new Date().toISOString());
        setTimeout(() => {
          setSaveStatus('idle');
          setShowNoteInput(false);
          setNote('');
          setSelectedMoodKey(null);
        }, 1200);
      }
    } catch (err: any) {
      setSaveStatus('error');
      Alert.alert('Lỗi', err.message);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleReaction = async (type: 'hug' | 'care' | 'chat') => {
    if (!couple?.id || !partner) return;
    setReactionSuccess(type);

    const partnerMoodConfig = MOODS.find((m) => m.key === partnerMood);
    const partnerMoodDisplay = partnerMoodConfig
      ? `${partnerMoodConfig.emoji} ${partnerMoodConfig.label}`
      : partnerMood || 'Bình thường';

    let message = '';
    const myName = profile?.display_name || 'Bạn';

    if (type === 'hug') {
      message = `🫂 ${myName} đã phản hồi tâm trạng "${partnerMoodDisplay}" của bạn bằng một cái ôm thật ấm áp!`;
      if (reactionNote.trim()) message += ` Lời nhắn: "${reactionNote.trim()}"`;
    } else if (type === 'care') {
      message = `❤️ ${myName} đang bày tỏ sự quan tâm đặc biệt phản hồi tâm trạng "${partnerMoodDisplay}" của bạn!`;
      if (reactionNote.trim()) message += ` Lời nhắn: "${reactionNote.trim()}"`;
    } else if (type === 'chat') {
      message = `💬 Lời nhắn từ ${myName} phản hồi tâm trạng "${partnerMoodDisplay}" của bạn: "${reactionNote.trim()}"`;
    }

    try {
      const { error: loveNoteErr } = await supabase.from('love_notes').insert({
        couple_id: couple.id,
        sender_id: profile.id,
        receiver_id: partner.id,
        message,
        reveal_at: new Date().toISOString(),
        is_read: false,
      });

      if (loveNoteErr) {
        setReactionSuccess(null);
        Alert.alert('Lỗi', 'Không thể gửi phản hồi.');
        return;
      }

      // Gửi thông báo đến partner
      let notifTitle = `${myName} phản hồi tâm trạng của bạn 💌`;
      if (type === 'hug') {
        notifTitle = `${myName} vừa ôm bạn một cái thật ấm áp 🫂`;
      } else if (type === 'care') {
        notifTitle = `${myName} gửi lời quan tâm ngọt ngào đến bạn ❤️`;
      } else if (type === 'chat') {
        notifTitle = `${myName} gửi tin nhắn chia sẻ 💬`;
      }

      await supabase.from('notifications').insert({
        couple_id: couple.id,
        user_id: partner.id,
        sender_id: profile.id,
        type: 'love_note',
        title: notifTitle,
        content: reactionNote.trim() ? reactionNote.trim() : message,
        link: '/love',
      });

      setTimeout(() => {
        setReactionSuccess(null);
        setReactionNote('');
      }, 1500);
    } catch (err: any) {
      setReactionSuccess(null);
      Alert.alert('Lỗi', err.message);
    }
  };

  const handleSignOut = async () => {
    Alert.alert('Xác nhận', 'Bạn có chắc chắn muốn đăng xuất?', [
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

  const togetherDays = daysTogether(couple?.love_start_date ?? null);
  const partnerName = partner?.display_name ?? 'Người ấy';
  const partnerBdayDays = partner?.birthday ? daysUntilBirthday(partner.birthday) : null;
  const nextSpecial = getNextSpecialDate(specialDates);
  const periodStatus = getPeriodStatus(
    periodLogs,
    profile?.id,
    partner?.id,
    partnerName,
    profile,
    partner
  );

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'like': return 'Thích';
      case 'dislike': return 'Ghét';
      case 'food': return 'Đồ ăn';
      case 'gift': return 'Quà tặng';
      case 'habit': return 'Thói quen';
      default: return 'Ghi chú';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a3496d" />
        <Text style={styles.loadingText}>Đang tải không gian yêu thương...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {notification && (
        <View style={styles.toastContainer}>
          <View style={styles.toast}>
            <Text style={styles.toastEmoji}>{notification.emoji}</Text>
            <Text style={styles.toastText} numberOfLines={2}>
              {notification.message}
            </Text>
            <TouchableOpacity onPress={() => setNotification(null)} style={styles.toastClose}>
              <X size={14} color="#8c7e6b" />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Atmosphere backgrounds */}
        <View style={styles.glowOrb1} />
        <View style={styles.glowOrb2} />

        {/* ───── HEADER ───── */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Xin chào,</Text>
            <Text style={styles.username}>{profile?.display_name || 'Bạn'}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.signOutButton}>
            <Settings size={18} color="#8c7e6b" />
          </TouchableOpacity>
        </View>

        {/* ───── DAYS TOGETHER COUNTER CARD ───── */}
        <View style={styles.daysCard}>
          <View style={styles.sparkleDecoration}>
            <Sparkles size={24} color="#e0b86a" style={{ opacity: 0.8 }} />
          </View>
          <Text style={styles.daysCardLabel}>NĂM THÁNG BÊN NHAU</Text>
          
          <View style={styles.counterRow}>
            <Text style={styles.counterNumber}>
              {togetherDays !== null ? String(togetherDays).padStart(2, '0') : '--'}
            </Text>
            <Heart size={32} color="#e11d48" fill="#e11d48" style={styles.heartPulse} />
          </View>

          <Text style={styles.daysCardSub}>
            {couple?.love_start_date
              ? `Bên nhau từ ${formatDate(couple.love_start_date)}`
              : 'Thêm ngày yêu của hai bạn để bắt đầu đếm số ngày.'}
          </Text>
        </View>

        {/* ───── CONNECTION STATUS CARD ───── */}
        <View style={styles.connectCard}>
          <Text style={styles.sectionTitle}>Không gian đôi</Text>
          {couple ? (
            <View style={styles.partnerRow}>
              {partner?.avatar_url ? (
                <Image source={{ uri: partner.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarPlaceholderText}>
                    {(partner?.display_name ?? 'N').slice(0, 1).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.partnerDetails}>
                <Text style={styles.partnerName}>{partner?.display_name || 'Đang kết nối...'}</Text>
                <Text style={styles.partnerStatus}>
                  {partner?.gender === 'female' ? 'Bạn gái của bạn 🌸' : 'Bạn trai của bạn 🫂'}
                </Text>
              </View>
              <View style={styles.connectedBadge}>
                <Text style={styles.connectedBadgeText}>Đã kết nối</Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.noCoupleRow}>
              <AlertCircle size={20} color="#8c754d" />
              <Text style={styles.noCoupleText}>
                Bạn chưa kết nối với người ấy. Nhấp vào đây để tạo mã mời hoặc liên kết ngay nhé! 💖
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ───── COUPLE MOOD SYNC CARD ───── */}
        <View style={styles.moodCard}>
          <View style={styles.moodCardHeader}>
            <View style={styles.moodHeaderLeft}>
              <Heart size={16} color="#e11d48" fill="#e11d48" style={{ marginRight: 6 }} />
              <View>
                <Text style={styles.cardTitle}>Couple Mood Sync</Text>
                <Text style={styles.cardSubTitleText}>KẾT NỐI CẢM XÚC REALTIME</Text>
              </View>
            </View>
            {couple ? (
              <View style={styles.realtimeBadge}>
                <View style={styles.greenDot} />
                <Text style={styles.realtimeBadgeText}>Realtime Active</Text>
              </View>
            ) : (
              <View style={styles.unpairedBadge}>
                <Text style={styles.unpairedBadgeText}>Chưa kết đôi</Text>
              </View>
            )}
          </View>

          {/* Presence Stage */}
          <View style={styles.presenceStage}>
            {/* Dashed bridge line */}
            <View style={styles.dashedBridge} />

            {/* Left side: You */}
            <View style={styles.presenceHalf}>
              <View style={styles.avatarContainer}>
                {profile?.avatar_url ? (
                  <Image source={{ uri: profile.avatar_url }} style={styles.presenceAvatar} />
                ) : (
                  <View style={styles.presenceAvatarPlaceholder}>
                    <Text style={styles.presenceAvatarText}>
                      {(profile?.display_name || 'B').slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                )}
                <View style={styles.miniEmojiBadge}>
                  <Text style={styles.miniEmojiText}>
                    {MOODS.find((m) => m.key === myMood)?.emoji || '❓'}
                  </Text>
                </View>
              </View>
              <Text style={styles.presenceLabel}>BẠN</Text>
              <Text style={styles.presenceName} numberOfLines={1}>{profile?.display_name || 'Bạn'}</Text>
              {myMood ? (
                <View style={[styles.moodBadge, { backgroundColor: (MOODS.find((m) => m.key === myMood)?.color || '#dfd2bb') + '20', borderColor: MOODS.find((m) => m.key === myMood)?.color || '#dfd2bb' }]}>
                  <Text style={styles.moodBadgeText}>
                    {MOODS.find((m) => m.key === myMood)?.emoji} {MOODS.find((m) => m.key === myMood)?.label}
                  </Text>
                </View>
              ) : (
                <Text style={styles.moodBadgeEmpty}>Chưa chọn</Text>
              )}
              {myMoodTime && (
                <Text style={styles.moodTimeText}>{formatMoodTime(myMoodTime)}</Text>
              )}
            </View>

            {/* Center: Heart bridge */}
            <View style={styles.presenceCenter}>
              <View style={styles.presenceHeartCircle}>
                <Heart size={18} color="#e11d48" fill="#e11d48" />
              </View>
              <Text style={styles.syncedFeelingsText}>SYNCED</Text>
              <Text style={styles.syncedFeelingsText}>FEELINGS</Text>
            </View>

            {/* Right side: Partner */}
            <View style={styles.presenceHalf}>
              {partner ? (
                <>
                  <View style={styles.avatarContainer}>
                    {partner.avatar_url ? (
                      <Image source={{ uri: partner.avatar_url }} style={styles.presenceAvatar} />
                    ) : (
                      <View style={styles.presenceAvatarPlaceholder}>
                        <Text style={styles.presenceAvatarText}>
                          {partner.display_name.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.miniEmojiBadge}>
                      <Text style={styles.miniEmojiText}>
                        {MOODS.find((m) => m.key === partnerMood)?.emoji || '❓'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.presenceLabel}>NGƯỜI ẤY</Text>
                  <Text style={styles.presenceName} numberOfLines={1}>{partner.display_name}</Text>
                  {partnerMood ? (
                    <View style={[styles.moodBadge, { backgroundColor: (MOODS.find((m) => m.key === partnerMood)?.color || '#dfd2bb') + '20', borderColor: MOODS.find((m) => m.key === partnerMood)?.color || '#dfd2bb' }]}>
                      <Text style={styles.moodBadgeText}>
                        {MOODS.find((m) => m.key === partnerMood)?.emoji} {MOODS.find((m) => m.key === partnerMood)?.label}
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.moodBadgeEmpty}>Chưa có</Text>
                  )}
                  {partnerMoodTime && (
                    <Text style={styles.moodTimeText}>{formatMoodTime(partnerMoodTime)}</Text>
                  )}
                </>
              ) : (
                <View style={styles.unconnectedPartner}>
                  <View style={styles.presenceAvatarPlaceholderEmpty}>
                    <Text style={styles.presenceAvatarTextEmpty}>?</Text>
                  </View>
                  <Text style={styles.presenceLabel}>NGƯỜI ẤY</Text>
                  <Text style={styles.presenceName}>Chưa kết nối</Text>
                  <TouchableOpacity onPress={() => router.push('/settings')} style={styles.connectNowBtn}>
                    <Text style={styles.connectNowBtnText}>Kết nối ngay</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Note bubbles */}
          {couple && (myMoodNote || partnerMoodNote) && (
            <View style={styles.noteBubblesContainer}>
              {myMoodNote ? (
                <View style={styles.noteBubbleLeft}>
                  <Text style={styles.noteBubbleTitle}>Bạn:</Text>
                  <Text style={styles.noteBubbleText}>"{myMoodNote}"</Text>
                </View>
              ) : <View style={{ flex: 1 }} />}
              
              {partnerMoodNote ? (
                <View style={styles.noteBubbleRight}>
                  <Text style={[styles.noteBubbleTitle, { color: '#a3496d' }]}>
                    {partnerName}:
                  </Text>
                  <Text style={styles.noteBubbleText}>"{partnerMoodNote}"</Text>
                </View>
              ) : <View style={{ flex: 1 }} />}
            </View>
          )}

          {/* Contextual Sparkles support text */}
          {couple && partnerMood && (() => {
            const partnerMoodObj = MOODS.find((m) => m.key === partnerMood);
            const supportText = partnerMoodObj?.supportText;
            return supportText ? (
              <View style={styles.supportTextCard}>
                <Sparkles size={16} color="#a3496d" />
                <Text style={styles.supportTextContent}>{supportText}</Text>
              </View>
            ) : null;
          })()}

          {/* Reaction input and buttons */}
          {couple && partnerMood && (
            <View style={styles.reactionPanel}>
              <Text style={styles.reactionPanelTitle}>
                <MessageCircle size={14} color="#a3496d" style={{ marginRight: 4 }} />
                Phản hồi tâm trạng của {partnerName}
              </Text>
              <TextInput
                style={styles.reactionInput}
                placeholder={
                  (() => {
                    const partnerMoodObj = MOODS.find((m) => m.key === partnerMood);
                    return partnerMoodObj?.supportText && partnerMoodObj.key !== 'Vui' && partnerMoodObj.key !== 'Yêu' && partnerMoodObj.key !== 'Nhớ'
                      ? `Gửi lời động viên, vỗ về đến ${partnerName}...`
                      : `Nhắn gửi yêu thương phản hồi tâm trạng của ${partnerName}...`;
                  })()
                }
                placeholderTextColor="#a39480"
                value={reactionNote}
                onChangeText={setReactionNote}
                maxLength={100}
                multiline
              />
              <View style={styles.reactionFooter}>
                <Text style={styles.charCounter}>{reactionNote.length}/100 kí tự</Text>
                <View style={styles.reactionButtons}>
                  <TouchableOpacity
                    onPress={() => handleReaction('hug')}
                    disabled={reactionSuccess !== null}
                    style={styles.reactionBtn}
                  >
                    <Text style={styles.reactionBtnText}>
                      {reactionSuccess === 'hug' ? 'Đã gửi ôm! 🫂' : '🫂 Gửi ôm'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReaction('care')}
                    disabled={reactionSuccess !== null}
                    style={styles.reactionBtn}
                  >
                    <Text style={styles.reactionBtnText}>
                      {reactionSuccess === 'care' ? 'Đã quan tâm! ❤️' : '❤️ Quan tâm'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleReaction('chat')}
                    disabled={reactionSuccess !== null || !reactionNote.trim()}
                    style={[
                      styles.reactionSubmitBtn,
                      (!reactionNote.trim() || reactionSuccess !== null) && { opacity: 0.5 }
                    ]}
                  >
                    <Text style={styles.reactionSubmitBtnText}>
                      {reactionSuccess === 'chat' ? 'Đã gửi! 💬' : '💬 Nhắn ngay'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Mood Selector Section */}
          <View style={styles.myMoodSelectorSection}>
            <Text style={styles.myMoodSelectorTitle}>Tâm trạng của bạn lúc này:</Text>
            <View style={styles.moodSelectorGrid}>
              {MOODS.map((m) => {
                const isSelected = selectedMoodKey === m.key || (selectedMoodKey === null && myMood === m.key);
                return (
                  <TouchableOpacity
                    key={m.key}
                    onPress={() => handleSelectMood(m.key)}
                    disabled={saveStatus === 'saving'}
                    style={[
                      styles.moodOption,
                      isSelected && { backgroundColor: m.color + '40', borderColor: m.color },
                    ]}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, isSelected && { fontWeight: '800', color: '#3c2a2f' }]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {showNoteInput && (
              <View style={styles.noteInputContainer}>
                <TextInput
                  style={styles.noteInput}
                  placeholder={`Viết vài từ về tâm trạng "${selectedMoodKey}" hôm nay... (tùy chọn)`}
                  placeholderTextColor="#a39480"
                  value={note}
                  onChangeText={setNote}
                  maxLength={80}
                  multiline
                />
                <View style={styles.noteInputFooter}>
                  <Text style={styles.charCounter}>{note.length}/80 kí tự</Text>
                  <View style={styles.noteInputButtons}>
                    <TouchableOpacity
                      onPress={() => {
                        setShowNoteInput(false);
                        setSelectedMoodKey(null);
                        setNote('');
                      }}
                      disabled={saveStatus === 'saving'}
                      style={styles.cancelBtn}
                    >
                      <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleSaveMood}
                      disabled={saveStatus === 'saving'}
                      style={[styles.saveBtn, saveStatus === 'saving' && { opacity: 0.7 }]}
                    >
                      {saveStatus === 'saving' ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : saveStatus === 'success' ? (
                        <Text style={styles.saveBtnText}>Đã lưu! ✓</Text>
                      ) : (
                        <Text style={styles.saveBtnText}>Cập nhật</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>

        {/* ───── LOVE NOTE MESSAGE CARD ───── */}
        {couple && (
          <TouchableOpacity onPress={() => router.push('/love')} style={styles.loveNoteCard}>
            <View style={styles.loveNoteHeader}>
              <View style={styles.noteIconWrapper}>
                <Mail size={18} color="#a3496d" />
              </View>
              <View>
                <Text style={styles.cardTitle}>Lời nhắn ngọt ngào</Text>
                <Text style={styles.cardSubtitle}>Mảnh ghép cảm xúc dành riêng cho nhau</Text>
              </View>
            </View>
            <View style={styles.noteTextBox}>
              <Text style={styles.noteText}>
                {latestLoveNote?.message ? `"${latestLoveNote.message}"` : 'Chưa có lời nhắn nào được trao gửi giữa hai bạn 💖'}
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* ───── NOTEBOOK SPACE CARD ───── */}
        {couple && (
          <TouchableOpacity onPress={() => router.push('/settings')} style={styles.notebookCard}>
            <View style={styles.notebookHeader}>
              <View style={styles.notebookIconWrapper}>
                <BookOpen size={18} color="#a3496d" />
              </View>
              <Text style={styles.cardTitle}>Sổ tay ghi nhớ</Text>
            </View>
            
            {notebookNotes.length > 0 ? (
              <View style={styles.notebookList}>
                {notebookNotes.map((note) => (
                  <View key={note.id} style={styles.notebookItem}>
                    <Text style={styles.notebookCategory}>
                      [{getCategoryLabel(note.category)}]
                    </Text>
                    <Text style={styles.notebookContent} numberOfLines={1}>
                      {note.content}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>Chưa có thông tin thói quen/ghi nhớ nào được ghi lại.</Text>
            )}
          </TouchableOpacity>
        )}

        {/* ───── THREE COUNTDOWNS GRID (KỲ DÂU, SINH NHẬT, KỶ NIỆM) ───── */}
        {couple && (
          <View style={styles.countdownsContainer}>
            {/* Countdown 1: Kỳ Dâu */}
            {periodStatus && (
              <TouchableOpacity onPress={() => router.push('/settings')} style={styles.countdownItem}>
                <View style={[styles.iconBox, { backgroundColor: '#ffe4e6' }]}>
                  <Droplet size={18} color="#f43f5e" fill="#f43f5e" />
                </View>
                <Text style={styles.countdownTitle}>Kỳ dâu</Text>
                {periodStatus.status !== 'not-setup' ? (
                  <>
                    <CountdownRing days={periodStatus.daysLeft} color="#f43f5e" />
                    <Text style={styles.countdownStatusText} numberOfLines={1}>{periodStatus.message}</Text>
                  </>
                ) : (
                  <Text style={styles.countdownUnsetupText}>Chưa kích hoạt</Text>
                )}
              </TouchableOpacity>
            )}

            {/* Countdown 2: Sinh nhật người ấy */}
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.countdownItem}>
              <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
                <Cake size={18} color="#f59e0b" />
              </View>
              <Text style={styles.countdownTitle}>Sinh nhật</Text>
              {partnerBdayDays !== null ? (
                <>
                  <CountdownRing days={partnerBdayDays} color="#f59e0b" />
                  <Text style={styles.countdownStatusText} numberOfLines={1}>Còn {partnerBdayDays} ngày</Text>
                </>
              ) : (
                <Text style={styles.countdownUnsetupText}>Chưa cập nhật ngày sinh</Text>
              )}
            </TouchableOpacity>

            {/* Countdown 3: Kỷ niệm kế tiếp */}
            <TouchableOpacity onPress={() => router.push('/settings')} style={styles.countdownItem}>
              <View style={[styles.iconBox, { backgroundColor: '#fce7f3' }]}>
                <CalendarDays size={18} color="#ec4899" />
              </View>
              <Text style={styles.countdownTitle}>Kỷ niệm</Text>
              {nextSpecial ? (
                <>
                  <CountdownRing days={nextSpecial.daysLeft} color="#ec4899" />
                  <Text style={styles.countdownStatusText} numberOfLines={1}>{nextSpecial.title}</Text>
                </>
              ) : (
                <Text style={styles.countdownUnsetupText}>Không có sự kiện tới</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
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
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8b6571',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
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
    top: 300,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(224, 184, 106, 0.07)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 12,
    fontWeight: '700',
    color: '#a39480',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  username: {
    fontSize: 24,
    fontWeight: '900',
    color: '#5a4c35',
    marginTop: 2,
  },
  signOutButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfd2bb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysCard: {
    backgroundColor: '#ffffff',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(196, 161, 90, 0.3)',
    padding: 24,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 20,
  },
  sparkleDecoration: {
    position: 'absolute',
    top: 20,
    right: 20,
  },
  daysCardLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#a3496d',
    letterSpacing: 2,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  counterNumber: {
    fontSize: 64,
    fontWeight: '900',
    color: '#a3496d',
    lineHeight: 64,
    letterSpacing: -2,
  },
  heartPulse: {
    marginBottom: 10,
  },
  daysCardSub: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8c7e6b',
    marginTop: 12,
  },
  connectCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#8c754d',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  partnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#a3496d',
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff5f8',
    borderWidth: 1.5,
    borderColor: '#a3496d',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#a3496d',
  },
  partnerDetails: {
    marginLeft: 12,
    flex: 1,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#3c2a2f',
  },
  partnerStatus: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b6571',
    marginTop: 2,
  },
  connectedBadge: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  noCoupleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  noCoupleText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#8c7e6b',
    lineHeight: 18,
  },
  moodCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    marginBottom: 20,
  },
  moodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#5a4c35',
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8b6571',
    lineHeight: 16,
    marginBottom: 16,
  },
  moodSelectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
    justifyContent: 'flex-start',
  },
  moodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcfaf7',
    borderWidth: 1.5,
    borderColor: '#ebdcb9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  moodEmoji: {
    fontSize: 16,
  },
  moodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  partnerMoodPanel: {
    borderTopWidth: 1,
    borderColor: 'rgba(235, 220, 185, 0.5)',
    paddingTop: 16,
  },
  partnerMoodTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8c754d',
  },
  partnerMoodValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f8',
    borderWidth: 1,
    borderColor: '#fcd3de',
    borderRadius: 14,
    padding: 10,
    marginTop: 8,
    gap: 8,
  },
  partnerMoodEmoji: {
    fontSize: 20,
  },
  partnerMoodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8b6571',
  },
  boldText: {
    fontWeight: '800',
    color: '#a3496d',
  },
  partnerNoMoodText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a39480',
    fontStyle: 'italic',
    marginTop: 6,
  },
  loveNoteCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    marginBottom: 20,
  },
  loveNoteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  noteIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#fff5f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noteTextBox: {
    backgroundColor: '#fdfbf7',
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8b6571',
    fontStyle: 'italic',
    lineHeight: 20,
    textAlign: 'center',
  },
  notebookCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    marginBottom: 20,
  },
  notebookHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  notebookIconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notebookList: {
    gap: 10,
  },
  notebookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fcfaf7',
    borderWidth: 1,
    borderColor: '#dfd2bb',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  notebookCategory: {
    fontSize: 11,
    fontWeight: '800',
    color: '#a3496d',
  },
  notebookContent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c2a2f',
    flex: 1,
  },
  emptyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#a39480',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  countdownsContainer: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  countdownItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    padding: 12,
    alignItems: 'center',
    gap: 8,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#5a4c35',
  },
  ringBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringDaysText: {
    fontSize: 14,
    fontWeight: '900',
    lineHeight: 14,
  },
  ringDaysSubText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#a39480',
    marginTop: -2,
  },
  countdownStatusText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8b6571',
    textAlign: 'center',
  },
  countdownUnsetupText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#a39480',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 8,
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ebdcb9',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  toastEmoji: {
    fontSize: 18,
  },
  toastText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#3c2a2f',
    lineHeight: 16,
  },
  toastClose: {
    padding: 4,
  },
  partnerMoodNoteBox: {
    backgroundColor: '#fdfcfb',
    borderWidth: 1,
    borderColor: '#dfd2bb50',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 8,
  },
  partnerMoodNoteText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: '#8c7e6b',
    lineHeight: 16,
  },
  charCounter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#a39480',
  },
  noteInputContainer: {
    backgroundColor: '#fffcf7',
    borderWidth: 1,
    borderColor: '#dfd2bb50',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  noteInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c2a2f',
    minHeight: 48,
    textAlignVertical: 'top',
    padding: 0,
    marginBottom: 8,
  },
  noteInputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteInputButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#8c7e6b',
  },
  saveBtn: {
    backgroundColor: '#a3496d',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 14,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  supportTextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff5f8',
    borderWidth: 1,
    borderColor: '#fcd3de50',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    gap: 8,
  },
  supportTextContent: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8b6571',
    flex: 1,
  },
  reactionPanel: {
    backgroundColor: '#fdfcfb',
    borderWidth: 1,
    borderColor: '#dfd2bb60',
    borderRadius: 16,
    padding: 12,
    marginTop: 12,
  },
  reactionPanelTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#8c7e6b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reactionInput: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3c2a2f',
    minHeight: 52,
    textAlignVertical: 'top',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfd2bb40',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  reactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reactionButtons: {
    flexDirection: 'row',
    gap: 6,
  },
  reactionBtn: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfd2bb',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3c2a2f',
  },
  reactionSubmitBtn: {
    backgroundColor: '#a3496d',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionSubmitBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  moodCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  moodHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardSubTitleText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#a39480',
    letterSpacing: 1,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  realtimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  realtimeBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  unpairedBadge: {
    backgroundColor: '#f5f5f7',
    borderWidth: 1,
    borderColor: '#e5e5e7',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unpairedBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#7c7c80',
  },
  presenceStage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    position: 'relative',
    paddingVertical: 12,
    marginBottom: 16,
  },
  dashedBridge: {
    position: 'absolute',
    left: '25%',
    right: '25%',
    top: 36,
    height: 1,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    borderStyle: 'dashed',
    opacity: 0.5,
  },
  presenceHalf: {
    flex: 1,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 8,
  },
  presenceAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  presenceAvatarPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff5f8',
    borderWidth: 3,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  presenceAvatarText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#a3496d',
  },
  miniEmojiBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#dfd2bb',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  miniEmojiText: {
    fontSize: 12,
  },
  presenceLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#a39480',
    letterSpacing: 1,
    marginBottom: 2,
  },
  presenceName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#3c2a2f',
    marginBottom: 6,
    textAlign: 'center',
    maxWidth: 90,
  },
  moodBadge: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  moodBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3c2a2f',
  },
  moodBadgeEmpty: {
    fontSize: 11,
    fontStyle: 'italic',
    fontWeight: '700',
    color: '#a39480',
    marginBottom: 4,
  },
  moodTimeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a39480',
  },
  presenceCenter: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    width: 80,
  },
  presenceHeartCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfd2bb50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 8,
  },
  syncedFeelingsText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#a39480',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  unconnectedPartner: {
    alignItems: 'center',
  },
  presenceAvatarPlaceholderEmpty: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f5f5f7',
    borderWidth: 2,
    borderColor: '#dfd2bb',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  presenceAvatarTextEmpty: {
    fontSize: 20,
    fontWeight: '700',
    color: '#a39480',
  },
  connectNowBtn: {
    backgroundColor: '#fff5f8',
    borderWidth: 1,
    borderColor: '#a3496d',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
  },
  connectNowBtnText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#a3496d',
  },
  noteBubblesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    borderTopWidth: 1,
    borderColor: '#dfd2bb40',
    paddingTop: 14,
    marginTop: 8,
    marginBottom: 12,
  },
  noteBubbleLeft: {
    flex: 1,
    backgroundColor: '#fff5f8',
    borderWidth: 1,
    borderColor: '#dfd2bb30',
    borderRadius: 14,
    padding: 8,
  },
  noteBubbleRight: {
    flex: 1,
    backgroundColor: '#fdfbf7',
    borderWidth: 1,
    borderColor: '#dfd2bb30',
    borderRadius: 14,
    padding: 8,
  },
  noteBubbleTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#a3496d',
    marginBottom: 2,
  },
  noteBubbleText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#5a4c35',
    fontStyle: 'italic',
    lineHeight: 14,
  },
  myMoodSelectorSection: {
    borderTopWidth: 1,
    borderColor: '#dfd2bb40',
    paddingTop: 16,
    marginTop: 16,
  },
  myMoodSelectorTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#5a4c35',
    marginBottom: 12,
  },
});
