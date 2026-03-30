import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import API from '../app/api/axiosInstance';
import useTrucks from '../hooks/useTruck';
import useTruckDocuments from '../hooks/useTruckDocuments';
import { useAuth } from './AuthContext';

interface NotificationContextType {
    notificationCount: number;
    reminderCount: number;
    totalCount: number;
    refresh: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    const { trucks, fetchTrucks } = useTrucks(Boolean(user), true);
    const { documents, fetchDocuments } = useTruckDocuments(undefined, Boolean(user), true);
    const [notifications, setNotifications] = useState<any[]>([]);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        try {
            const response = await API.get("/api/notifications/my");
            setNotifications(response.data.notifications || []);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    }, [user]);

    const refresh = useCallback(async () => {
        if (!user) return;
        await Promise.all([
            fetchNotifications(),
            fetchTrucks(),
            fetchDocuments()
        ]);
    }, [user, fetchNotifications, fetchTrucks, fetchDocuments]);

    useEffect(() => {
        if (user) {
            fetchNotifications();
        }
    }, [user, fetchNotifications]);

    const parseExpiryDate = (value: any): Date | null => {
        if (!value) return null;
        const direct = new Date(value);
        if (!Number.isNaN(direct.getTime())) return direct;
        if (typeof value !== "string") return null;
        const normalized = value.trim();
        const parts = normalized.split(/[-/]/);
        if (parts.length === 3) {
            const [p1, p2, p3] = parts.map((p) => Number(p));
            if (p1 > 0 && p2 > 0 && p3 > 999) {
                const d = new Date(p3, p2 - 1, p1);
                if (!Number.isNaN(d.getTime())) return d;
            }
        }
        return null;
    };

    const isWithinReminderWindow = (expiry: Date): boolean => {
        const today = new Date();
        const expiryStart = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
        const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const diffTime = expiryStart.getTime() - todayStart.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
    };

    const reminderCount = useMemo(() => {
        if (!user || !trucks.length) return 0;
        
        let count = 0;
        
        // Track unique reminders to avoid double counting between docs and fields
        const processedReminders = new Set<string>();

        // Uploaded doc reminders
        documents.forEach(doc => {
            const rawExpiry = (doc as any).expiry_date ?? (doc as any).expiryDate;
            const expiry = parseExpiryDate(rawExpiry);
            if (expiry && isWithinReminderWindow(expiry)) {
                const truckId = typeof doc.truck === 'object' ? doc.truck?._id : doc.truck;
                processedReminders.add(`${truckId}-${doc.document_type?.toUpperCase()}`);
                count++;
            }
        });

        // Truck field reminders
        const fields: { type: string; read: (truck: any) => any }[] = [
            { type: "INSURANCE", read: (truck) => truck.insurance_upto || truck?.rc_details?.vehicle_insurance_upto },
            { type: "FITNESS CERTIFICATE", read: (truck) => truck.fitness_upto || truck?.rc_details?.rc_expiry_date },
            { type: "STATE PERMIT", read: (truck) => truck.permit_upto || truck?.rc_details?.permit_valid_upto },
            { type: "PUCC", read: (truck) => truck.pollution_upto || truck?.rc_details?.pucc_upto },
            { type: "ROAD TAX", read: (truck) => truck.road_tax_upto || truck?.rc_details?.vehicle_tax_upto },
        ];

        trucks.forEach(truck => {
            fields.forEach(field => {
                const key = `${truck._id}-${field.type}`;
                if (processedReminders.has(key)) return;

                const expiry = parseExpiryDate(field.read(truck));
                if (expiry && isWithinReminderWindow(expiry)) {
                    count++;
                }
            });
        });

        return count;
    }, [user, documents, trucks]);

    const notificationCount = useMemo(() => {
        // Filtering only "SCHEDULED" which is treated as "Pending" in the app
        return notifications.filter(n => n.status === "SCHEDULED").length;
    }, [notifications]);

    const totalCount = notificationCount + reminderCount;

    return (
        <NotificationContext.Provider value={{ notificationCount, reminderCount, totalCount, refresh }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotificationCount = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotificationCount must be used within a NotificationProvider');
    }
    return context;
};
