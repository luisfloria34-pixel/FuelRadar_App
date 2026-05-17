// FuelRadar Translations — English default, German optional
export const translations = {
  de: {
    // General
    appName: 'FuelRadar',
    tagline: 'Live Kraftstoffpreise in Deutschland',

    // Greetings
    goodMorning: 'Guten Morgen',
    goodAfternoon: 'Guten Tag',
    goodEvening: 'Guten Abend',

    // Home Screen
    findBestPrices: 'Beste Preise finden',
    searchPlaceholder: 'Tankstelle suchen...',
    cheapest: 'Günstigste',
    nearYou: 'In der Nähe',
    liveMap: 'Live-Karte',
    explore: 'Erkunden',
    alerts: 'Alarme',
    setUp: 'Einrichten',
    fuelType: 'Kraftstoffart',
    bestPriceNow: 'Bester Preis jetzt',
    worthTheDrive: 'Lohnt die Fahrt',
    saveMoreAt: 'Spare mehr bei',
    awayKm: 'km entfernt',
    nearbyStations: 'Tankstellen in der Nähe',
    seeAll: 'Alle anzeigen',
    cheapestNearYou: 'Günstigste in deiner Nähe',
    searchingStations: 'Suche Tankstellen...',
    liveRecommendation: 'LIVE-EMPFEHLUNG',
    show: 'Anzeigen',
    cheaperThanAvg: 'günstiger',

    // Fuel Types
    diesel: 'Diesel',
    superE5: 'Super E5',
    superE10: 'Super E10',

    // Station Card
    open: 'Geöffnet',
    closed: 'Geschlossen',
    openNow: 'Jetzt geöffnet',
    details: 'Details',
    away: 'entfernt',
    live: 'Live',

    // Map Screen
    nearbyStationsTitle: 'Tankstellen in der Nähe',
    stationsFound: 'Tankstellen gefunden',
    nearYourLocation: 'In Ihrer Nähe',
    sortBy: 'Sortieren nach',
    distance: 'Entfernung',
    price: 'Preis',
    findingStations: 'Tankstellen werden gesucht...',
    noStationsFound: 'Keine Tankstellen gefunden',
    tryAdjustingFilters: 'Versuchen Sie, die Filter anzupassen oder suchen Sie in einem anderen Bereich',
    navigation: 'Navigation',
    searchPLZ: 'PLZ oder Ort eingeben',

    // Alerts Screen
    priceAlerts: 'Preisalarme',
    noAlertsYet: 'Noch keine Alarme',
    createAlertsDescription: 'Erstellen Sie Preisalarme, um benachrichtigt zu werden, wenn die Kraftstoffpreise unter Ihren Zielpreis fallen.',
    createAlert: 'Alarm erstellen',
    alertWhenBelow: 'Alarm wenn unter',
    targetPrice: 'Zielpreis',
    targetPriceEur: 'Zielpreis (€)',
    stationName: 'Tankstellenname',
    anyStation: 'Beliebige Tankstelle',
    anyStationPlaceholder: 'Jede Tankstelle',
    optional: 'Optional',
    deleteAlert: 'Alarm löschen',
    deleteAlertConfirm: 'Möchten Sie diesen Alarm wirklich löschen?',
    newPriceAlert: 'Neuer Preisalarm',
    activeAlertsCount: 'aktive Alarme',
    activeAlertSingular: 'aktiver Alarm',
    getNotified: 'Werde benachrichtigt',
    invalidPrice: 'Ungültiger Preis',
    invalidPriceBody: 'Bitte gib einen gültigen Preis ein.',

    // Favorites Screen
    favorites: 'Favoriten',
    stations: 'Tankstellen',
    noFavoritesYet: 'Noch keine Favoriten',
    saveFavoritesDescription: 'Speichern Sie Ihre bevorzugten Tankstellen für schnellen Zugriff auf aktuelle Preise.',
    exploreStations: 'Tankstellen erkunden',
    discoverStations: 'Tankstellen entdecken',
    loadingPrices: 'Preise werden geladen...',
    loadingPricesShort: 'Preise laden...',
    viewDetails: 'Details anzeigen',
    removeFavorite: 'Favorit entfernen',
    removeFavoriteConfirm: 'aus den Favoriten entfernen?',
    savedStations: 'gespeicherte Tankstellen',
    yourFavoriteStations: 'Deine Lieblingstankstellen',

    // Station Detail
    currentPrices: 'Aktuelle Preise',
    tapToSetAlert: 'Tippen für Alarm',
    openingHours: 'Öffnungszeiten',
    information: 'Informationen',
    location: 'Standort',
    state: 'Bundesland',
    navigate: 'Navigation',
    startNavigation: 'Navigation starten',
    createPriceAlert: 'Preisalarm erstellen',
    getNotifiedWhen: 'Benachrichtigt werden, wenn',
    dropsBelow: 'unter fällt',
    at: 'bei',
    success: 'Erfolg',
    alertCreated: 'Preisalarm erstellt!',
    stationNotFound: 'Tankstelle nicht gefunden',
    failedToLoad: 'Laden fehlgeschlagen',
    loadingDetails: 'Lade Details...',
    priceHistory: 'Preisverlauf (7 Tage)',
    noHistoryData: 'Noch keine Verlaufsdaten',

    // Settings
    settings: 'Einstellungen',
    fuelPreferences: 'Kraftstoff-Einstellungen',
    defaultFuelType: 'Standard-Kraftstoffart',
    preferredFuel: 'Bevorzugter Kraftstoff',
    searchSettings: 'Sucheinstellungen',
    searchRadius: 'Suchradius',
    searchRadiusDesc: 'Umkreis für die Tankstellensuche',
    general: 'Allgemein',
    country: 'Land',
    germany: 'Deutschland',
    language: 'Sprache',
    german: 'Deutsch',
    english: 'English',
    about: 'Über',
    version: 'Version',
    termsOfService: 'Nutzungsbedingungen',
    privacyPolicy: 'Datenschutzerklärung',
    dataSource: 'Datenquelle',
    debug: 'Debug',
    resetOnboarding: 'Onboarding zurücksetzen',
    showWelcomeAgain: 'Willkommensbildschirme erneut anzeigen',
    onboardingReset: 'Onboarding wurde zurückgesetzt. Starten Sie die App neu, um es wieder zu sehen.',
    legal: 'Rechtliches',
    aboutApp: 'Über die App',
    langSection: 'Sprache',

    // Favorite toast
    favoriteAdded: 'Zu Favoriten hinzugefügt',
    favoriteRemoved: 'Aus Favoriten entfernt',

    // Stable timestamp fallback (no real field from TankerKönig list API)
    updated: 'Aktualisiert',

    // Station detail
    alertSetHint: 'Alarm setzen',
    create: 'Erstellen',

    // Settings / misc
    onboardingResetSuccess: 'Das Onboarding wird beim nächsten Start erneut angezeigt.',
    radius: 'Radius',
    saveFavoritesHint: 'Speichere deine bevorzugten Tankstellen, um jederzeit schnell auf deren aktuelle Preise zuzugreifen.',

    // Language Change Dialog (required)
    language_change_title: 'Sprache ändern?',
    language_change_body_to_en: 'Möchtest du die App wirklich auf Englisch umstellen?',
    language_change_body_to_de: 'Möchtest du die App wirklich auf Deutsch umstellen?',
    language_change_cancel: 'Abbrechen',
    language_change_confirm: 'Bestätigen',

    // Onboarding
    skip: 'Überspringen',
    next: 'Weiter',
    getStarted: 'Los geht\'s',
    onboarding1Title: 'Günstigsten Kraftstoff finden',
    onboarding1Desc: 'Entdecke die besten Kraftstoffpreise in deiner Nähe in Echtzeit.',
    onboarding2Title: 'Sofort vergleichen',
    onboarding2Desc: 'Sieh alle Tankstellen in der Nähe mit aktuellen Preisen auf einen Blick.',
    onboarding3Title: 'Preisalarme',
    onboarding3Desc: 'Werde benachrichtigt, wenn Kraftstoffpreise unter deinen Zielpreis fallen.',
    demoNotifTitle: 'Preisalarm bei FuelRadar',
    demoNotifBody: 'Der Preis liegt jetzt unter deinem Zielpreis. Zeit zu tanken!',

    // Common
    cancel: 'Abbrechen',
    delete: 'Löschen',
    remove: 'Entfernen',
    save: 'Speichern',
    ok: 'OK',
    error: 'Fehler',
    loading: 'Laden...',
    retry: 'Erneut versuchen',
    confirm: 'Bestätigen',

    // Location
    locationRequired: 'Standort benötigt',
    locationRequiredBody: 'FuelRadar benötigt deinen Standort, um Tankstellen in deiner Nähe zu finden.',

    // Legal
    legalDisclaimer: 'Kraftstoffpreisdaten: Tankerkönig / MTS-K (CC BY 4.0). Preise können sich an der Tankstelle ändern. Keine Gewähr für Richtigkeit.',

    // Tab Labels
    home: 'Start',
    map: 'Karte',
    alertsTab: 'Alarme',
    favoritesTab: 'Favoriten',

    // Home screen
    homeTagline: 'Finde die günstigsten Spritpreise\nin deiner Nähe',
    stationsIn: 'Tankstellen in',
    locationDeniedBannerText: 'Standort deaktiviert · PLZ suchen oder aktivieren',

    // Map screen
    loadingStations: 'Lade Tankstellen...',
    locationLocked: 'Standort gesperrt · Einstellungen öffnen',
    locationDisabled: 'Standort deaktiviert · Tippen zum Aktivieren',

    // Location permission modal
    locationBlockedTitle: 'Standort gesperrt',
    locationRequestTitle: 'Standort freigeben?',
    locationBlockedBody: 'Der Standort wurde dauerhaft verweigert. Bitte aktiviere ihn in den Einstellungen unter FuelRadar → Standort.',
    locationRequestBody: 'FuelRadar zeigt dir Tankstellen in deiner Nähe und die günstigsten Preise auf der Karte.',
    locationWhyTitle: 'Warum brauchen wir deinen Standort?',
    locationWhyDetail: 'Dein Standort wird nur auf deinem Gerät verwendet, um Tankstellen in der Nähe zu laden. Er wird nicht gespeichert, nicht geteilt und nicht an Dritte weitergegeben.\n\nOhne Standort wird Berlin als Standardort verwendet.',
    locationShowLess: 'Weniger anzeigen',
    locationWhyBtn: 'Warum wird der Standort benötigt?',
    locationNotNow: 'Nicht jetzt',
    locationAllow: 'Erlauben',

    // Alerts screen
    notificationsDisabled: 'Benachrichtigungen deaktiviert',
    openSettingsToEnable: 'In den Einstellungen aktivieren',
    tapToReceiveAlerts: 'Tippe um Alarme zu erhalten',
    active: 'Aktiv',
    backendWarning: 'Preisalarme benötigen eine aktive Serververbindung.',
    backendNoConfig: 'Kein Backend konfiguriert – Push-Benachrichtigungen sind nicht verfügbar.',
    targetPricePlaceholder: 'z.B. 1,50',
    notificationsDisabledBody: 'Öffne die Einstellungen und aktiviere Benachrichtigungen für FuelRadar.',
    stationOptionalLabel: 'Tankstelle (optional)',

    // Notifications
    androidChannelPriceAlertsDesc: 'Benachrichtigungen wenn Kraftstoffpreise fallen',

    // Onboarding — vehicle type page
    onboardingVehicleTitle: 'Was fährst du?',
    onboardingVehicleSubtitle: 'Wähle deinen Fahrzeugtyp',
    vehicleSmallCar: 'Kleinwagen',
    vehicleSedan: 'Limousine',
    vehicleSuv: 'SUV',
    vehicleVan: 'Van / Transporter',
    vehicleMotorcycle: 'Motorrad',
    vehicleElectric: 'Elektro',
    comingSoon: 'Bald verfügbar',

    // Onboarding — fuel preference page
    onboardingFuelTitle: 'Was tankst du?',
    onboardingFuelSubtitle: 'Wähle deinen bevorzugten Kraftstoff',
    fuelSuperPlus: 'Super Plus',
    fuelPremiumDiesel: 'Premium Diesel',
    fuelLpg: 'LPG / Autogas',
    fuelCng: 'CNG / Erdgas',
    fuelHvo: 'HVO',
    fuelAdblue: 'AdBlue',
    fuelElectricNote: 'Ladesäulen in Kürze',
    fuelElectricEv: 'Elektro / Laden',

    // Onboarding — referral page
    onboardingReferralTitle: 'Wie hast du uns gefunden?',
    onboardingReferralSubtitle: 'Hilf uns, besser zu werden',
    referralTiktok: 'TikTok',
    referralInstagram: 'Instagram',
    referralFriends: 'Freunde',
    referralWebsite: 'Website',
    referralGoogle: 'Google',
    referralAppStore: 'App Store',
    referralOther: 'Anderes',

    // Onboarding — location page
    onboardingLocationTitle: 'Standort freigeben?',
    onboardingLocationSubtitle: 'Um Tankstellen in deiner Nähe zu finden',

    // Onboarding — ready screen
    onboardingReadyTitle: 'Alles bereit',
    onboardingReadySubtitle: 'FuelRadar ist eingerichtet.',

    // General UI
    selectOne: 'Wähle eine Option',
    continue: 'Weiter',
    finish: 'Fertig',
    skip_for_now: 'Vorerst überspringen',
  },
  en: {
    // General
    appName: 'FuelRadar',
    tagline: 'Live fuel prices in Germany',

    // Greetings
    goodMorning: 'Good morning',
    goodAfternoon: 'Good afternoon',
    goodEvening: 'Good evening',

    // Home Screen
    findBestPrices: 'Find Best Prices',
    searchPlaceholder: 'Search for a station...',
    cheapest: 'Cheapest',
    nearYou: 'Near you',
    liveMap: 'Live Map',
    explore: 'Explore',
    alerts: 'Alerts',
    setUp: 'Set up',
    fuelType: 'Fuel Type',
    bestPriceNow: 'Best Price Now',
    worthTheDrive: 'Worth the Drive',
    saveMoreAt: 'Save more at',
    awayKm: 'km away',
    nearbyStations: 'Nearby Stations',
    seeAll: 'See all',
    cheapestNearYou: 'Cheapest near you',
    searchingStations: 'Searching stations...',
    liveRecommendation: 'LIVE RECOMMENDATION',
    show: 'Show',
    cheaperThanAvg: 'cheaper',

    // Fuel Types
    diesel: 'Diesel',
    superE5: 'Super E5',
    superE10: 'Super E10',

    // Station Card
    open: 'Open',
    closed: 'Closed',
    openNow: 'Open Now',
    details: 'Details',
    away: 'away',
    live: 'Live',

    // Map Screen
    nearbyStationsTitle: 'Nearby Stations',
    stationsFound: 'stations found',
    nearYourLocation: 'Near your location',
    sortBy: 'Sort by',
    distance: 'Distance',
    price: 'Price',
    findingStations: 'Finding stations...',
    noStationsFound: 'No stations found',
    tryAdjustingFilters: 'Try adjusting your filters or search in a different area',
    navigation: 'Navigate',
    searchPLZ: 'Enter postcode or city',

    // Alerts Screen
    priceAlerts: 'Price Alerts',
    noAlertsYet: 'No Alerts Yet',
    createAlertsDescription: 'Create price alerts to get notified when fuel prices drop below your target.',
    createAlert: 'Create Alert',
    alertWhenBelow: 'Alert when below',
    targetPrice: 'Target Price',
    targetPriceEur: 'Target Price (€)',
    stationName: 'Station Name',
    anyStation: 'Any station',
    anyStationPlaceholder: 'Any station',
    optional: 'Optional',
    deleteAlert: 'Delete Alert',
    deleteAlertConfirm: 'Are you sure you want to delete this alert?',
    newPriceAlert: 'New Price Alert',
    activeAlertsCount: 'active alerts',
    activeAlertSingular: 'active alert',
    getNotified: 'Get notified',
    invalidPrice: 'Invalid Price',
    invalidPriceBody: 'Please enter a valid price.',

    // Favorites Screen
    favorites: 'Favorites',
    stations: 'stations',
    noFavoritesYet: 'No Favorites Yet',
    saveFavoritesDescription: 'Save your preferred stations for quick access to their current prices.',
    exploreStations: 'Explore Stations',
    discoverStations: 'Discover Stations',
    loadingPrices: 'Loading prices...',
    loadingPricesShort: 'Loading prices...',
    viewDetails: 'View Details',
    removeFavorite: 'Remove Favorite',
    removeFavoriteConfirm: 'Remove from favorites?',
    savedStations: 'saved stations',
    yourFavoriteStations: 'Your favorite stations',

    // Station Detail
    currentPrices: 'Current Prices',
    tapToSetAlert: 'Tap to set alert',
    openingHours: 'Opening Hours',
    information: 'Information',
    location: 'Location',
    state: 'State',
    navigate: 'Navigate',
    startNavigation: 'Start Navigation',
    createPriceAlert: 'Create Price Alert',
    getNotifiedWhen: 'Get notified when',
    dropsBelow: 'drops below',
    at: 'at',
    success: 'Success',
    alertCreated: 'Price alert created!',
    stationNotFound: 'Station not found',
    failedToLoad: 'Failed to load station details',
    loadingDetails: 'Loading details...',
    priceHistory: 'Price History (7 days)',
    noHistoryData: 'No history data yet',

    // Settings
    settings: 'Settings',
    fuelPreferences: 'Fuel Preferences',
    defaultFuelType: 'Default Fuel Type',
    preferredFuel: 'Preferred Fuel',
    searchSettings: 'Search Settings',
    searchRadius: 'Search Radius',
    searchRadiusDesc: 'Search radius for stations',
    general: 'General',
    country: 'Country',
    germany: 'Germany',
    language: 'Language',
    german: 'Deutsch',
    english: 'English',
    about: 'About',
    version: 'Version',
    termsOfService: 'Terms of Service',
    privacyPolicy: 'Privacy Policy',
    dataSource: 'Data Source',
    debug: 'Debug',
    resetOnboarding: 'Reset Onboarding',
    showWelcomeAgain: 'Show welcome screens again',
    onboardingReset: 'Onboarding has been reset. Restart the app to see it again.',
    legal: 'Legal',
    aboutApp: 'About the App',
    langSection: 'Language',

    // Favorite toast
    favoriteAdded: 'Added to favorites',
    favoriteRemoved: 'Removed from favorites',

    // Stable timestamp fallback
    updated: 'Updated',

    // Station detail
    alertSetHint: 'Set alert',
    create: 'Create',

    // Settings / misc
    onboardingResetSuccess: 'Onboarding will be shown again on next start.',
    radius: 'Radius',
    saveFavoritesHint: 'Save your preferred stations for quick access to current prices.',

    // Language Change Dialog (required)
    language_change_title: 'Change language?',
    language_change_body_to_en: 'Do you really want to switch the app to English?',
    language_change_body_to_de: 'Do you really want to switch the app to German?',
    language_change_cancel: 'Cancel',
    language_change_confirm: 'Confirm',

    // Onboarding
    skip: 'Skip',
    next: 'Next',
    getStarted: 'Get Started',
    onboarding1Title: 'Find the cheapest fuel',
    onboarding1Desc: 'Discover the best fuel prices near you in real time.',
    onboarding2Title: 'Compare instantly',
    onboarding2Desc: 'See nearby fuel stations with live prices at a glance.',
    onboarding3Title: 'Price alerts',
    onboarding3Desc: 'Get notified when fuel prices drop below your target.',
    demoNotifTitle: 'FuelRadar Price Alert',
    demoNotifBody: 'The price is now below your target. Time to refuel!',

    // Common
    cancel: 'Cancel',
    delete: 'Delete',
    remove: 'Remove',
    save: 'Save',
    ok: 'OK',
    error: 'Error',
    loading: 'Loading...',
    retry: 'Retry',
    confirm: 'Confirm',

    // Location
    locationRequired: 'Location Required',
    locationRequiredBody: 'FuelRadar needs your location to find nearby stations.',

    // Legal
    legalDisclaimer: 'Fuel price data: Tankerkönig / MTS-K (CC BY 4.0). Prices may change at the station. No guarantee of accuracy.',

    // Tab Labels
    home: 'Home',
    map: 'Map',
    alertsTab: 'Alerts',
    favoritesTab: 'Favorites',

    // Home screen
    homeTagline: 'Find the cheapest fuel prices\nnear you',
    stationsIn: 'Stations in',
    locationDeniedBannerText: 'Location disabled · Search by postcode or activate',

    // Map screen
    loadingStations: 'Loading stations...',
    locationLocked: 'Location locked · Open Settings',
    locationDisabled: 'Location disabled · Tap to activate',

    // Location permission modal
    locationBlockedTitle: 'Location Locked',
    locationRequestTitle: 'Allow Location?',
    locationBlockedBody: 'Location was permanently denied. Please enable it in Settings under FuelRadar → Location.',
    locationRequestBody: 'FuelRadar shows you nearby stations and the best fuel prices on the map.',
    locationWhyTitle: 'Why do we need your location?',
    locationWhyDetail: 'Your location is only used on your device to load nearby stations. It is not stored, shared, or passed to third parties.\n\nWithout location, Berlin is used as a default.',
    locationShowLess: 'Show less',
    locationWhyBtn: 'Why is location needed?',
    locationNotNow: 'Not now',
    locationAllow: 'Allow',

    // Alerts screen
    notificationsDisabled: 'Notifications disabled',
    openSettingsToEnable: 'Enable in Settings',
    tapToReceiveAlerts: 'Tap to receive alerts',
    active: 'Active',
    backendWarning: 'Price alerts require an active server connection.',
    backendNoConfig: 'No backend configured – push notifications are not available.',
    targetPricePlaceholder: 'e.g. 1.50',
    notificationsDisabledBody: 'Open Settings and enable notifications for FuelRadar.',
    stationOptionalLabel: 'Station (optional)',

    // Notifications
    androidChannelPriceAlertsDesc: 'Notifications when fuel prices drop',

    // Onboarding — vehicle type page
    onboardingVehicleTitle: 'What do you drive?',
    onboardingVehicleSubtitle: 'Choose your vehicle type',
    vehicleSmallCar: 'Small Car',
    vehicleSedan: 'Sedan',
    vehicleSuv: 'SUV',
    vehicleVan: 'Van',
    vehicleMotorcycle: 'Motorcycle',
    vehicleElectric: 'Electric',
    comingSoon: 'Coming soon',

    // Onboarding — fuel preference page
    onboardingFuelTitle: 'Which fuel do you use?',
    onboardingFuelSubtitle: 'Choose your preferred fuel',
    fuelSuperPlus: 'Super Plus',
    fuelPremiumDiesel: 'Premium Diesel',
    fuelLpg: 'LPG / Autogas',
    fuelCng: 'CNG / Erdgas',
    fuelHvo: 'HVO',
    fuelAdblue: 'AdBlue',
    fuelElectricNote: 'Charging stations coming soon',
    fuelElectricEv: 'Electric / Charging',

    // Onboarding — referral page
    onboardingReferralTitle: 'How did you find us?',
    onboardingReferralSubtitle: 'Help us improve',
    referralTiktok: 'TikTok',
    referralInstagram: 'Instagram',
    referralFriends: 'Friends',
    referralWebsite: 'Website',
    referralGoogle: 'Google',
    referralAppStore: 'App Store',
    referralOther: 'Other',

    // Onboarding — location page
    onboardingLocationTitle: 'Allow Location?',
    onboardingLocationSubtitle: 'To find fuel stations near you',

    // Onboarding — ready screen
    onboardingReadyTitle: 'All set',
    onboardingReadySubtitle: 'FuelRadar is set up.',

    // General UI
    selectOne: 'Select one',
    continue: 'Continue',
    finish: 'Finish',
    skip_for_now: 'Skip for now',
  },
};

export type Language = 'de' | 'en';
export type TranslationKey = keyof typeof translations.de;
