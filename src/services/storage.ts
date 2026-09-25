import {
  User,
  Transaction,
  CommissionRecord,
  WalletTransaction,
  CablePackage,
  CableServiceConfig,
  Notification,
  AuditLog,
  SupportTicket,
} from '../types';

const STORAGE_KEYS = {
  USERS: 'jdpay_users_v1',
  CURRENT_USER: 'jdpay_current_user_v1',
  TRANSACTIONS: 'jdpay_transactions_v1',
  COMMISSIONS: 'jdpay_commissions_v1',
  WALLET_TX: 'jdpay_wallet_tx_v1',
  PACKAGES: 'jdpay_packages_v2',
  SERVICES: 'jdpay_services_v1',
  NOTIFICATIONS: 'jdpay_notifications_v1',
  AUDIT_LOGS: 'jdpay_audit_logs_v1',
  SUPPORT_TICKETS: 'jdpay_support_tickets_v1',
};

export const INITIAL_SERVICES: CableServiceConfig[] = [
  {
    id: 'srv_dstv',
    name: 'DStv',
    slug: 'dstv',
    status: 'active',
    description: 'Renew your DStv subscription quickly and securely.',
    numberLabel: 'Smartcard Number',
    numberPlaceholder: 'e.g. 41234567890 (10-11 digits)',
    badgeText: 'MultiChoice DStv',
  },
  {
    id: 'srv_gotv',
    name: 'GOtv',
    slug: 'gotv',
    status: 'active',
    description: 'Keep your GOtv subscription active with a simple payment process.',
    numberLabel: 'IUC Number',
    numberPlaceholder: 'e.g. 2012345678 (10 digits)',
    badgeText: 'MultiChoice GOtv',
  },
  {
    id: 'srv_startimes',
    name: 'StarTimes',
    slug: 'startimes',
    status: 'active',
    description: 'Renew your StarTimes package conveniently from your JDpay wallet.',
    numberLabel: 'Smartcard Number',
    numberPlaceholder: 'e.g. 0213456789 (11 digits)',
    badgeText: 'StarTimes Digital',
  },
];

