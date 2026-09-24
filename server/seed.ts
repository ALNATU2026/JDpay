import {
  UserModel,
  CablePackageModel,
  TransactionModel,
  NotificationModel,
  CableServiceModel,
} from './models.js';

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Check & Seed Packages
    const packageCount = await CablePackageModel.countDocuments();
    if (packageCount === 0) {
      console.log('[MongoDB Seeder] Seeding official Cable TV packages...');
      const defaultPackages = [
        // DStv
        { service: 'DStv', packageName: 'DStv Premium', price: 37000, channelsCount: 160, description: 'All channels, live sports, movies, and documentary bouquets.' },
        { service: 'DStv', packageName: 'DStv Compact Plus', price: 25000, channelsCount: 145, description: 'European football leagues, premium drama & kids series.' },
        { service: 'DStv', packageName: 'DStv Compact', price: 15700, channelsCount: 130, description: 'Premier League highlights, movies, and local entertainment.' },
        { service: 'DStv', packageName: 'DStv Confam', price: 9300, channelsCount: 105, description: 'Family favorite movies, news, music and documentary channels.' },
        { service: 'DStv', packageName: 'DStv Yanga', price: 5100, channelsCount: 85, description: 'Affordable entertainment with Nollywood and kids favorite channels.' },
        { service: 'DStv', packageName: 'DStv Padi', price: 3600, channelsCount: 45, description: 'Essential local news, music and educational broadcasts.' },

        // GOtv
        { service: 'GOtv', packageName: 'GOtv Supa Plus', price: 15700, channelsCount: 75, description: 'Premier League matches, international movies, and kids TV.' },
        { service: 'GOtv', packageName: 'GOtv Supa', price: 9600, channelsCount: 65, description: 'More entertainment, sports highlights, wildlife and series.' },
        { service: 'GOtv', packageName: 'GOtv Max', price: 7200, channelsCount: 55, description: 'La Liga, Serie A, Africa Magic and cartoon channels.' },
        { service: 'GOtv', packageName: 'GOtv Jolli', price: 4850, channelsCount: 40, description: 'Quality family entertainment at an accessible price.' },
        { service: 'GOtv', packageName: 'GOtv Jinja', price: 3300, channelsCount: 30, description: 'Local music, news and religious programming.' },
        { service: 'GOtv', packageName: 'GOtv Smallie', price: 1575, channelsCount: 15, description: 'Basic digital terrestrial television for every household.' },

        // StarTimes
        { service: 'StarTimes', packageName: 'StarTimes Super Bouquet', price: 9500, channelsCount: 95, description: 'Top international sports, blockbuster movies and live news.' },
        { service: 'StarTimes', packageName: 'StarTimes Classic Bouquet', price: 5500, channelsCount: 70, description: 'Popular family channels, Bundesliga matches and series.' },
        { service: 'StarTimes', packageName: 'StarTimes Basic Bouquet', price: 3700, channelsCount: 45, description: 'Music, local drama, cartoons and documentary channels.' },
        { service: 'StarTimes', packageName: 'StarTimes Nova Bouquet', price: 1900, channelsCount: 25, description: 'Entry level crystal-clear digital TV entertainment.' },
      ];
      await CablePackageModel.insertMany(defaultPackages);
      console.log(`[MongoDB Seeder] Inserted ${defaultPackages.length} packages into MongoDB.`);
    }

    // 2. Check & Seed System Admin
    const adminCount = await UserModel.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      console.log('[MongoDB Seeder] Seeding initial Platform Administrator into MongoDB...');

      const admin = new UserModel({
        fullName: 'JDpay Administrator',
        email: 'admin@jdpay.ng',
        phone: '+234 800 537 2900',
        password: 'adminPass123',
        role: 'admin',
        walletBalance: 0,
        status: 'active',
        virtualAccount: {
          bankName: 'Moniepoint MFB',
          accountNumber: '8005372900',
          accountName: 'JDPAY SETTLEMENT ESCROW',
        },
      });
      await admin.save();
      console.log('[MongoDB Seeder] Platform Administrator initialized.');
    }

    // 3. Check & Seed Cable Services
    const serviceCount = await CableServiceModel.countDocuments();
    if (serviceCount === 0) {
      console.log('[MongoDB Seeder] Seeding Cable Services into MongoDB...');
      await CableServiceModel.insertMany([
        {
          name: 'DStv',
          fullName: 'MultiChoice DStv (Direct Broadcast Satellite)',
          description: 'Direct-to-home satellite television service across Sub-Saharan Africa.',
          icon: 'Tv',
          status: 'active',
        },
        {
          name: 'GOtv',
          fullName: 'MultiChoice GOtv (Digital Terrestrial Television)',
          description: 'Affordable digital terrestrial television service with wide nationwide coverage.',
          icon: 'Tv',
          status: 'active',
        },
        {
          name: 'StarTimes',
          fullName: 'StarTimes Media (DTT & DTH Satellite)',
          description: 'Affordable digital TV provider offering high definition digital broadcast bouquets.',
          icon: 'Tv',
          status: 'active',
        },
      ]);
      console.log('[MongoDB Seeder] Cable services seeded successfully.');
    }
  } catch (err) {
    console.error('[MongoDB Seeder] Seeding error (non-fatal):', err);
  }
}
