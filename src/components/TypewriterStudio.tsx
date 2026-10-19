import React, { useState, useEffect, useRef } from 'react';
import { useDiary } from '../context/DiaryContext';
import { VisibilityType, MoodType } from '../types/diary';
import { typewriterAudio, SOUND_PROFILES, SoundProfileType } from '../utils/audio';
import { 
  Globe, 
  Users, 
  Lock, 
  UserX, 
  Sparkles, 
  Eye, 
  Volume2, 
  Settings2, 
  Check, 
  Hash, 
  Sliders, 
  HelpCircle,
  FileText,
  ImagePlus,
  CloudSun,
  Locate,
  MapPin,
  LoaderCircle,
  X,
} from 'lucide-react';
import type { DiaryWeather } from '../types/diary';
import { compressDiaryPhoto } from '../utils/diaryPhoto';
import {
  localDateKey,
  lookupWeatherAtPlace,
  lookupWeatherForDate,
  searchWeatherLocations,
  weatherPlaceFromCoordinates,
  type WeatherPlace,
} from '../utils/weather';

interface TypewriterStudioProps {
  initialVisibility?: VisibilityType;
  initialAnonymous?: boolean;
  onPostPublished: (visibility: VisibilityType) => void;
  onOpenCustomize: () => void;
}

