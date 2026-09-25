import {
  UserModel,
  CablePackageModel,
  TransactionModel,
  NotificationModel,
  CableServiceModel,
} from './models.js';

export async function seedDatabaseIfEmpty() {
  try {
    // 1. Check & Seed Packages with Live Official VTpass Bouquets & Prices (Zero sandbox pricing)
    const packageCount = await CablePackageModel.countDocuments();
    if (packageCount === 0) {
      console.log('[MongoDB Seeder] Seeding official live Cable TV packages (removing sandbox prices)...');
      const defaultPackages = [
        // DStv (Live official prices from VTpass)
        { service: 'DStv', packageName: 'DStv Premium', variationCode: 'dstv3', price: 44500, channelsCount: 165, description: 'All channels, live Premier League, Champions League, Formula 1, and Showmax included.' },
        { service: 'DStv', packageName: 'DStv Compact Plus', variationCode: 'dstv7', price: 30000, channelsCount: 145, description: 'European football leagues, premium international drama, documentary and kids series.' },
        { service: 'DStv', packageName: 'DStv Compact', variationCode: 'dstv79', price: 19000, channelsCount: 130, description: 'Premier League action, WWE, blockbuster movies, and local entertainment.' },
        { service: 'DStv', packageName: 'DStv Confam', variationCode: 'dstv-confam', price: 11000, channelsCount: 105, description: 'Family favorite movies, news, music, SuperSport La Liga and documentary channels.' },
        { service: 'DStv', packageName: 'DStv Yanga', variationCode: 'dstv-yanga', price: 6000, channelsCount: 85, description: 'Affordable entertainment with Nollywood, kids favorite channels and selected sports.' },
        { service: 'DStv', packageName: 'DStv Padi', variationCode: 'dstv-padi', price: 4400, channelsCount: 45, description: 'Essential local news, music and educational broadcasts.' },

        // GOtv (Live official prices from VTpass)
        { service: 'GOtv', packageName: 'GOtv Supa Plus - Monthly', variationCode: 'gotv-supa-plus', price: 16800, channelsCount: 75, description: 'All Premier League matches, Disney Channel, international movies and series.' },
        { service: 'GOtv', packageName: 'GOtv Supa - Monthly', variationCode: 'gotv-supa', price: 11400, channelsCount: 70, description: 'More entertainment, sports highlights, wildlife documentaries and telenovelas.' },
        { service: 'GOtv', packageName: 'GOtv Max', variationCode: 'gotv-max', price: 8500, channelsCount: 60, description: 'La Liga, Serie A, SuperSport Football and family cartoon channels.' },
        { service: 'GOtv', packageName: 'GOtv Jolli', variationCode: 'gotv-jolli', price: 5800, channelsCount: 50, description: 'Quality family entertainment at an accessible monthly subscription.' },
        { service: 'GOtv', packageName: 'GOtv Jinja', variationCode: 'gotv-jinja', price: 3900, channelsCount: 40, description: 'Local music, Nollywood movies, news and religious programming.' },
        { service: 'GOtv', packageName: 'GOtv Smallie - Monthly', variationCode: 'gotv-smallie', price: 1900, channelsCount: 35, description: 'Pocket-friendly digital terrestrial television for every Nigerian household.' },

        // StarTimes (Live official prices from VTpass)
        { service: 'StarTimes', packageName: 'StarTimes Super (Dish) - 1 Month', variationCode: 'super', price: 9800, channelsCount: 95, description: 'Top international sports (Bundesliga, Europa), blockbuster movies and live global news.' },
        { service: 'StarTimes', packageName: 'StarTimes Super (Antenna) - 1 Month', variationCode: 'super-antenna-monthly', price: 9500, channelsCount: 90, description: 'Top sports, international movies and children entertainment on antenna decoder.' },
        { service: 'StarTimes', packageName: 'StarTimes Classic (Dish) - 1 Month', variationCode: 'special-monthly', price: 7400, channelsCount: 80, description: 'Popular family channels, football matches and drama series on satellite dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Classic (Antenna) - 1 Month', variationCode: 'classic', price: 6000, channelsCount: 70, description: 'Popular family entertainment and selected sports on antenna decoder.' },
        { service: 'StarTimes', packageName: 'StarTimes Basic (Dish) - 1 Month', variationCode: 'smart', price: 5100, channelsCount: 60, description: 'Music, local drama, cartoons and documentary channels via dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Basic (Antenna) - 1 Month', variationCode: 'basic', price: 4000, channelsCount: 50, description: 'Affordable balanced mix of local Nollywood, cartoons, and music broadcasts.' },
        { service: 'StarTimes', packageName: 'StarTimes Nova (Dish) - 1 Month', variationCode: 'nova', price: 2100, channelsCount: 35, description: 'Entry level crystal-clear digital TV entertainment on satellite dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Nova (Antenna) - 1 Month', variationCode: 'uni-2', price: 2100, channelsCount: 35, description: 'Entry level crystal-clear digital TV entertainment on antenna decoder.' },
        { service: 'StarTimes', packageName: 'StarTimes Super (Dish) - 1 Week', variationCode: 'super-weekly', price: 3300, channelsCount: 95, description: '7-day full sports and movie access on StarTimes satellite dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Super (Antenna) - 1 Week', variationCode: 'super-antenna-weekly', price: 3200, channelsCount: 90, description: '7-day premium access on StarTimes terrestrial antenna.' },
        { service: 'StarTimes', packageName: 'StarTimes Classic (Dish) - 1 Week', variationCode: 'classic-weekly-dish', price: 2500, channelsCount: 80, description: '7-day classic bouquet entertainment on StarTimes satellite dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Classic (Antenna) - 1 Week', variationCode: 'classic-weekly', price: 2000, channelsCount: 70, description: '7-day classic bouquet entertainment on antenna decoder.' },
        { service: 'StarTimes', packageName: 'StarTimes Basic (Dish) - 1 Week', variationCode: 'smart-weekly', price: 1700, channelsCount: 60, description: '7-day basic entertainment on StarTimes satellite dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Basic (Antenna) - 1 Week', variationCode: 'basic-weekly', price: 1400, channelsCount: 50, description: '7-day basic bouquet access on terrestrial antenna.' },
        { service: 'StarTimes', packageName: 'StarTimes Nova (Dish) - 1 Week', variationCode: 'nova-dish-weekly', price: 700, channelsCount: 35, description: 'Weekly pocket-friendly digital broadcast on satellite dish.' },
        { service: 'StarTimes', packageName: 'StarTimes Nova (Antenna) - 1 Week', variationCode: 'nova-weekly', price: 700, channelsCount: 35, description: 'Weekly pocket-friendly digital broadcast on antenna decoder.' },
      ];
      await CablePackageModel.insertMany(defaultPackages);
      console.log(`[MongoDB Seeder] Inserted ${defaultPackages.length} official packages into MongoDB.`);
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
