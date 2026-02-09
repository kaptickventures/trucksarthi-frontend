import { create } from 'zustand';

export type TripStatus = 'Assigned' | 'Active' | 'PendingApproval' | 'Completed' | 'Rejected';

export interface Trip {
    id: string;
    source: string;
    destination: string;
    truckId: string;
    truckNumber: string;
    startTime?: string;
    endTime?: string;
    status: TripStatus;
    podImage?: string;
    rejectionReason?: string;
    driverName: string;
    clientName: string;
}

export interface Transaction {
    id: string;
    type: 'ReceivedFromOwner' | 'ReceivedFromClient' | 'ReceivedFromVendor' | 'GivenToOwner' | 'GivenToClient' | 'GivenToVendor';
    amount: number;
    description: string;
    date: string; // ISO String
    tripId?: string;
    createdAt: number; // Timestamp for 60-min window check
}

interface UserProfile {
    name: string;
    id: string;
    phone: string;
    address: string;
    profilePhoto: string | number; // URL or local path
    aadharUrl: string | number;
    licenseUrl: string | number;
}

export interface AppState {

    user: UserProfile | null;
    activeTrip: Trip | null;
    tripHistory: Trip[];
    ledger: Transaction[];
    notifications: string[];

    // Actions
    setActiveTrip: (trip: Trip | null) => void;
    updateTripStatus: (tripId: string, status: TripStatus, data?: Partial<Trip>) => void;
    addTransaction: (transaction: Transaction) => void;
    editTransaction: (id: string, updates: Partial<Transaction>) => void;
    deleteTransaction: (id: string) => void;
    addNotification: (message: string) => void;
    initializeData: () => void;
    logout: () => void;
    language: 'en' | 'hi';
    setLanguage: (lang: 'en' | 'hi') => void;
}

