import { CablePackageModel } from './models.js';
import { fetchVtpassVariations, VtpassVariation } from './vtpass.js';

/**
 * Clean bouquet package name for display
 */
function cleanPackageName(name: string, service: 'DStv' | 'GOtv' | 'StarTimes'): string {
  let cleaned = name.trim();
  // Strip trailing price patterns like " N4,400", " - 2100 Naira - 1 Month", " - monthly N11,400"
  if (service === 'DStv') {
    cleaned = cleaned.replace(/[\s-]+N[\d,]+$/i, '').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  } else if (service === 'GOtv') {
    cleaned = cleaned.replace(/[\s-]+monthly\s+N[\d,]+/i, '- Monthly').trim();
    cleaned = cleaned.replace(/[\s-]+quarterly\s+N[\d,]+/i, '- Quarterly').trim();
    cleaned = cleaned.replace(/[\s-]+yearly\s+N[\d,]+/i, '- Yearly').trim();
    cleaned = cleaned.replace(/[\s-]+N[\d,]+$/i, '').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  } else if (service === 'StarTimes') {
    // Examples: "Nova (Dish) - 2100 Naira - 1 Month" -> "Nova (Dish) - 1 Month"
    // "Basic (Antenna) - 4,000 Naira - 1 Month" -> "Basic (Antenna) - 1 Month"
    // "Startimes SHS - 2,800 Naira - Weekly" -> "StarTimes Solar - Weekly"
    cleaned = cleaned.replace(/\s*-\s*[\d,]+\s*Naira\s*-\s*/i, ' - ').trim();
    cleaned = cleaned.replace(/^Startimes\s+/i, 'StarTimes ').trim();
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
  }
  return cleaned;
}

/**
 * Estimate channel count based on service and price
 */
function estimateChannelsCount(service: 'DStv' | 'GOtv' | 'StarTimes', price: number): number {
  if (service === 'DStv') {
    return price >= 40000 ? 165 : price >= 25000 ? 145 : price >= 18000 ? 130 : price >= 10000 ? 105 : price >= 5000 ? 85 : 45;
  }
  if (service === 'GOtv') {
    return price >= 15000 ? 75 : price >= 10000 ? 70 : price >= 8000 ? 60 : price >= 5000 ? 50 : price >= 3000 ? 40 : 35;
  }
  // StarTimes
  return price >= 9000 ? 95 : price >= 6000 ? 75 : price >= 4000 ? 55 : price >= 2000 ? 35 : 25;
}

/**
 * Purge obsolete sandbox/dummy packages that lack variationCode or have deprecated sandbox prices
 */
export async function purgeOldSandboxPackages(): Promise<number> {
  try {
    // Delete any packages without a valid variationCode (the old mock seed items)
    const resultNoCode = await CablePackageModel.deleteMany({
      $or: [
        { variationCode: { $exists: false } },
        { variationCode: null },
        { variationCode: '' },
        // Known legacy dummy names
        { packageName: 'StarTimes Super Bouquet' },
        { packageName: 'StarTimes Classic Bouquet' },
        { packageName: 'StarTimes Basic Bouquet' },
        { packageName: 'StarTimes Nova Bouquet' },
      ],
    });

    console.log(`[VTpass Sync] Purged ${resultNoCode.deletedCount} old sandbox/dummy packages from DB.`);
    return resultNoCode.deletedCount || 0;
  } catch (err: any) {
    console.warn('[VTpass Sync] Error purging old sandbox packages:', err.message);
    return 0;
  }
}

/**
 * Synchronize official DStv packages and live prices directly from VTpass API
 */
export async function syncDstvPackagesFromVtpass(): Promise<{ count: number; added: number; updated: number }> {
  const variations = await fetchVtpassVariations('dstv');
  let added = 0;
  let updated = 0;

  for (const v of variations) {
    const price = typeof v.variation_amount === 'string' ? parseFloat(v.variation_amount.replace(/,/g, '')) : Number(v.variation_amount);
    if (isNaN(price) || price <= 0) continue;

    const cleanName = cleanPackageName(v.name, 'DStv');

    let existing = await CablePackageModel.findOne({
      service: 'DStv',
      variationCode: v.variation_code,
    });

    if (existing) {
      existing.packageName = cleanName;
      existing.price = price;
      existing.status = 'active';
      existing.channelsCount = estimateChannelsCount('DStv', price);
      await existing.save();
      updated++;
    } else {
      await new CablePackageModel({
        service: 'DStv',
        packageName: cleanName,
        variationCode: v.variation_code,
        price,
        channelsCount: estimateChannelsCount('DStv', price),
        description: `${cleanName} bouquet on MultiChoice DStv with instant switch activation.`,
        status: 'active',
      }).save();
      added++;
    }
  }

  console.log(`[VTpass Sync] DStv: ${variations.length} packages processed (${added} added, ${updated} updated).`);
  return { count: variations.length, added, updated };
}

