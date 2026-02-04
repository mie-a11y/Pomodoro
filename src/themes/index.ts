import { zenGarden } from './zen-garden';
import type { Theme } from '../types';

export const themes: Record<string, Theme> = {
  'zen-garden': zenGarden,
};

export function getTheme(id: string): Theme {
  return themes[id] ?? zenGarden;
}

export { zenGarden };