export const useStore = create<AppState>()((set) => ({

    user: {
        name: 'Nikhil',
        id: 'driver_123',
        phone: '+91 98765 43210',
        address: '123, Transport Nagar, Delhi',
        profilePhoto: 'https://placehold.co/400x400/0EA5E9/FFFFFF?text=Driver+Profile',
        aadharUrl: 'https://placehold.co/600x400/64748B/FFFFFF?text=Aadhaar+Card',
        licenseUrl: 'https://placehold.co/600x400/64748B/FFFFFF?text=Driving+License',
    },
    activeTrip: null,
    tripHistory: [],
    ledger: [],
    notifications: [],
    language: 'en',
    setLanguage: (lang: 'en' | 'hi') => set({ language: lang }),

    setActiveTrip: (trip: Trip | null) => set({ activeTrip: trip }),

    updateTripStatus: (tripId: string, status: TripStatus, data?: Partial<Trip>) =>
        set((state: AppState) => {
            if (state.activeTrip && state.activeTrip.id === tripId) {
                const updatedTrip = { ...state.activeTrip, status, ...data };
                if (status === 'Completed') {
                    return {
                        activeTrip: null,
                        tripHistory: [updatedTrip, ...state.tripHistory]
                    };
                }
                return { activeTrip: updatedTrip };
            }
            return state;
        }),

    addTransaction: (txn: Transaction) => set((state: AppState) => ({ ledger: [txn, ...state.ledger] })),

    editTransaction: (id: string, updates: Partial<Transaction>) =>
        set((state: AppState) => ({
            ledger: state.ledger.map(t => t.id === id ? { ...t, ...updates } : t)
        })),

    deleteTransaction: (id: string) =>
        set((state: AppState) => ({
            ledger: state.ledger.filter(t => t.id !== id)
        })),

    addNotification: (msg: string) => set((state: AppState) => ({ notifications: [msg, ...state.notifications] })),


    logout: () => set({ user: null }),

    initializeData: () => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const twoDaysAgo = new Date(today);
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
        const lastWeek = new Date(today);
        lastWeek.setDate(lastWeek.getDate() - 7);
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);

        set({
            activeTrip: {
                id: 'trip_101',
                source: 'Delhi Warehouse',
                destination: 'Mumbai Port',
                truckId: 'truck_01',
                truckNumber: 'HR-55-1234',
                status: 'Active',
                startTime: today.toISOString(),
                driverName: 'Ramesh Kumar',
                clientName: 'ABC Logistics Pvt Ltd',
            },
            tripHistory: [
                {
                    id: 'trip_120',
                    source: 'Gurgaon Hub',
                    destination: 'Noida Sector 62',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0).toISOString(),
                    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 30).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'QuickMove Express',
                },
                {
                    id: 'trip_119',
                    source: 'Faridabad Factory',
                    destination: 'Delhi Airport',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
                    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 12, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'AirCargo Solutions',
                },
                {
                    id: 'trip_118',
                    source: 'Manesar Plant',
                    destination: 'Rohtak Market',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
                    endTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 30).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Haryana Traders',
                },
                {
                    id: 'trip_117',
                    source: 'Jaipur',
                    destination: 'Delhi',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 5, 0).toISOString(),
                    endTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 10, 30).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Rajasthan Freight',
                },
                {
                    id: 'trip_116',
                    source: 'Delhi',
                    destination: 'Chandigarh',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 12, 0).toISOString(),
                    endTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 17, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Punjab Logistics',
                },
                {
                    id: 'trip_115',
                    source: 'Chandigarh',
                    destination: 'Ludhiana',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 18, 0).toISOString(),
                    endTime: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 21, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Industrial Movers',
                },
                {
                    id: 'trip_114',
                    source: 'Ludhiana',
                    destination: 'Amritsar',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 7, 0).toISOString(),
                    endTime: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 11, 30).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Border Transport Co',
                },
                {
                    id: 'trip_113',
                    source: 'Amritsar',
                    destination: 'Jalandhar',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 14, 0).toISOString(),
                    endTime: new Date(twoDaysAgo.getFullYear(), twoDaysAgo.getMonth(), twoDaysAgo.getDate(), 17, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'City Cargo Services',
                },
                {
                    id: 'trip_112',
                    source: 'Delhi',
                    destination: 'Agra',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 6, 0).toISOString(),
                    endTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 10, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'UP Transport',
                },
                {
                    id: 'trip_111',
                    source: 'Agra',
                    destination: 'Lucknow',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 12, 0).toISOString(),
                    endTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate(), 19, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Capital Freight',
                },
                {
                    id: 'trip_110',
                    source: 'Lucknow',
                    destination: 'Kanpur',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() + 1, 8, 0).toISOString(),
                    endTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() + 1, 11, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Metro Logistics',
                },
                {
                    id: 'trip_109',
                    source: 'Kanpur',
                    destination: 'Allahabad',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() + 1, 13, 0).toISOString(),
                    endTime: new Date(lastWeek.getFullYear(), lastWeek.getMonth(), lastWeek.getDate() + 1, 16, 30).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'River City Movers',
                },
                {
                    id: 'trip_108',
                    source: 'Allahabad',
                    destination: 'Varanasi',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastWeek.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 2, 7, 0).toISOString(),
                    endTime: new Date(lastWeek.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 2, 10, 30).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Temple City Transport',
                },
                {
                    id: 'trip_107',
                    source: 'Delhi',
                    destination: 'Kolkata',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate(), 5, 0).toISOString(),
                    endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 1, 22, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'East India Logistics',
                },
                {
                    id: 'trip_106',
                    source: 'Kolkata',
                    destination: 'Bhubaneswar',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 3, 6, 0).toISOString(),
                    endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 3, 14, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Odisha Freight',
                },
                {
                    id: 'trip_105',
                    source: 'Bhubaneswar',
                    destination: 'Visakhapatnam',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 4, 7, 0).toISOString(),
                    endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 4, 15, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Coastal Carriers',
                },
                {
                    id: 'trip_104',
                    source: 'Visakhapatnam',
                    destination: 'Hyderabad',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 5, 6, 0).toISOString(),
                    endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 5, 13, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Telangana Transport',
                },
                {
                    id: 'trip_103',
                    source: 'Hyderabad',
                    destination: 'Bangalore',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 6, 5, 0).toISOString(),
                    endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 6, 16, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Silicon Valley Movers',
                },
                {
                    id: 'trip_102',
                    source: 'Bangalore',
                    destination: 'Chennai',
                    truckId: 'truck_01',
                    truckNumber: 'HR-55-1234',
                    status: 'Completed',
                    startTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 7, 6, 0).toISOString(),
                    endTime: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), lastMonth.getDate() + 7, 12, 0).toISOString(),
                    driverName: 'Ramesh Kumar',
                    clientName: 'Tamil Nadu Logistics',
                },
            ],
            ledger: [
                { id: 'tx_1', type: 'ReceivedFromOwner', amount: 5000, description: 'Advance for Trip 101', date: new Date().toISOString(), tripId: 'trip_101', createdAt: Date.now() },
                { id: 'tx_2', type: 'GivenToVendor', amount: 2000, description: 'Diesel', date: new Date().toISOString(), tripId: 'trip_101', createdAt: Date.now() - 3600000 - 1000 },
            ],
            notifications: [
                'Truck HR-55-1234 insurance expires in 5 days',
            ]
        });
    }
}));