export const INITIAL_PACKAGES: CablePackage[] = [
  // DStv (Live official prices from VTpass)
  {
    id: 'pkg_dstv_prem',
    service: 'DStv',
    packageName: 'DStv Premium',
    variationCode: 'dstv3',
    price: 44500,
    channelsCount: 165,
    description: 'Full sports bouquet, Showmax included, latest Hollywood blockbuster movies.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_dstv_cp',
    service: 'DStv',
    packageName: 'DStv Compact Plus',
    variationCode: 'dstv7',
    price: 30000,
    channelsCount: 145,
    description: 'Premier League, UEFA Champions League, and top international drama.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_dstv_c',
    service: 'DStv',
    packageName: 'DStv Compact',
    variationCode: 'dstv79',
    price: 19000,
    channelsCount: 130,
    description: 'Premier League action, kids entertainment, local movies & documentary.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_dstv_cf',
    service: 'DStv',
    packageName: 'DStv Confam',
    variationCode: 'dstv-confam',
    price: 11000,
    channelsCount: 105,
    description: 'Family entertainment, FA Cup, kids channels and lifestyle shows.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_dstv_y',
    service: 'DStv',
    packageName: 'DStv Yanga',
    variationCode: 'dstv-yanga',
    price: 6000,
    channelsCount: 85,
    description: 'Nollywood magic, music channels, local news, and selected sports.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_dstv_p',
    service: 'DStv',
    packageName: 'DStv Padi',
    variationCode: 'dstv-padi',
    price: 4400,
    channelsCount: 45,
    description: 'Essential local entertainment, news and educational stations.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // GOtv (Live official prices from VTpass)
  {
    id: 'pkg_gotv_supaplus',
    service: 'GOtv',
    packageName: 'GOtv Supa Plus - Monthly',
    variationCode: 'gotv-supa-plus',
    price: 16800,
    channelsCount: 75,
    description: 'All Premier League matches, Disney Channel, premium international movies.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_gotv_supa',
    service: 'GOtv',
    packageName: 'GOtv Supa - Monthly',
    variationCode: 'gotv-supa',
    price: 11400,
    channelsCount: 70,
    description: 'Over 70 channels of quality football, Africa Magic, and cartoons.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_gotv_max',
    service: 'GOtv',
    packageName: 'GOtv Max',
    variationCode: 'gotv-max',
    price: 8500,
    channelsCount: 60,
    description: 'La Liga, Serie A, SuperSport Football and family variety.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_gotv_jolli',
    service: 'GOtv',
    packageName: 'GOtv Jolli',
    variationCode: 'gotv-jolli',
    price: 5800,
    channelsCount: 50,
    description: 'Affordable family mix with music, telenovelas and kids channels.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_gotv_jinja',
    service: 'GOtv',
    packageName: 'GOtv Jinja',
    variationCode: 'gotv-jinja',
    price: 3900,
    channelsCount: 40,
    description: 'Good quality local entertainment and major news broadcasts.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_gotv_smallie',
    service: 'GOtv',
    packageName: 'GOtv Smallie - Monthly',
    variationCode: 'gotv-smallie',
    price: 1900,
    channelsCount: 35,
    description: 'Pocket-friendly monthly package with 35+ essential channels.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // StarTimes (Live official prices from VTpass - all sandbox prices removed)
  {
    id: 'pkg_st_super_dish',
    service: 'StarTimes',
    packageName: 'StarTimes Super (Dish) - 1 Month',
    variationCode: 'super',
    price: 9800,
    channelsCount: 95,
    description: 'Full sports lineup (Bundesliga, Europa), Bollywood and discovery on satellite dish.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_super_ant',
    service: 'StarTimes',
    packageName: 'StarTimes Super (Antenna) - 1 Month',
    variationCode: 'super-antenna-monthly',
    price: 9500,
    channelsCount: 90,
    description: 'Top sports, international movies and kids entertainment on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_classic_dish',
    service: 'StarTimes',
    packageName: 'StarTimes Classic (Dish) - 1 Month',
    variationCode: 'special-monthly',
    price: 7400,
    channelsCount: 80,
    description: 'Great family entertainment, documentary and sports variety on satellite dish.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_classic_ant',
    service: 'StarTimes',
    packageName: 'StarTimes Classic (Antenna) - 1 Month',
    variationCode: 'classic',
    price: 6000,
    channelsCount: 70,
    description: 'Popular family entertainment and sports on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_basic_dish',
    service: 'StarTimes',
    packageName: 'StarTimes Basic (Dish) - 1 Month',
    variationCode: 'smart',
    price: 5100,
    channelsCount: 60,
    description: 'Music, local drama, cartoons and documentary channels on satellite dish.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_basic_ant',
    service: 'StarTimes',
    packageName: 'StarTimes Basic (Antenna) - 1 Month',
    variationCode: 'basic',
    price: 4000,
    channelsCount: 50,
    description: 'Balanced mix of Nollywood, cartoons, music and religion on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_nova_dish',
    service: 'StarTimes',
    packageName: 'StarTimes Nova (Dish) - 1 Month',
    variationCode: 'nova',
    price: 2100,
    channelsCount: 35,
    description: 'Budget-conscious bouquet with free-to-air and top local stations on satellite dish.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_nova_ant',
    service: 'StarTimes',
    packageName: 'StarTimes Nova (Antenna) - 1 Month',
    variationCode: 'uni-2',
    price: 2100,
    channelsCount: 35,
    description: 'Budget-conscious bouquet with free-to-air and top local stations on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_super_dish_wk',
    service: 'StarTimes',
    packageName: 'StarTimes Super (Dish) - 1 Week',
    variationCode: 'super-weekly',
    price: 3300,
    channelsCount: 95,
    description: 'Weekly full sports and movie access on StarTimes satellite dish.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_classic_ant_wk',
    service: 'StarTimes',
    packageName: 'StarTimes Classic (Antenna) - 1 Week',
    variationCode: 'classic-weekly',
    price: 2000,
    channelsCount: 70,
    description: 'Weekly classic entertainment bouquet on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_basic_ant_wk',
    service: 'StarTimes',
    packageName: 'StarTimes Basic (Antenna) - 1 Week',
    variationCode: 'basic-weekly',
    price: 1400,
    channelsCount: 50,
    description: 'Weekly basic entertainment bouquet on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'pkg_st_nova_wk',
    service: 'StarTimes',
    packageName: 'StarTimes Nova (Antenna) - 1 Week',
    variationCode: 'nova-weekly',
    price: 700,
    channelsCount: 35,
    description: 'Weekly pocket-friendly digital broadcast on antenna decoder.',
    status: 'active',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: '6ab44acc7b6a361d8a96eb74',
    fullName: 'Hawanatu Jalloh',
    email: 'hawanatudaboh123@gmail.com',
    phone: '099009392',
    role: 'super_admin',
    isMegaSuperAdmin: true,
    adminTitle: 'Mega Super Admin',
    walletBalance: 0,
    status: 'active',
    virtualAccount: {
      bankName: 'Wema Bank / Moniepoint MFB',
      accountNumber: '7740455450',
      accountName: 'JDPAY - HAWANATU JALLOH',
    },
    createdAt: '2026-09-23T21:55:24.707Z',
    updatedAt: '2026-09-23T22:02:48.141Z',
  },
  {
    id: 'adm_01',
    fullName: 'JDpay Administrator',
    email: 'admin@jdpay.ng',
    phone: '08098765432',
    role: 'admin',
    walletBalance: 0,
    status: 'active',
    createdAt: '2026-01-01T08:00:00.000Z',
    updatedAt: '2026-09-23T11:15:00.000Z',
  },
  {
    id: 'usr_02',
    fullName: 'Oluwaseun Adeyemi',
    email: 'seun.adeyemi@example.com',
    phone: '08123456789',
    role: 'customer',
    walletBalance: 12400.0,
    status: 'active',
    createdAt: '2026-03-01T12:00:00.000Z',
    updatedAt: '2026-09-22T14:30:00.000Z',
  },
  {
    id: 'usr_03',
    fullName: 'Ngozi Okeke',
    email: 'ngozi.okeke@example.com',
    phone: '07033445566',
    role: 'customer',
    walletBalance: 4500.0,
    status: 'active',
    createdAt: '2026-04-10T16:20:00.000Z',
    updatedAt: '2026-09-21T09:12:00.000Z',
  },
  {
    id: 'usr_04',
    fullName: 'Babajide Adeleke',
    email: 'babajide.adeleke@example.com',
    phone: '08055667788',
    role: 'customer',
    walletBalance: 0.0,
    status: 'suspended',
    createdAt: '2026-05-18T11:45:00.000Z',
    updatedAt: '2026-09-18T17:00:00.000Z',
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_01',
    transactionReference: 'JDPAY-20260923-000001',
    userId: 'usr_02',
    customerName: 'Oluwaseun Adeyemi',
    service: 'DStv',
    package: 'DStv Compact',
    smartcardNumber: '41289012345',
    amount: 19000,
    serviceFee: 0,
    totalAmount: 19000,
    status: 'SUCCESSFUL',
    providerReference: 'MC-DSTV-882391024',
    providerResponse: 'SUBSCRIPTION_RENEWED_OK',
    createdAt: '2026-09-23T11:20:00.000Z',
    updatedAt: '2026-09-23T11:20:10.000Z',
  },
  {
    id: 'tx_02',
    transactionReference: 'JDPAY-20260922-000042',
    userId: 'usr_02',
    customerName: 'Oluwaseun Adeyemi',
    service: 'GOtv',
    package: 'GOtv Supa',
    smartcardNumber: '2019483726',
    amount: 9600,
    serviceFee: 0,
    totalAmount: 9600,
    status: 'SUCCESSFUL',
    providerReference: 'MC-GOTV-77123904',
    providerResponse: 'SUBSCRIPTION_RENEWED_OK',
    createdAt: '2026-09-22T08:14:00.000Z',
    updatedAt: '2026-09-22T08:14:05.000Z',
  },
  {
    id: 'tx_03',
    transactionReference: 'JDPAY-20260921-000089',
    userId: 'usr_02',
    customerName: 'Oluwaseun Adeyemi',
    service: 'StarTimes',
    package: 'StarTimes Basic',
    smartcardNumber: '0219876543',
    amount: 3700,
    serviceFee: 0,
    totalAmount: 3700,
    status: 'SUCCESSFUL',
    providerReference: 'ST-NG-55420192',
    providerResponse: 'CARD_RELOADED_OK',
    createdAt: '2026-09-21T15:40:00.000Z',
    updatedAt: '2026-09-21T15:40:08.000Z',
  },
  {
    id: 'tx_04',
    transactionReference: 'JDPAY-20260920-000104',
    userId: 'usr_02',
    customerName: 'Oluwaseun Adeyemi',
    service: 'GOtv',
    package: 'GOtv Max',
    smartcardNumber: '2019483726',
    amount: 7200,
    serviceFee: 0,
    totalAmount: 7200,
    status: 'PENDING',
    providerReference: 'MC-GOTV-WAITING-994',
    providerResponse: 'AWAITING_PROVIDER_CONFIRMATION',
    createdAt: '2026-09-20T19:10:00.000Z',
    updatedAt: '2026-09-20T19:10:00.000Z',
  },
  {
    id: 'tx_05',
    transactionReference: 'JDPAY-20260918-000076',
    userId: 'usr_02',
    customerName: 'Oluwaseun Adeyemi',
    service: 'DStv',
    package: 'DStv Confam',
    smartcardNumber: '41289012345',
    amount: 10500,
    serviceFee: 0,
    totalAmount: 10500,
    status: 'REFUNDED',
    providerReference: 'MC-FAIL-TIMEOUT',
    failureReason: 'MultiChoice Switch Timeout during network maintenance. Wallet automatically refunded.',
    createdAt: '2026-09-18T10:05:00.000Z',
    updatedAt: '2026-09-18T10:15:00.000Z',
  },
  {
    id: 'tx_06',
    transactionReference: 'JDPAY-20260917-000018',
    userId: 'usr_02',
    customerName: 'Oluwaseun Adeyemi',
    service: 'DStv',
    package: 'DStv Premium',
    smartcardNumber: '41299988776',
    amount: 37000,
    serviceFee: 0,
    totalAmount: 37000,
    status: 'SUCCESSFUL',
    providerReference: 'MC-DSTV-665123',
    createdAt: '2026-09-17T14:30:00.000Z',
    updatedAt: '2026-09-17T14:30:12.000Z',
  },
  {
    id: 'tx_07',
    transactionReference: 'JDPAY-20260916-000055',
    userId: 'usr_03',
    customerName: 'Ngozi Okeke',
    service: 'StarTimes',
    package: 'StarTimes Classic',
    smartcardNumber: '0218844221',
    amount: 5200,
    serviceFee: 0,
    totalAmount: 5200,
    status: 'FAILED',
    providerReference: 'ST-ERR-404',
    failureReason: 'Smartcard number blocked by provider. Please contact StarTimes service center.',
    createdAt: '2026-09-16T12:00:00.000Z',
    updatedAt: '2026-09-16T12:00:05.000Z',
  },
];

export const INITIAL_WALLET_TX: WalletTransaction[] = [
  {
    id: 'wtx_01',
    userId: 'usr_01',
    type: 'credit',
    amount: 25000,
    balanceBefore: 500,
    balanceAfter: 25500,
    reference: 'WAL-FUND-PAYSTACK-99120',
    description: 'Instant Card Funding (Paystack)',
    createdAt: '2026-09-23T09:00:00.000Z',
  },
  {
    id: 'wtx_02',
    userId: 'usr_01',
    type: 'debit',
    amount: 19000,
    balanceBefore: 44500,
    balanceAfter: 25500,
    reference: 'WAL-DEBIT-DSTV-88239',
    description: 'Payment for DStv Compact (41289012345)',
    createdAt: '2026-09-23T11:20:00.000Z',
  },
  {
    id: 'wtx_03',
    userId: 'usr_01',
    type: 'credit',
    amount: 10500,
    balanceBefore: 34000,
    balanceAfter: 44500,
    reference: 'WAL-REFUND-JDPAY-20260918',
    description: 'Refund for failed DStv Confam payment',
    createdAt: '2026-09-18T10:15:00.000Z',
  },
  {
    id: 'wtx_04',
    userId: 'usr_01',
    type: 'credit',
    amount: 50000,
    balanceBefore: 3500,
    balanceAfter: 53500,
    reference: 'WAL-FUND-TRANSFER-8812',
    description: 'Direct Bank Transfer Funding (Wema / Moniepoint)',
    createdAt: '2026-09-15T10:00:00.000Z',
  },
];

export const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif_01',
    userId: 'usr_01',
    title: 'Payment Successful',
    message: 'Your DStv Compact subscription payment of ₦19,000 was successful. Smartcard: 41289012345.',
    type: 'payment',
    read: false,
    createdAt: '2026-09-23T11:20:00.000Z',
  },
  {
    id: 'notif_02',
    userId: 'usr_01',
    title: 'Wallet Funded',
    message: 'Your JDpay wallet has been credited with ₦25,000. New balance: ₦25,500.',
    type: 'wallet',
    read: false,
    createdAt: '2026-09-23T09:00:00.000Z',
  },
  {
    id: 'notif_03',
    userId: 'usr_01',
    title: 'Payment Pending',
    message: 'Your GOtv Max payment (Ref: JDPAY-20260920-000104) is currently being processed with MultiChoice.',
    type: 'payment',
    read: true,
    createdAt: '2026-09-20T19:10:00.000Z',
  },
  {
    id: 'notif_04',
    userId: 'all',
    title: 'System Notice: Instant Activation Active',
    message: 'All DStv, GOtv, and StarTimes switches are operating at 99.98% immediate confirmation latency.',
    type: 'system',
    read: true,
    createdAt: '2026-09-19T08:00:00.000Z',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit_01',
    adminId: 'adm_01',
    adminName: 'Amina Bello (Admin)',
    action: 'WALLET_CREDIT',
    targetUserId: 'usr_01',
    description: 'Manual wallet compensation credit of ₦2,000 processed due to provider downtime ticket #4910.',
    createdAt: '2026-09-21T16:00:00.000Z',
  },
  {
    id: 'audit_02',
    adminId: 'adm_01',
    adminName: 'Amina Bello (Admin)',
    action: 'PACKAGE_PRICE_UPDATE',
    description: 'Updated DStv Compact Plus price benchmark to ₦25,000.',
    createdAt: '2026-09-15T11:30:00.000Z',
  },
  {
    id: 'audit_03',
    adminId: 'adm_01',
    adminName: 'Amina Bello (Admin)',
    action: 'REFUND_APPROVED',
    transactionId: 'tx_05',
    targetUserId: 'usr_01',
    description: 'Approved auto-refund of ₦10,500 for failed transaction JDPAY-20260918-000076.',
    createdAt: '2026-09-18T10:15:00.000Z',
  },
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'tkt_01',
    userId: 'usr_02',
    userName: 'Oluwaseun Adeyemi',
    userEmail: 'seun.adeyemi@example.com',
    subject: 'E16 Error after renewing GOtv',
    message: 'I paid for GOtv Supa but my decoder was off during the payment. Can you send a clearing signal?',
    status: 'resolved',
    createdAt: '2026-09-22T09:00:00.000Z',
  },
];

