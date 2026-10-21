import type { MessageKey } from '../i18n';
import { PALETTE_IDS, type PaletteId } from '../storage/schema';

/** Board colour schemes. `violet` is the default; the others unlock as the player levels up. */
export { PALETTE_IDS };
export type { PaletteId };

export interface PaletteDef {
  id: PaletteId;
  /** Catalog key of the palette's name. */
  labelKey: MessageKey;
  /** Player level needed to use it. */
  unlockLevel: number;
  /** Swatch for the picker (the colour of a selected cell). */
  swatch: string;
}

export const PALETTES: readonly PaletteDef[] = [
  { id: 'violet', labelKey: 'palette.violet', unlockLevel: 1, swatch: '#A78BFA' },
  { id: 'ocean', labelKey: 'palette.ocean', unlockLevel: 3, swatch: '#38BDF8' },
  { id: 'forest', labelKey: 'palette.forest', unlockLevel: 6, swatch: '#4ADE80' },
  { id: 'sunset', labelKey: 'palette.sunset', unlockLevel: 10, swatch: '#FB7185' },
];

export function isPaletteUnlocked(id: PaletteId, level: number): boolean {
  const def = PALETTES.find((p) => p.id === id);
  return def !== undefined && level >= def.unlockLevel;
}
