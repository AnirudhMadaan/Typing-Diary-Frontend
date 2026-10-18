import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Download, LogOut, UserRound, X } from 'lucide-react';
import { useDiary } from '../context/DiaryContext';
import { VisibilityType } from '../types/diary';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, entries, updateUserProfile, exportDiary, deleteAccount, logout, error, clearError } = useDiary();
  const [displayName, setDisplayName] = useState(currentUser.displayName);
  const [username, setUsername] = useState(currentUser.username);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);
  const [defaultPrivacy, setDefaultPrivacy] = useState<VisibilityType>(currentUser.defaultPrivacy);
  const [settings, setSettings] = useState(currentUser.settings);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isDeleteExpanded, setIsDeleteExpanded] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleting, setDeleting] = useState(false);

  const closeModal = () => {
    setDeletePhrase('');
    setIsDeleteExpanded(false);
    onClose();
  };

  useEffect(() => {
    setDisplayName(currentUser.displayName);
    setUsername(currentUser.username);
    setBio(currentUser.bio);
    setAvatar(currentUser.avatar);
    setDefaultPrivacy(currentUser.defaultPrivacy);
    setSettings({
      ...currentUser.settings,
      soundType: currentUser.settings.soundType === 'mute' ? 'typewriter' : currentUser.settings.soundType,
    });
  }, [currentUser]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setDeletePhrase('');
        setIsDeleteExpanded(false);
        onClose();
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const myEntries = entries.filter((entry) => entry.authorId === currentUser.id);
  const totalWords = myEntries.reduce((sum, entry) => sum + (entry.typingStats?.words || 0), 0);
  const averageWpm = myEntries.length ? Math.round(myEntries.reduce((sum, entry) => sum + (entry.typingStats?.wpm || 0), 0) / myEntries.length) : 0;

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    clearError();
    try {
      await updateUserProfile({
        displayName: displayName.trim(),
        username: username.trim().toLowerCase(),
        bio: bio.trim(),
        avatar: avatar.trim(),
        defaultPrivacy,
        settings,
      });
      setSaved(true);
      window.setTimeout(closeModal, 800);
    } catch {
      // The shared account banner displays the server's validation message.
    } finally {
      setSaving(false);
    }
  };

  const saveAccountPreferences = (key: 'allowFriendRequests' | 'defaultAnonymous' | 'showStatsByDefault', value: boolean) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const confirmDeleteAccount = async () => {
    if (deletePhrase !== 'DELETE' || deleting) return;
    setDeleting(true);
    clearError();
    try {
      await deleteAccount();
      closeModal();
    } catch {
      // Keep the confirmation open so the user can review the service error.
    } finally {
      setDeleting(false);
    }
  };

  const initials = displayName.trim().slice(0, 1).toUpperCase() || 'W';

  return (
    <div className="fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto" onPointerDown={(event) => { if (event.target === event.currentTarget) closeModal(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="profile-modal-title" className="bg-[#FAF8F5] border border-[#E3DCCF] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        <header className="flex items-start justify-between pb-4 border-b border-[#EAE4DC]">
          <div className="flex items-center gap-3">
            {avatar
              ? <img src={avatar} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#D5CBBB]" />
              : <span className="w-12 h-12 rounded-full bg-[#DED3C3] flex items-center justify-center text-lg font-semibold text-[#51463A]"><UserRound className="w-5 h-5" /></span>}
            <div>
              <h2 id="profile-modal-title" className="font-serif-display text-xl font-bold text-[#24201C]">{displayName || currentUser.displayName}</h2>
              <p className="text-xs text-[#8A7969] font-mono-type">@{username}</p>
              {currentUser.email && <p className="text-[11px] text-[#A19183]">{currentUser.email}</p>}
            </div>
          </div>
          <button onClick={closeModal} aria-label="Close" className="p-1 text-[#8C7D6F] hover:text-[#24201C]"><X className="w-5 h-5" /></button>
        </header>

        <div className="grid grid-cols-3 gap-3 p-3 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-center text-xs font-mono-type">
          <div><span className="text-[10px] text-[#8C7A68] uppercase block">Entries</span><strong className="text-sm text-[#24201C]">{myEntries.length}</strong></div>
          <div className="border-x border-[#DDD5C7]"><span className="text-[10px] text-[#8C7A68] uppercase block">Words typed</span><strong className="text-sm text-[#24201C]">{totalWords}</strong></div>
          <div><span className="text-[10px] text-[#8C7A68] uppercase block">Avg. cadence</span><strong className="text-sm text-[#24201C]">{averageWpm} WPM</strong></div>
        </div>

        <form onSubmit={(event) => void save(event)} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="font-semibold text-[#4A3E33]">Display name
              <input required minLength={2} maxLength={80} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg font-normal focus:outline-none focus:border-[#8C765E]" />
            </label>
            <label className="font-semibold text-[#4A3E33]">Username
              <input required minLength={3} maxLength={24} pattern="[a-zA-Z0-9_]+" value={username} onChange={(event) => setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg font-mono-type font-normal focus:outline-none focus:border-[#8C765E]" />
            </label>
          </div>

          <label className="block font-semibold text-[#4A3E33]">Bio
            <textarea maxLength={280} rows={3} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="A little about you and what you like to write." className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg font-normal focus:outline-none focus:border-[#8C765E] resize-none" />
          </label>

          <label className="block font-semibold text-[#4A3E33]">Avatar image URL <span className="font-normal text-[#8A7969]">(optional, HTTPS)</span>
            <input type="url" value={avatar} onChange={(event) => setAvatar(event.target.value)} placeholder="https://…" className="mt-1 w-full px-3 py-2 bg-white border border-[#DDD6CB] rounded-lg font-normal focus:outline-none focus:border-[#8C765E]" />
          </label>

          <fieldset>
            <legend className="font-semibold text-[#4A3E33] mb-2">Default privacy for new entries</legend>
            <div className="grid grid-cols-3 gap-2">
              {([
                ['private', 'Private'],
                ['friends', 'Friends'],
                ['public', 'Public'],
              ] as [VisibilityType, string][]).map(([value, label]) => (
                <button type="button" key={value} onClick={() => setDefaultPrivacy(value)} className={`py-2 px-2 rounded-lg border text-center ${defaultPrivacy === value ? 'bg-[#2B2621] text-[#FAF8F5] border-[#2B2621] font-semibold' : 'bg-white border-[#DDD6CB] text-[#54483C]'}`}>{label}</button>
              ))}
            </div>
          </fieldset>

          <fieldset className="space-y-2 rounded-xl border border-[#E3DCCF] bg-[#FCFBF9] p-3">
            <legend className="px-1 font-semibold text-[#4A3E33]">Account preferences</legend>
            {[
              ['allowFriendRequests', 'Allow friend requests'],
              ['defaultAnonymous', 'Start public posts anonymously'],
              ['showStatsByDefault', 'Show typing stats on new posts'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center justify-between gap-3 text-[#51463A]">
                <span>{label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[key as keyof typeof settings])}
                  onChange={(event) => saveAccountPreferences(key as 'allowFriendRequests' | 'defaultAnonymous' | 'showStatsByDefault', event.target.checked)}
                  className="w-4 h-4 accent-[#71634F]"
                />
              </label>
            ))}
          </fieldset>

          <section className="rounded-xl border border-[#E3DCCF] bg-[#FCFBF9] p-3">
            <div className="flex items-start gap-2">
              <Download className="w-4 h-4 mt-0.5 text-[#8C765E]" />
              <div>
                <h3 className="font-semibold text-[#4A3E33]">Take your diary with you</h3>
                <p className="mt-1 text-[11px] leading-relaxed text-[#817366]">Download your entries for your own archive. Exports include your entry text and privacy labels.</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 pl-6">
              <button type="button" data-testid="button-export-json" onClick={() => exportDiary('json')} className="rounded-lg border border-[#DDD5C7] bg-white px-3 py-2 text-[11px] font-medium text-[#51463A] hover:bg-[#F3EEE6]">Export JSON</button>
              <button type="button" data-testid="button-export-markdown" onClick={() => exportDiary('markdown')} className="rounded-lg border border-[#DDD5C7] bg-white px-3 py-2 text-[11px] font-medium text-[#51463A] hover:bg-[#F3EEE6]">Export Markdown</button>
            </div>
          </section>

          {error && <p role="alert" className="text-xs text-[#A63A2B] bg-[#FDEAE8] p-3 rounded-lg border border-[#F2C4BE]">{error}</p>}
          <div className="flex items-center justify-between gap-3 pt-2">
            <button type="submit" disabled={saving || deleting} className="px-5 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] disabled:opacity-60 rounded-xl flex items-center gap-1.5">
              {saved && <Check className="w-4 h-4 text-[#7BD46B]" />}
              {saving ? 'Saving…' : saved ? 'Saved' : 'Save profile'}
            </button>
            <button type="button" onClick={() => void logout().then(closeModal).catch(() => undefined)} className="flex items-center gap-1 text-xs text-[#96473D] hover:text-[#7A362D]">
              <LogOut className="w-3.5 h-3.5" /><span>Sign out</span>
            </button>
          </div>
        </form>

        <section className="border-t border-[#EAE4DC] pt-4">
          <button
            type="button"
            data-testid="button-toggle-delete-account"
            onClick={() => { setIsDeleteExpanded((open) => !open); setDeletePhrase(''); }}
            aria-expanded={isDeleteExpanded}
            className="text-xs font-medium text-[#96473D] hover:text-[#7A362D]"
          >
            {isDeleteExpanded ? 'Cancel account deletion' : 'Delete account'}
          </button>
          {isDeleteExpanded && (
            <div className="mt-3 rounded-xl border border-[#E7BDB6] bg-[#FDF2F0] p-4">
              <div className="flex items-start gap-2 text-[#813C32]">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-xs font-bold">This cannot be undone</h3>
                  <p className="mt-1 text-[11px] leading-relaxed">
                    Deleting your account permanently removes your entries and linked social data, including friend connections and related community activity.
                  </p>
                </div>
              </div>
              <label className="mt-3 block text-[11px] font-semibold text-[#71382F]">
                Type DELETE to confirm
                <input
                  value={deletePhrase}
                  data-testid="input-delete-account-confirmation"
                  onChange={(event) => setDeletePhrase(event.target.value)}
                  autoComplete="off"
                  className="mt-1 w-full rounded-lg border border-[#D9AAA2] bg-[#FFFAF9] px-3 py-2 font-mono-type text-xs text-[#4D302C] focus:outline-none focus:border-[#A34F43]"
                  aria-label="Type DELETE to confirm account deletion"
                />
              </label>
              <button
                type="button"
                data-testid="button-confirm-delete-account"
                disabled={deletePhrase !== 'DELETE' || deleting}
                onClick={() => void confirmDeleteAccount()}
                className="mt-3 rounded-lg bg-[#8B3328] px-3 py-2 text-xs font-semibold text-white hover:bg-[#73291F] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? 'Deleting account…' : 'Permanently delete account'}
              </button>
            </div>
          )}
        </section>
      </section>
    </div>
  );
};
