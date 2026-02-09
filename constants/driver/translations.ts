export const translations = {
    en: {
        // Navigation
        home: 'Home',
        history: 'History',
        khata: 'Khata',
        notifications: 'Notifications',
        chat: 'Chat',

        // Sidebar
        profile: 'Driver Profile',
        viewAadhaar: 'View Aadhaar',
        viewLicense: 'View License',
        callOwner: 'Call Owner',
        logout: 'Logout',
        language: 'Language',
        changeLanguage: 'Change Language',
        notLoggedIn: 'Not logged in.',

        // Dashboard
        activeTrips: 'Active Trips',
        completedToday: 'Completed Today',
        noActiveTrips: 'No active trips assigned.',
        tripId: 'TRIP ID',
        status: 'STATUS',
        driver: 'Driver',
        client: 'Client',
        route: 'Route',
        from: 'From',
        to: 'To',
        vehicle: 'VEHICLE',
        tripsThisMonth: 'Trips This Month',
        netKhata: 'Net Khata',

        // Trip Details
        tripDetails: 'Trip Details',
        addExpense: 'Add Trip Expense',
        completeTrip: 'Complete Trip & Upload POD',
        retakePod: 'Retake POD',
        podPreview: 'POD Preview',
        retake: 'Retake',
        confirmSubmit: 'Confirm & Submit',
        waitingApproval: 'Waiting for Owner Approval',
        rejectionReason: 'REJECTION REASON',
        pleaseRetake: 'Please retake the POD.',

        // Expense Modal
        amount: 'Amount (₹)',
        description: 'Vendor Name & Description',
        saveExpense: 'Add Expense',
        enterAmount: 'e.g. 5000',
        enterDesc: 'e.g. Shell Pump - Diesel',

        // Khata
        totalBalance: 'Total Balance',
        addEntry: 'Add Entry',
        received: 'Received',
        given: 'Given',
        noTransactions: 'No transactions yet',
        partyType: 'Party Type',
        owner: 'Owner',
        vendor: 'Vendor',
        saveEntry: 'Save Entry',

        // History
        filterToday: 'Today',
        filterYesterday: 'Yesterday',
        filterThisWeek: 'This Week',
        filterLastWeek: 'Last Week',
        filterLastMonth: 'Last Month',
        filterOlder: 'Older',

        // Common
        loading: 'Loading...',
        success: 'Success',
        error: 'Error',
        cancel: 'Cancel',
        uploading: 'Uploading...',
        totalExpenses: 'Total Expenses',
    },
    hi: {
        // Navigation
        home: 'होम',
        history: 'इतिहास',
        khata: 'खाता',
        notifications: 'सूचनाएं',
        chat: 'चैट',

        // Sidebar
        profile: 'ड्राइवर प्रोफाइल',
        viewAadhaar: 'आधार देखें',
        viewLicense: 'लाइसेंस देखें',
        callOwner: 'मालिक को कॉल करें',
        logout: 'लॉग आउट',
        language: 'भाषा',
        changeLanguage: 'भाषा बदलें',
        notLoggedIn: 'लॉग इन नहीं है।',

        // Dashboard
        activeTrips: 'सक्रिय ट्रिप',
        completedToday: 'आज पूर्ण हुए',
        noActiveTrips: 'कोई सक्रिय ट्रिप नहीं है।',
        tripId: 'ट्रिप आईडी',
        status: 'स्तिथि',
        driver: 'ड्राइवर',
        client: 'क्लाइंट',
        route: 'रूट',
        from: 'कहाँ से',
        to: 'कहाँ तक',
        vehicle: 'गाड़ी',
        tripsThisMonth: 'इस महीने की ट्रिप्स',
        netKhata: 'कुल खाता',

        // Trip Details
        tripDetails: 'ट्रिप विवरण',
        addExpense: 'खर्च जोड़ें',
        completeTrip: 'ट्रिप पूर्ण करें और POD अपलोड करें',
        retakePod: 'POD दोबारा लें',
        podPreview: 'POD पूर्वावलोकन',
        retake: 'दोबारा लें',
        confirmSubmit: 'पुष्टि करें और जमा करें',
        waitingApproval: 'मालिक की मंजूरी का इंतजार',
        rejectionReason: 'अस्वीकृति का कारण',
        pleaseRetake: 'कृपया POD दोबारा लें।',

        // Expense Modal
        amount: 'राशि (₹)',
        description: 'विक्रेता का नाम और विवरण',
        saveExpense: 'खर्च जोड़ें',
        enterAmount: 'जैसे 5000',
        enterDesc: 'जैसे शेल पंप - डीजल',

        // Khata
        totalBalance: 'कुल शेष',
        addEntry: 'एंट्री जोड़ें',
        received: 'प्राप्त किया',
        given: 'दिया',
        noTransactions: 'अभी कोई लेनदेन नहीं',
        partyType: 'पक्ष',
        owner: 'मालिक',
        vendor: 'विक्रेता',
        saveEntry: 'एंट्री सहेजें',

        // History
        filterToday: 'आज',
        filterYesterday: 'कल',
        filterThisWeek: 'इस सप्ताह',
        filterLastWeek: 'पिछले सप्ताह',
        filterLastMonth: 'पिछले महीने',
        filterOlder: 'पुराना',

        // Common
        loading: 'लोड हो रहा है...',
        success: 'सफल',
        error: 'त्रुटि',
        cancel: 'रद्द करें',
        uploading: 'अपलोड हो रहा है...',
        totalExpenses: 'कुल खर्च',
    }
};

export type Language = 'en' | 'hi';
export type TranslationKeys = keyof typeof translations.en;
