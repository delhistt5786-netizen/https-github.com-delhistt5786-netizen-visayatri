/**
 * Mock Data for Visayatri Development
 * Used when backend MongoDB is unavailable
 */

// Service charge applied to all visas (599 for B2C and logged-in users)
export const SERVICE_CHARGE = 599;

// Fallback country list, used only if /api/countries is unreachable
export const MOCK_COUNTRIES = [
  { _id: 'c-in', name: 'India', code: 'IN', flag: '🇮🇳', continent: 'asia' },
  { _id: 'c-us', name: 'United States', code: 'US', flag: '🇺🇸', continent: 'north-america' },
  { _id: 'c-gb', name: 'United Kingdom', code: 'GB', flag: '🇬🇧', continent: 'europe' },
  { _id: 'c-ae', name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', continent: 'middle-east' },
  { _id: 'c-sa', name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', continent: 'middle-east' },
  { _id: 'c-au', name: 'Australia', code: 'AU', flag: '🇦🇺', continent: 'oceania' },
  { _id: 'c-ca', name: 'Canada', code: 'CA', flag: '🇨🇦', continent: 'north-america' },
  { _id: 'c-sg', name: 'Singapore', code: 'SG', flag: '🇸🇬', continent: 'asia' },
];

export const MOCK_USER = {
  _id: '1001',
  name: 'Raj Kumar',
  email: 'raj@example.com',
  phone: '+919876543210',
  role: 'user',
};

export const MOCK_AGENT = {
  _id: '2001',
  name: 'Priya Singh',
  email: 'priya@visayatri.com',
  phone: '+919876543211',
  role: 'agent',
  agentCode: 'AG-1234',
  isApproved: true,
};

export const MOCK_ADMIN = {
  _id: '3001',
  name: 'Admin User',
  email: 'admin@visayatri.com',
  phone: '+919876543212',
  role: 'admin',
};

// Helper to transform visa data to public view
// Adds 599 service charge to all prices for B2C and logged-in users
const transformVisaForPublic = (rawVisa) => ({
  ...rawVisa,
  plans: (rawVisa.plans || []).map(p => ({
    label: p.label,
    price: (p.publicPrice || 0) + SERVICE_CHARGE,
    publicPrice: (p.publicPrice || 0) + SERVICE_CHARGE,
    basePrice: (p.basePrice || 0) + SERVICE_CHARGE,
    agentPrice: (p.agentPrice || 0) + SERVICE_CHARGE,
    originalPublicPrice: p.publicPrice,
    serviceCharge: SERVICE_CHARGE,
    isContactUs: p.isContactUs,
  })),
});

export const MOCK_VISAS_RAW = [
  { _id: '1', country: 'Oman', slug: 'oman', flag: '🇴🇲', region: 'middle-east', processingTime: '1-3 business days', visaType: 'eVisa', stayDuration: '10 / 30 days; 90-day category shown in source list', validity: 'Category-dependent', documents: 'Passport 6+ months; photo; supporting documents as applicable', plans: [
    { label: '10 Days', basePrice: 800, agentPrice: 1200, publicPrice: 1850, isContactUs: false },
    { label: '30 Days', basePrice: 2500, agentPrice: 3900, publicPrice: 5400, isContactUs: false },
    { label: '90 Days (Male)', basePrice: 12000, agentPrice: 16500, publicPrice: 20800, isContactUs: false },
    { label: '90 Days (Female)', basePrice: 12300, agentPrice: 17000, publicPrice: 21300, isContactUs: false },
  ]},
  { _id: '2', country: 'Qatar', slug: 'qatar', flag: '🇶🇦', region: 'middle-east', processingTime: '2-5 business days', visaType: 'eVisa / Hayya', stayDuration: 'Up to 30 days for relevant tourist category', validity: 'Category-dependent', documents: 'Passport and required accommodation/return/other documents as applicable', plans: [
    { label: '30 Days', basePrice: 500, agentPrice: 750, publicPrice: 1000, isContactUs: false },
  ]},
  { _id: '3', country: 'Bahrain', slug: 'bahrain', flag: '🇧🇭', region: 'middle-east', processingTime: '1-2 business days', visaType: 'eVisa', stayDuration: '14 days; 3-month and 1-year categories may be available', validity: 'Category-dependent', documents: 'Passport 6+ months; hotel/return/funds etc. as required', plans: [
    { label: '14 Days', basePrice: 1800, agentPrice: 2500, publicPrice: 3200, isContactUs: false },
    { label: '3 Months Multi', basePrice: 2800, agentPrice: 3900, publicPrice: 4950, isContactUs: false },
    { label: '1 Year Multi', basePrice: 6500, agentPrice: 9000, publicPrice: 11400, isContactUs: false },
  ]},
  { _id: '4', country: 'Saudi Arabia', slug: 'saudi-arabia', flag: '🇸🇦', region: 'middle-east', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Up to 90 days per visit; eligible tourist eVisa commonly 1-year validity', validity: '1 year for eligible tourist eVisa', documents: 'Passport; photo; insurance/other eligibility requirements', plans: [
    { label: '90 Days (KL Passport)', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
  ]},
  { _id: '5', country: 'Singapore', slug: 'singapore', flag: '🇸🇬', region: 'asia', processingTime: '3-5 business days', visaType: 'Entry visa', stayDuration: 'Stay granted at entry; not tied to visa validity', validity: 'Visa validity varies', documents: 'Passport 6+ months; photo; Form 14A; LOI/supporting documents as required', plans: [
    { label: '30 Days', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
  ]},
  { _id: '7', country: 'Jordan', slug: 'jordan', flag: '🇯🇴', region: 'middle-east', processingTime: '5-7 business days', visaType: 'eVisa / electronic visa service', stayDuration: 'Category/nationality dependent', validity: 'Category-dependent', documents: 'Passport and supporting documents as requested', plans: [
    { label: 'Tourist Visa', basePrice: 3300, agentPrice: 4600, publicPrice: 5800, isContactUs: false },
  ]},
  { _id: '8', country: 'Russia', slug: 'russia', flag: '🇷🇺', region: 'europe', processingTime: '10-15 business days', visaType: 'eVisa', stayDuration: 'Up to 30 days stay', validity: '120 days from issue', documents: 'Passport; required medical insurance', plans: [
    { label: 'Tourist Visa', basePrice: 3200, agentPrice: 4400, publicPrice: 5500, isContactUs: false },
  ]},
  { _id: '9', country: 'Vietnam', slug: 'vietnam', flag: '🇻🇳', region: 'asia', processingTime: '1-2 business days', visaType: 'eVisa', stayDuration: 'Up to 90 days', validity: 'Up to 90 days', documents: 'Passport data, portrait/photo and payment', plans: [
    { label: '30 Days Single', basePrice: 1800, agentPrice: 2500, publicPrice: 3200, isContactUs: false },
  ]},
  { _id: '10', country: 'Indonesia', slug: 'indonesia', flag: '🇮🇩', region: 'asia', processingTime: '1-2 business days', visaType: 'eVisa / Visitor Visa', stayDuration: '30-day e-VOA; 60-day visitor visa and other categories', validity: 'Category-dependent', documents: 'Passport 6+ months; photo/supporting documents depending category', plans: [
    { label: '30 Days', basePrice: 2300, agentPrice: 3200, publicPrice: 4000, isContactUs: false },
  ]},
  { _id: '11', country: 'Philippines', slug: 'philippines', flag: '🇵🇭', region: 'asia', processingTime: '3-5 business days', plans: [
    { label: '30 Days', basePrice: 2500, agentPrice: 3400, publicPrice: 4400, isContactUs: false },
  ]},
  { _id: '12', country: 'Ethiopia', slug: 'ethiopia', flag: '🇪🇹', region: 'africa', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: '30 or 90 days', validity: 'Starts from intended entry date', documents: 'Passport 6+ months; photo', plans: [
    { label: 'Tourist Visa', basePrice: 4000, agentPrice: 5500, publicPrice: 6900, isContactUs: false },
  ]},
  { _id: '13', country: 'Uganda', slug: 'uganda', flag: '🇺🇬', region: 'africa', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Tourist visa generally up to 90 days', validity: 'Category-dependent', documents: 'Passport; yellow fever/other documents as applicable', plans: [
    { label: 'Tourist Visa', basePrice: 3400, agentPrice: 4700, publicPrice: 5900, isContactUs: false },
  ]},
  { _id: '14', country: 'Zimbabwe', slug: 'zimbabwe', flag: '🇿🇼', region: 'africa', processingTime: '3-5 business days', visaType: 'eVisa', stayDuration: 'Tourist duration depends on visa class', validity: 'Category-dependent', documents: 'Passport, photo and supporting documents', plans: [
    { label: 'Tourist Visa', basePrice: 2500, agentPrice: 3500, publicPrice: 4400, isContactUs: false },
  ]},
  { _id: '15', country: 'Azerbaijan', slug: 'azerbaijan', flag: '🇦🇿', region: 'asia', processingTime: '3-5 business days', visaType: 'eVisa', stayDuration: 'Up to 30 days stay', validity: 'Standard eVisa validity is generally 90 days from issue', documents: 'Passport details; eligible nationality; required documents', plans: [
    { label: '30 Days', basePrice: 1700, agentPrice: 2350, publicPrice: 3000, isContactUs: false },
    { label: 'Express (Same Day)', basePrice: 3800, agentPrice: 5200, publicPrice: 6500, isContactUs: false },
  ]},
  { _id: '16', country: 'Egypt', slug: 'egypt', flag: '🇪🇬', region: 'africa', processingTime: '1-2 business days', visaType: 'eVisa', stayDuration: 'Tourist stay commonly up to 30 days', validity: 'Category-dependent', documents: 'Passport 6+ months; photo; hotel/return/supporting documents as applicable', plans: [
    { label: '30 Days', basePrice: 2400, agentPrice: 3300, publicPrice: 4200, isContactUs: false },
    { label: '30 Days Multi', basePrice: 3600, agentPrice: 4900, publicPrice: 6200, isContactUs: false },
  ]},
  { _id: '17', country: 'Malaysia', slug: 'malaysia-south', flag: '🇲🇾', region: 'asia', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: '30 days per entry for MEV; category-specific', validity: 'MEV: multiple journeys within 6 months', documents: 'Passport 6+ months; return ticket; accommodation; financial/support documents as required', plans: [
    { label: 'Tourist Visa', basePrice: 6200, agentPrice: 8600, publicPrice: 10800, isContactUs: false },
  ]},
  { _id: '18', country: 'Morocco', slug: 'morocco', flag: '🇲🇦', region: 'africa', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Maximum 30 days stay', validity: 'Up to 180 days', documents: 'Eligibility depends on qualifying residence/visa route; passport requirements', plans: [
    { label: 'Tourist Visa', basePrice: 5000, agentPrice: 6900, publicPrice: 8700, isContactUs: false },
  ]},
  { _id: '19', country: 'Laos', slug: 'laos', flag: '🇱🇦', region: 'asia', processingTime: '1-2 business days', visaType: 'eVisa', stayDuration: '30 days stay', validity: 'Category/approval dependent', documents: 'Passport 6+ months; photo; eligible entry point', plans: [
    { label: '30 Days', basePrice: 3300, agentPrice: 4500, publicPrice: 5700, isContactUs: false },
  ]},
  { _id: '20', country: 'Armenia', slug: 'armenia', flag: '🇦🇲', region: 'asia', processingTime: '3-5 business days', visaType: 'eVisa', stayDuration: 'Up to 21 days OR up to 120 days', validity: 'As stated on issued visa', documents: 'Passport; photo; Indian-national eligibility/supporting documents must be checked', plans: [
    { label: '21 Days', basePrice: 1200, agentPrice: 1600, publicPrice: 2000, isContactUs: false },
  ]},
  { _id: '21', country: 'Kenya', slug: 'kenya', flag: '🇰🇪', region: 'africa', processingTime: '3-5 business days', visaType: 'eTA — NOT eVisa', stayDuration: 'Stay determined at entry; eTA valid for travel within 90 days from issue', validity: '90 days to travel', documents: 'Passport 6+ months; selfie/photo; itinerary; accommodation; payment', plans: [
    { label: '90 Days', basePrice: 2800, agentPrice: 3900, publicPrice: 4900, isContactUs: false },
  ]},
  { _id: '22', country: 'Tanzania', slug: 'tanzania', flag: '🇹🇿', region: 'africa', processingTime: '3-5 business days', visaType: 'eVisa', stayDuration: 'Ordinary tourist visa up to 90 days', validity: 'Up to 90 days; multiple category can be 1 year', documents: 'Passport; return ticket; online form; fee; supporting documents as required', plans: [
    { label: '90 Days', basePrice: 3750, agentPrice: 5200, publicPrice: 6500, isContactUs: false },
  ]},
  { _id: '23', country: 'Uzbekistan', slug: 'uzbekistan', flag: '🇺🇿', region: 'asia', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Standard tourist eVisa commonly up to 30 days', validity: 'Category-dependent', documents: 'Passport; photo and application details', plans: [
    { label: '30 Days', basePrice: 2250, agentPrice: 3100, publicPrice: 3900, isContactUs: false },
  ]},
  { _id: '24', country: 'Tajikistan', slug: 'tajikistan', flag: '🇹🇯', region: 'asia', processingTime: '7-10 business days', visaType: 'eVisa', stayDuration: 'Category-dependent; tourist route requires checking issued visa conditions', validity: 'Category-dependent', documents: 'Passport; photo; supporting documents as required', plans: [
    { label: '45 Days', basePrice: 3200, agentPrice: 4400, publicPrice: 5550, isContactUs: false },
  ]},
  { _id: '25', country: 'Kyrgyzstan', slug: 'kyrgyzstan', flag: '🇰🇬', region: 'asia', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Category-dependent; tourist options vary', validity: 'Category-dependent', documents: 'Passport; photo; supporting documents', plans: [
    { label: '60 Days', basePrice: 6000, agentPrice: 8300, publicPrice: 10500, isContactUs: false },
  ]},
  { _id: '26', country: 'Sri Lanka', slug: 'sri-lanka', flag: '🇱🇰', region: 'asia', processingTime: '1-2 business days', visaType: 'ETA / visa authorization', stayDuration: '30 days tourist', validity: 'Category-specific', documents: 'Passport; travel/accommodation details; eligibility/payment', plans: [
    { label: '30 Days', basePrice: 400, agentPrice: 550, publicPrice: 700, isContactUs: false },
  ]},
  { _id: '27', country: 'Mongolia', slug: 'mongolia', flag: '🇲🇳', region: 'asia', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Tourist duration/category-dependent', validity: 'Category-dependent', documents: 'Passport; photo; travel details', plans: [
    { label: '30 Days', basePrice: 1600, agentPrice: 2200, publicPrice: 2700, isContactUs: false },
  ]},
  { _id: '28', country: 'Ukraine', slug: 'ukraine', flag: '🇺🇦', region: 'europe', processingTime: '10-15 business days', visaType: 'Visa application — NOT simple eVisa', stayDuration: 'Visa-specific', validity: 'Visa-specific', documents: 'Passport and consular documents; route depends on current application rules', plans: [
    { label: '90 Days', basePrice: 2600, agentPrice: 3600, publicPrice: 4500, isContactUs: false },
  ]},
  { _id: '29', country: 'Papua New Guinea', slug: 'papua-new-guinea', flag: '🇵🇬', region: 'asia', processingTime: '7-10 business days', visaType: 'eVisa', stayDuration: 'Tourist eVisa commonly up to 60 days', validity: 'Category-dependent', documents: 'Passport; photo; itinerary/accommodation/supporting documents', plans: [
    { label: '60 Days', basePrice: 5100, agentPrice: 7000, publicPrice: 8800, isContactUs: false },
  ]},
  { _id: '30', country: 'South Africa', slug: 'south-africa', flag: '🇿🇦', region: 'africa', processingTime: '10-15 business days', visaType: 'eVisa / ePermit', stayDuration: 'Visa-specific; stay granted per visa/entry conditions', validity: 'Visa-specific', documents: 'Passport; photo; itinerary/accommodation/financial documents as applicable', plans: [
    { label: '90 Days', basePrice: 3900, agentPrice: 5400, publicPrice: 6700, isContactUs: false },
  ]},
  { _id: '31', country: 'Zambia', slug: 'zambia', flag: '🇿🇲', region: 'africa', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Tourist visa commonly up to 90 days', validity: 'Category-dependent', documents: 'Passport; photo; return ticket/accommodation/supporting documents as required', plans: [
    { label: '90 Days', basePrice: 2900, agentPrice: 4000, publicPrice: 5000, isContactUs: false },
  ]},
  { _id: '32', country: 'Hong Kong', slug: 'hongkong', flag: '🇭🇰', region: 'asia', processingTime: '1-2 business days', visaType: 'Pre-arrival registration — NOT eVisa', stayDuration: 'Indian passport holders: up to 14 days per visit if PAR requirements are met', validity: 'PAR validity/category-dependent', documents: 'Passport; online PAR; arrival/departure details', plans: [
    { label: '90 Days', basePrice: 700, agentPrice: 950, publicPrice: 1200, isContactUs: false },
  ]},
  { _id: '33', country: 'Japan', slug: 'japan', flag: '🇯🇵', region: 'asia', processingTime: '15-20 business days', visaType: 'eVisa / visa', stayDuration: 'Short-term tourist up to 90 days', validity: 'Visa-specific', documents: 'Passport; photo; itinerary; financial/supporting documents; Indian residents may use designated agency route', plans: [
    { label: '90 Days', basePrice: 3200, agentPrice: 4400, publicPrice: 5500, isContactUs: false },
  ]},
  { _id: '34', country: 'Thailand', slug: 'thailand', flag: '🇹🇭', region: 'asia', processingTime: '5-7 business days', visaType: 'Arrival card — NOT visa', stayDuration: 'Not a visa; stay depends on visa/entry status', validity: '', documents: 'Passport and arrival/travel information', plans: [
    { label: 'Tourist Visa', basePrice: 0, agentPrice: 0, publicPrice: 0, isContactUs: true },
  ]},
  { _id: '35', country: 'Argentina', slug: 'argentina', flag: '🇦🇷', region: 'others', processingTime: '5-7 business days', visaType: 'Consular visa route — NOT simple eVisa', stayDuration: 'Visa-specific', validity: 'Visa-specific', documents: 'Consular application; documents per embassy/consulate', plans: [
    { label: '90 Days', basePrice: 1700, agentPrice: 2300, publicPrice: 2900, isContactUs: false },
  ]},
  { _id: '36', country: 'Madagascar', slug: 'madagascar', flag: '🇲🇬', region: 'africa', processingTime: '5-7 business days', visaType: 'eVisa', stayDuration: 'Tourist duration/category-dependent', validity: 'Category-dependent', documents: 'Passport; photo; travel details and payment', plans: [
    { label: '15 Days', basePrice: 2300, agentPrice: 3200, publicPrice: 4000, isContactUs: false },
  ]},
  { _id: '37', country: 'Cuba', slug: 'cuba', flag: '🇨🇺', region: 'others', processingTime: '10-15 business days', visaType: 'eVisa / tourist visa', stayDuration: 'Tourist stay/category-dependent; verify current issued conditions', validity: 'Category-dependent', documents: 'Passport; travel/accommodation details and payment', plans: [
    { label: 'Tourist Card', basePrice: 14000, agentPrice: 19500, publicPrice: 25000, isContactUs: false },
  ]},
  { _id: '38', country: 'Dubai', slug: 'dubai', flag: '🇦🇪', region: 'middle-east', processingTime: '5-7 business days', plans: [
    { label: '30 Days', basePrice: 1500, agentPrice: 2200, publicPrice: 3000, isContactUs: false },
  ]},
];

