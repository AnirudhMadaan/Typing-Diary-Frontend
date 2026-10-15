import React, { useEffect, useMemo, useState } from 'react';
import { RotateCcw, Shuffle, SlidersHorizontal, X } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { User } from '../types/diary';

type PageStyle = NonNullable<User['settings']['page']>;
type GlobalStyle = NonNullable<User['settings']['global']>;

const defaultPage: PageStyle = {
  font: 'lora', pageStyle: 'lined', fontSize: 16, lineHeight: 1.9, editorWidth: 720, align: 'left', textColor: '',
};
const defaultGlobal: GlobalStyle = {
  palette: 'forest', accent: '', texture: true, icon: '✦', compact: false, mode: 'light',
};
const fonts = [
  ['dm', 'DM Sans', 'Clean'], ['lora', 'Lora', 'Literary'], ['fraunces', 'Fraunces', 'Editorial'],
  ['caveat', 'Caveat', 'Handwritten'], ['patrick', 'Patrick Hand', 'Casual'], ['kalam', 'Kalam', 'Ink note'], ['mono', 'Space Mono', 'Typewriter'],
];
const pages = ['lined', 'grid', 'dots', 'paper', 'blank'];
const palettes: Record<string, {
  label: string;
  color: string;
  background: string;
  surface: string;
  ink: string;
  muted: string;
  border: string;
  primary: string;
}> = {
  forest: { label: 'Forest', color: '#73865c', background: '#FAF8F5', surface: '#FCFBF9', ink: '#24201C', muted: '#736558', border: '#EAE4DC', primary: '#2B2621' },
  ink: { label: 'Ink', color: '#514948', background: '#F5F4F3', surface: '#FCFBFA', ink: '#262322', muted: '#716B68', border: '#E2DFDD', primary: '#302C2B' },
  ocean: { label: 'Ocean', color: '#66869a', background: '#F2F7F8', surface: '#FBFEFF', ink: '#1F2B30', muted: '#65777D', border: '#D8E5E8', primary: '#27434D' },
  rose: { label: 'Rose', color: '#b17682', background: '#FBF4F4', surface: '#FFFAFA', ink: '#342527', muted: '#80666A', border: '#EBD8DA', primary: '#493137' },
  lavender: { label: 'Lavender', color: '#8878a5', background: '#F7F5FB', surface: '#FDFCFF', ink: '#2E2938', muted: '#716A80', border: '#E3DDEC', primary: '#393149' },
  sunset: { label: 'Sunset', color: '#bd7958', background: '#FAF4EF', surface: '#FFFAF5', ink: '#35291F', muted: '#806B5C', border: '#EADBCB', primary: '#493428' },
};
const icons = ['✦', '✎', '♡', '☼', '☾', '❋', '◌'];

