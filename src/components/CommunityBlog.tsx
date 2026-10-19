import React, { useState, useMemo } from 'react';
import { useDiary } from '../context/DiaryContext';
import { DiaryEntry, MoodType } from '../types/diary';
import { 
  Heart, 
  Bookmark, 
  MessageCircle, 
  Sparkles, 
  Lock, 
  Globe, 
  Users, 
  UserX, 
  Search, 
  ArrowRight,
  Filter,
  CheckCircle2,
  Smile,
  ShieldCheck,
  Send
} from 'lucide-react';

interface CommunityBlogProps {
  onSelectEntry: (entry: DiaryEntry) => void;
  onOpenNewEntry: (presetVisibility?: 'public' | 'anonymous') => void;
}

function animateReactionButton(button: HTMLButtonElement) {
  if (typeof button.animate !== 'function') return;
  button.animate(
    [
      { transform: 'scale(1)' },
      { transform: 'scale(1.14)' },
      { transform: 'scale(0.98)' },
      { transform: 'scale(1)' },
    ],
    { duration: 380, easing: 'cubic-bezier(0.2, 0.8, 0.2, 1)' },
  );
}

export const CommunityBlog: React.FC<CommunityBlogProps> = ({ onSelectEntry, onOpenNewEntry }) => {
  const { entries, currentUser, canUserViewEntry, toggleReaction } = useDiary();
  const [activeFilter, setActiveFilter] = useState<'all' | 'anonymous' | 'friends' | 'public'>('all');
  const [selectedMood, setSelectedMood] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Filter entries based on viewer permissions and active tabs
  const visibleEntries = useMemo(() => {
    return entries.filter((entry) => {
      // 1. Can the current viewer see this post under privacy rules?
      if (entry.visibility === 'private') return false;
      const canView = canUserViewEntry(entry, currentUser.id);
      if (!canView) return false;

      // 2. Tab filtering
      if (activeFilter === 'anonymous') {
        if (!entry.isAnonymous) return false;
      } else if (activeFilter === 'friends') {
        // Only show entries that are specifically shared with friends or custom friends
        if (entry.visibility !== 'friends' && entry.visibility !== 'custom_friends') return false;
      } else if (activeFilter === 'public') {
        if (entry.visibility !== 'public' || entry.isAnonymous) return false;
      }

      // 3. Mood filtering
      if (selectedMood !== 'all' && entry.mood !== selectedMood) {
        return false;
      }

      // 4. Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = entry.title.toLowerCase().includes(query);
        const matchesContent = entry.content.toLowerCase().includes(query);
        const matchesAuthor = !entry.isAnonymous && entry.authorName.toLowerCase().includes(query);
        const matchesTag = entry.tags.some((t) => t.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesAuthor || matchesTag;
      }

      return true;
    });
  }, [entries, currentUser.id, activeFilter, selectedMood, searchQuery, canUserViewEntry]);

  // Count metrics for header proof
  const totalAnonymous = entries.filter((e) => e.isAnonymous && canUserViewEntry(e, currentUser.id)).length;
  const totalFriendsPosts = entries.filter((e) => (e.visibility === 'friends' || e.visibility === 'custom_friends') && canUserViewEntry(e, currentUser.id)).length;

  return (
    <div className="space-y-12 pb-16">
      {/* Editorial Hero Split */}
      <section className="bg-[#FAF8F5] border-b border-[#EAE4DC] pt-8 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Left Column: Typographic Hierarchy */}
            <div className="lg:col-span-7 flex flex-col justify-between py-2">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-mono-type uppercase tracking-wider text-[#8A7969]">
                  <span>Diary Commons</span>
                  <span aria-hidden="true">·</span>
                  <span>Tactile Typewriter Feed</span>
                  <span aria-hidden="true">·</span>
                  <span>Granular Privacy Control</span>
                </div>

                <h1 className="font-serif-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#24201C] leading-[1.15] text-balance">
                  Unfiltered reflections from minds typing in the quiet.
                </h1>

                <p className="text-base text-[#574C40] leading-relaxed max-w-2xl">
                  Step inside an open journal repository. Authors publish candid anonymous musings, 
                  public essays, or intimate entries shared exclusively with vetted circles of friends.
                </p>
              </div>

              {/* Publishing actions and signed-in author context */}
              <div className="pt-6 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => onOpenNewEntry('public')}
                    className="px-5 py-2.5 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] rounded-lg transition-colors whitespace-nowrap shadow-xs"
                  >
                    Publish to Blog
                  </button>

                  <button
                    onClick={() => onOpenNewEntry('anonymous')}
                    className="px-4 py-2.5 text-xs font-medium text-[#4A3E33] bg-[#EFE9DF] hover:bg-[#E5DDCF] border border-[#DDD4C5] rounded-lg transition-colors whitespace-nowrap"
                  >
                    Post Anonymously
                  </button>
                </div>

                {/* Subtle reassurance banner regarding privacy */}
                <div className="flex items-center gap-2 text-xs text-[#7A6C5E] pt-1">
                  <ShieldCheck className="w-4 h-4 text-[#7A8E66] shrink-0" />
                  <span>
                    Viewing as <strong className="text-[#2B2621]">{currentUser.displayName}</strong>. 
                    Posts you see respect author-defined friend access and privacy boundaries.
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Container at matching height */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-[#E3DCD1] shadow-xs min-h-[280px] lg:min-h-full">
              <img
                src="/src/assets/images/hero_typing_diary_1791652572913.jpg"
                alt="Vintage mechanical typewriter on a warm wooden desk with coffee and open journal"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-5">
                <div className="text-white text-xs space-y-0.5">
                  <p className="font-serif-display font-medium text-sm text-[#F7F4EE]">Mechanical Cadence</p>
                  <p className="text-[#DDD6CC] text-[11px]">Every thought stamped letter by letter.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Full-width Metric Strip below the split */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-[#EAE4DC] mt-10">
            <div>
              <p className="text-xs text-[#8A7A6D] uppercase tracking-wider font-mono-type">Visible Feed</p>
              <p className="font-serif-display text-2xl font-bold text-[#24201C] tabular-nums mt-0.5">{visibleEntries.length}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7A6D] uppercase tracking-wider font-mono-type">Anonymous Musings</p>
              <p className="font-serif-display text-2xl font-bold text-[#24201C] tabular-nums mt-0.5">{totalAnonymous}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7A6D] uppercase tracking-wider font-mono-type">Friends' Circles</p>
              <p className="font-serif-display text-2xl font-bold text-[#24201C] tabular-nums mt-0.5">{totalFriendsPosts}</p>
            </div>
            <div>
              <p className="text-xs text-[#8A7A6D] uppercase tracking-wider font-mono-type">Friend Network</p>
              <p className="font-serif-display text-2xl font-bold text-[#24201C] tabular-nums mt-0.5">{currentUser.friendIds.length} Connected</p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Blog Feed & Filters */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Controls Toolbar: Functional tabs + Search + Mood */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#EAE4DC]">
          {/* Functional Segmented Filter Tabs (ALLOWED for interactive state selectors) */}
          <div className="flex items-center gap-1.5 p-1 bg-[#EFE9DF] rounded-xl self-start">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#24201C]'
              }`}
            >
              All Entries
            </button>
            <button
              onClick={() => setActiveFilter('anonymous')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'anonymous'
                  ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#24201C]'
              }`}
            >
              <UserX className="w-3.5 h-3.5 text-[#8A7B6D]" />
              Anonymous ({totalAnonymous})
            </button>
            <button
              onClick={() => setActiveFilter('friends')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                activeFilter === 'friends'
                  ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#24201C]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#8A7B6D]" />
              Friends' Diaries ({totalFriendsPosts})
            </button>
            <button
              onClick={() => setActiveFilter('public')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === 'public'
                  ? 'bg-[#FAF8F5] text-[#24201C] shadow-xs'
                  : 'text-[#6B5E52] hover:text-[#24201C]'
              }`}
            >
              Public Writers
            </button>
          </div>

          {/* Search & Mood selectors */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-[#8C7D6F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search reflections, tags, authors..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg text-[#24201C] placeholder-[#9E9082] focus:outline-none focus:border-[#8C765E] focus:ring-1 focus:ring-[#8C765E]"
              />
            </div>

            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value)}
              className="py-1.5 px-2.5 text-xs bg-[#FAF8F5] border border-[#DDD6CB] rounded-lg text-[#473D33] focus:outline-none focus:border-[#8C765E]"
            >
              <option value="all">All Moods</option>
              <option value="reflective">Reflective</option>
              <option value="peaceful">Peaceful</option>
              <option value="creative">Creative</option>
              <option value="melancholy">Melancholy</option>
              <option value="grateful">Grateful</option>
            </select>
          </div>
        </div>

        {/* Empty state if no posts match */}
        {visibleEntries.length === 0 && (
          <div className="text-center py-16 px-4 bg-[#FCFBF9] rounded-2xl border border-dashed border-[#DDD6CB] max-w-lg mx-auto space-y-3">
            <div className="w-10 h-10 rounded-full bg-[#EFE9DF] text-[#736353] flex items-center justify-center mx-auto">
              <Filter className="w-5 h-5" />
            </div>
            <h3 className="font-serif-display text-lg font-semibold text-[#24201C]">No diary entries found</h3>
            <p className="text-xs text-[#736558] max-w-sm mx-auto">
              No entries match your current privacy or filter criteria. Be the first to publish a thought in this category.
            </p>
            <button
              onClick={() => onOpenNewEntry('public')}
              className="mt-2 px-4 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] rounded-lg hover:bg-[#403932] transition-colors"
            >
              Start Typing Now
            </button>
          </div>
        )}

        {/* Editorial Feed Grid: 2 columns on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleEntries.map((entry) => {
            const isOwnPost = entry.authorId === currentUser.id;
            const hasReactedResonance = entry.userReactions.includes('resonance');

            return (
              <article
                key={entry.id}
                className="group relative bg-[#FCFBF9] border border-[#E4DDD2] hover:border-[#CFC4B5] rounded-2xl p-6 transition-[border-color,background-color,transform] duration-150 shadow-xs flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar on Card: Author Information + Privacy Status */}
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-[#EFE9DF] mb-4">
                    <div className="flex items-center gap-3">
                      {entry.isAnonymous ? (
                        <div className="w-9 h-9 rounded-full bg-[#3D3730] text-[#E8DFD3] flex items-center justify-center font-serif-display text-sm font-semibold shadow-xs">
                          ?
                        </div>
                      ) : (
                        <img
                          src={entry.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                          alt={entry.authorName}
                          referrerPolicy="no-referrer"
                          className="w-9 h-9 rounded-full object-cover border border-[#D5CBBB]"
                        />
                      )}

                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-xs font-semibold text-[#24201C]">
                            {entry.isAnonymous ? 'Anonymous Writer' : entry.authorName}
                          </p>
                          {!entry.isAnonymous && entry.authorIsAdmin && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md bg-[#2B2621] text-[#F5F2EB] border border-[#8C765E]/50 shadow-2xs">
                              <ShieldCheck className="w-2.5 h-2.5 text-[#E6C35C]" />
                              {entry.authorRank || 'ADMIN'}
                            </span>
                          )}
                          {entry.isAnonymous && entry.anonymousAlias && (
                            <span className="text-[11px] text-[#8C7A6B]">
                              ({entry.anonymousAlias})
                            </span>
                          )}
                          {isOwnPost && (
                            <span className="text-[10px] text-[#8C7355] font-mono-type">· You</span>
                          )}
                        </div>

                        {/* Zero-Pill Unboxed Metadata with · separator */}
                        <div className="flex items-center gap-1.5 text-[11px] text-[#7A6D5F] mt-0.5">
                          <span>{new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          <span aria-hidden="true">·</span>
                          <span className="capitalize">{entry.mood}</span>
                          {entry.privacySettings.showTypingStats && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono-type tabular-nums">{entry.typingStats.wpm} WPM</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visibility indicator - Clean unboxed text with icon */}
                    <div className="flex items-center gap-1 text-[11px] text-[#736355] shrink-0">
                      {entry.visibility === 'public' && (
                        <span className="flex items-center gap-1 text-[#667858]" title="Published to public blog">
                          <Globe className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Public</span>
                        </span>
                      )}
                      {entry.visibility === 'friends' && (
                        <span className="flex items-center gap-1 text-[#8C6D47]" title="Exclusively shared with friends">
                          <Users className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Friends Only</span>
                        </span>
                      )}
                      {entry.visibility === 'custom_friends' && (
                        <span className="flex items-center gap-1 text-[#945C3F]" title="Shared with selected friend circle">
                          <Users className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Selected Friends</span>
                        </span>
                      )}
                      {entry.visibility === 'private' && (
                        <span className="flex items-center gap-1 text-[#8C554F]" title="Strictly private to author">
                          <Lock className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Private</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title & Preview Content */}
                  <h2 
                    onClick={() => onSelectEntry(entry)}
                    className="font-serif-display text-xl font-bold text-[#24201C] hover:text-[#6E553D] transition-colors cursor-pointer leading-snug line-clamp-2 text-balance"
                  >
                    {entry.title}
                  </h2>

                  <p 
                    onClick={() => onSelectEntry(entry)}
                    className="text-xs text-[#52463B] leading-relaxed mt-2.5 line-clamp-3 cursor-pointer font-normal"
                  >
                    {entry.content}
                  </p>

                  {/* Tags list as clean text */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#8C7A68] mt-4">
                      {entry.tags.map((tag) => (
                        <span key={tag} className="hover:text-[#24201C]">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Action Footer on Card */}
                <div className="flex items-center justify-between pt-5 mt-5 border-t border-[#EFE9DF] text-xs">
                  {/* Reaction buttons */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(event) => {
                        animateReactionButton(event.currentTarget);
                        void toggleReaction(entry.id, 'resonance').catch(() => undefined);
                      }}
                      aria-pressed={hasReactedResonance}
                      className={`flex items-center gap-1.5 transition-colors active:scale-95 ${
                        hasReactedResonance
                          ? 'text-[#A63A2B] font-medium'
                          : 'text-[#6E6052] hover:text-[#A63A2B]'
                      }`}
                      title="Resonance"
                    >
                      <Heart className={`w-3.5 h-3.5 ${hasReactedResonance ? 'fill-[#A63A2B]' : ''}`} />
                      <span className="tabular-nums font-mono-type">{entry.reactions.resonance}</span>
                    </button>

                    <button
                      onClick={() => onSelectEntry(entry)}
                      className="flex items-center gap-1.5 text-[#6E6052] hover:text-[#24201C] transition-colors"
                      title="Comments"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="tabular-nums font-mono-type">{entry.comments.length}</span>
                    </button>
                  </div>

                  {/* Read full post affordance */}
                  <button
                    onClick={() => onSelectEntry(entry)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#3D3328] hover:text-[#1F1B17] transition-colors"
                  >
                    <span>Read Entry</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
};