export const TypewriterStudio: React.FC<TypewriterStudioProps> = ({ 
  initialVisibility = 'public',
  initialAnonymous = false,
  onPostPublished,
  onOpenCustomize,
}) => {
  const { currentUser, users, createEntry, setPaperTheme: savePaperTheme, updateUserSettings } = useDiary();

  // Content state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mood, setMood] = useState<MoodType>('reflective');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Daily Draft Auto-Save State & Logic
  const [draftRestored, setDraftRestored] = useState<boolean>(false);
  const draftLoadedRef = useRef<boolean>(false);
  const draftKey = `typing_diary_studio_draft_${currentUser.id || 'anonymous'}`;

  // Typing sound profile state
  const [soundProfile, setSoundProfile] = useState<SoundProfileType>(
    currentUser.settings.soundEnabled === false ? 'mute' : (currentUser.settings.soundType || 'typewriter')
  );

  useEffect(() => {
    setSoundProfile(currentUser.settings.soundEnabled === false ? 'mute' : (currentUser.settings.soundType || 'typewriter'));
  }, [currentUser.settings.soundEnabled, currentUser.settings.soundType]);

  const selectSoundProfile = (profile: SoundProfileType) => {
    setSoundProfile(profile);
    typewriterAudio.setSoundProfile(profile);
    typewriterAudio.playKeySound('a');
    void updateUserSettings({
      soundEnabled: profile !== 'mute',
      soundType: profile !== 'mute' ? profile : currentUser.settings.soundType,
    }).catch(() => undefined);
  };

  const getTodayDateStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Restore daily draft on mount or when draftKey changes
  useEffect(() => {
    if (draftLoadedRef.current) return;
    draftLoadedRef.current = true;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      const today = getTodayDateStr();

      if (parsed && parsed.date === today) {
        if ((parsed.title && parsed.title.trim()) || (parsed.content && parsed.content.trim())) {
          if (parsed.title) setTitle(parsed.title);
          if (parsed.content) setContent(parsed.content);
          if (parsed.mood) setMood(parsed.mood);
          if (Array.isArray(parsed.tags)) setTags(parsed.tags);
          setDraftRestored(true);
        }
      } else {
        // Automatically reset expired draft from previous days
        localStorage.removeItem(draftKey);
      }
    } catch {
      // Ignore corrupted localStorage data
    }
  }, [draftKey]);

  // Auto-save written text to localStorage for the current day
  useEffect(() => {
    if (!draftLoadedRef.current) return;
    const hasText = Boolean(title.trim() || content.trim());
    if (!hasText) {
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      return;
    }
    const today = getTodayDateStr();
    const draftData = {
      date: today,
      timestamp: Date.now(),
      title,
      content,
      mood,
      tags,
    };
    try {
      localStorage.setItem(draftKey, JSON.stringify(draftData));
    } catch {}
  }, [title, content, mood, tags, draftKey]);

  const clearRestoredDraft = () => {
    setTitle('');
    setContent('');
    setTags([]);
    setMood('reflective');
    try {
      localStorage.removeItem(draftKey);
    } catch {}
    setDraftRestored(false);
  };

  // Privacy & Sharing Settings state (Granular control!)
  const [visibility, setVisibility] = useState<VisibilityType>(initialVisibility);
  const [isAnonymous, setIsAnonymous] = useState<boolean>(initialAnonymous);
  const [anonymousAlias, setAnonymousAlias] = useState<string>('Solitary Scribe');
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(currentUser.friendIds);
  const [allowComments, setAllowComments] = useState<boolean>(true);
  const [allowReactions, setAllowReactions] = useState<boolean>(true);
  const [showTypingStats, setShowTypingStats] = useState<boolean>(currentUser.settings.showStatsByDefault);
  const [paperTheme, setPaperTheme] = useState<'parchment' | 'sepia' | 'midnight' | 'minimal'>(currentUser.settings.paperTheme);
  const [isPublishing, setIsPublishing] = useState(false);
  const [location, setLocation] = useState('');
  const [selectedWeatherPlace, setSelectedWeatherPlace] = useState<WeatherPlace | null>(null);
  const [weatherPlaces, setWeatherPlaces] = useState<WeatherPlace[]>([]);
  const [weatherSearchLoading, setWeatherSearchLoading] = useState(false);
  const [locationSearchError, setLocationSearchError] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [photoUploads, setPhotoUploads] = useState<string[]>([]);
  const [photoError, setPhotoError] = useState('');
  const [weather, setWeather] = useState<DiaryWeather | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState('');

  // Typing analytics state
  const [totalKeystrokes, setTotalKeystrokes] = useState<number>(0);
  const [currentWpm, setCurrentWpm] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const typingTimerRef = useRef<number | null>(null);
  const activeTypingStartedAtRef = useRef<number | null>(null);
  const accumulatedTypingMsRef = useRef(0);

  // Focus ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (selectedWeatherPlace || location.trim().length < 2) {
      setWeatherPlaces([]);
      setWeatherSearchLoading(false);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setWeatherSearchLoading(true);
      setLocationSearchError('');
      try {
        setWeatherPlaces(await searchWeatherLocations(location, controller.signal));
      } catch (error) {
        if (!controller.signal.aborted) {
          setWeatherPlaces([]);
          setLocationSearchError(error instanceof Error ? error.message : 'Place suggestions are unavailable.');
        }
      } finally {
        if (!controller.signal.aborted) setWeatherSearchLoading(false);
      }
    }, 300);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [location, selectedWeatherPlace]);

  // Timer for duration & WPM calculation
  useEffect(() => {
    if (!isTyping) return;
    const updateTypingMetrics = () => {
      const activeStart = activeTypingStartedAtRef.current;
      if (activeStart === null) return;
      const totalTypingMs = accumulatedTypingMsRef.current + Math.max(0, Date.now() - activeStart);
      const seconds = Math.floor(totalTypingMs / 1000);
      setElapsedSeconds(seconds);

      const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
      const minutes = totalTypingMs / 60_000;
      const calculatedWpm = minutes > 0.05 ? Math.round(wordCount / minutes) : 0;
      setCurrentWpm(Math.min(180, Math.max(0, calculatedWpm)));
    };
    updateTypingMetrics();
    const interval = window.setInterval(updateTypingMetrics, 1000);
    return () => window.clearInterval(interval);
  }, [isTyping, content]);

  useEffect(() => () => {
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Play realistic mechanical / typewriter audio
    typewriterAudio.playKeySound(e.key);

    if (activeTypingStartedAtRef.current === null) {
      activeTypingStartedAtRef.current = Date.now();
      setIsTyping(true);
    }
    setTotalKeystrokes((prev) => prev + 1);

    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => {
      const activeStart = activeTypingStartedAtRef.current;
      if (activeStart !== null) {
        accumulatedTypingMsRef.current += Math.max(0, Date.now() - activeStart);
        activeTypingStartedAtRef.current = null;
        setElapsedSeconds(Math.floor(accumulatedTypingMsRef.current / 1000));
      }
      setIsTyping(false);
    }, 4000);
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const cleaned = tagInput.trim().replace(/^#/, '');
      if (!tags.includes(cleaned)) {
        setTags([...tags, cleaned]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleFriendSelection = (friendId: string) => {
    if (selectedFriendIds.includes(friendId)) {
      setSelectedFriendIds(selectedFriendIds.filter((id) => id !== friendId));
    } else {
      setSelectedFriendIds([...selectedFriendIds, friendId]);
    }
  };

  const handleWeatherLookup = async () => {
    if (!location.trim() && !selectedWeatherPlace) return;
    setWeatherLoading(true);
    setWeatherError('');
    try {
      setWeather(selectedWeatherPlace
        ? await lookupWeatherAtPlace(selectedWeatherPlace, localDateKey())
        : await lookupWeatherForDate(location, localDateKey()));
    } catch (error) {
      setWeather(null);
      setWeatherError(error instanceof Error ? error.message : 'Weather data could not be loaded.');
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleDetectLocation = async () => {
    if (!navigator.geolocation) {
      setLocationSearchError('Location detection is not available in this browser.');
      return;
    }
    setDetectingLocation(true);
    setLocationSearchError('');
    setWeatherError('');
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          maximumAge: 300_000,
          timeout: 15_000,
        });
      });
      const place = weatherPlaceFromCoordinates(position.coords.latitude, position.coords.longitude);
      setLocation(place.label);
      setSelectedWeatherPlace(place);
      setWeatherPlaces([]);
      setWeatherLoading(true);
      try {
        setWeather(await lookupWeatherAtPlace(place, localDateKey()));
      } catch (error) {
        setWeather(null);
        setWeatherError(error instanceof Error ? error.message : 'Weather data could not be loaded.');
      } finally {
        setWeatherLoading(false);
      }
    } catch (error) {
      const code = (error as GeolocationPositionError)?.code;
      setLocationSearchError(
        code === 1
          ? 'Location permission was denied. You can still choose or type a place.'
          : code === 3
            ? 'Location detection timed out. Try again or choose a place.'
            : 'Your current location could not be detected. Choose a place instead.',
      );
    } finally {
      setDetectingLocation(false);
    }
  };

  const handlePhotoSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files || []);
    event.currentTarget.value = '';
    setPhotoError('');
    const availableSlots = Math.max(0, 3 - photoUploads.length);
    if (!availableSlots) {
      setPhotoError('A diary can include up to 3 pictures.');
      return;
    }
    try {
      const compressed = await Promise.all(files.slice(0, availableSlots).map(compressDiaryPhoto));
      setPhotoUploads((current) => [...current, ...compressed].slice(0, 3));
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'A picture could not be added.');
    }
  };

  const handlePublish = async (saveVisibility?: VisibilityType, skipWeather = false) => {
    if (!title.trim() && !content.trim()) return;

    const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
    const activeTypingMs = accumulatedTypingMsRef.current
      + (activeTypingStartedAtRef.current === null ? 0 : Math.max(0, Date.now() - activeTypingStartedAtRef.current));
    const durationMin = Math.max(1, Math.round(activeTypingMs / 60_000));

    const finalVisibility = saveVisibility || visibility;
    setIsPublishing(true);
    try {
      let weatherForEntry = weather;
      if (location.trim() && !weatherForEntry && !skipWeather) {
        setWeatherLoading(true);
        setWeatherError('');
        try {
          weatherForEntry = selectedWeatherPlace
            ? await lookupWeatherAtPlace(selectedWeatherPlace, localDateKey())
            : await lookupWeatherForDate(location, localDateKey());
          setWeather(weatherForEntry);
        } catch (error) {
          setWeatherError(error instanceof Error ? error.message : 'Weather data could not be loaded.');
          return;
        } finally {
          setWeatherLoading(false);
        }
      }
      await createEntry({
        title: title.trim() || 'Untitled Reflection',
        content: content.trim(),
        isAnonymous: finalVisibility === 'public' && isAnonymous,
        anonymousAlias: finalVisibility === 'public' && isAnonymous ? (anonymousAlias.trim() || 'Solitary Scribe') : undefined,
        visibility: finalVisibility,
        allowedFriendIds: finalVisibility === 'custom_friends' ? selectedFriendIds : [],
        mood,
        tags,
        location: selectedWeatherPlace?.label || weatherForEntry?.location || location.trim(),
        weather: weatherForEntry,
        photoUploads,
        typingStats: {
          wpm: currentWpm || 0,
          totalKeystrokes,
          durationMinutes: durationMin,
          words: wordCount,
        },
        privacySettings: {
          allowComments,
          allowReactions,
          showTypingStats,
        },
      });
      try {
        localStorage.removeItem(draftKey);
      } catch {}
      setDraftRestored(false);
      onPostPublished(finalVisibility);
    } catch {
      // The shared app banner displays the server-side validation message.
    } finally {
      setIsPublishing(false);
    }
  };

  // Word & character counts
  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;
  const elapsedLabel = `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(elapsedSeconds % 60).padStart(2, '0')}`;

  // Paper styling class
  const paperClass = {
    parchment: 'bg-[#FCFBF9] text-[#24211D] border-[#E5DFD4]',
    sepia: 'bg-[#F7F2E7] text-[#362C22] border-[#DFD6C5]',
    midnight: 'bg-[#151413] text-[#E6E1DC] border-[#292623]',
    minimal: 'bg-[#FFFFFF] text-[#1A1816] border-[#E8E8E8]',
  }[paperTheme];

  // Lookup friends of current user
  const myFriends = users.filter((u) => currentUser.friendIds.includes(u.id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Daily Draft Restored Alert Banner */}
      {draftRestored && (
        <div className="flex items-center justify-between gap-3 p-3.5 sm:px-4 rounded-xl bg-[#FAF3E0] border border-[#EADBBD] text-xs text-[#6B5224] shadow-xs">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-4 h-4 text-[#B88728] shrink-0" />
            <div>
              <p className="font-semibold text-[#543F1A]">Draft restored from earlier today</p>
              <p className="text-[11px] text-[#7A602F]">
                Your writing is automatically saved for today so you can freely switch tabs without losing unsaved words.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDraftRestored(false)}
              className="px-2.5 py-1 rounded-lg border border-[#DDD0B2] bg-[#FAF8F5] text-[11px] font-medium text-[#543F1A] hover:bg-[#F2ECE1] transition-colors"
            >
              Keep draft
            </button>
            <button
              type="button"
              onClick={clearRestoredDraft}
              className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-[#8C3B34] hover:bg-[#8C3B34]/10 transition-colors"
            >
              Clear & reset
            </button>
          </div>
        </div>
      )}

      {/* Studio Header: Status Bar with Tactile Typing Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE4DC]">
        <div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#24201C]">
            Typewriter Studio
          </h1>
          <p className="text-xs text-[#7A6C5E] mt-0.5">
            Feel the weight of every word. Tactile mechanical cadence with granular privacy control.
          </p>
        </div>

        {/* Live Keystroke Telemetry (Unboxed Tabular Figures) */}
        <div className="flex items-center gap-5 text-xs text-[#6B5E52] font-mono-type tabular-nums bg-[#F2EDE4] px-4 py-2 rounded-xl border border-[#DDD5C7] self-start sm:self-auto">
          <div>
            <span className="text-[#998A7B] uppercase text-[10px] block">Speed</span>
            <span className="font-semibold text-[#24201C] text-sm">{currentWpm} WPM</span>
          </div>
          <div className="h-6 w-px bg-[#DDD5C7]" />
          <div>
            <span className="text-[#998A7B] uppercase text-[10px] block">Words</span>
            <span className="font-semibold text-[#24201C] text-sm">{wordCount}</span>
          </div>
          <div className="h-6 w-px bg-[#DDD5C7]" />
          <div>
            <span className="text-[#998A7B] uppercase text-[10px] block">Time</span>
            <span className="font-semibold text-[#24201C] text-sm tabular-nums">{elapsedLabel}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Writing Canvas (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Paper theme and Typing key sound effect selector bar */}
          <div className="typing-controls space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#6E6154]">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-medium">Paper Texture:</span>
                <div className="flex items-center gap-1 bg-[#EFE9DF] p-0.5 rounded-lg">
                  {(['parchment', 'sepia', 'midnight', 'minimal'] as const).map((theme) => (
                    <button
                      key={theme}
                      onClick={() => {
                        setPaperTheme(theme);
                        void savePaperTheme(theme).catch(() => undefined);
                      }}
                      className={`px-2.5 py-1 rounded capitalize transition-colors ${
                        paperTheme === theme
                          ? 'bg-[#FAF8F5] text-[#24201C] font-medium shadow-xs'
                          : 'hover:text-[#24201C]'
                      }`}
                    >
                      {theme}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex w-full sm:w-auto flex-wrap items-center justify-between sm:justify-end gap-2 text-[11px] text-[#8C7D6F]">
                <span className="font-mono-type">{charCount} characters</span>
                <button
                  type="button"
                  onClick={onOpenCustomize}
                  data-testid="button-customize-page"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexShrink: 0, minHeight: 36, padding: '6px 12px', borderRadius: 8, border: '1px solid #2B2621', backgroundColor: '#2B2621', color: '#FAF8F5', fontWeight: 600, fontSize: 12, lineHeight: 1.2, whiteSpace: 'nowrap', cursor: 'pointer' }}
                  aria-label="Customize writing font, ink color, page, and layout"
                  title="Customize font, ink color, page style, and layout"
                >
                  <Settings2 style={{ width: 14, height: 14 }} />
                  <span>Customize page</span>
                </button>
              </div>
            </div>

            {/* Multiple Typing Key Sound Selection */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#6E6154]">
              <span className="font-medium inline-flex items-center gap-1 text-[#51463A]">
                <Volume2 className="w-3.5 h-3.5 text-[#8A7969]" /> Typing Sound:
              </span>
              <div className="flex flex-wrap items-center gap-1 bg-[#EFE9DF] p-0.5 rounded-lg">
                {SOUND_PROFILES.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => selectSoundProfile(profile.id)}
                    className={`px-2 py-1 rounded text-[11px] capitalize transition-colors ${
                      soundProfile === profile.id
                        ? 'bg-[#FAF8F5] text-[#24201C] font-semibold shadow-xs ring-1 ring-[#D8CEBF]'
                        : 'hover:text-[#24201C]'
                    }`}
                    title={`${profile.label} — ${profile.desc}`}
                  >
                    {profile.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tactile Writing Paper Container */}
          <div className={`typing-paper rounded-2xl border p-6 sm:p-10 shadow-sm transition-colors min-h-[460px] flex flex-col justify-between ${paperClass}`}>
            <div className="space-y-4">
              {/* Title input */}
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Title of this reflection..."
                className="typing-title w-full bg-transparent font-serif-display text-2xl sm:text-3xl font-bold tracking-tight placeholder-current opacity-70 focus:opacity-100 focus:outline-none"
              />

              <div className="h-px bg-current opacity-15" />

              {/* Body textarea */}
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Press keys to write... Feel the sound of mechanical letters stamping onto paper."
                rows={14}
                className="typing-body w-full bg-transparent resize-none leading-relaxed text-sm sm:text-base placeholder-current opacity-60 focus:opacity-100 focus:outline-none font-normal"
              />
            </div>

            {/* Quick tags row */}
            <div className="pt-4 border-t border-current/10 mt-6 flex flex-wrap items-center gap-2 text-xs">
              <span className="opacity-60 text-[11px]">Tags:</span>
              {tags.map((tag) => (
                <span
                  key={tag}
                  onClick={() => removeTag(tag)}
                  className="cursor-pointer opacity-75 hover:opacity-100 font-mono-type text-[11px]"
                  title="Click to remove"
                >
                  #{tag} ×
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={addTag}
                placeholder="+ tag & Enter"
                className="bg-transparent border-b border-current/20 text-xs px-1 py-0.5 focus:outline-none placeholder-current opacity-50 focus:opacity-100"
              />
            </div>
            <div className="grid gap-3 border-t border-current/10 pt-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <div className="relative min-w-0">
                <label htmlFor="weather-location" className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold">
                  <MapPin className="h-3.5 w-3.5" /> Weather location
                </label>
                <input
                  id="weather-location"
                  type="text"
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={weatherPlaces.length > 0}
                  aria-controls="weather-location-options"
                  autoComplete="off"
                  value={location}
                  onChange={(event) => {
                    setLocation(event.target.value);
                    setSelectedWeatherPlace(null);
                    setWeatherPlaces([]);
                    setWeather(null);
                    setWeatherError('');
                    setLocationSearchError('');
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') setWeatherPlaces([]);
                  }}
                  maxLength={160}
                  placeholder="Type a city, region, or country"
                  className="w-full rounded-lg border border-current/20 bg-transparent px-3 py-2 text-xs font-normal focus:outline-none focus:ring-2 focus:ring-[#8C765E]/30"
                />
                {weatherPlaces.length > 0 && (
                  <div id="weather-location-options" role="listbox" aria-label="Suggested weather locations" className="absolute left-0 right-0 top-full z-30 mt-1 max-h-52 overflow-y-auto rounded-xl border border-[#DDD5C7] bg-[#FCFBF9] p-1 shadow-xl">
                    {weatherPlaces.map((place) => (
                      <button
                        key={`${place.label}-${place.latitude}-${place.longitude}`}
                        type="button"
                        role="option"
                        aria-selected={selectedWeatherPlace?.label === place.label}
                        onClick={() => {
                          setLocation(place.label);
                          setSelectedWeatherPlace(place);
                          setWeatherPlaces([]);
                          setWeather(null);
                          setWeatherError('');
                          setLocationSearchError('');
                        }}
                        className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs text-[#4A3E33] hover:bg-[#EFE9DF] focus:bg-[#EFE9DF] focus:outline-none"
                      >
                        <span className="min-w-0 truncate font-medium">{place.label}</span>
                        <span className="shrink-0 text-[10px] text-[#8A7969]">{place.latitude.toFixed(2)}, {place.longitude.toFixed(2)}</span>
                      </button>
                    ))}
                  </div>
                )}
                <p className="mt-1 text-[10px] font-normal opacity-65">
                  Use of your location asks browser permission. Approximate coordinates go to Open-Meteo for weather; the location is saved with this diary and follows its privacy setting.
                </p>
                {weatherSearchLoading && <p className="mt-1 text-[10px] opacity-70" role="status">Searching places…</p>}
                {locationSearchError && <p className="mt-1 text-[10px] text-[#9B4539]" role="status">{locationSearchError}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleDetectLocation()}
                  disabled={detectingLocation || weatherLoading}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-current/20 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {detectingLocation ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Locate className="h-3.5 w-3.5" />}
                  {detectingLocation ? 'Finding location…' : 'Use my location'}
                </button>
                <button
                  type="button"
                  onClick={() => void handleWeatherLookup()}
                  disabled={!location.trim() || weatherLoading || detectingLocation}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-current/20 px-3 py-2 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {weatherLoading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <CloudSun className="h-3.5 w-3.5" />}
                  {weatherLoading ? 'Checking…' : 'Get weather'}
                </button>
              </div>
            </div>
            {weather && (
              <div className="flex flex-wrap items-center gap-2 rounded-lg bg-black/5 px-3 py-2 text-[11px]">
                <CloudSun className="h-4 w-4" />
                <span className="font-semibold">{weather.description}</span>
                <span>{weather.location}</span>
                {weather.temperatureMinC !== null && weather.temperatureMaxC !== null && (
                  <span>{Math.round(weather.temperatureMinC)}°–{Math.round(weather.temperatureMaxC)}°C</span>
                )}
                <span className="opacity-60">Open-Meteo · {weather.date}</span>
              </div>
            )}
            {weatherError && (
              <div className="space-y-1 text-[11px] text-[#9B4539]" role="status">
                <p>{weatherError}</p>
                <button type="button" onClick={() => void handlePublish(undefined, true)} className="underline underline-offset-2">
                  Save without weather
                </button>
              </div>
            )}
            <div className="space-y-2 border-t border-current/10 pt-4">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-current/20 px-3 py-2 text-xs font-medium hover:bg-black/5">
                <ImagePlus className="h-3.5 w-3.5" />
                Add pictures ({photoUploads.length}/3)
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  disabled={photoUploads.length >= 3}
                  onChange={(event) => void handlePhotoSelection(event)}
                  className="sr-only"
                  aria-label="Add up to three pictures to this diary"
                />
              </label>
              {photoError && <p className="text-[11px] text-[#9B4539]" role="status">{photoError}</p>}
              {photoUploads.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {photoUploads.map((photo, index) => (
                    <div key={`${index}-${photo.length}`} className="relative aspect-[4/3] overflow-hidden rounded-lg">
                      <img src={photo} alt={`Diary picture ${index + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setPhotoUploads((current) => current.filter((_, photoIndex) => photoIndex !== index))}
                        aria-label={`Remove picture ${index + 1}`}
                        className="absolute right-1 top-1 rounded-full bg-black/65 p-1 text-white"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Granular Privacy & Publishing Sidebar (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8A7969]">
                <Sliders className="w-3.5 h-3.5" />
                <span>Privacy & Distribution</span>
              </div>
              <h2 className="font-serif-display text-lg font-bold text-[#24201C] mt-1">
                Audience & Privacy
              </h2>
              <p className="text-xs text-[#736558] mt-0.5">
                Define who is permitted to view, read, or discover this entry.
              </p>
            </div>

            {/* Granular Visibility Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#3D3328] block">
                Visibility Scope
              </label>

              <div className="space-y-1.5">
                {/* 1. Public Blog */}
                <button
                  type="button"
                  onClick={() => {
                    setVisibility('public');
                    setIsAnonymous(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    visibility === 'public' && !isAnonymous
                      ? 'bg-[#FAF8F5] border-[#2B2621] ring-1 ring-[#2B2621]'
                      : 'border-[#E2DBD0] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Globe className="w-4 h-4 text-[#4A6B3D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#24201C]">Public Community Blog</p>
                    <p className="text-[11px] text-[#736558] mt-0.5">
                      Published with your profile name ({currentUser.displayName}). Visible to everyone.
                    </p>
                  </div>
                </button>

                {/* 2. Anonymous Blog Entry */}
                <button
                  type="button"
                  onClick={() => {
                    setVisibility('public');
                    setIsAnonymous(true);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    visibility === 'public' && isAnonymous
                      ? 'bg-[#FAF8F5] border-[#2B2621] ring-1 ring-[#2B2621]'
                      : 'border-[#E2DBD0] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <UserX className="w-4 h-4 text-[#8C5D3D] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#24201C]">Anonymous Public Post</p>
                    <p className="text-[11px] text-[#736558] mt-0.5">
                      Your avatar and username are removed. Published under a pseudonym.
                    </p>
                  </div>
                </button>

                {/* 3. Friends Only (All Friends) */}
                <button
                  type="button"
                  onClick={() => {
                    setVisibility('friends');
                    setIsAnonymous(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    visibility === 'friends'
                      ? 'bg-[#FAF8F5] border-[#2B2621] ring-1 ring-[#2B2621]'
                      : 'border-[#E2DBD0] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#3A6073] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#24201C]">Friends Only ({currentUser.friendIds.length} Friends)</p>
                    <p className="text-[11px] text-[#736558] mt-0.5">
                      Only users in your confirmed friends list can view this post.
                    </p>
                  </div>
                </button>

                {/* 4. Custom Selected Friends (Granular Circle) */}
                <button
                  type="button"
                  onClick={() => {
                    setVisibility('custom_friends');
                    setIsAnonymous(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    visibility === 'custom_friends'
                      ? 'bg-[#FAF8F5] border-[#2B2621] ring-1 ring-[#2B2621]'
                      : 'border-[#E2DBD0] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Users className="w-4 h-4 text-[#8C4362] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#24201C]">Selected Friends (Granular)</p>
                    <p className="text-[11px] text-[#736558] mt-0.5">
                      Handpick specific friends who get permission to read this post.
                    </p>
                  </div>
                </button>

                {/* 5. Private (Only Me) */}
                <button
                  type="button"
                  onClick={() => {
                    setVisibility('private');
                    setIsAnonymous(false);
                  }}
                  className={`w-full text-left p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${
                    visibility === 'private'
                      ? 'bg-[#FAF8F5] border-[#2B2621] ring-1 ring-[#2B2621]'
                      : 'border-[#E2DBD0] hover:bg-[#FAF8F5]'
                  }`}
                >
                  <Lock className="w-4 h-4 text-[#8A3B34] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-[#24201C]">Private (Only Me)</p>
                    <p className="text-[11px] text-[#736558] mt-0.5">
                      Completely locked. Stored strictly in your personal journal vault.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom Friends Checklist (shown when custom_friends is selected) */}
            {visibility === 'custom_friends' && (
              <div className="p-3 bg-[#FAF8F5] border border-[#DDD4C5] rounded-xl space-y-2 animate-in fade-in">
                <p className="text-xs font-semibold text-[#24201C]">
                  Select Permitted Friends:
                </p>
                {myFriends.length === 0 ? (
                  <p className="text-xs text-[#8A7969]">
                    You have no connected friends yet. Add friends in the Friends tab to share.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {myFriends.map((friend) => {
                      const isSelected = selectedFriendIds.includes(friend.id);
                      return (
                        <label
                          key={friend.id}
                          className="flex items-center justify-between p-2 rounded-lg hover:bg-[#F2ECE1] cursor-pointer text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <img
                              src={friend.avatar}
                              alt={friend.displayName}
                              referrerPolicy="no-referrer"
                              className="w-5 h-5 rounded-full object-cover"
                            />
                            <span className="font-medium text-[#24201C]">{friend.displayName}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleFriendSelection(friend.id)}
                            className="w-4 h-4 text-[#2B2621] rounded border-[#C8BEAE] focus:ring-0"
                          />
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Pseudonym Input if Anonymous */}
            {isAnonymous && (
              <div className="space-y-1.5 animate-in fade-in">
                <label className="text-xs font-semibold text-[#3D3328] block">
                  Anonymous Pseudonym (Optional)
                </label>
                <input
                  type="text"
                  value={anonymousAlias}
                  onChange={(e) => setAnonymousAlias(e.target.value)}
                  placeholder="e.g. Midnight Thinker, Solitary Reader"
                  className="w-full text-xs bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg px-3 py-2 text-[#24201C] focus:outline-none focus:border-[#8C765E]"
                />
              </div>
            )}

            {/* Mood Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#3D3328] block">
                Atmosphere & Mood
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {(['reflective', 'peaceful', 'creative', 'melancholy', 'grateful', 'wandering'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`py-1.5 px-2 rounded-lg border capitalize text-[11px] font-medium transition-colors ${
                      mood === m
                        ? 'bg-[#2B2621] text-[#FAF8F5] border-[#2B2621]'
                        : 'bg-[#FAF8F5] border-[#E0D7C9] text-[#5C4F42] hover:bg-[#EFE9DF]'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Granular Interaction Toggles */}
            <div className="space-y-3 pt-3 border-t border-[#EAE4DC] text-xs">
              <p className="font-semibold text-[#3D3328]">Granular Post Toggles</p>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#594C3F]">Allow comments & reflections</span>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                  className="w-4 h-4 text-[#2B2621] rounded border-[#C8BEAE] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#594C3F]">Allow reader reactions (Heart, Hug)</span>
                <input
                  type="checkbox"
                  checked={allowReactions}
                  onChange={(e) => setAllowReactions(e.target.checked)}
                  className="w-4 h-4 text-[#2B2621] rounded border-[#C8BEAE] focus:ring-0"
                />
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span className="text-[#594C3F]">Display typing speed & duration</span>
                <input
                  type="checkbox"
                  checked={showTypingStats}
                  onChange={(e) => setShowTypingStats(e.target.checked)}
                  className="w-4 h-4 text-[#2B2621] rounded border-[#C8BEAE] focus:ring-0"
                />
              </label>
            </div>

            {/* Final Publishing Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => handlePublish()}
                disabled={isPublishing || (!title.trim() && !content.trim())}
                className="w-full py-2.5 px-4 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#423A33] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
              >
                {isPublishing ? 'Publishing…' : visibility === 'private'
                  ? 'Save to Private Journal'
                  : isAnonymous
                  ? 'Publish Anonymously to Blog'
                  : visibility === 'custom_friends'
                  ? 'Share with Selected Friends'
                  : visibility === 'friends'
                  ? 'Share with All Friends'
                  : 'Publish to Public Blog'}
              </button>

              <button
                type="button"
                onClick={() => handlePublish('private')}
                disabled={!title.trim() && !content.trim()}
                className="w-full py-2 px-4 text-xs font-medium text-[#6B5D50] hover:text-[#24201C] hover:bg-[#F2ECE1] rounded-xl transition-colors"
              >
                Save as Secret Draft (Private)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Always-reachable Customize button for phones (stays on screen while scrolling the long editor). */}
      <button
        type="button"
        onClick={onOpenCustomize}
        data-testid="button-customize-floating"
        className="sm:hidden"
        style={{
          position: 'fixed',
          right: 16,
          bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
          zIndex: 30,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          minHeight: 44,
          padding: '10px 16px',
          borderRadius: 999,
          border: '1px solid #FAF8F5',
          backgroundColor: '#2B2621',
          color: '#FAF8F5',
          fontSize: 13,
          fontWeight: 600,
          boxShadow: '0 6px 18px rgba(0,0,0,.28)',
          cursor: 'pointer',
        }}
        aria-label="Customize writing font, ink color, page, and layout"
      >
        <Settings2 style={{ width: 16, height: 16 }} />
        <span>Customize</span>
      </button>
    </div>
  );
};
