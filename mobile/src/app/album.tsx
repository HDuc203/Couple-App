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
  Image,
  Dimensions,
  FlatList,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase';
import {
  Images,
  Plus,
  Trash2,
  FolderPlus,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Calendar,
  X,
  Heart,
  Eye,
  Camera,
} from 'lucide-react-native';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 56) / 2; // 2 column layout with padding

// Default sample couple images
const SAMPLE_COUPLE_PHOTOS = [
  { url: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&auto=format&fit=crop&q=80', label: 'Hoàng hôn nắm tay' },
  { url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80', label: 'Bóng hình trái tim' },
  { url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&auto=format&fit=crop&q=80', label: 'Nụ cười bên nhau' },
  { url: 'https://images.unsplash.com/photo-1464746133101-a2c3f88e0dd9?w=800&auto=format&fit=crop&q=80', label: 'Cái ôm trên núi' },
  { url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop&q=80', label: 'Buổi hẹn cà phê' },
];

function parsePhotoCaption(rawCaption: string | null) {
  if (!rawCaption) return { text: '', comments: [] };
  const clean = rawCaption.trim();
  if (clean.startsWith('{') && clean.endsWith('}')) {
    try {
      const parsed = JSON.parse(clean);
      return {
        text: parsed.text || '',
        comments: parsed.comments || [],
      };
    } catch (e) {
      // Fallback
    }
  }
  return {
    text: rawCaption,
    comments: [],
  };
}

export default function AlbumScreen() {
  const [loading, setLoading] = useState(true);
  const [photos, setPhotos] = useState<any[]>([]);
  const [albums, setAlbums] = useState<any[]>([]);
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [profile, setProfile] = useState<any>(null);

  // Filter selection
  const [selectedAlbumId, setSelectedAlbumId] = useState<string | 'all'>('all');

  // Modals state
  const [albumModalVisible, setAlbumModalVisible] = useState(false);
  const [photoModalVisible, setPhotoModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);

  // Album creation form state
  const [albumTitle, setAlbumTitle] = useState('');
  const [savingAlbum, setSavingAlbum] = useState(false);

  // Photo creation form state
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoCaption, setPhotoCaption] = useState('');
  const [photoLocation, setPhotoLocation] = useState('');
  const [photoAlbumId, setPhotoAlbumId] = useState('');
  const [savingPhoto, setSavingPhoto] = useState(false);

  // Comment state
  const [commentText, setCommentText] = useState('');

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

        // Fetch albums
        const { data: albumsData } = await supabase
          .from('photo_albums')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('created_at', { ascending: false });
        setAlbums(albumsData || []);

        // Fetch photos
        const { data: photosData } = await supabase
          .from('photos')
          .select('*')
          .eq('couple_id', memberData.couple_id)
          .order('created_at', { ascending: false });
        setPhotos(photosData || []);
        
        // Sync selected photo details if open
        if (selectedPhoto) {
          const updatedPhoto = (photosData || []).find((p) => p.id === selectedPhoto.id);
          if (updatedPhoto) setSelectedPhoto(updatedPhoto);
        }
      } else {
        setCoupleId(null);
        setAlbums([]);
        setPhotos([]);
      }
    } catch (err) {
      console.error('Error fetching albums/photos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPhoto?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    // Real-time synchronization
    const channel = supabase
      .channel('album-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photos' }, () => {
        fetchData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'photo_albums' }, () => {
        fetchData();
      })
      .subscribe((status, err) => {
        console.log('[REALTIME] Album channel status:', status, err);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const handleCreateAlbum = async () => {
    if (!albumTitle.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên album.');
      return;
    }

    setSavingAlbum(true);
    try {
      const { error } = await supabase.from('photo_albums').insert({
        couple_id: coupleId,
        title: albumTitle.trim(),
        created_by: profile?.id,
      });

      if (error) {
        Alert.alert('Lỗi', `Không thể tạo album: ${error.message}`);
      } else {
        setAlbumTitle('');
        setAlbumModalVisible(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSavingAlbum(false);
    }
  };

  const handleAddPhoto = async () => {
    if (!photoUrl.trim()) {
      Alert.alert('Thông báo', 'Vui lòng điền hoặc chọn URL ảnh hồi ức.');
      return;
    }

    setSavingPhoto(true);
    try {
      const targetAlbumId = photoAlbumId || null;

      // Pack caption & comments empty array inside JSON string
      const packedCaption = JSON.stringify({
        text: photoCaption.trim(),
        comments: [],
      });

      const { error } = await supabase.from('photos').insert({
        couple_id: coupleId,
        album_id: targetAlbumId,
        uploaded_by: profile?.id,
        image_url: photoUrl.trim(),
        caption: packedCaption,
        location: photoLocation.trim() || null,
        taken_at: new Date().toISOString(),
      });

      if (error) {
        Alert.alert('Lỗi', `Không thể lưu ảnh: ${error.message}`);
      } else {
        setPhotoUrl('');
        setPhotoCaption('');
        setPhotoLocation('');
        setPhotoAlbumId('');
        setPhotoModalVisible(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    } finally {
      setSavingPhoto(false);
    }
  };

  const handleDeletePhoto = async (photoId: string) => {
    Alert.alert('Xóa kỷ niệm', 'Bạn có chắc muốn xóa bức ảnh kỷ niệm ngọt ngào này khỏi thư viện chung?', [
      { text: 'Quay lại', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          try {
            const { error } = await supabase.from('photos').delete().eq('id', photoId);
            if (error) {
              Alert.alert('Lỗi', error.message);
            } else {
              setDetailModalVisible(false);
              setSelectedPhoto(null);
              fetchData();
            }
          } catch (err: any) {
            Alert.alert('Lỗi', err.message);
          }
        },
      },
    ]);
  };

  const handleSendComment = async () => {
    if (!selectedPhoto || !commentText.trim()) return;

    try {
      const parsed = parsePhotoCaption(selectedPhoto.caption);
      const newComment = {
        id: Math.random().toString(),
        authorName: profile?.display_name || 'Bạn',
        text: commentText.trim(),
        createdAt: new Date().toISOString(),
      };

      const updatedCaption = JSON.stringify({
        text: parsed.text,
        comments: [...parsed.comments, newComment],
      });

      const { error } = await supabase
        .from('photos')
        .update({ caption: updatedCaption })
        .eq('id', selectedPhoto.id);

      if (error) {
        Alert.alert('Lỗi', `Không thể gửi bình luận: ${error.message}`);
      } else {
        setCommentText('');
        // Reload details immediately
        const { data: updatedPhoto } = await supabase
          .from('photos')
          .select('*')
          .eq('id', selectedPhoto.id)
          .single();
        if (updatedPhoto) setSelectedPhoto(updatedPhoto);
      }
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
  };

  const filteredPhotos = photos.filter((photo) => {
    if (selectedAlbumId === 'all') return true;
    return photo.album_id === selectedAlbumId;
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#a3496d" />
        <Text style={styles.loadingText}>Đang tải hộp ảnh hồi ức...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header View */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerLabel}>TẤM GƯƠNG KỶ NIỆM</Text>
          <Text style={styles.headerTitle}>Hộp ảnh hồi ức</Text>
        </View>
        {coupleId && (
          <View style={styles.headerActionRow}>
            <TouchableOpacity onPress={() => setAlbumModalVisible(true)} style={styles.headerIconBtn}>
              <FolderPlus size={18} color="#a3496d" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPhotoModalVisible(true)} style={styles.addBtn}>
              <Plus size={16} color="#ffffff" />
              <Text style={styles.addBtnText}>Thêm ảnh</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {!coupleId ? (
        <View style={styles.unconnectedBox}>
          <Images size={48} color="#a39480" style={styles.unconnectedIcon} />
          <Text style={styles.unconnectedText}>
            Hai bạn chưa kết nối cặp đôi. Hãy vào mục Cài đặt để tạo mã mời hoặc liên kết với người ấy để cùng chia sẻ album ảnh hồi ức nhé! 📸
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Albums categories navigation */}
          <View style={styles.categoryContainer}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              <TouchableOpacity
                onPress={() => setSelectedAlbumId('all')}
                style={[
                  styles.categoryBadge,
                  selectedAlbumId === 'all' && styles.activeCategoryBadge,
                ]}
              >
                <Text style={[styles.categoryText, selectedAlbumId === 'all' && styles.activeCategoryText]}>
                  Tất cả ảnh ({photos.length})
                </Text>
              </TouchableOpacity>

              {albums.map((album) => {
                const count = photos.filter((p) => p.album_id === album.id).length;
                return (
                  <TouchableOpacity
                    key={album.id}
                    onPress={() => setSelectedAlbumId(album.id)}
                    style={[
                      styles.categoryBadge,
                      selectedAlbumId === album.id && styles.activeCategoryBadge,
                    ]}
                  >
                    <Text style={[styles.categoryText, selectedAlbumId === album.id && styles.activeCategoryText]}>
                      📂 {album.title} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Photos Grid */}
          {filteredPhotos.length === 0 ? (
            <View style={styles.emptyContainer}>
              <ImageIcon size={48} color="#a39480" style={styles.unconnectedIcon} />
              <Text style={styles.emptyText}>Thư mục này chưa có bức ảnh kỷ niệm nào.</Text>
              <Text style={styles.emptySubText}>Hãy thêm những khoảnh khắc đầu tiên của hai bạn nhé!</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(true)} style={[styles.primaryButton, { marginTop: 16 }]}>
                <Text style={styles.primaryButtonText}>Tải bức ảnh đầu tiên</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={filteredPhotos}
              keyExtractor={(item) => item.id}
              numColumns={2}
              contentContainerStyle={styles.gridContainer}
              renderItem={({ item }) => {
                const parsed = parsePhotoCaption(item.caption);
                return (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPhoto(item);
                      setDetailModalVisible(true);
                    }}
                    style={styles.gridPolaroid}
                  >
                    <Image source={{ uri: item.image_url }} style={styles.polaroidImg} />
                    <View style={styles.polaroidCardBody}>
                      <Text style={styles.polaroidCaption} numberOfLines={1}>
                        {parsed.text || 'Kỷ niệm ngọt ngào'}
                      </Text>
                      {item.location && (
                        <View style={styles.polaroidLocationRow}>
                          <MapPin size={10} color="#a3496d" />
                          <Text style={styles.polaroidLocationText} numberOfLines={1}>
                            {item.location}
                          </Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </View>
      )}

      {/* Album Creation Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={albumModalVisible}
        onRequestClose={() => setAlbumModalVisible(false)}
      >
        <View style={styles.overlayCenter}>
          <View style={styles.dialogCard}>
            <View style={styles.dialogHeader}>
              <Text style={styles.dialogTitle}>Tạo Album hồi ức mới</Text>
              <TouchableOpacity onPress={() => setAlbumModalVisible(false)}>
                <X size={18} color="#5a4c35" />
              </TouchableOpacity>
            </View>
            <View style={styles.dialogBody}>
              <Text style={styles.dialogLabel}>TÊN ALBUM</Text>
              <TextInput
                value={albumTitle}
                onChangeText={setAlbumTitle}
                placeholder="Ví dụ: Du lịch Nha Trang 2026"
                placeholderTextColor="#a39480"
                style={styles.input}
              />
              <TouchableOpacity
                onPress={handleCreateAlbum}
                disabled={savingAlbum}
                style={styles.primaryButton}
              >
                {savingAlbum ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Tạo Album</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Photo Addition Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={photoModalVisible}
        onRequestClose={() => setPhotoModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm hình ảnh hồi ức mới</Text>
              <TouchableOpacity onPress={() => setPhotoModalVisible(false)}>
                <X size={20} color="#5a4c35" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} keyboardShouldPersistTaps="handled">
              {/* Photo Preset Templates Selector */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CHỌN ẢNH CÓ SẴN (PRESETS) HOẶC ĐIỀN URL:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
                  {SAMPLE_COUPLE_PHOTOS.map((preset, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => setPhotoUrl(preset.url)}
                      style={[
                        styles.presetBadge,
                        photoUrl === preset.url && styles.activePresetBadge,
                      ]}
                    >
                      <Text style={[styles.presetText, photoUrl === preset.url && styles.activePresetText]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Photo URL */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ĐƯỜNG DẪN ẢNH (IMAGE URL)</Text>
                <TextInput
                  value={photoUrl}
                  onChangeText={setPhotoUrl}
                  placeholder="https://example.com/hinh-anh.jpg"
                  placeholderTextColor="#a39480"
                  style={styles.input}
                />
              </View>

              {/* Caption */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CHÚ THÍCH HỒI ỨC</Text>
                <TextInput
                  value={photoCaption}
                  onChangeText={setPhotoCaption}
                  placeholder="Mình cùng cười thật tươi ngày hôm đó..."
                  placeholderTextColor="#a39480"
                  style={styles.input}
                />
              </View>

              {/* Location */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>ĐỊA ĐIỂM (LOCATION)</Text>
                <TextInput
                  value={photoLocation}
                  onChangeText={setPhotoLocation}
                  placeholder="Ví dụ: Đà Lạt, Lâm Đồng"
                  placeholderTextColor="#a39480"
                  style={styles.input}
                />
              </View>

              {/* Album Selection */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PHÂN VÀO ALBUM (TÙY CHỌN)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.albumSelectRow}>
                  <TouchableOpacity
                    onPress={() => setPhotoAlbumId('')}
                    style={[
                      styles.albumSelectBadge,
                      !photoAlbumId && styles.activeAlbumSelectBadge,
                    ]}
                  >
                    <Text style={[styles.albumSelectText, !photoAlbumId && styles.activeAlbumSelectText]}>
                      Chung (Không phân mục)
                    </Text>
                  </TouchableOpacity>
                  {albums.map((album) => (
                    <TouchableOpacity
                      key={album.id}
                      onPress={() => setPhotoAlbumId(album.id)}
                      style={[
                        styles.albumSelectBadge,
                        photoAlbumId === album.id && styles.activeAlbumSelectBadge,
                      ]}
                    >
                      <Text style={[styles.albumSelectText, photoAlbumId === album.id && styles.activeAlbumSelectText]}>
                        📂 {album.title}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                onPress={handleAddPhoto}
                disabled={savingPhoto}
                style={styles.primaryButton}
              >
                {savingPhoto ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.primaryButtonText}>Lưu hồi ức vào hộp ảnh</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Photo Full Screen detail view modal */}
      {selectedPhoto && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={detailModalVisible}
          onRequestClose={() => setDetailModalVisible(false)}
        >
          <SafeAreaView style={styles.fullscreenOverlay}>
            <View style={styles.fullscreenHeader}>
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.closeOverlayBtn}>
                <X size={20} color="#5a4c35" />
              </TouchableOpacity>
              <Text style={styles.overlayTitle} numberOfLines={1}>
                {albums.find((a) => a.id === selectedPhoto.album_id)?.title || 'Hộp ảnh chung'}
              </Text>
              <TouchableOpacity onPress={() => handleDeletePhoto(selectedPhoto.id)} style={styles.deletePhotoBtn}>
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.fullscreenScroll} keyboardShouldPersistTaps="handled">
              {/* Photo Image display */}
              <Image source={{ uri: selectedPhoto.image_url }} style={styles.fullscreenImage} resizeMode="contain" />

              {/* Photo details container */}
              <View style={styles.detailsBox}>
                <Text style={styles.detailsCaption}>
                  {parsePhotoCaption(selectedPhoto.caption).text || 'Một khoảnh khắc đẹp.'}
                </Text>

                <View style={styles.metaRow}>
                  {selectedPhoto.location && (
                    <View style={styles.metaBadge}>
                      <MapPin size={12} color="#a3496d" />
                      <Text style={styles.metaBadgeText}>{selectedPhoto.location}</Text>
                    </View>
                  )}
                  <View style={styles.metaBadge}>
                    <Calendar size={12} color="#8c7e6b" />
                    <Text style={styles.metaBadgeText}>{formatDate(selectedPhoto.taken_at || selectedPhoto.created_at)}</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Comments section */}
                <View style={styles.commentsContainer}>
                  <Text style={styles.commentsTitle}>
                    Bình luận ({parsePhotoCaption(selectedPhoto.caption).comments.length})
                  </Text>

                  {parsePhotoCaption(selectedPhoto.caption).comments.map((comment: any) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <View style={styles.commentHeader}>
                        <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                        <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                      </View>
                      <Text style={styles.commentText}>{comment.text}</Text>
                    </View>
                  ))}

                  {/* Add comment Form */}
                  <View style={styles.addCommentRow}>
                    <TextInput
                      value={commentText}
                      onChangeText={setCommentText}
                      placeholder="Viết bình luận dịu dàng..."
                      placeholderTextColor="#a39480"
                      style={styles.commentInput}
                    />
                    <TouchableOpacity onPress={handleSendComment} style={styles.sendCommentBtn}>
                      <MessageSquare size={16} color="#ffffff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
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
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfd2bb50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  categoryContainer: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dfd2bb20',
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  categoryBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebdcb9',
  },
  activeCategoryBadge: {
    backgroundColor: '#a3496d',
    borderColor: '#a3496d',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  activeCategoryText: {
    color: '#ffffff',
    fontWeight: '900',
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
  gridContainer: {
    padding: 20,
    gap: 16,
  },
  gridPolaroid: {
    width: COLUMN_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dfd2bb',
    padding: 10,
    shadowColor: '#a59678',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    marginRight: 16,
    marginBottom: 16,
  },
  polaroidImg: {
    width: '100%',
    height: COLUMN_WIDTH - 20,
    borderRadius: 10,
    backgroundColor: '#fcfaf7',
  },
  polaroidCardBody: {
    marginTop: 8,
    gap: 4,
  },
  polaroidCaption: {
    fontSize: 12,
    fontWeight: '900',
    color: '#3c2a2f',
  },
  polaroidLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  polaroidLocationText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#8c7e6b',
  },
  overlayCenter: {
    flex: 1,
    backgroundColor: 'rgba(90, 76, 53, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  dialogCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ebdcb9',
    padding: 20,
    width: '100%',
    maxWidth: 340,
    gap: 16,
  },
  dialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dialogTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#5a4c35',
  },
  dialogBody: {
    gap: 12,
  },
  dialogLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#8c754d',
    letterSpacing: 1,
  },
  inputGroup: {
    gap: 6,
    marginBottom: 16,
  },
  label: {
    fontSize: 10,
    fontWeight: '900',
    color: '#8c754d',
    letterSpacing: 0.5,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    color: '#3c2a2f',
    backgroundColor: '#fcfbf9',
    marginBottom: 12,
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
  modalForm: {
    maxHeight: 400,
  },
  presetsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  presetBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fcfaf7',
    borderWidth: 1,
    borderColor: '#ebdcb9',
  },
  activePresetBadge: {
    backgroundColor: '#fff5f8',
    borderColor: '#a3496d',
  },
  presetText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  activePresetText: {
    color: '#a3496d',
    fontWeight: '800',
  },
  albumSelectRow: {
    gap: 8,
    paddingVertical: 4,
  },
  albumSelectBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#fcfaf7',
    borderWidth: 1,
    borderColor: '#ebdcb9',
  },
  activeAlbumSelectBadge: {
    backgroundColor: '#ebdcb9',
    borderColor: '#a3754d',
  },
  albumSelectText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  activeAlbumSelectText: {
    color: '#3c2a2f',
    fontWeight: '800',
  },
  modalFooter: {
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: '#fdfaf2',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#dfd2bb30',
  },
  closeOverlayBtn: {
    padding: 6,
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#5a4c35',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  deletePhotoBtn: {
    padding: 6,
  },
  fullscreenScroll: {
    paddingBottom: 40,
  },
  fullscreenImage: {
    width: '100%',
    height: width * 1.1,
    backgroundColor: '#fcfaf7',
  },
  detailsBox: {
    padding: 20,
  },
  detailsCaption: {
    fontSize: 15,
    fontWeight: '800',
    color: '#3c2a2f',
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 4,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#8c7e6b',
  },
  divider: {
    height: 1,
    backgroundColor: '#ebdcb9',
    marginVertical: 18,
    opacity: 0.6,
  },
  commentsContainer: {
    gap: 12,
  },
  commentsTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#5a4c35',
    marginBottom: 4,
  },
  commentItem: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dfd2bb50',
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  commentAuthor: {
    fontSize: 11,
    fontWeight: '900',
    color: '#a3496d',
  },
  commentDate: {
    fontSize: 9,
    color: '#a39480',
    fontWeight: '600',
  },
  commentText: {
    fontSize: 12,
    color: '#554348',
    lineHeight: 16,
    fontWeight: '500',
  },
  addCommentRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  commentInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ebdcb9',
    borderRadius: 14,
    paddingHorizontal: 12,
    fontSize: 12,
    color: '#3c2a2f',
    backgroundColor: '#ffffff',
  },
  sendCommentBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#a3496d',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