function applyAppearance(page: PageStyle, global: GlobalStyle) {
  const root = document.documentElement;
  const selectedPalette = palettes[global.palette] || palettes.forest;
  const accentColor = global.accent || selectedPalette.color;
  document.body.dataset.diaryPage = page.pageStyle;
  document.body.dataset.diaryMode = global.mode === 'dark' ? 'dark' : 'light';
  document.body.dataset.diaryTexture = global.texture ? 'on' : 'off';
  document.body.dataset.diaryCompact = global.compact ? 'on' : 'off';
  document.body.dataset.diaryPalette = global.palette in palettes ? global.palette : 'forest';
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

export const CustomizeModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { currentUser, saveAppearance, error, clearError } = useDiary();
  const [page, setPage] = useState<PageStyle>({ ...defaultPage, ...(currentUser.settings.page || {}) });
  const [global, setGlobal] = useState<GlobalStyle>({ ...defaultGlobal, ...(currentUser.settings.global || {}) });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const nextPage = { ...defaultPage, ...(currentUser.settings.page || {}) };
    const nextGlobal = { ...defaultGlobal, ...(currentUser.settings.global || {}) };
    setPage(nextPage);
    setGlobal(nextGlobal);
    applyAppearance(nextPage, nextGlobal);
  }, [currentUser.settings.page, currentUser.settings.global]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  const accent = useMemo(() => global.accent || palettes[global.palette]?.color || palettes.forest.color, [global]);

  if (!isOpen) return null;

  const updatePage = (updates: Partial<PageStyle>) => {
    const next = { ...page, ...updates };
    setPage(next);
    applyAppearance(next, global);
  };
  const updateGlobal = (updates: Partial<GlobalStyle>) => {
    const next = { ...global, ...updates };
    setGlobal(next);
    applyAppearance(page, next);
  };
  const save = async () => {
    setSaving(true);
    setSaved(false);
    clearError();
    try {
      await saveAppearance(page, global);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } catch {
      // The server message is shown above the save controls.
    } finally {
      setSaving(false);
    }
  };
  const randomize = () => {
    const nextPage = {
      ...page,
      font: fonts[Math.floor(Math.random() * fonts.length)][0],
      pageStyle: pages[Math.floor(Math.random() * pages.length)],
    };
    const paletteNames = Object.keys(palettes);
    const nextGlobal = {
      ...global,
      palette: paletteNames[Math.floor(Math.random() * paletteNames.length)],
      accent: '',
    };
    setPage(nextPage);
    setGlobal(nextGlobal);
    applyAppearance(nextPage, nextGlobal);
  };
  const reset = () => {
    setPage(defaultPage);
    setGlobal(defaultGlobal);
    applyAppearance(defaultPage, defaultGlobal);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="customize-modal-title" className="bg-[#FAF8F5] border border-[#E3DCCF] rounded-2xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6">
        <header className="flex items-start justify-between border-b border-[#EAE4DC] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-type uppercase tracking-wider text-[#8A7969]">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Personal writing space
            </div>
              <h2 id="customize-modal-title" className="font-serif-display text-2xl font-bold text-[#24201C] mt-1">Writing page & app appearance</h2>
              <p className="text-xs text-[#736558] mt-1">Writing-page choices shape the typewriter canvas; app-wide colors carry across every tab.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1 text-[#8C7D6F] hover:text-[#24201C]"><X className="w-5 h-5" /></button>
        </header>

        <div className="space-y-5">
          <section className="space-y-2">
            <div>
              <h3 className="text-xs font-bold text-[#342D26]">Writing page · type</h3>
              <p className="text-[11px] text-[#817366]">Choose the voice of your page.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fonts.map(([key, label, mood]) => (
                <button key={key} onClick={() => updatePage({ font: key })} className={`p-2.5 border rounded-lg text-left ${page.font === key ? 'border-[#2B2621] bg-[#EFE9DF]' : 'border-[#DDD5C7] bg-[#FCFBF9] hover:bg-[#F3EEE6]'}`}>
                  <span className="block text-xs font-semibold text-[#2B2621]">{label}</span>
                  <span className="block text-[10px] text-[#827467]">{mood}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div>
              <h3 className="text-xs font-bold text-[#342D26]">Writing page · paper</h3>
              <p className="text-[11px] text-[#817366]">Change the paper beneath your words.</p>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {pages.map((style) => (
                <button key={style} onClick={() => updatePage({ pageStyle: style })} className={`px-2 py-3 border rounded-lg text-xs capitalize ${page.pageStyle === style ? 'border-[#2B2621] bg-[#EFE9DF] font-semibold' : 'border-[#DDD5C7] bg-[#FCFBF9] hover:bg-[#F3EEE6]'}`}>
                  <span className="block text-base mb-1">{style === 'lined' ? '▤' : style === 'grid' ? '▦' : style === 'dots' ? '⠿' : style === 'paper' ? '◫' : '□'}</span>
                  {style}
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-2">
            <div>
               <h3 className="text-xs font-bold text-[#342D26]">App-wide color theme</h3>
               <p className="text-[11px] text-[#817366]">Change the background, cards, text, borders, and accent throughout the app.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(palettes).map(([key, value]) => (
                <button key={key} onClick={() => updateGlobal({ palette: key, accent: '' })} aria-pressed={global.palette === key} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs ${global.palette === key ? 'border-[#2B2621] bg-[#EFE9DF]' : 'border-[#DDD5C7] bg-[#FCFBF9]'}`}>
                  <span className="w-4 h-4 rounded-full" style={{ backgroundColor: value.color }} />{value.label}
                </button>
              ))}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[#DDD5C7] bg-[#FCFBF9] text-xs">
                Accent
                <input type="color" aria-label="Custom accent color" value={accent} onChange={(event) => updateGlobal({ accent: event.target.value })} className="w-5 h-5 p-0 border-0 bg-transparent" />
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <label className="text-xs text-[#4A3E33]">
              Text size <span className="float-right font-mono-type">{page.fontSize}px</span>
              <input type="range" min="13" max="22" step="1" value={page.fontSize} onChange={(event) => updatePage({ fontSize: Number(event.target.value) })} className="block w-full mt-2 accent-[#71634F]" />
            </label>
            <label className="text-xs text-[#4A3E33]">
              Line spacing <span className="float-right font-mono-type">{page.lineHeight.toFixed(1)}</span>
              <input type="range" min="1.2" max="2.6" step="0.1" value={page.lineHeight} onChange={(event) => updatePage({ lineHeight: Number(event.target.value) })} className="block w-full mt-2 accent-[#71634F]" />
            </label>
            <label className="text-xs text-[#4A3E33]">
              Writing width <span className="float-right font-mono-type">{page.editorWidth}px</span>
              <input type="range" min="520" max="980" step="20" value={page.editorWidth} onChange={(event) => updatePage({ editorWidth: Number(event.target.value) })} className="block w-full mt-2 accent-[#71634F]" />
            </label>
            <label className="text-xs text-[#4A3E33]">
              Text alignment
              <select value={page.align} onChange={(event) => updatePage({ align: event.target.value })} className="block w-full mt-1 px-2 py-2 bg-white border border-[#DDD6CB] rounded-lg text-xs">
                {['left', 'center', 'right', 'justify'].map((align) => <option key={align} value={align}>{align[0].toUpperCase() + align.slice(1)}</option>)}
              </select>
            </label>
            <label className="text-xs text-[#4A3E33]">
              Ink color
              <span className="flex items-center gap-2 mt-1">
                <input type="color" value={page.textColor || '#29241F'} onChange={(event) => updatePage({ textColor: event.target.value })} className="w-8 h-8" />
                <button type="button" onClick={() => updatePage({ textColor: '' })} className="text-[11px] underline text-[#75685B]">Reset ink</button>
              </span>
            </label>
            <label className="flex items-center justify-between gap-3 text-xs text-[#4A3E33] sm:col-span-2">
              <span><strong>Paper texture</strong><small className="block text-[11px] text-[#817366]">Add a subtle grain across the app and writing surface.</small></span>
              <input type="checkbox" checked={global.texture} onChange={(event) => updateGlobal({ texture: event.target.checked })} className="w-4 h-4 accent-[#71634F]" />
            </label>
            <div className="sm:col-span-2">
              <span className="text-xs font-semibold text-[#4A3E33]">Diary mark</span>
              <div className="flex gap-2 mt-2">
                {icons.map((icon) => (
                  <button key={icon} type="button" onClick={() => updateGlobal({ icon })} aria-label={`Use ${icon} as your diary mark`} aria-pressed={global.icon === icon} className={`w-9 h-9 rounded-lg border text-lg ${global.icon === icon ? 'border-[#2B2621] bg-[#EFE9DF]' : 'border-[#DDD5C7] bg-white'}`}>{icon}</button>
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between gap-3 text-xs text-[#4A3E33] sm:col-span-2">
              <span><strong>Compact writing page</strong><small className="block text-[11px] text-[#817366]">Use tighter padding in the Typewriter Studio.</small></span>
              <input type="checkbox" checked={global.compact} onChange={(event) => updateGlobal({ compact: event.target.checked })} className="w-4 h-4 accent-[#71634F]" />
            </label>
          </section>
        </div>

        {error && <p role="alert" className="text-xs text-[#A63A2B] bg-[#FDEAE8] p-3 rounded-lg border border-[#F2C4BE]">{error}</p>}
        <footer className="flex flex-wrap justify-between gap-2 border-t border-[#EAE4DC] pt-4">
          <div className="flex gap-2">
            <button onClick={randomize} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4D4034] bg-[#EFE9DF] border border-[#DDD5C7] rounded-lg"><Shuffle className="w-3.5 h-3.5" /> Randomize</button>
            <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 text-xs text-[#6B5E52] hover:bg-[#F2EDE4] rounded-lg"><RotateCcw className="w-3.5 h-3.5" /> Reset</button>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-3 py-2 text-xs text-[#6B5E52]">Close</button>
            <button disabled={saving} onClick={() => void save()} className="px-4 py-2 text-xs font-semibold text-white rounded-lg disabled:opacity-60" style={{ backgroundColor: 'var(--diary-primary, #2B2621)' }}>
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save customization'}
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};
