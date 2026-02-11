import { Ionicons } from "@expo/vector-icons";
import {
    User as UserIcon,
    Download,
    Share2,
    Copy,
    MapPin,
    Phone,
    CreditCard,
    FileText,
} from "lucide-react-native";
import { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    Share,
    Platform,
    Clipboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import "../../global.css";
import DriverScreenHeader from "../../components/driver/DriverScreenHeader";
import { useThemeStore } from "../../hooks/useThemeStore";
import { useUser } from "../../hooks/useUser";
import { getFileUrl } from "../../lib/utils";

export default function DriverOwnProfile() {
    const { theme, colors } = useThemeStore();
    const { user } = useUser();

    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [previewType, setPreviewType] = useState<'license' | 'aadhaar' | null>(null);

    if (!user) return null;

    const handleViewDocument = (url: string | undefined | null, type: 'license' | 'aadhaar') => {
        if (!url) return;
        setPreviewImage(getFileUrl(url));
        setPreviewType(type);
    };

    const handleDownloadDocument = async (url: string | undefined | null, documentName: string) => {
        if (!url) return;

        try {
            const { status } = await MediaLibrary.requestPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission Required', 'Please grant media library permissions to download documents.');
                return;
            }

            const fileUrl = getFileUrl(url);
            if (!fileUrl) return;

            const fileExtension = fileUrl.split('.').pop() || 'jpg';
            const fileName = `${documentName}_${Date.now()}.${fileExtension}`;
            const fileUri = `${(FileSystem as any).documentDirectory}${fileName}`;

            const { uri: downloadUri } = await FileSystem.downloadAsync(fileUrl, fileUri);

            const asset = await MediaLibrary.createAssetAsync(downloadUri);
            await MediaLibrary.createAlbumAsync('Trucksarthi', asset, false);
            Alert.alert('Success', `${documentName} downloaded successfully!`);
        } catch (error) {
            console.error('Download error:', error);
            Alert.alert('Error', 'Failed to download document');
        }
    };

    const handleShareDocument = async (url: string | undefined | null, documentName: string) => {
        if (!url) return;

        try {
            const fileUrl = getFileUrl(url);
            if (!fileUrl) return;

            await Share.share({
                message: `${documentName} - ${user.name}`,
                url: fileUrl,
                title: documentName,
            });
        } catch (error) {
            console.error('Share error:', error);
            Alert.alert('Error', 'Failed to share document');
        }
    };

    const handleCopyToClipboard = (text: string, label: string) => {
        Clipboard.setString(text);
        Alert.alert('Copied!', `${label} copied to clipboard`);
    };

    const closePreview = () => {
        setPreviewImage(null);
        setPreviewType(null);
    };

    // Extract document numbers (you may need to add these fields to User type)
    const aadhaarNumber = (user as any).aadhaar_number || "Not Available";
    const licenseNumber = (user as any).license_number || "Not Available";

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View style={{ flex: 1 }}>
                <DriverScreenHeader title="My Profile" />

                <ScrollView
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 40 }}
                >
                    {/* Profile Header */}
                    <View style={{ alignItems: 'center', marginVertical: 24 }}>
                        <View style={{
                            width: 120,
                            height: 120,
                            borderRadius: 60,
                            borderWidth: 4,
                            borderColor: colors.primary,
                            overflow: 'hidden',
                            backgroundColor: colors.muted,
                            marginBottom: 16
                        }}>
                            {user.profile_picture_url ? (
                                <Image source={{ uri: getFileUrl(user.profile_picture_url) || "" }} style={{ width: '100%', height: '100%' }} />
                            ) : (
                                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                                    <UserIcon size={60} color={colors.mutedForeground} />
                                </View>
                            )}
                        </View>

                        <Text style={{ fontSize: 24, fontWeight: 'bold', color: colors.foreground }}>
                            {user.name || "Driver"}
                        </Text>
                        <Text style={{ fontSize: 16, color: colors.mutedForeground, marginTop: 4 }}>
                            {user.phone || ""}
                        </Text>
                    </View>

                    <View style={{ height: 1, backgroundColor: colors.border, marginHorizontal: 24, marginBottom: 24 }} />

                    {/* Personal Details Section */}
                    <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>Personal Details</Text>

                        <View style={{ gap: 12 }}>
                            <InfoRow icon={<UserIcon size={18} color={colors.mutedForeground} />} label="Full Name" value={user.name || "Not Available"} />
                            <InfoRow icon={<Phone size={18} color={colors.mutedForeground} />} label="Phone Number" value={user.phone || "Not Available"} />
                            <InfoRow icon={<MapPin size={18} color={colors.mutedForeground} />} label="Address" value={user.address || "Not Available"} multiline />
                        </View>

                        <View style={{
                            marginTop: 12,
                            padding: 12,
                            backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.1)' : '#eff6ff',
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.2)' : '#bfdbfe'
                        }}>
                            <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>
                                ℹ️ These details are managed by your fleet owner and cannot be edited here.
                            </Text>
                        </View>
                    </View>

                    {/* Identity Documents Section */}
                    <View style={{ paddingHorizontal: 24, marginBottom: 32 }}>
                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.foreground, marginBottom: 16 }}>Identity Documents</Text>

                        {/* Aadhaar Card */}
                        <DocumentSection
                            title="Aadhaar Card"
                            documentNumber={aadhaarNumber}
                            imageUrl={user.identity_card_url}
                            onView={() => handleViewDocument(user.identity_card_url, 'aadhaar')}
                            onDownload={() => handleDownloadDocument(user.identity_card_url, 'Aadhaar_Card')}
                            onShare={() => handleShareDocument(user.identity_card_url, 'Aadhaar Card')}
                            onCopyNumber={() => handleCopyToClipboard(aadhaarNumber, 'Aadhaar Number')}
                            colors={colors}
                            theme={theme}
                        />

                        <View style={{ height: 24 }} />

                        {/* Driving License */}
                        <DocumentSection
                            title="Driving License"
                            documentNumber={licenseNumber}
                            imageUrl={user.license_card_url}
                            onView={() => handleViewDocument(user.license_card_url, 'license')}
                            onDownload={() => handleDownloadDocument(user.license_card_url, 'Driving_License')}
                            onShare={() => handleShareDocument(user.license_card_url, 'Driving License')}
                            onCopyNumber={() => handleCopyToClipboard(licenseNumber, 'License Number')}
                            colors={colors}
                            theme={theme}
                        />
                    </View>
                </ScrollView>
            </View>

            {/* Image Preview Modal */}
            <Modal visible={!!previewImage} transparent animationType="fade">
                <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)' }}>
                    <SafeAreaView style={{ flex: 1 }}>
                        {/* Header with actions */}
                        <View style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            paddingHorizontal: 20,
                            paddingVertical: 12
                        }}>
                            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600' }}>
                                {previewType === 'license' ? 'Driving License' : 'Aadhaar Card'}
                            </Text>
                            <View style={{ flexDirection: 'row', gap: 16 }}>
                                <TouchableOpacity
                                    onPress={() => {
                                        const url = previewType === 'license' ? user.license_card_url : user.identity_card_url;
                                        const name = previewType === 'license' ? 'Driving_License' : 'Aadhaar_Card';
                                        handleDownloadDocument(url, name);
                                    }}
                                    style={{ padding: 8 }}
                                >
                                    <Download size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={() => {
                                        const url = previewType === 'license' ? user.license_card_url : user.identity_card_url;
                                        const name = previewType === 'license' ? 'Driving License' : 'Aadhaar Card';
                                        handleShareDocument(url, name);
                                    }}
                                    style={{ padding: 8 }}
                                >
                                    <Share2 size={24} color="white" />
                                </TouchableOpacity>
                                <TouchableOpacity onPress={closePreview} style={{ padding: 8 }}>
                                    <Ionicons name="close" size={24} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Image */}
                        <TouchableOpacity
                            activeOpacity={1}
                            onPress={closePreview}
                            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                        >
                            <Image
                                source={{ uri: previewImage || "" }}
                                style={{ width: '95%', height: '90%' }}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
}

