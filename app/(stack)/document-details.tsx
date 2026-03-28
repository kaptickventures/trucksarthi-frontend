import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Calendar, FileText, Plus, Share2, Trash2, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Share,
    StatusBar,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import { useThemeStore } from "../../hooks/useThemeStore";
import useTrucks from "../../hooks/useTruck";
import useTruckDocuments from "../../hooks/useTruckDocuments";
import { formatDate as globalFormatDate, getFileUrl } from "../../lib/utils";
import { useTranslation } from "../../context/LanguageContext";
import BottomSheet from "../../components/BottomSheet";

const DEFAULT_DOCUMENT_TYPES = [
    "INSURANCE",
    "PUCC",
    "FITNESS CERTIFICATE",
    "ROAD TAX",
    "RC",
    "STATE PERMIT",
    "NATIONAL PERMIT"
] as const;

export default function DocumentDetails() {
    const { truckId } = useLocalSearchParams<{ truckId: string }>();
    const router = useRouter();
    const { theme, colors } = useThemeStore();
    const { t } = useTranslation();
    const isDark = theme === "dark";
    const { documents, loading, uploadDocument, deleteDocument } = useTruckDocuments(truckId);
    const { trucks } = useTrucks();

    const [modalVisible, setModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // Form States
    const [docType, setDocType] = useState("");
    const [selectedFile, setSelectedFile] = useState<any>(null);
    const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const truck = useMemo(() => trucks.find(t => t._id === truckId), [trucks, truckId]);
    const truckNumber = truck?.registration_number || "Unknown Truck";

    // Helper
    const formatDate = (dateString?: string | Date) => globalFormatDate(dateString);

    const getExpiryFromTruck = (docType: string) => {
        if (!truck) return undefined;
        const type = docType.toUpperCase();
        if (type === "INSURANCE") return truck.insurance_upto;
        if (type === "PUCC") return truck.pollution_upto;
        if (type === "FITNESS CERTIFICATE" || type === "FITNESS") return truck.fitness_upto;
        if (type === "ROAD TAX") return truck.road_tax_upto;
        if (type === "RC") {
            const regDateStr = truck.registration_date || (truck.rc_details as any)?.reg_date;
            if (regDateStr) {
                const date = new Date(regDateStr);
                if (!isNaN(date.getTime())) {
                    date.setFullYear(date.getFullYear() + 15);
                    return date.toISOString();
                }
            }
            return (truck.rc_details as any)?.rc_expiry_date || truck.fitness_upto;
        }
        if (type === "STATE PERMIT" || type === "PERMIT") return truck.permit_upto;
        if (type === "NATIONAL PERMIT") return truck.national_permit_upto;
        return undefined;
    };

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

    const pickDocumentFile = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ["images"],
                allowsEditing: true,
                quality: 0.8,
            });

            if (!result.canceled) {
                return {
                    uri: result.assets[0].uri,
                    name: result.assets[0].fileName || `doc_${Date.now()}.jpg`,
                    type: result.assets[0].mimeType || 'image/jpeg',
                };
            }
            return null;
        } catch {
            Alert.alert("Error", "Failed to pick file");
            return null;
        }
    };

    const handlePickDocument = async () => {
        const file = await pickDocumentFile();
        if (file) setSelectedFile(file);
    };

    const handleQuickUpload = async (documentType: string, existingExpiryDate?: string) => {
        const file = await pickDocumentFile();
        if (!file || !truckId) return;

        try {
            setUploading(true);
            await uploadDocument({
                truck_id: truckId,
                document_type: documentType,
                file,
                expiry_date: existingExpiryDate || "",
            });
            Alert.alert("Success", `${documentType} uploaded successfully`);
        } catch {
            // handled by hook
        } finally {
            setUploading(false);
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
            // Web can't share local files via expo-sharing reliably.
            if (Platform.OS === "web") {
                await Share.share({ message: url });
                return;
            }

            const canShare = await Sharing.isAvailableAsync();
            if (!canShare) {
                await Share.share({ message: url });
                return;
            }

            const ext = (() => {
                const clean = url.split("?")[0];
                const idx = clean.lastIndexOf(".");
                return (idx > -1 ? clean.substring(idx) : ".jpg").toLowerCase();
            })();
            const localPath = `${FileSystem.cacheDirectory}truck_doc_${Date.now()}${ext}`;
            const isPdf = ext === ".pdf";
            const mimeType = isPdf ? "application/pdf" : "image/*";

            const downloaded = await FileSystem.downloadAsync(url, localPath);
            await Sharing.shareAsync(downloaded.uri, {
                mimeType,
                dialogTitle: "Share Truck Document",
            });
        } catch (error) {
            try {
                await Share.share({ message: url });
            } catch {
                Alert.alert("Error", "Failed to share document");
            }
        }
    }

    const mergedDocuments = useMemo(() => {
        const docsByType = new Map(
            (documents || []).map((doc: any) => [String(doc.document_type || "").toUpperCase(), doc])
        );

        const defaults = DEFAULT_DOCUMENT_TYPES.map((docType) => {
            const existing = docsByType.get(docType);
            const truckDate = getExpiryFromTruck(docType);

            if (existing) {
                return {
                    ...existing,
                    expiry_date: truckDate || existing.expiry_date
                };
            }

            return {
                _id: `placeholder-${docType}`,
                truck: truckId,
                document_type: docType,
                file_url: "",
                expiry_date: truckDate,
                status: "active",
                createdAt: undefined,
                updatedAt: undefined,
                __isPlaceholder: true,
            };
        });

        const defaultSet = new Set(DEFAULT_DOCUMENT_TYPES);
        const customDocs = (documents || []).filter(
            (doc: any) => !defaultSet.has(String(doc.document_type || "").toUpperCase() as any)
        ).map((doc: any) => ({
            ...doc,
            expiry_date: getExpiryFromTruck(doc.document_type) || doc.expiry_date
        }));

        return [...defaults, ...customDocs];
    }, [documents, truckId, truck]);

    const filteredDocuments = useMemo(() => {
        if (!searchQuery.trim()) return mergedDocuments;
        return mergedDocuments.filter(doc =>
            doc.document_type.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [mergedDocuments, searchQuery]);

    const renderDocumentItem = ({ item }: { item: any }) => {
        const expired = isExpired(item.expiry_date);
        const expiring = isExpiring(item.expiry_date);
        const fileUrl = getFileUrl(item.file_url);
        const hasUploadedFile = Boolean(item.file_url);
        const isPlaceholder = Boolean(item.__isPlaceholder);

        return (
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => hasUploadedFile && fileUrl && setPreviewImage(fileUrl)}
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
                        backgroundColor: expired ? colors.destructiveSoft : (expiring ? colors.warningSoft : colors.accent),
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 16
                    }}
                >
                    <FileText size={22} color={expired ? colors.destructive : (expiring ? colors.warning : colors.primary)} />
                </View>

                <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.foreground, marginRight: 8 }}>
                            {item.document_type}
                        </Text>
                        {expired && (
                            <View style={{ backgroundColor: colors.destructiveSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.destructive }}>EXPIRED</Text>
                            </View>
                        )}
                        {!expired && expiring && (
                            <View style={{ backgroundColor: colors.warningSoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 10, fontWeight: '700', color: colors.warning }}>EXPIRING</Text>
                            </View>
                        )}
                    </View>

                    <View style={{ marginTop: 4 }}>
                        {item.expiry_date ? (
                            <Text style={{ fontSize: 12, color: expired ? colors.destructive : (expiring ? colors.warning : colors.mutedForeground), fontWeight: (expired || expiring) ? '600' : '400' }}>
                                Expires: {formatDate(item.expiry_date)}
                            </Text>
                        ) : (
                            <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                                {hasUploadedFile ? "No Expiry Date" : "Not uploaded yet"}
                            </Text>
                        )}
                    </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                        disabled={uploading}
                        onPress={() => handleQuickUpload(String(item.document_type || "").toUpperCase(), item.expiry_date)}
                        style={{ padding: 8 }}
                    >
                        <Ionicons name={hasUploadedFile ? "refresh-outline" : "cloud-upload-outline"} size={20} color={colors.primary} />
                    </TouchableOpacity>

                    {/* Share Button (Optional) */}
                    {hasUploadedFile && fileUrl && (
                        <TouchableOpacity onPress={() => handleShare(fileUrl)} style={{ padding: 8 }}>
                            <Share2 size={20} color={colors.foreground} />
                        </TouchableOpacity>
                    )}

                    {hasUploadedFile && !isPlaceholder && (
                        <TouchableOpacity
                            onPress={() => Alert.alert("Delete", "Delete this document?", [
                                { text: "Cancel", style: "cancel" },
                                { text: "Delete", style: "destructive", onPress: () => deleteDocument(item._id) }
                            ])}
                            style={{ padding: 8 }}
                        >
                            <Trash2 size={20} color={colors.destructive} />
                        </TouchableOpacity>
                    )}
                </View>

            </TouchableOpacity>
        );
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === "ios" ? "padding" : "height"}
            >
                <FlatList
                    data={filteredDocuments}
                    renderItem={renderDocumentItem}
                    keyExtractor={item => item._id}
                    contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                    ListHeaderComponent={
                        <View className="mb-3">
                            <View className="flex-row justify-between items-center mb-3">
                                <View>
                                    <Text className="text-[24px] font-black" style={{ color: colors.foreground }}>{t('documents')}</Text>
                                    <Text className="text-sm opacity-60" style={{ color: colors.foreground }}>
                                        {`Truck: ${truckNumber} `}
                                    </Text>
                                </View>
                                <TouchableOpacity
                                    onPress={() => setModalVisible(true)}
                                    style={{ backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center' }}
                                >
                                    <Plus size={16} color={colors.primaryForeground} />
                                    <Text style={{ color: colors.primaryForeground, fontWeight: '600', marginLeft: 4 }}>Add</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Search Bar */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    backgroundColor: colors.card,
                                    borderWidth: 1,
                                    borderColor: colors.border,
                                    borderRadius: 12,
                                    paddingHorizontal: 12,
                                    height: 50,
                                }}
                            >
                                <Ionicons name="search" size={18} color={colors.mutedForeground} />
                                <TextInput
                                    style={{
                                        flex: 1,
                                        marginLeft: 10,
                                        fontSize: 15,
                                        color: colors.foreground,
                                        paddingVertical: 0,
                                        includeFontPadding: false,
                                    }}
                                    placeholder="Search documents..."
                                    placeholderTextColor={colors.mutedForeground}
                                    value={searchQuery}
                                    onChangeText={setSearchQuery}
                                    autoCapitalize="none"
                                />
                                {searchQuery.length > 0 && (
                                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                                        <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
                                    </TouchableOpacity>
                                )}
                            </View>
                        </View>
                    }
                    ListEmptyComponent={
                        <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 80 }}>
                            <FileText size={48} color={colors.mutedForeground} />
                            <Text style={{ marginTop: 16, fontSize: 16, color: colors.mutedForeground, fontWeight: '500' }}>No documents found</Text>
                        </View>
                    }
                />
            </KeyboardAvoidingView>

            {/* ADD MODAL */}
            <BottomSheet
                visible={modalVisible}
                onClose={() => setModalVisible(false)}
                title="New Document"
                maxHeight="70%"
            >
                        <KeyboardAwareScrollView
                            showsVerticalScrollIndicator={false}
                            enableOnAndroid
                            extraScrollHeight={0}
                            keyboardShouldPersistTaps="handled"
                        >
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

                        </KeyboardAwareScrollView>
            </BottomSheet>

            {/* IMAGE PREVIEW */}
            <BottomSheet
                visible={!!previewImage}
                onClose={() => setPreviewImage(null)}
                title="Preview"
                maxHeight="70%"
            >
                <View style={{ paddingTop: 8 }}>
                    {previewImage && (
                        <Image source={{ uri: previewImage }} style={{ width: '100%', height: 360 }} resizeMode="contain" />
                    )}
                </View>
            </BottomSheet>
        </View>
    );
}
