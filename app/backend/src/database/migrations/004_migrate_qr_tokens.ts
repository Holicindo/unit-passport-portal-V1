import { DataSource } from 'typeorm';

/**
 * One-time migration: update all existing qr_tokens to use
 * serial-number-based format: holi-cp-[serial_slug]
 *
 * Safe to run multiple times — skips tokens already in correct format.
 */
export async function migrateQrTokens(dataSource: DataSource): Promise<void> {
  const repo = dataSource.getRepository('units');

  const units: any[] = await repo.find({ select: ['id', 'serial_number', 'qr_token'] });

  let updated = 0;

  for (const unit of units) {
    const current = unit.qr_token as string;

    // Build the expected token from serial number
    const serialSlug = (unit.serial_number as string)
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const expectedToken = `holi-cp-${serialSlug}`;

    // Skip if already correct
    if (current === expectedToken) continue;

    // Check for collision with another unit
    const collision = await repo.findOne({ where: { qr_token: expectedToken } });
    const finalToken = collision && collision.id !== unit.id
      ? `holi-cp-${serialSlug}-${Math.random().toString(36).substring(2, 5)}`
      : expectedToken;

    await repo.update(unit.id, { qr_token: finalToken });
    updated++;
    console.log(`[QR Migration] ${unit.serial_number}: ${current} → ${finalToken}`);
  }

  if (updated > 0) {
    console.log(`[QR Migration] Done — updated ${updated}/${units.length} units.`);
  } else {
    console.log(`[QR Migration] All ${units.length} units already have correct token format.`);
  }
}
