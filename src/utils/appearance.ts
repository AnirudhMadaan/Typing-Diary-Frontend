import type { User } from '../types/diary';

export type PageAppearance = NonNullable<User['settings']['page']>;
export type GlobalAppearance = NonNullable<User['settings']['global']>;

export const defaultPageAppearance: PageAppearance = {
  font: 'lora',
  pageStyle: 'lined',
  fontSize: 16,
  lineHeight: 1.9,
  editorWidth: 720,
  align: 'left',
  textColor: '',
};

export const defaultGlobalAppearance: GlobalAppearance = {
  palette: 'forest',
  accent: '',
  texture: true,
  icon: '✦',
  compact: false,
  mode: 'light',
};

export const appearancePalettes = {
  forest: { id: 'forest', label: 'Forest', color: '#73865c', background: '#FAF8F5', surface: '#FCFBF9', ink: '#24201C', muted: '#736558', border: '#EAE4DC', primary: '#2B2621' },
  ink: { id: 'ink', label: 'Ink', color: '#514948', background: '#F5F4F3', surface: '#FCFBFA', ink: '#262322', muted: '#716B68', border: '#E2DFDD', primary: '#302C2B' },
  ocean: { id: 'ocean', label: 'Ocean', color: '#66869a', background: '#F2F7F8', surface: '#FBFEFF', ink: '#1F2B30', muted: '#65777D', border: '#D8E5E8', primary: '#27434D' },
  rose: { id: 'rose', label: 'Rose', color: '#b17682', background: '#FBF4F4', surface: '#FFFAFA', ink: '#342527', muted: '#80666A', border: '#EBD8DA', primary: '#493137' },
  lavender: { id: 'lavender', label: 'Lavender', color: '#8878a5', background: '#F7F5FB', surface: '#FDFCFF', ink: '#2E2938', muted: '#716A80', border: '#E3DDEC', primary: '#393149' },
  sunset: { id: 'sunset', label: 'Sunset', color: '#bd7958', background: '#FAF4EF', surface: '#FFFAF5', ink: '#35291F', muted: '#806B5C', border: '#EADBCB', primary: '#493428' },
};

export function applyAppearance(page: PageAppearance, global: GlobalAppearance) {
  const selectedPalette = appearancePalettes[global.palette as keyof typeof appearancePalettes] || appearancePalettes.forest;
  const accentColor = global.accent || selectedPalette.color;
  const root = document.documentElement;

  document.body.dataset.diaryPage = page.pageStyle;
  document.body.dataset.diaryMode = global.mode === 'dark' ? 'dark' : 'light';
  document.body.dataset.diaryTexture = global.texture ? 'on' : 'off';
  document.body.dataset.diaryCompact = global.compact ? 'on' : 'off';
  document.body.dataset.diaryPalette = selectedPalette.id;
  root.dataset.diaryFont = page.font;
  root.style.colorScheme = global.mode === 'dark' ? 'dark' : 'light';
  root.style.setProperty('--diary-ink', page.textColor || '#29241F');
  root.style.setProperty('--diary-accent', accentColor);
  root.style.setProperty('--diary-accent-soft', `color-mix(in srgb, ${accentColor} 11%, ${selectedPalette.surface})`);
  root.style.setProperty('--diary-app-bg', selectedPalette.background);
  root.style.setProperty('--diary-surface', selectedPalette.surface);
  root.style.setProperty('--diary-surface-muted', `color-mix(in srgb, ${accentColor} 7%, ${selectedPalette.background})`);
  root.style.setProperty('--diary-app-ink', selectedPalette.ink);
  root.style.setProperty('--diary-muted-ink', selectedPalette.muted);
  root.style.setProperty('--diary-border', selectedPalette.border);
  root.style.setProperty('--diary-primary', selectedPalette.primary);
  root.style.setProperty('--diary-primary-hover', `color-mix(in srgb, ${selectedPalette.primary} 84%, white)`);
  root.style.setProperty('--diary-font-size', `${page.fontSize}px`);
  root.style.setProperty('--diary-line-height', String(page.lineHeight));
  root.style.setProperty('--diary-editor-width', `${page.editorWidth}px`);
  root.style.setProperty('--diary-text-align', page.align);
}