export const storage = {
  getUsers: (): User[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers: (users: User[]): void => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  getCurrentUser: (): User | null => {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  saveCurrentUser: (user: User | null): void => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    }
  },

  getTransactions: (): Transaction[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  },

  saveTransactions: (txs: Transaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  },

  getWalletTransactions: (): WalletTransaction[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.WALLET_TX);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(INITIAL_WALLET_TX));
      return INITIAL_WALLET_TX;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WALLET_TX;
    }
  },

  saveWalletTransactions: (wtxs: WalletTransaction[]): void => {
    localStorage.setItem(STORAGE_KEYS.WALLET_TX, JSON.stringify(wtxs));
  },

  getPackages: (): CablePackage[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
      return INITIAL_PACKAGES;
    }
    try {
      const parsed: CablePackage[] = JSON.parse(raw);
      // Validate that sandbox prices are not present (e.g. DStv Premium at 37000 or StarTimes Super at 8200)
      const hasOldSandboxPrice = parsed.some(
        (p) =>
          !p.variationCode ||
          (p.packageName.includes('Premium') && p.price === 37000) ||
          (p.packageName.includes('Confam') && (p.price === 9300 || p.price === 10500)) ||
          (p.packageName.includes('Padi') && (p.price === 3600 || p.price === 4000)) ||
          (p.service === 'StarTimes' && (p.price === 8200 || p.price === 5200 || p.price === 3700 || p.price === 1900))
      );
      if (hasOldSandboxPrice || parsed.length === 0) {
        localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
        return INITIAL_PACKAGES;
      }
      return parsed;
    } catch {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(INITIAL_PACKAGES));
      return INITIAL_PACKAGES;
    }
  },

  savePackages: (pkgs: CablePackage[]): void => {
    localStorage.setItem(STORAGE_KEYS.PACKAGES, JSON.stringify(pkgs));
  },

  getServices: (): CableServiceConfig[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.SERVICES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(INITIAL_SERVICES));
      return INITIAL_SERVICES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SERVICES;
    }
  },

  saveServices: (srvs: CableServiceConfig[]): void => {
    localStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(srvs));
  },

  getNotifications: (): Notification[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(INITIAL_NOTIFICATIONS));
      return INITIAL_NOTIFICATIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  },

  saveNotifications: (notifs: Notification[]): void => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
  },

  getAuditLogs: (): AuditLog[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  },

  saveAuditLogs: (logs: AuditLog[]): void => {
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  getSupportTickets: (): SupportTicket[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.SUPPORT_TICKETS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(INITIAL_SUPPORT_TICKETS));
      return INITIAL_SUPPORT_TICKETS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_SUPPORT_TICKETS;
    }
  },

  saveSupportTickets: (tickets: SupportTicket[]): void => {
    localStorage.setItem(STORAGE_KEYS.SUPPORT_TICKETS, JSON.stringify(tickets));
  },

  getCommissions: (): CommissionRecord[] => {
    const raw = localStorage.getItem(STORAGE_KEYS.COMMISSIONS);
    let parsed: CommissionRecord[] = [];
    if (raw) {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = [];
      }
    }

    // If empty or fewer than transactions, compute/backfill from transactions
    const txs = storage.getTransactions();
    if (parsed.length === 0 && txs.length > 0) {
      parsed = txs.map((tx) => {
        const commPct = tx.service === 'DStv' ? 1.8 : 2.0;
        const commRate = commPct / 100;
        const commAmt = Number(((tx.amount * commPct) / 100).toFixed(2));
        return {
          id: `comm_${tx.id}`,
          transactionId: tx.id,
          transactionReference: tx.transactionReference,
          service: tx.service,
          package: tx.package,
          smartcardNumber: tx.smartcardNumber,
          customerName: tx.customerName || 'Subscriber',
          amount: tx.amount,
          commissionRate: commRate,
          commissionPercentage: commPct,
          commissionAmount: commAmt,
          provider: 'VTpass Live Gateway',
          providerReference: tx.providerReference,
          status: tx.status,
          recordedBy: tx.recordedBy || 'Admin Direct',
          createdAt: tx.createdAt,
          updatedAt: tx.updatedAt,
        };
      });
      localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(parsed));
    }

    return parsed;
  },

  saveCommissions: (commissions: CommissionRecord[]): void => {
    localStorage.setItem(STORAGE_KEYS.COMMISSIONS, JSON.stringify(commissions));
  },
};