/**
 * Synchronize official StarTimes packages and live prices directly from VTpass API
 */
export async function syncStartimesPackagesFromVtpass(): Promise<{ count: number; added: number; updated: number }> {
  const variations = await fetchVtpassVariations('startimes');
  let added = 0;
  let updated = 0;

  for (const v of variations) {
    const price = typeof v.variation_amount === 'string' ? parseFloat(v.variation_amount.replace(/,/g, '')) : Number(v.variation_amount);
    if (isNaN(price) || price <= 0) continue;

    const cleanName = cleanPackageName(v.name, 'StarTimes');

    let existing = await CablePackageModel.findOne({
      service: 'StarTimes',
      variationCode: v.variation_code,
    });

    if (existing) {
      existing.packageName = cleanName;
      existing.price = price;
      existing.status = 'active';
      existing.channelsCount = estimateChannelsCount('StarTimes', price);
      await existing.save();
      updated++;
    } else {
      await new CablePackageModel({
        service: 'StarTimes',
        packageName: cleanName,
        variationCode: v.variation_code,
        price,
        channelsCount: estimateChannelsCount('StarTimes', price),
        description: `${cleanName} bouquet on StarTimes Digital TV with crystal clear broadcast.`,
        status: 'active',
      }).save();
      added++;
    }
  }

  console.log(`[VTpass Sync] StarTimes: ${variations.length} packages processed (${added} added, ${updated} updated).`);
  return { count: variations.length, added, updated };
}

/**
 * Synchronize official GOtv packages and live prices directly from VTpass API
 */
export async function syncGotvPackagesFromVtpass(): Promise<{ count: number; added: number; updated: number }> {
  const variations = await fetchVtpassVariations('gotv');
  let added = 0;
  let updated = 0;

  for (const v of variations) {
    const price = typeof v.variation_amount === 'string' ? parseFloat(v.variation_amount.replace(/,/g, '')) : Number(v.variation_amount);
    if (isNaN(price) || price <= 0) continue;

    const cleanName = cleanPackageName(v.name, 'GOtv');

    let existing = await CablePackageModel.findOne({
      service: 'GOtv',
      variationCode: v.variation_code,
    });

    if (existing) {
      existing.packageName = cleanName;
      existing.price = price;
      existing.status = 'active';
      existing.channelsCount = estimateChannelsCount('GOtv', price);
      await existing.save();
      updated++;
    } else {
      await new CablePackageModel({
        service: 'GOtv',
        packageName: cleanName,
        variationCode: v.variation_code,
        price,
        channelsCount: estimateChannelsCount('GOtv', price),
        description: `${cleanName} bouquet on MultiChoice GOtv digital terrestrial network.`,
        status: 'active',
      }).save();
      added++;
    }
  }

  console.log(`[VTpass Sync] GOtv: ${variations.length} packages processed (${added} added, ${updated} updated).`);
  return { count: variations.length, added, updated };
}

/**
 * Full synchronization of all cable broadcasters from VTpass live API
 */
export async function syncAllPackagesFromVtpass(): Promise<{
  purgedOld: number;
  dstv: { count: number; added: number; updated: number };
  startimes: { count: number; added: number; updated: number };
  gotv: { count: number; added: number; updated: number };
}> {
  console.log('[VTpass Sync] Starting full live synchronization of all broadcasters...');
  const purgedOld = await purgeOldSandboxPackages();

  const [dstv, startimes, gotv] = await Promise.all([
    syncDstvPackagesFromVtpass().catch((e) => {
      console.warn('[VTpass Sync] DStv sync error:', e.message);
      return { count: 0, added: 0, updated: 0 };
    }),
    syncStartimesPackagesFromVtpass().catch((e) => {
      console.warn('[VTpass Sync] StarTimes sync error:', e.message);
      return { count: 0, added: 0, updated: 0 };
    }),
    syncGotvPackagesFromVtpass().catch((e) => {
      console.warn('[VTpass Sync] GOtv sync error:', e.message);
      return { count: 0, added: 0, updated: 0 };
    }),
  ]);

  console.log('[VTpass Sync] Full synchronization complete. All sandbox prices removed!');
  return { purgedOld, dstv, startimes, gotv };
}
