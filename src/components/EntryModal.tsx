import React, { useEffect, useState } from 'react';
import { diaryAssetUrl, useDiary } from '../context/DiaryContext';
import { DiaryEntry, DiaryPhoto } from '../types/diary';
import { 
  X, 
  Heart, 
  Bookmark, 
  Sparkles, 
  MessageCircle, 
  Lock, 
  Globe, 
  Users, 
  UserX, 
  Send, 
  Smile, 
  Clock, 
  Share2,
  MapPin,
  CloudSun,
  Image as ImageIcon,
} from 'lucide-react';
import { typewriterAudio } from '../utils/audio';

interface EntryModalProps {
  entry: DiaryEntry | null;
  onClose: () => void;
}

export const EntryModal: React.FC<EntryModalProps> = ({ entry: initialEntry, onClose }) => {
  const { currentUser, entries, toggleReaction, addComment } = useDiary();
  const [newCommentText, setNewCommentText] = useState('');
  const [commentAnonymously, setCommentAnonymously] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<DiaryPhoto | null>(null);
  const entry = initialEntry ? entries.find((item) => item.id === initialEntry.id) || initialEntry : null;

  useEffect(() => {
    if (!entry) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedPhoto) setSelectedPhoto(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [entry, onClose, selectedPhoto]);

  if (!entry) return null;

  const hasReactedResonance = entry.userReactions.includes('resonance');
  const hasReactedHug = entry.userReactions.includes('hug');
  const hasReactedBookmark = entry.userReactions.includes('bookmark');
  const hasReactedInspire = entry.userReactions.includes('inspire');

  const handleSendComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    typewriterAudio.playKeySound('Enter');
    void addComment(entry.id, newCommentText, commentAnonymously)
      .then(() => setNewCommentText(''))
      .catch(() => undefined);
  };

  const handleReaction = (type: string, button: HTMLButtonElement) => {
    if (typeof button.animate === 'function') {
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
    void toggleReaction(entry.id, type).catch(() => undefined);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="diary-entry-title" className="bg-[#FAF8F5] border border-[#E3DCcf] rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col justify-between animate-in zoom-in-95">
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#FAF8F5]/95 backdrop-blur-md px-6 py-4 border-b border-[#EAE4DC] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {entry.isAnonymous ? (
              <div className="w-9 h-9 rounded-full bg-[#3D3730] text-[#E8DFD3] flex items-center justify-center font-serif-display text-sm font-semibold">
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
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-[#24201C]">
                  {entry.isAnonymous ? 'Anonymous Writer' : entry.authorName}
                </p>
                {entry.isAnonymous && entry.anonymousAlias && (
                  <span className="text-[11px] text-[#8C7A6B]">
                    ({entry.anonymousAlias})
                  </span>
                )}
              </div>

              {/* Zero-Pill Unboxed Metadata */}
              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] text-[#7A6D5F]">
                <span>{new Date(entry.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span aria-hidden="true">·</span>
                <Clock className="h-3 w-3" aria-hidden="true" />
                <span>{new Date(entry.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{entry.mood}</span>
                {entry.location && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{entry.location}</span>
                  </>
                )}
                {entry.privacySettings.showTypingStats && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-type tabular-nums">{entry.typingStats.wpm} WPM</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Visibility Tag */}
            <div className="flex items-center gap-1 text-[11px] text-[#736355] bg-[#EFE9DF] px-2.5 py-1 rounded-lg">
              {entry.visibility === 'public' && <Globe className="w-3 h-3 text-[#527344]" />}
              {entry.visibility === 'friends' && <Users className="w-3 h-3 text-[#3A6073]" />}
              {entry.visibility === 'custom_friends' && <Users className="w-3 h-3 text-[#8C4362]" />}
              {entry.visibility === 'private' && <Lock className="w-3 h-3 text-[#8A3B34]" />}
              <span className="capitalize">{entry.visibility.replace('_', ' ')}</span>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#8C7D6F] hover:text-[#24201C] hover:bg-[#EFE9DF] rounded-lg transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Reading Body */}
        <div className="p-6 sm:p-10 space-y-6">
          <h1 id="diary-entry-title" className="font-serif-display text-2xl sm:text-3xl lg:text-4xl font-bold text-[#24201C] leading-[1.25] text-balance">
            {entry.title}
          </h1>

          {entry.weather && (
            <section className="flex items-start gap-3 rounded-xl border border-[#DDD5C7] bg-[#F4EFE6] p-4 text-[#4A3E33]" aria-label="Weather on diary date">
              <CloudSun className="mt-0.5 h-5 w-5 shrink-0 text-[#8C765E]" />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{entry.weather.description}</p>
                <p className="mt-0.5 text-[11px]">{entry.weather.location} · {new Date(`${entry.weather.date}T12:00:00`).toLocaleDateString()}</p>
                {entry.weather.temperatureMinC !== null && entry.weather.temperatureMaxC !== null && (
                  <p className="mt-1 font-mono-type text-xs">{Math.round(entry.weather.temperatureMinC)}°–{Math.round(entry.weather.temperatureMaxC)}°C</p>
                )}
                <p className="mt-1 text-[10px] text-[#817366]">Weather data: Open-Meteo</p>
              </div>
            </section>
          )}

          {entry.photos?.length ? (
            <section className="space-y-2" aria-label="Diary pictures">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold text-[#6B5E52]">
                <ImageIcon className="h-3.5 w-3.5" /> Pictures ({entry.photos.length})
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {entry.photos.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setSelectedPhoto(photo)}
                    className="overflow-hidden rounded-xl border border-[#DDD5C7] focus:outline-none focus:ring-2 focus:ring-[#8C765E]"
                    aria-label={`View ${photo.alt}`}
                  >
                    <img src={diaryAssetUrl(photo.src)} alt={photo.alt} loading="lazy" className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.02]" />
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {/* Typing Telemetry Strip if enabled */}
          {entry.privacySettings.showTypingStats && (
            <div className="flex flex-wrap items-center gap-4 py-2 px-3.5 bg-[#F4EFE6] rounded-xl text-xs text-[#6B5D50] font-mono-type tabular-nums border border-[#E5DFD4]">
              <div>
                <span className="text-[#998A7B] text-[10px] block uppercase">Cadence</span>
                <span className="font-semibold text-[#24201C]">{entry.typingStats.wpm} words/min</span>
              </div>
              <div className="h-5 w-px bg-[#DDD5C7]" />
              <div>
                <span className="text-[#998A7B] text-[10px] block uppercase">Length</span>
                <span className="font-semibold text-[#24201C]">{entry.typingStats.words} words</span>
              </div>
              <div className="h-5 w-px bg-[#DDD5C7]" />
              <div>
                <span className="text-[#998A7B] text-[10px] block uppercase">Session</span>
                <span className="font-semibold text-[#24201C]">{entry.typingStats.durationMinutes} minutes typing</span>
              </div>
            </div>
          )}

          {/* Post Content with editorial line spacing */}
          <div className="prose prose-stone max-w-none text-[#29241F] text-sm sm:text-base leading-relaxed whitespace-pre-line font-normal space-y-4">
            {entry.content}
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-[#EAE4DC] text-xs text-[#8A7968]">
              {entry.tags.map((tag) => (
                <span key={tag} className="hover:text-[#24201C]">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Reactions bar */}
          {entry.privacySettings.allowReactions && (
            <div className="flex flex-wrap items-center gap-2.5 pt-4 border-t border-[#EAE4DC]">
              <button
                onClick={(event) => handleReaction('resonance', event.currentTarget)}
                aria-pressed={hasReactedResonance}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                  hasReactedResonance
                    ? 'bg-[#FBEBE8] border-[#E8B4AC] text-[#A63A2B] font-semibold'
                    : 'bg-[#FCFBF9] border-[#DDD5C7] text-[#594B3D] hover:bg-[#EFE9DF]'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${hasReactedResonance ? 'fill-[#A63A2B]' : ''}`} />
                <span>Resonance</span>
                <span className="tabular-nums font-mono-type ml-1">{entry.reactions.resonance}</span>
              </button>

              <button
                onClick={(event) => handleReaction('hug', event.currentTarget)}
                aria-pressed={hasReactedHug}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                  hasReactedHug
                    ? 'bg-[#F7EFE8] border-[#DFBAA3] text-[#A85834] font-semibold'
                    : 'bg-[#FCFBF9] border-[#DDD5C7] text-[#594B3D] hover:bg-[#EFE9DF]'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Warmth / Hug</span>
                <span className="tabular-nums font-mono-type ml-1">{entry.reactions.hug}</span>
              </button>

              <button
                onClick={(event) => handleReaction('inspire', event.currentTarget)}
                aria-pressed={hasReactedInspire}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                  hasReactedInspire
                    ? 'bg-[#FBF8EB] border-[#E4D59E] text-[#91761F] font-semibold'
                    : 'bg-[#FCFBF9] border-[#DDD5C7] text-[#594B3D] hover:bg-[#EFE9DF]'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Inspire</span>
                <span className="tabular-nums font-mono-type ml-1">{entry.reactions.inspire}</span>
              </button>

              <button
                onClick={(event) => handleReaction('bookmark', event.currentTarget)}
                aria-pressed={hasReactedBookmark}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all active:scale-95 ${
                  hasReactedBookmark
                    ? 'bg-[#EBF3FB] border-[#A8C7E8] text-[#2F6196] font-semibold'
                    : 'bg-[#FCFBF9] border-[#DDD5C7] text-[#594B3D] hover:bg-[#EFE9DF]'
                }`}
              >
                <Bookmark className={`w-3.5 h-3.5 ${hasReactedBookmark ? 'fill-[#2F6196]' : ''}`} />
                <span>Keep Note</span>
                <span className="tabular-nums font-mono-type ml-1">{entry.reactions.bookmark}</span>
              </button>
            </div>
          )}

          {/* Reflections / Comments Section */}
          <div className="pt-6 border-t border-[#EAE4DC] space-y-5">
            <h3 className="font-serif-display text-lg font-bold text-[#24201C] flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-[#8C7D6F]" />
              <span>Reflections & Comments ({entry.comments.length})</span>
            </h3>

            {entry.comments.length === 0 ? (
              <p className="text-xs text-[#8A7969] italic">
                No reflections added yet. Leave a quiet note or anonymous impression below.
              </p>
            ) : (
              <div className="space-y-3">
                {entry.comments.map((comment) => (
                  <div key={comment.id} className="p-3.5 bg-[#FCFBF9] border border-[#E3DCcf] rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {comment.isAnonymous ? (
                          <div className="w-5 h-5 rounded-full bg-[#473F38] text-white flex items-center justify-center text-[10px]">
                            ?
                          </div>
                        ) : (
                          <img
                            src={comment.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=250&q=80'}
                            alt={comment.authorName}
                            referrerPolicy="no-referrer"
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        )}
                        <span className="font-semibold text-[#24201C]">{comment.authorName}</span>
                      </div>
                      <span className="text-[11px] text-[#8C7D6F]">
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#473E36] leading-relaxed pl-7">{comment.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Comment form */}
            {entry.privacySettings.allowComments ? (
              <form onSubmit={handleSendComment} className="pt-2 space-y-3">
                <div className="relative">
                  <textarea
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Leave a thoughtful reflection for the author..."
                    rows={2}
                    className="w-full text-xs p-3 bg-white border border-[#DDD5C7] rounded-xl text-[#24201C] placeholder-[#9E9082] focus:outline-none focus:border-[#8C765E]"
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer text-[#6B5D50]">
                    <input
                      type="checkbox"
                      checked={commentAnonymously}
                      onChange={(e) => setCommentAnonymously(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-[#C8BEAE] text-[#2B2621] focus:ring-0"
                    />
                    <span>Post reflection anonymously</span>
                  </label>

                  <button
                    type="submit"
                    disabled={!newCommentText.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Reflection</span>
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-xs text-[#8C7D6F] italic">
                Comments have been disabled for this entry by the author.
              </p>
            )}
          </div>
        </div>
      </div>
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Diary picture preview"
          onClick={() => setSelectedPhoto(null)}
        >
          <button type="button" onClick={() => setSelectedPhoto(null)} className="absolute right-4 top-4 rounded-full bg-white/15 p-2 text-white" aria-label="Close picture preview">
            <X className="h-5 w-5" />
          </button>
          <img
            src={diaryAssetUrl(selectedPhoto.src)}
            alt={selectedPhoto.alt}
            className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