// Info Row Component
function InfoRow({ icon, label, value, multiline }: { icon: React.ReactNode, label: string, value: string, multiline?: boolean }) {
    const { colors } = useThemeStore();

    return (
        <View style={{
            backgroundColor: colors.card,
            padding: 16,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: colors.border
        }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {icon}
                <Text style={{ fontSize: 12, fontWeight: '600', color: colors.mutedForeground, marginLeft: 8, textTransform: 'uppercase' }}>
                    {label}
                </Text>
            </View>
            <Text style={{
                fontSize: 16,
                color: colors.foreground,
                fontWeight: '500',
                ...(multiline && { lineHeight: 22 })
            }}>
                {value}
            </Text>
        </View>
    );
}

// Document Section Component
function DocumentSection({
    title,
    documentNumber,
    imageUrl,
    onView,
    onDownload,
    onShare,
    onCopyNumber,
    colors,
    theme
}: {
    title: string;
    documentNumber: string;
    imageUrl: string | undefined | null;
    onView: () => void;
    onDownload: () => void;
    onShare: () => void;
    onCopyNumber: () => void;
    colors: any;
    theme: string;
}) {
    const hasDocument = !!imageUrl;

    return (
        <View style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: 'hidden'
        }}>
            {/* Document Image */}
            <TouchableOpacity
                onPress={hasDocument ? onView : undefined}
                disabled={!hasDocument}
                activeOpacity={0.8}
                style={{
                    width: '100%',
                    aspectRatio: 16 / 10,
                    backgroundColor: colors.muted,
                    justifyContent: 'center',
                    alignItems: 'center'
                }}
            >
                {hasDocument ? (
                    <Image
                        source={{ uri: getFileUrl(imageUrl) || "" }}
                        style={{ width: '100%', height: '100%' }}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={{ alignItems: 'center', opacity: 0.5 }}>
                        <FileText size={40} color={colors.mutedForeground} />
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 8 }}>No Document Uploaded</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Document Info */}
            <View style={{ padding: 16 }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: colors.foreground, marginBottom: 12 }}>
                    {title}
                </Text>

                {/* Document Number */}
                <TouchableOpacity
                    onPress={onCopyNumber}
                    disabled={documentNumber === "Not Available"}
                    style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        padding: 12,
                        borderRadius: 10,
                        marginBottom: 12
                    }}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <CreditCard size={16} color={colors.mutedForeground} />
                        <Text style={{
                            fontSize: 14,
                            color: colors.foreground,
                            marginLeft: 8,
                            fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                            fontWeight: '600'
                        }}>
                            {documentNumber}
                        </Text>
                    </View>
                    {documentNumber !== "Not Available" && (
                        <Copy size={16} color={colors.primary} />
                    )}
                </TouchableOpacity>

                {/* Action Buttons */}
                {hasDocument && (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                        <TouchableOpacity
                            onPress={onView}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: colors.primary,
                                paddingVertical: 12,
                                borderRadius: 10,
                                gap: 6
                            }}
                        >
                            <Ionicons name="eye-outline" size={18} color={colors.primaryForeground} />
                            <Text style={{ color: colors.primaryForeground, fontWeight: '600', fontSize: 14 }}>View</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onDownload}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                paddingVertical: 12,
                                borderRadius: 10,
                                gap: 6
                            }}
                        >
                            <Download size={18} color={colors.foreground} />
                            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>Download</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={onShare}
                            style={{
                                flex: 1,
                                flexDirection: 'row',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                paddingVertical: 12,
                                borderRadius: 10,
                                gap: 6
                            }}
                        >
                            <Share2 size={18} color={colors.foreground} />
                            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: 14 }}>Share</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}
