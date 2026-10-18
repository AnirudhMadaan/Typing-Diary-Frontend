/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { DiaryProvider, useDiary } from './context/DiaryContext';
import { Navbar } from './components/Navbar';
import { CommunityBlog } from './components/CommunityBlog';
import { TypewriterStudio } from './components/TypewriterStudio';
import { FriendsAndPrivacy } from './components/FriendsAndPrivacy';
import { MyJournal } from './components/MyJournal';
import { EntryModal } from './components/EntryModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { CustomizeModal } from './components/CustomizeModal';
import { AdminPanel } from './components/AdminPanel';
import { TermsModal } from './components/TermsModal';
import { DiaryTab } from './components/Navbar';
import { DiaryEntry, VisibilityType } from './types/diary';
import { X, Bell, ShieldCheck } from 'lucide-react';

function DiaryApp() {
  const { currentUser, isAuthenticated, isLoading, error, clearError, getSystemAnnouncement } = useDiary();
  const [activeTab, setActiveTab] = useState<DiaryTab>('blog');
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [studioInitialVisibility, setStudioInitialVisibility] = useState<VisibilityType>('public');
  const [studioInitialAnonymous, setStudioInitialAnonymous] = useState<boolean>(false);

  // Auth, Profile & Terms modal states
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [banner, setBanner] = useState<{ text: string; type: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    getSystemAnnouncement().then(setBanner).catch(() => undefined);
  }, [getSystemAnnouncement]);

  const handleOpenNewEntry = (preset?: 'public' | 'anonymous') => {
    if (preset === 'anonymous') {
      setStudioInitialVisibility('public');
      setStudioInitialAnonymous(true);
    } else if (preset === 'public') {
      setStudioInitialVisibility('public');
      setStudioInitialAnonymous(false);
    } else {
      setStudioInitialVisibility(currentUser?.defaultPrivacy || 'private');
      setStudioInitialAnonymous(Boolean(currentUser?.settings?.defaultAnonymous));
    }
    setActiveTab('studio');
  };

  const handlePostPublished = (visibility: VisibilityType) => {
    setActiveTab(visibility === 'private' ? 'my-journal' : 'blog');
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5] text-[#736558] font-serif-display">Opening your diary…</div>;
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] text-[#24201C] flex items-center justify-center p-4">
        <div className="fixed top-5 left-5 flex items-center gap-2 text-[#51463A]">
          <span className="w-8 h-8 rounded-lg bg-[#2B2621] text-white flex items-center justify-center"><span>✎</span></span>
          <span className="font-serif-display text-lg font-bold">Typing Diary</span>
        </div>
        <AuthModal isOpen defaultMode="login" onClose={() => undefined} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#24211D]">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewEntry={() => handleOpenNewEntry()}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenCustomize={() => setIsCustomizeModalOpen(true)}
      />

      {/* Platform Announcement Banner */}
      {banner && !bannerDismissed && (
        <div className={`border-b text-xs py-2 px-4 flex items-center justify-between gap-3 ${
          banner.type === 'warning'
            ? 'bg-[#FAF0E1] border-[#E8DEC8] text-[#8C5D23]'
            : banner.type === 'success'
            ? 'bg-[#EAF5EC] border-[#BDE0C4] text-[#2F6136]'
            : 'bg-[#FAF4EB] border-[#EAE4DC] text-[#4A3E33]'
        }`}>
          <div className="max-w-7xl mx-auto flex items-center gap-2 flex-1 justify-center font-medium">
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span>{banner.text}</span>
          </div>
          <button
            onClick={() => setBannerDismissed(true)}
            aria-label="Dismiss banner"
            className="text-xs opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      <main className="flex-1">
        {error && (
          <div role="alert" className="max-w-7xl mx-auto mt-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-3 rounded-lg border border-[#F2C4BE] bg-[#FDEAE8] px-3 py-2 text-xs text-[#8B3328]">
              <span>{error}</span>
              <button onClick={clearError} aria-label="Dismiss message"><X className="w-4 h-4" /></button>
            </div>
          </div>
        )}
        {activeTab === 'blog' && (
          <CommunityBlog
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onOpenNewEntry={handleOpenNewEntry}
          />
        )}

        {activeTab === 'studio' && (
          <TypewriterStudio
            initialVisibility={studioInitialVisibility}
            initialAnonymous={studioInitialAnonymous}
            onPostPublished={handlePostPublished}
            onOpenCustomize={() => setIsCustomizeModalOpen(true)}
          />
        )}

        {activeTab === 'my-journal' && (
          <MyJournal
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onOpenTypewriter={() => handleOpenNewEntry()}
          />
        )}

        {activeTab === 'friends' && (
          <FriendsAndPrivacy
            onSelectEntry={(entry) => setSelectedEntry(entry)}
            onOpenTypewriter={() => handleOpenNewEntry()}
          />
        )}

        {activeTab === 'admin' && (
          <AdminPanel />
        )}
      </main>

      {/* Reading Modal */}
      <EntryModal
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />

      {/* Profile & Account Details Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
      <CustomizeModal isOpen={isCustomizeModalOpen} onClose={() => setIsCustomizeModalOpen(false)} />
      <TermsModal isOpen={isTermsModalOpen} onClose={() => setIsTermsModalOpen(false)} />

      {/* Quiet, elegant footer (conforming to Anti-Slop constitution) */}
      <footer className="border-t border-[#EAE4DC] py-8 bg-[#FAF8F5] text-xs text-[#7A6C5E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif-display font-semibold text-[#24201C]">Typing Diary</span>
            <span aria-hidden="true">·</span>
            <span>A tactile refuge for words stamped one keystroke at a time.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setActiveTab('blog')}
              className="hover:text-[#24201C] transition-colors"
            >
              Community Blog
            </button>
            <button
              onClick={() => setActiveTab('friends')}
              className="hover:text-[#24201C] transition-colors"
            >
              Friends & Privacy
            </button>
            <button
              onClick={() => setActiveTab('studio')}
              className="hover:text-[#24201C] transition-colors"
            >
              Typewriter Studio
            </button>
            <button
              onClick={() => setIsTermsModalOpen(true)}
              className="hover:text-[#24201C] transition-colors"
            >
              Terms & Conditions
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <DiaryProvider>
      <DiaryApp />
    </DiaryProvider>
  );
}
