import { PALETTE_IDS, type PaletteId } from '../storage/schema';

/** Board colour schemes. `violet` is the default; the others unlock as the player levels up. */
export { PALETTE_IDS };
export type { PaletteId };

export interface PaletteDef {
  id: PaletteId;
  label: string;
  /** Player level needed to use it. */
  unlockLevel: number;
  /** Swatch for the picker (the colour of a selected cell). */
  swatch: string;
}

export const PALETTES: readonly PaletteDef[] = [
  { id: 'violet', label: 'Tím', unlockLevel: 1, swatch: '#A78BFA' },
  { id: 'ocean', label: 'Đại dương', unlockLevel: 3, swatch: '#38BDF8' },
  { id: 'forest', label: 'Rừng xanh', unlockLevel: 6, swatch: '#4ADE80' },
  { id: 'sunset', label: 'Hoàng hôn', unlockLevel: 10, swatch: '#FB7185' },
];

export function isPaletteUnlocked(id: PaletteId, level: number): boolean {
  const def = PALETTES.find((p) => p.id === id);
  return def !== undefined && level >= def.unlockLevel;
}
