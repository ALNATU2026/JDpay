import { CablePackageModel } from './models.js';
import { fetchVtpassVariations } from './vtpass.js';

/**
 * Sync official DStv packages and prices directly from VTpass live API into MongoDB
 */
export async function syncDstvPackagesFromVtpass(): Promise<{ count: number; added: number; updated: number }> {
  try {
    const variations = await fetchVtpassVariations('dstv');
    let added = 0;
    let updated = 0;

    for (const v of variations) {
      const price = typeof v.variation_amount === 'string' ? parseFloat(v.variation_amount) : Number(v.variation_amount);
      if (isNaN(price) || price <= 0) continue;

      let cleanName = v.name.trim();
      // Remove trailing price suffix like " N4,400" or " - N37,000" for neat bouquet display
      const priceRegex = /[\s-]+N[\d,]+$/i;
      cleanName = cleanName.replace(priceRegex, '').trim();

      // Look up by variationCode or packageName
      let existing = await CablePackageModel.findOne({
        service: 'DStv',
        $or: [{ variationCode: v.variation_code }, { packageName: cleanName }],
      });

      if (existing) {
        existing.packageName = cleanName;
        existing.price = price;
        existing.variationCode = v.variation_code;
        existing.status = 'active';
        await existing.save();
        updated++;
      } else {
        const channelsEstimate = price > 35000 ? 165 : price > 20000 ? 140 : price > 10000 ? 110 : 60;
        await new CablePackageModel({
          service: 'DStv',
          packageName: cleanName,
          variationCode: v.variation_code,
          price,
          channelsCount: channelsEstimate,
          description: `${cleanName} bouquet on MultiChoice DStv with instant switch activation.`,
          status: 'active',
        }).save();
        added++;
      }
    }

    console.log(`[VTpass Sync] Completed DStv bouquet synchronization: ${added} new packages added, ${updated} packages updated.`);
    return { count: variations.length, added, updated };
  } catch (err: any) {
    console.error('[VTpass Sync] Error synchronizing DStv packages:', err.message);
    throw err;
  }
}
