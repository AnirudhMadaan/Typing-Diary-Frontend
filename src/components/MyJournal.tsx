import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { DiaryEntry, VisibilityType } from '../types/diary';
import { 
  Lock, 
  Globe, 
  Users, 
  UserX, 
  Download, 
  Trash2, 
  PenTool, 
  Sliders, 
  Check, 
  X, 
  Search, 
  FileDown, 
  Pin,
  Calendar,
  Eye,
  ChevronLeft,
  ChevronRight,
  MapPin,
  CloudSun,
} from 'lucide-react';
import { diaryAssetUrl } from '../context/DiaryContext';

function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function entryDateKey(isoDate: string): string {
  return dateKey(new Date(isoDate));
}

interface MyJournalProps {
  onSelectEntry: (entry: DiaryEntry) => void;
  onOpenTypewriter: () => void;
}

export const MyJournal: React.FC<MyJournalProps> = ({ onSelectEntry, onOpenTypewriter }) => {
  const { currentUser, users, entries, updateEntry, deleteEntry, exportDiary } = useDiary();

  const [filterVisibility, setFilterVisibility] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingPrivacyEntryId, setEditingPrivacyEntryId] = useState<string | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState('');

  // Temporary edit states
  const [editVisibility, setEditVisibility] = useState<VisibilityType>('private');
  const [editIsAnonymous, setEditIsAnonymous] = useState<boolean>(false);
  const [editSelectedFriends, setEditSelectedFriends] = useState<string[]>([]);

  // My entries
  const myEntries = entries.filter((e) => e.authorId === currentUser.id);

  const filteredEntries = myEntries.filter((entry) => {
    if (filterVisibility !== 'all') {
      if (filterVisibility === 'anonymous' && !entry.isAnonymous) return false;
      if (filterVisibility === 'private' && entry.visibility !== 'private') return false;
      if (filterVisibility === 'friends' && entry.visibility !== 'friends' && entry.visibility !== 'custom_friends') return false;
      if (filterVisibility === 'public' && (entry.visibility !== 'public' || entry.isAnonymous)) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return entry.title.toLowerCase().includes(q)
        || entry.content.toLowerCase().includes(q)
        || (entry.location || '').toLowerCase().includes(q)
        || entry.tags.some((tag) => tag.toLowerCase().includes(q));
    }

    return true;
  });
  const visibleEntries = selectedDate
    ? filteredEntries.filter((entry) => entryDateKey(entry.createdAt) === selectedDate)
    : filteredEntries;
  const entryCountsByDate = new Map<string, number>();
  myEntries.forEach((entry) => {
    const key = entryDateKey(entry.createdAt);
    entryCountsByDate.set(key, (entryCountsByDate.get(key) || 0) + 1);
  });
  const firstWeekday = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
  const calendarDays = Array.from({ length: 42 }, (_, index) => (
    new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index - firstWeekday + 1)
  ));
  const changeCalendarMonth = (offset: number) => {
    setCalendarMonth((month) => new Date(month.getFullYear(), month.getMonth() + offset, 1));
    setSelectedDate('');
  };

  const startEditingPrivacy = (entry: DiaryEntry) => {
    setEditingPrivacyEntryId(entry.id);
    setEditVisibility(entry.visibility);
    setEditIsAnonymous(entry.isAnonymous);
    setEditSelectedFriends(entry.allowedFriendIds || []);
  };

  const savePrivacyChanges = (entryId: string) => {
    void updateEntry(entryId, {
      visibility: editVisibility,
      isAnonymous: editIsAnonymous,
      allowedFriendIds: editVisibility === 'custom_friends' ? editSelectedFriends : [],
    }).catch(() => undefined);
    setEditingPrivacyEntryId(null);
  };

  const myFriends = users.filter((u) => currentUser.friendIds.includes(u.id));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#EAE4DC]">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono-type uppercase tracking-wider text-[#8A7969]">
            <span>Personal Archive</span>
            <span aria-hidden="true">·</span>
            <span>{myEntries.length} Stored Entries</span>
          </div>
          <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#24201C] mt-1">
            My Typing Journal
          </h1>
          <p className="text-xs text-[#736558] mt-0.5">
            Your personal chronicle. Fine-tune privacy toggles on any past post or export your manuscript.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportDiary('markdown')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4D4034] bg-[#EFE9DF] hover:bg-[#E5DDCF] border border-[#DDD5C7] rounded-lg transition-colors whitespace-nowrap"
            title="Download your entire journal as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Markdown</span>
          </button>

          <button
            onClick={() => exportDiary('json')}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#4D4034] bg-[#EFE9DF] hover:bg-[#E5DDCF] border border-[#DDD5C7] rounded-lg transition-colors whitespace-nowrap"
            title="Backup entries to JSON"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onOpenTypewriter}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] rounded-lg transition-colors whitespace-nowrap"
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>New Entry</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Segmented Filter */}
        <div className="flex items-center gap-1 bg-[#EFE9DF] p-1 rounded-xl overflow-x-auto">
          <button
            onClick={() => setFilterVisibility('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              filterVisibility === 'all'
                ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                : 'text-[#695C4F] hover:text-[#24201C]'
            }`}
          >
            All ({myEntries.length})
          </button>

          <button
            onClick={() => setFilterVisibility('private')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterVisibility === 'private'
                ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                : 'text-[#695C4F] hover:text-[#24201C]'
            }`}
          >
            <Lock className="w-3 h-3 text-[#8A3B34]" />
            Private ({myEntries.filter((e) => e.visibility === 'private').length})
          </button>

          <button
            onClick={() => setFilterVisibility('friends')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterVisibility === 'friends'
                ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                : 'text-[#695C4F] hover:text-[#24201C]'
            }`}
          >
            <Users className="w-3 h-3 text-[#3A6073]" />
            Friends ({myEntries.filter((e) => e.visibility === 'friends' || e.visibility === 'custom_friends').length})
          </button>

          <button
            onClick={() => setFilterVisibility('public')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterVisibility === 'public'
                ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                : 'text-[#695C4F] hover:text-[#24201C]'
            }`}
          >
            <Globe className="w-3 h-3 text-[#4A6B3D]" />
            Public ({myEntries.filter((e) => e.visibility === 'public' && !e.isAnonymous).length})
          </button>

          <button
            onClick={() => setFilterVisibility('anonymous')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors flex items-center gap-1 ${
              filterVisibility === 'anonymous'
                ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                : 'text-[#695C4F] hover:text-[#24201C]'
            }`}
          >
            <UserX className="w-3 h-3 text-[#8C5D3D]" />
            Anonymous ({myEntries.filter((e) => e.isAnonymous).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-[#8C7D6F] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search my journal..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FCFBF9] border border-[#DDD6CB] rounded-lg text-[#24201C] focus:outline-none focus:border-[#8C765E]"
          />
        </div>
      </div>

      <section className="rounded-2xl border border-[#E3DCCF] bg-[#FCFBF9] p-4 shadow-xs sm:p-5" aria-label="Diary calendar">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-serif-display text-lg font-bold text-[#24201C]">
              <Calendar className="h-4 w-4" /> Diary calendar
            </h2>
            <p className="mt-0.5 text-[11px] text-[#736558]">Select a date to find and open that day’s entries.</p>
          </div>
          <div className="flex items-center gap-2">
            {selectedDate && (
              <button
                type="button"
                onClick={() => setSelectedDate('')}
                className="rounded-lg px-2 py-1 text-[11px] text-[#594C3F] underline underline-offset-2"
              >
                Show all dates
              </button>
            )}
            <button type="button" onClick={() => changeCalendarMonth(-1)} aria-label="Previous month" className="rounded-lg border border-[#DDD5C7] p-1.5 hover:bg-[#EFE9DF]">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-32 text-center text-xs font-semibold text-[#4A3E33]">
              {calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
            </span>
            <button type="button" onClick={() => changeCalendarMonth(1)} aria-label="Next month" className="rounded-lg border border-[#DDD5C7] p-1.5 hover:bg-[#EFE9DF]">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold uppercase tracking-wide text-[#817366]" aria-hidden="true">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => <span key={day} className="py-1">{day}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const key = dateKey(day);
            const count = entryCountsByDate.get(key) || 0;
            const isCurrentMonth = day.getMonth() === calendarMonth.getMonth();
            const isSelected = selectedDate === key;
            return (
              <button
                key={key}
                type="button"
                data-testid={`calendar-day-${key}`}
                aria-pressed={isSelected}
                aria-label={`${day.toLocaleDateString()}${count ? `, ${count} ${count === 1 ? 'diary' : 'diaries'}` : ', no diaries'}`}
                title={`${day.toLocaleDateString()} · ${count} ${count === 1 ? 'diary' : 'diaries'}`}
                onClick={() => setSelectedDate(key)}
                className={`relative flex min-h-10 flex-col items-center justify-center rounded-lg border text-xs transition-colors ${
                  isSelected
                    ? 'border-[#2B2621] bg-[#2B2621] font-bold text-[#FAF8F5]'
                    : isCurrentMonth
                      ? 'border-transparent text-[#4A3E33] hover:border-[#DDD5C7] hover:bg-[#EFE9DF]'
                      : 'border-transparent text-[#A89E92] hover:bg-[#F3EEE6]'
                }`}
              >
                <span>{day.getDate()}</span>
                {count > 0 && (
                  <span className={`mt-0.5 h-1 w-1 rounded-full ${isSelected ? 'bg-[#FAF8F5]' : 'bg-[#8C765E]'}`} aria-hidden="true" />
                )}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[10px] text-[#948679]">
          {selectedDate ? `${entryCountsByDate.get(selectedDate) || 0} entries on ${new Date(`${selectedDate}T12:00:00`).toLocaleDateString()}` : `${myEntries.length} entries across your journal`}
        </p>
      </section>

      {/* Entries List */}
      {visibleEntries.length === 0 ? (
        <div className="text-center py-16 px-4 bg-[#FCFBF9] rounded-2xl border border-dashed border-[#DDD6CB] max-w-lg mx-auto space-y-3">
          <Calendar className="w-8 h-8 text-[#8C7D6F] mx-auto" />
          <h3 className="font-serif-display text-lg font-semibold text-[#24201C]">{selectedDate ? 'No entries on this date' : 'No matching journal entries'}</h3>
          <p className="text-xs text-[#736558] max-w-sm mx-auto">
            {selectedDate ? 'Choose another marked date or start a new diary entry.' : 'You do not have any entries under this privacy filter. Start typing a fresh page in your typewriter studio.'}
          </p>
          <button
            onClick={onOpenTypewriter}
            className="px-4 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] rounded-lg hover:bg-[#403932] transition-colors"
          >
            Type New Entry
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleEntries.map((entry) => {
            const isEditingThis = editingPrivacyEntryId === entry.id;

            return (
              <div
                key={entry.id}
                className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs hover:border-[#D0C6B8] transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    {/* Unboxed Metadata */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#7A6C5E]">
                      <span>{new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{entry.mood}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-type tabular-nums">{entry.typingStats.words} words</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-type tabular-nums">{entry.typingStats.wpm} WPM</span>
                      {entry.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.location}</span>
                        </>
                      )}
                      {entry.weather && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1"><CloudSun className="h-3 w-3" />{entry.weather.description}</span>
                        </>
                      )}
                    </div>

                    <h3 
                      onClick={() => onSelectEntry(entry)}
                      className="font-serif-display text-lg sm:text-xl font-bold text-[#24201C] hover:text-[#6E553D] cursor-pointer transition-colors"
                    >
                      {entry.title}
                    </h3>

                    <p 
                      onClick={() => onSelectEntry(entry)}
                      className="text-xs text-[#52463B] line-clamp-2 leading-relaxed cursor-pointer font-normal pt-0.5"
                    >
                      {entry.content}
                    </p>
                    {entry.photos?.length ? (
                      <img
                        src={diaryAssetUrl(entry.photos[0].src)}
                        alt={entry.photos[0].alt}
                        className="mt-2 h-24 w-32 rounded-lg border border-[#DDD5C7] object-cover"
                      />
                    ) : null}
                  </div>

                  {/* Privacy Badge & Edit Action */}
                  <div className="flex flex-row sm:flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-[#DDD5C7] bg-[#FAF8F5]">
                      {entry.visibility === 'public' && !entry.isAnonymous && (
                        <span className="flex items-center gap-1 text-[#4A6B3D] font-medium">
                          <Globe className="w-3.5 h-3.5" /> Public Blog
                        </span>
                      )}
                      {entry.visibility === 'public' && entry.isAnonymous && (
                        <span className="flex items-center gap-1 text-[#8C5D3D] font-medium">
                          <UserX className="w-3.5 h-3.5" /> Anonymous Blog
                        </span>
                      )}
                      {entry.visibility === 'friends' && (
                        <span className="flex items-center gap-1 text-[#3A6073] font-medium">
                          <Users className="w-3.5 h-3.5" /> Friends Only
                        </span>
                      )}
                      {entry.visibility === 'custom_friends' && (
                        <span className="flex items-center gap-1 text-[#8C4362] font-medium">
                          <Users className="w-3.5 h-3.5" /> Selected Friends ({entry.allowedFriendIds.length})
                        </span>
                      )}
                      {entry.visibility === 'private' && (
                        <span className="flex items-center gap-1 text-[#8A3B34] font-medium">
                          <Lock className="w-3.5 h-3.5" /> Private
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => startEditingPrivacy(entry)}
                      className="text-[11px] text-[#695D51] hover:text-[#24201C] flex items-center gap-1 py-0.5"
                    >
                      <Sliders className="w-3 h-3" />
                      <span>Change Privacy</span>
                    </button>
                  </div>
                </div>

                {/* Inline Granular Privacy Editor when opened */}
                {isEditingThis && (
                  <div className="p-4 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl space-y-4 animate-in fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-[#EAE4DC]">
                      <span className="text-xs font-bold text-[#24201C]">
                        Adjust Privacy Toggles for: "{entry.title}"
                      </span>
                      <button
                        onClick={() => setEditingPrivacyEntryId(null)}
                        className="text-[#8C7D6F] hover:text-[#24201C]"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                      <button
                        onClick={() => {
                          setEditVisibility('private');
                          setEditIsAnonymous(false);
                        }}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2 ${
                          editVisibility === 'private'
                            ? 'bg-[#2B2621] text-[#FAF8F5] border-[#2B2621]'
                            : 'bg-white border-[#E0D8CB] text-[#3D3328] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Private</p>
                          <p className="text-[10px] opacity-75">Only you can read</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setEditVisibility('friends');
                          setEditIsAnonymous(false);
                        }}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2 ${
                          editVisibility === 'friends'
                            ? 'bg-[#2B2621] text-[#FAF8F5] border-[#2B2621]'
                            : 'bg-white border-[#E0D8CB] text-[#3D3328] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">All Friends</p>
                          <p className="text-[10px] opacity-75">All mutual friends</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setEditVisibility('custom_friends');
                          setEditIsAnonymous(false);
                        }}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2 ${
                          editVisibility === 'custom_friends'
                            ? 'bg-[#2B2621] text-[#FAF8F5] border-[#2B2621]'
                            : 'bg-white border-[#E0D8CB] text-[#3D3328] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Selected Friends</p>
                          <p className="text-[10px] opacity-75">Pick specific people</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setEditVisibility('public');
                          setEditIsAnonymous(true);
                        }}
                        className={`p-2 rounded-lg border text-left flex items-start gap-2 ${
                          editVisibility === 'public' && editIsAnonymous
                            ? 'bg-[#2B2621] text-[#FAF8F5] border-[#2B2621]'
                            : 'bg-white border-[#E0D8CB] text-[#3D3328] hover:bg-[#F5EFE6]'
                        }`}
                      >
                        <UserX className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold">Anonymous Blog</p>
                          <p className="text-[10px] opacity-75">Shield author identity</p>
                        </div>
                      </button>
                    </div>

                    {/* Custom Friends Checklist if custom_friends selected */}
                    {editVisibility === 'custom_friends' && (
                      <div className="p-3 bg-white border border-[#DDD5C7] rounded-xl space-y-2">
                        <p className="text-xs font-semibold text-[#24201C]">
                          Choose permitted friends:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {myFriends.map((friend) => {
                            const isChecked = editSelectedFriends.includes(friend.id);
                            return (
                              <label key={friend.id} className="flex items-center gap-2 text-xs cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    if (isChecked) {
                                      setEditSelectedFriends(editSelectedFriends.filter((id) => id !== friend.id));
                                    } else {
                                      setEditSelectedFriends([...editSelectedFriends, friend.id]);
                                    }
                                  }}
                                  className="w-4 h-4 text-[#2B2621] rounded border-[#C8BEAE] focus:ring-0"
                                />
                                <span className="font-medium text-[#24201C]">{friend.displayName}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2">
                      <button
                        onClick={() => setEditingPrivacyEntryId(null)}
                        className="px-3 py-1.5 text-xs text-[#6E6154] hover:text-[#24201C]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => savePrivacyChanges(entry.id)}
                        className="px-4 py-1.5 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] rounded-lg transition-colors"
                      >
                        Save Privacy
                      </button>
                    </div>
                  </div>
                )}

                {/* Bottom Row */}
                <div className="flex items-center justify-between pt-2 border-t border-[#EFE9DF] text-xs">
                  <div className="flex items-center gap-3 text-[#7A6C5E]">
                    <span>{entry.reactions.resonance} Resonances</span>
                    <span aria-hidden="true">·</span>
                    <span>{entry.comments.length} Reflections</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onSelectEntry(entry)}
                      className="text-xs font-semibold text-[#3D3328] hover:text-[#1F1B17]"
                    >
                      Open & Read
                    </button>
                    <button
                      onClick={() => { void deleteEntry(entry.id).catch(() => undefined); }}
                      className="text-[#96473D] hover:text-[#7A362D] p-1"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