export const MOCK_VISAS = MOCK_VISAS_RAW.map(transformVisaForPublic);

export const MOCK_APPLICATIONS = [
  {
    _id: 'app_1001',
    applicationId: '#APP-001',
    userId: { _id: '1001', name: 'Raj Kumar' },
    visaId: MOCK_VISAS[0],
    applicantName: 'Raj Kumar',
    applicantEmail: 'raj@example.com',
    applicantPhone: '+919876543210',
    passportNumber: 'AA123456',
    nationality: 'Indian',
    travelDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
    returnDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    planLabel: '30 Day',
    pricePaid: 2999,
    status: 'approved',
    paymentStatus: 'paid',
    paymentMethod: 'razorpay',
    documents: [
      { originalName: 'passport.pdf', storedName: 'passport_001.pdf' },
      { originalName: 'photo.jpg', storedName: 'photo_001.jpg' },
    ],
    statusHistory: [
      { status: 'pending', updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      { status: 'documents_received', updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) },
      { status: 'in_review', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { status: 'approved', updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
    ],
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
  },
  {
    _id: 'app_1002',
    applicationId: '#APP-002',
    userId: { _id: '1001', name: 'Raj Kumar' },
    visaId: MOCK_VISAS[1],
    applicantName: 'Priya Sharma',
    applicantEmail: 'priya.sharma@example.com',
    applicantPhone: '+919876543211',
    passportNumber: 'AA123457',
    nationality: 'Indian',
    travelDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
    returnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    planLabel: '10 Day',
    pricePaid: 1999,
    status: 'in_review',
    paymentStatus: 'paid',
    paymentMethod: 'razorpay',
    documents: [],
    statusHistory: [
      { status: 'pending', updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
      { status: 'documents_received', updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
      { status: 'in_review', updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
    ],
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
  },
];

export const MOCK_AGENT_DATA = {
  agentCode: 'AG-5678',
  stats: {
    total: MOCK_APPLICATIONS.length,
    pending: 1,
    approved: 1,
    rejected: 0,
    walletBalance: 15000,
    totalTopUp: 50000,
    totalSpent: 35000,
    totalCommission: 8500,
    commissionRate: 20,
  },
  applications: MOCK_APPLICATIONS,
  transactions: [
    { _id: 'txn_1', type: 'credit', category: 'wallet_topup', amount: 10000, balanceAfter: 25000, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: 'Manual top-up' },
    { _id: 'txn_2', type: 'debit', category: 'visa_application', amount: 2999, balanceAfter: 22001, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: 'Dubai visa - Raj Kumar' },
    { _id: 'txn_3', type: 'credit', category: 'commission', amount: 600, balanceAfter: 22601, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), description: 'Commission earned' },
  ],
  wallet: {
    balance: 15000,
    totalAdded: 50000,
    totalSpent: 35000,
    transactions: [
      { _id: 'txn_1', type: 'credit', category: 'wallet_topup', amount: 10000, balanceAfter: 25000, createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), description: 'Manual top-up' },
      { _id: 'txn_2', type: 'debit', category: 'visa_application', amount: 2999, balanceAfter: 22001, createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), description: 'Dubai visa' },
    ],
  },
};

export const MOCK_ADMIN_DATA = {
  stats: {
    totalUsers: 248,
    totalAgents: 42,
    totalApplications: 1256,
    totalVisas: 39,
    revenue: 2850000,
    pendingApps: 143,
  },
  recentApps: MOCK_APPLICATIONS.slice(0, 5),
  topVisas: [
    { _id: 'visa_uae', country: 'Dubai', flag: '🇦🇪', count: 342 },
    { _id: 'visa_oman', country: 'Oman', flag: '🇴🇲', count: 198 },
    { _id: 'visa_qatar', country: 'Qatar', flag: '🇶🇦', count: 156 },
  ],
};

export default { MOCK_USER, MOCK_AGENT, MOCK_ADMIN, MOCK_VISAS, MOCK_APPLICATIONS, MOCK_AGENT_DATA, MOCK_ADMIN_DATA };
