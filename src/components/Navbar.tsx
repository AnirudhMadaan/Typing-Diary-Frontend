import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, Check, ChevronDown, Moon, Palette, PenTool, Settings2, Sun, Volume2, VolumeX, ShieldCheck } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { typewriterAudio, SOUND_PROFILES, type SoundProfileType } from '../utils/audio';
import {
  applyAppearance,
  appearancePalettes,
  defaultGlobalAppearance,
  defaultPageAppearance,
  type GlobalAppearance,
} from '../utils/appearance';

export type DiaryTab = 'blog' | 'studio' | 'my-journal' | 'friends' | 'admin';

const palettes = Object.values(appearancePalettes);

interface NavbarProps {
  activeTab: DiaryTab;
  setActiveTab: (tab: DiaryTab) => void;
  onOpenNewEntry: () => void;
  onOpenProfile: () => void;
  onOpenCustomize: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab, setActiveTab, onOpenNewEntry, onOpenProfile, onOpenCustomize,
}) => {
  const { currentUser, updateUserSettings, saveAppearance, logout } = useDiary();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false);
  const [isSoundOpen, setIsSoundOpen] = useState(false);
  const [appearanceSaving, setAppearanceSaving] = useState(false);
  const [appearanceSaved, setAppearanceSaved] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);
  const soundRef = useRef<HTMLDivElement>(null);
  const incomingRequestCount = currentUser.friendRequestsReceived.length;
  const navItems: { id: DiaryTab; label: string; icon?: React.ReactNode }[] = [
    { id: 'blog', label: 'Community Blog' },
    { id: 'studio', label: 'Typewriter Studio' },
    { id: 'my-journal', label: 'My Journal' },
    { id: 'friends', label: 'Friends & Circles' },
    ...(currentUser.isAdmin
      ? [{ id: 'admin' as DiaryTab, label: 'Admin Panel', icon: <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> }]
      : []),
  ];

  // Close the account menu / appearance panel when the user taps anywhere
  // outside of it (pointerdown also covers touch screens), or presses Escape.
  useEffect(() => {
    if (!isMenuOpen && !isAppearanceOpen && !isSoundOpen) return;
    const closeOnOutsidePress = (event: Event) => {
      const target = event.target as Node | null;
      if (isMenuOpen && menuRef.current && target && !menuRef.current.contains(target)) setIsMenuOpen(false);
      if (isAppearanceOpen && appearanceRef.current && target && !appearanceRef.current.contains(target)) setIsAppearanceOpen(false);
      if (isSoundOpen && soundRef.current && target && !soundRef.current.contains(target)) setIsSoundOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
        setIsAppearanceOpen(false);
        setIsSoundOpen(false);
      }
    };
    document.addEventListener('pointerdown', closeOnOutsidePress);
    document.addEventListener('touchstart', closeOnOutsidePress, { passive: true });
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePress);
      document.removeEventListener('touchstart', closeOnOutsidePress);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMenuOpen, isAppearanceOpen, isSoundOpen]);

  // Changing page also dismisses any open menu.
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAppearanceOpen(false);
    setIsSoundOpen(false);
  }, [activeTab]);

  useEffect(() => {
    applyAppearance(
      currentUser.settings.page || defaultPageAppearance,
      { ...defaultGlobalAppearance, ...currentUser.settings.global },
    );
  }, [currentUser.settings.global, currentUser.settings.page]);

  const activeSoundType: SoundProfileType = currentUser.settings.soundType === 'mute' ? 'typewriter' : currentUser.settings.soundType;

  const setSoundEnabled = (soundEnabled: boolean) => {
    void updateUserSettings({ soundEnabled, soundType: activeSoundType }).catch(() => undefined);
  };

  const chooseSoundStyle = (soundType: SoundProfileType) => {
    // Play it straight away so the choice can be heard before the save finishes.
    typewriterAudio.setSoundProfile(soundType);
    typewriterAudio.playKeySound('a');
    void updateUserSettings({ soundEnabled: true, soundType }).catch(() => undefined);
  };

  const saveGlobalAppearance = async (global: GlobalAppearance) => {
    const page = currentUser.settings.page || defaultPageAppearance;
    applyAppearance(page, global);
    setAppearanceSaving(true);
    setAppearanceSaved(false);
    try {
      await saveAppearance(page, global);
      setAppearanceSaved(true);
      window.setTimeout(() => setAppearanceSaved(false), 1600);
    } catch {
      // The app-level error banner carries the save failure.
    } finally {
      setAppearanceSaving(false);
    }
  };

  const applyPalette = async (palette: typeof palettes[number]) => {
    await saveGlobalAppearance({
      ...defaultGlobalAppearance,
      ...currentUser.settings.global,
      palette: palette.id,
      accent: '',
    });
  };

  const setThemeMode = async (mode: 'light' | 'dark') => {
    await saveGlobalAppearance({
      ...defaultGlobalAppearance,
      ...currentUser.settings.global,
      mode,
    });
  };

  const toggleTexture = async () => {
    await saveGlobalAppearance({
      ...defaultGlobalAppearance,
      ...currentUser.settings.global,
      texture: !(currentUser.settings.global?.texture ?? true),
    });
  };

  const initials = currentUser.displayName.trim().slice(0, 1).toUpperCase() || 'W';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE4DC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button onClick={() => setActiveTab('blog')} className="flex items-center gap-2.5 text-left shrink-0">
          <span className="w-8 h-8 rounded-lg bg-[#2B2621] text-[#FAF8F5] flex items-center justify-center text-lg" aria-hidden="true">
            {currentUser.settings.global?.icon || '✦'}
          </span>
          <span className="flex flex-col">
            <span className="font-serif-display text-lg font-bold tracking-tight text-[#24201C] leading-none">Typing Diary</span>
            <span className="text-[10px] uppercase tracking-widest text-[#8C7D6F] font-mono-type mt-0.5">Journal & Commons</span>
          </span>
        </button>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-[#6B5E52]">
          {navItems.map(({ id, label, icon }) => (
            <button key={id} onClick={() => setActiveTab(id)} className={`relative whitespace-nowrap py-1 transition-colors flex items-center gap-1.5 ${activeTab === id ? 'text-[#1F1B17] font-semibold' : 'hover:text-[#1F1B17]'}`}>
              {icon}
              {label}
              {id === 'friends' && incomingRequestCount > 0 && (
                <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-[#B3402C]" title={`${incomingRequestCount} pending requests`} />
              )}
              {activeTab === id && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#8C765E] rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={appearanceRef}>
            <button
              onClick={() => { setIsMenuOpen(false); setIsSoundOpen(false); setIsAppearanceOpen((open) => !open); }}
              aria-expanded={isAppearanceOpen}
              aria-label="App appearance"
              data-testid="button-app-appearance"
              title="App appearance"
              className="flex items-center gap-1.5 p-2 sm:px-2.5 text-[#736557] hover:text-[#24201C] hover:bg-[#EFEAE2] rounded-lg"
            >
              <Palette className="w-4 h-4" />
              <span className="hidden xl:inline text-xs">Appearance</span>
            </button>
            {isAppearanceOpen && (
              <section className="absolute right-0 mt-2 w-[min(19rem,calc(100vw-1.5rem))] rounded-xl border border-[#E3DCCF] bg-[#FCFBF9] p-3 shadow-xl z-50" aria-label="App-wide appearance controls">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-serif-display text-sm font-bold text-[#24201C]">App-wide appearance</h2>
                    <p className="mt-0.5 text-[11px] text-[#817366]">Choose light or dark, then set a color palette.</p>
                  </div>
                  {appearanceSaved && <Check className="w-4 h-4 text-[#73865c]" aria-label="Appearance saved" />}
                </div>
                <div className="mt-3">
                  <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#817366]">Display mode</p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      data-testid="button-mode-light"
                      onClick={() => void setThemeMode('light')}
                      aria-pressed={(currentUser.settings.global?.mode || 'light') === 'light'}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] ${
                        (currentUser.settings.global?.mode || 'light') === 'light'
                          ? 'border-[#8C765E] bg-[#EFE9DF] font-semibold'
                          : 'border-[#DDD5C7] bg-white hover:bg-[#F3EEE6]'
                      }`}
                    >
                      <Sun className="h-3.5 w-3.5" /> Light
                    </button>
                    <button
                      type="button"
                      data-testid="button-mode-dark"
                      onClick={() => void setThemeMode('dark')}
                      aria-pressed={currentUser.settings.global?.mode === 'dark'}
                      className={`flex items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-[11px] ${
                        currentUser.settings.global?.mode === 'dark'
                          ? 'border-[#8C765E] bg-[#EFE9DF] font-semibold'
                          : 'border-[#DDD5C7] bg-white hover:bg-[#F3EEE6]'
                      }`}
                    >
                      <Moon className="h-3.5 w-3.5" /> Dark
                    </button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  {palettes.map((palette) => (
                    <button
                      key={palette.id}
                      type="button"
                      data-testid={`button-palette-${palette.id}`}
                      onClick={() => void applyPalette(palette)}
                      aria-pressed={(currentUser.settings.global?.palette || 'forest') === palette.id}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-2 text-left text-[11px] text-[#51463A] ${((currentUser.settings.global?.palette || 'forest') === palette.id) ? 'border-[#8C765E] bg-[#EFE9DF]' : 'border-[#DDD5C7] bg-white hover:bg-[#F3EEE6]'}`}
                    >
                      <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-black/10" style={{ backgroundColor: palette.color }} />
                      {palette.label}
                    </button>
                  ))}
                </div>
                <label className="mt-3 flex items-center justify-between border-t border-[#EFE9DF] pt-3 text-xs text-[#51463A]">
                  <span>Paper texture</span>
                  <input type="checkbox" data-testid="input-global-paper-texture" checked={currentUser.settings.global?.texture ?? true} onChange={() => void toggleTexture()} className="h-4 w-4 accent-[#71634F]" />
                </label>
                <p className="mt-2 text-[10px] text-[#948679]">{appearanceSaving ? 'Saving appearance…' : 'Writing page details live in Typewriter Studio customization.'}</p>
              </section>
            )}
          </div>

          <div className="relative" ref={soundRef}>
            <button
              type="button"
              onClick={() => { setIsAppearanceOpen(false); setIsMenuOpen(false); setIsSoundOpen((open) => !open); }}
              aria-expanded={isSoundOpen}
              title="Typing sounds"
              aria-label="Typing sound settings"
              data-testid="button-sound-settings"
              className="p-2 text-[#736557] hover:text-[#24201C] hover:bg-[#EFEAE2] rounded-lg"
            >
              {currentUser.settings.soundEnabled ? <Volume2 className="w-4 h-4 text-[#8C765E]" /> : <VolumeX className="w-4 h-4 text-[#A89E92]" />}
            </button>
            {isSoundOpen && (
              <section className="absolute right-0 mt-2 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-[#E3DCCF] bg-[#FCFBF9] p-3 shadow-xl z-50" aria-label="Typing sound settings">
                <label className="flex items-center justify-between gap-3 text-xs font-semibold text-[#24201C]">
                  <span>Play sounds while typing</span>
                  <input
                    type="checkbox"
                    checked={currentUser.settings.soundEnabled}
                    onChange={(event) => setSoundEnabled(event.target.checked)}
                    className="h-4 w-4 accent-[#71634F]"
                  />
                </label>
                <p className="mt-3 mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#817366]">Sound style</p>
                <div className="space-y-1 max-h-64 overflow-y-auto">
                  {SOUND_PROFILES.filter((profile) => profile.id !== 'mute').map((profile) => {
                    const selected = activeSoundType === profile.id;
                    return (
                      <button
                        key={profile.id}
                        type="button"
                        onClick={() => chooseSoundStyle(profile.id)}
                        aria-pressed={selected}
                        className={`w-full flex items-center justify-between gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] ${selected ? 'border-[#8C765E] bg-[#EFE9DF]' : 'border-[#DDD5C7] bg-white hover:bg-[#F3EEE6]'}`}
                      >
                        <span>
                          <span className="block font-semibold text-[#24201C]">{profile.label}</span>
                          <span className="block text-[10px] text-[#817366]">{profile.desc}</span>
                        </span>
                        {selected && <Check className="w-3.5 h-3.5 text-[#73865c] shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10px] text-[#948679]">Tap a style to hear it. Changes are saved automatically.</p>
              </section>
            )}
          </div>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => { setIsAppearanceOpen(false); setIsSoundOpen(false); setIsMenuOpen((open) => !open); }}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 text-xs text-[#4F4439] bg-[#F2EDE4] hover:bg-[#E8E1D5] border border-[#DDD6CB] rounded-lg"
              aria-expanded={isMenuOpen}
            >
              {currentUser.avatar
                ? <img src={currentUser.avatar} alt="" className="w-6 h-6 rounded-full object-cover border border-[#CFC5B8]" />
                : <span className="w-6 h-6 rounded-full bg-[#DED3C3] flex items-center justify-center text-[10px] font-bold">{initials}</span>}
              <span className="font-medium max-w-[100px] truncate">{currentUser.displayName}</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#857769]" />
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-[#FCFBF9] border border-[#E3DCCF] rounded-xl shadow-lg p-2 z-50">
                <div className="px-2.5 py-2 border-b border-[#EFE9DF] mb-1.5">
                  <p className="font-serif-display text-sm font-bold text-[#24201C]">{currentUser.displayName}</p>
                  <p className="text-[11px] text-[#8A7969] font-mono-type">@{currentUser.username}</p>
                </div>
                <button onClick={() => { setIsMenuOpen(false); onOpenProfile(); }} className="w-full text-left px-2.5 py-2 text-xs text-[#473D33] hover:bg-[#F2EDE4] rounded-lg">Edit profile</button>
                <button onClick={() => { setIsMenuOpen(false); onOpenCustomize(); }} className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-xs text-[#473D33] hover:bg-[#F2EDE4] rounded-lg">
                  <Settings2 className="w-3.5 h-3.5" /> Writing page & layout
                </button>
                {currentUser.isAdmin && (
                  <button onClick={() => { setIsMenuOpen(false); setActiveTab('admin'); }} className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-xs font-semibold text-[#24201C] bg-[#FAF4EB] hover:bg-[#F3E8D8] rounded-lg my-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" /> Admin Dashboard
                  </button>
                )}
                <button onClick={() => { setIsMenuOpen(false); void logout().catch(() => undefined); }} className="w-full flex items-center gap-2 text-left px-2.5 py-2 text-xs text-[#96473D] hover:bg-[#F7E9E5] rounded-lg">
                  <BookOpen className="w-3.5 h-3.5" /> Sign out
                </button>
              </div>
            )}
          </div>

          <button onClick={onOpenNewEntry} className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] rounded-lg whitespace-nowrap">
            <PenTool className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Write Entry</span>
            <span className="sm:hidden">Write</span>
          </button>
        </div>
      </div>

      <nav className="lg:hidden flex items-center justify-around px-2 py-2 border-t border-[#EAE4DC] text-[11px] font-medium text-[#6B5E52] bg-[#FAF8F5]">
        {navItems.map(({ id, label, icon }) => (
          <button key={id} onClick={() => setActiveTab(id)} className={`py-1 px-1 relative flex items-center gap-1 ${activeTab === id ? 'text-[#1F1B17] font-semibold' : ''}`}>
            {icon}
            {id === 'blog' ? 'Blog' : id === 'studio' ? 'Typewriter' : id === 'my-journal' ? 'Journal' : id === 'friends' ? 'Friends' : 'Admin'}
            {id === 'friends' && incomingRequestCount > 0 && <span className="absolute -right-1 top-0 w-1.5 h-1.5 rounded-full bg-[#B3402C]" />}
          </button>
        ))}
      </nav>
    </header>
  );
};
