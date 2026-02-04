import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, FileText, Plus, Share2, Trash2, X } from "lucide-react-native";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Modal,
    Platform,
    SafeAreaView,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

import { useThemeStore } from "../../hooks/useThemeStore";
import useTruckDocuments from "../../hooks/useTruckDocuments";
import { formatDate as globalFormatDate, getFileUrl } from "../../lib/utils";

export default function DocumentDetails() {
    const { truckId } = useLocalSearchParams<{ truckId: string }>();
    const router = useRouter();
    const { theme, colors } = useThemeStore();
    const isDark = theme === "dark";
    const { documents, loading, fetchDocuments, uploadDocument, deleteDocument } = useTruckDocuments(truckId);

    const [modalVisible, setModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Form States
    const [docType, setDocType] = useState("");
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Helper
    const formatDate = (dateString?: string | Date) => globalFormatDate(dateString);

    const isExpiring = (dateString?: string) => {
        if (!dateString) return false;
        const expiry = new Date(dateString);
        const today = new Date();
        const diffTime = expiry.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 30; // Close to expiry but not expired
    };

    const isExpired = (dateString?: string) => {
        if (!dateString) return false;
        return new Date(dateString) < new Date();
    };

    const handlePickDocument = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                setSelectedFile({
                    uri: result.assets[0].uri,
                    name: result.assets[0].fileName || `doc_${Date.now()}.jpg`,
                    type: result.assets[0].mimeType || 'image/jpeg',
                });
            }
        } catch {
            Alert.alert("Error", "Failed to pick file");
        }
    };

    const handleUpload = async () => {
        if (!docType || !selectedFile) {
            Alert.alert("Missing Fields", "Please select a document type and file.");
            return;
        }
        try {
            setUploading(true);
            await uploadDocument({
                truck_id: truckId!,
                document_type: docType,
                file: selectedFile,
                expiry_date: expiryDate ? expiryDate.toISOString() : "",
            });
            setModalVisible(false);
            resetForm();
            Alert.alert("Success", "Document uploaded successfully");
        } catch {
            // handled by hook
        } finally {
            setUploading(false);
        }
    };

    const resetForm = () => {
        setDocType("");
        setSelectedFile(null);
        setExpiryDate(undefined);
    };

    const handleShare = async (url: string) => {
        try {
            await Share.share({
                message: `Check out this document: ${url}`,
            });
        } catch (error) {
            Alert.alert("Error", "Failed to share document");
        }
    }

    const renderDocumentItem = ({ item }: { item: any }) => {
        const expired = isExpired(item.expiry_date);
        const expiring = isExpiring(item.expiry_date);
        const fileUrl = getFileUrl(item.file_url);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => fileUrl && setPreviewImage(fileUrl)}
                style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    opacity: expired ? 0.8 : 1
                }}
            >
                <View
                    style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: expired ? '#fee2e2' : (expiring ? '#ffedd5' : colors.primary + '15'),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16
                    }}
                >
                    <FileText size={22} color={expired ? '#ef4444' : (expiring ? '#f97316' : colors.primary)} />
                </View>

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginRight: 8 }}>
                            {item.document_type}
                        </Text>
                        {expired && (
                            <View style={{ backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#ef4444' }}>EXPIRED</Text>
                            </View>
                        )}
                        {!expired && expiring && (
                            <View style={{ backgroundColor: '#ffedd5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: '#f97316' }}>EXPIRING</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 4 }}>
                        {item.expiry_date ? (
                            <Text style={{ fontSize: 12, color: expired ? '#ef4444' : (expiring ? '#f97316' : colors.mutedForeground), fontWeight: (expired || expiring) ? '600' : '400' }}>
                                Expires: {formatDate(item.expiry_date)}
                            </Text>
                        ) : (
                            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                                No Expiry Date
                            </Text>
                        )}
                        <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
                            Uploaded: {formatDate(item.updatedAt)}
                        </Text>
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    {/* Share Button (Optional) */}
                    {fileUrl && (
                        <TouchableOpacity onPress={() => handleShare(fileUrl)} style={{ padding: 8 }}>
                            <Share2 size={20} color={colors.foreground} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        onPress={() => Alert.alert("Delete", "Delete this document?", [
                            { text: "Cancel", style: "cancel" },
                            { text: "Delete", style: "destructive", onPress: () => deleteDocument(item._id) }
                        ])}
                        style={{ padding: 8 }}
                    >
                        <Trash2 size={20} color={colors.destructive || '#ef4444'} />
                    </TouchableOpacity>
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            {/* HEADER */}
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 16 }}>
                <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 16 }}>
                    <Ionicons name="arrow-back" size={24} color={colors.foreground} />
                </TouchableOpacity>
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>Documents</Text>
                <View style={{ flex: 1 }} />
                <TouchableOpacity
                    onPress={() => setModalVisible(true)}
                    style={{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', alignItems: 'center' }}
                >
                    <Plus size={16} color={colors.primaryForeground} />
                    <Text style={{ color: colors.primaryForeground, fontWeight: '600', marginLeft: 4 }}>Add</Text>
                </TouchableOpacity>
            </View>

            <View style={{ flex: 1 }}>
                {loading && !documents.length ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                    </View>
                ) : (
                    <FlatList
                        data={documents}
                        renderItem={renderDocumentItem}
                        keyExtractor={item => item._id}
                        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                        ListEmptyComponent={
                            <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
                                <FileText size={48} color={colors.mutedForeground} />
                                <Text style={{ marginTop: 16, fontSize: 16, color: colors.mutedForeground, fontWeight: '500' }}>No documents found</Text>
                            </View>
                        }
                    />
                )}
            </View>

            {/* ADD MODAL */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                    <View style={{ backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, maxHeight: '85%' }}>
                        <View style={{ width: 40, height: 4, backgroundColor: colors.border, alignSelf: 'center', borderRadius: 2, marginBottom: 20 }} />

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                            <Text style={{ fontSize: 20, fontWeight: '700', color: colors.foreground }}>New Document</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <X size={24} color={colors.foreground} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Type</Text>
                            <TextInput
                                value={docType}
                                onChangeText={setDocType}
                                placeholder="e.g. Insurance, Permit"
                                placeholderTextColor={colors.mutedForeground}
                                style={{ backgroundColor: colors.card, color: colors.foreground, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, marginBottom: 20 }}
                            />

                            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>Expiry Date (Optional)</Text>
                            <TouchableOpacity
                                onPress={() => setShowDatePicker(true)}
                                style={{ backgroundColor: colors.card, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}
                            >
                                <Text style={{ color: expiryDate ? colors.foreground : colors.mutedForeground }}>{expiryDate ? formatDate(expiryDate) : "Select Date"}</Text>
                                <Calendar size={20} color={colors.mutedForeground} />
                            </TouchableOpacity>
                            {showDatePicker && (
                                <DateTimePicker
                                    value={expiryDate || new Date()}
                                    mode="date"
                                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                                    onChange={(e, d) => { setShowDatePicker(Platform.OS === 'ios'); if (d) setExpiryDate(d); }}
                                />
                            )}

                            <Text style={{ fontSize: 12, color: colors.mutedForeground, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8 }}>File</Text>
                            <TouchableOpacity
                                onPress={handlePickDocument}
                                style={{ borderStyle: 'dashed', borderWidth: 2, borderColor: colors.border, borderRadius: 16, padding: 32, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, marginBottom: 32 }}
                            >
                                {selectedFile ? (
                                    <View style={{ alignItems: 'center' }}>
                                        <FileText size={32} color={colors.primary} />
                                        <Text style={{ marginTop: 8, fontWeight: '600', color: colors.foreground }}>{selectedFile.name}</Text>
                                        <Text style={{ fontSize: 12, color: colors.mutedForeground }}>Tap to change</Text>
                                    </View>
                                ) : (
                                    <View style={{ alignItems: 'center' }}>
                                        <Plus size={32} color={colors.mutedForeground} />
                                        <Text style={{ marginTop: 8, color: colors.mutedForeground }}>Tap to upload image</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleUpload}
                                disabled={uploading}
                                style={{ backgroundColor: uploading ? colors.muted : colors.primary, padding: 18, borderRadius: 16, alignItems: 'center', marginBottom: 20 }}
                            >
                                {uploading ? (
                                    <ActivityIndicator color={colors.primaryForeground} />
                                ) : (
                                    <Text style={{ color: colors.primaryForeground, fontWeight: '700', fontSize: 16 }}>Upload Document</Text>
                                )}
                            </TouchableOpacity>

                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* IMAGE PREVIEW */}
            <Modal visible={!!previewImage} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
                    <TouchableOpacity onPress={() => setPreviewImage(null)} style={{ position: 'absolute', top: 50, right: 24, zIndex: 10, backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                        <X size={24} color="white" />
                    </TouchableOpacity>
                    {previewImage && (
                        <Image source={{ uri: previewImage }} style={{ width: '100%', height: '80%' }} resizeMode="contain" />
                    )}
                </View>
            </Modal>

        </SafeAreaView>
    );
}
