import React, { useState, useEffect, useMemo } from 'react';
import { useDiary } from '../context/DiaryContext';
import { AdminOverview, AdminUserMetric, DiaryEntry, BroadcastEmailPayload } from '../types/diary';
import {
  ShieldCheck,
  Users,
  PenTool,
  Mail,
  Send,
  Eye,
  Trash2,
  Bell,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  KeyRound,
  FileText,
  Lock,
  ChevronDown,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  Globe,
  Radio,
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const {
    currentUser,
    getAdminOverview,
    getAdminUsers,
    sendBroadcastEmail,
    getAdminPublicEntries,
    adminDeleteEntry,
    getSystemAnnouncement,
    setSystemAnnouncement,
  } = useDiary();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'email' | 'moderation' | 'announcement' | 'env'>('overview');
  
  // Data states
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [adminUsers, setAdminUsers] = useState<AdminUserMetric[]>([]);
  const [publicEntries, setPublicEntries] = useState<DiaryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // User search & filters
  const [userSearch, setUserSearch] = useState('');
  const [userSortBy, setUserSortBy] = useState<'words' | 'entries' | 'recent' | 'name'>('words');
  const [userFilter, setUserFilter] = useState<'all' | 'admins' | 'opted_in'>('all');

  // Broadcast Email Form states
  const [emailTarget, setEmailTarget] = useState<'all' | 'opted_in' | 'specific' | 'test_admin'>('opted_in');
  const [specificEmail, setSpecificEmail] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [previewEmail, setPreviewEmail] = useState(false);
  const [emailSendResult, setEmailSendResult] = useState<{ success: boolean; message: string; devMode?: boolean } | null>(null);

  // System Announcement states
  const [announcementText, setAnnouncementText] = useState('');
  const [announcementType, setAnnouncementType] = useState<'info' | 'warning' | 'success'>('info');
  const [isAnnouncementActive, setIsAnnouncementActive] = useState(false);
  const [isSavingAnnouncement, setIsSavingAnnouncement] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [overviewData, usersData, entriesData, announcementData] = await Promise.all([
        getAdminOverview(),
        getAdminUsers(),
        getAdminPublicEntries(),
        getSystemAnnouncement(),
      ]);
      setOverview(overviewData);
      setAdminUsers(usersData);
      setPublicEntries(entriesData);
      if (announcementData) {
        setAnnouncementText(announcementData.text);
        setAnnouncementType((announcementData.type as any) || 'info');
        setIsAnnouncementActive(true);
      } else {
        setIsAnnouncementActive(false);
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to load administrative data.' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  // Filter and sort user metrics
  const filteredUsers = useMemo(() => {
    return adminUsers
      .filter((u) => {
        if (userFilter === 'admins' && !u.isAdmin) return false;
        if (userFilter === 'opted_in' && !u.emailOptIn) return false;
        if (!userSearch.trim()) return true;
        const q = userSearch.toLowerCase();
        return (
          u.name.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (userSortBy === 'words') return b.totalWords - a.totalWords;
        if (userSortBy === 'entries') return b.totalEntries - a.totalEntries;
        if (userSortBy === 'recent') return new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime();
        return a.name.localeCompare(b.name);
      });
  }, [adminUsers, userSearch, userSortBy, userFilter]);

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailSubject.trim() || !emailMessage.trim()) {
      setStatusMessage({ type: 'error', text: 'Please fill in both the subject and the announcement message.' });
      return;
    }
    if (emailTarget === 'specific' && !specificEmail.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a recipient email address.' });
      return;
    }

    setIsSendingEmail(true);
    setEmailSendResult(null);
    setStatusMessage(null);

    try {
      const payload: BroadcastEmailPayload = {
        subject: emailSubject.trim(),
        message: emailMessage.trim(),
        target: emailTarget,
        specificEmail: emailTarget === 'specific' ? specificEmail.trim() : undefined,
      };

      const result = await sendBroadcastEmail(payload);
      setEmailSendResult(result);
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        if (emailTarget !== 'test_admin') {
          setEmailSubject('');
          setEmailMessage('');
        }
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to dispatch email broadcast.' });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingAnnouncement(true);
    setStatusMessage(null);
    try {
      await setSystemAnnouncement(announcementText.trim(), announcementType, isAnnouncementActive);
      setStatusMessage({
        type: 'success',
        text: isAnnouncementActive
          ? 'Platform announcement banner is now live for all users!'
          : 'Platform announcement banner deactivated.',
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to update announcement.' });
    } finally {
      setIsSavingAnnouncement(false);
    }
  };

  const handleDeletePublicEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this public post? This cannot be undone.')) return;
    try {
      await adminDeleteEntry(entryId);
      setPublicEntries((prev) => prev.filter((e) => e.id !== entryId));
      setStatusMessage({ type: 'success', text: 'Public entry removed successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err?.message || 'Failed to remove entry.' });
    }
  };

  const openEmailToUser = (userEmail: string) => {
    setEmailTarget('specific');
    setSpecificEmail(userEmail);
    setActiveTab('email');
  };

  if (!currentUser.isAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <ShieldCheck className="w-12 h-12 text-[#96473D] mx-auto mb-3" />
        <h2 className="font-serif-display text-2xl font-bold text-[#24201C]">Restricted Access</h2>
        <p className="text-xs text-[#736558] mt-2">
          This area is reserved for Typing Diary administrators configured in the server environment.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Banner Header */}
      <header className="bg-[#FAF8F5] border border-[#E3DCCF] rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#2B2621] text-[#FAF8F5] border border-[#8C765E]/40">
                <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
                {currentUser.adminRank || 'ADMINISTRATOR'}
              </span>
              <span className="text-xs text-[#8A7969] font-mono-type">@{currentUser.username}</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#24201C]">
              Typing Diary Admin Console
            </h1>
            <p className="text-xs text-[#736558] max-w-2xl">
              Platform administration, aggregate data volume analytics, and official email broadcast center.
              Writer privacy is strictly preserved — personal diary contents remain zero-knowledge and inaccessible.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => void loadData()}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4A3E33] bg-[#F2EDE4] hover:bg-[#E8E1D5] border border-[#DDD6CB] rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </div>

        {/* Status Notification */}
        {statusMessage && (
          <div
            className={`mt-4 p-3 rounded-xl border flex items-center justify-between text-xs ${
              statusMessage.type === 'success'
                ? 'bg-[#EAF5EC] border-[#BDE0C4] text-[#2F6136]'
                : 'bg-[#FDEAE8] border-[#F2C4BE] text-[#8B3328]'
            }`}
          >
            <div className="flex items-center gap-2">
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMessage.text}</span>
            </div>
            <button onClick={() => setStatusMessage(null)} className="font-semibold text-xs ml-4">✕</button>
          </div>
        )}

        {/* Tab Navigation */}
        <nav className="mt-6 flex items-center gap-2 overflow-x-auto pb-1 border-t border-[#EAE4DC] pt-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'overview' ? 'bg-[#2B2621] text-white' : 'text-[#6B5E52] hover:bg-[#F2EDE4]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Platform Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'users' ? 'bg-[#2B2621] text-white' : 'text-[#6B5E52] hover:bg-[#F2EDE4]'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Writers Directory ({adminUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'email' ? 'bg-[#2B2621] text-white' : 'text-[#6B5E52] hover:bg-[#F2EDE4]'
            }`}
          >
            <Mail className="w-3.5 h-3.5" /> Send Updates Email
          </button>
          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'moderation' ? 'bg-[#2B2621] text-white' : 'text-[#6B5E52] hover:bg-[#F2EDE4]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" /> Public Posts ({publicEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('announcement')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'announcement' ? 'bg-[#2B2621] text-white' : 'text-[#6B5E52] hover:bg-[#F2EDE4]'
            }`}
          >
            <Bell className="w-3.5 h-3.5" /> Site Banner
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeTab === 'env' ? 'bg-[#2B2621] text-white' : 'text-[#6B5E52] hover:bg-[#F2EDE4]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" /> Admin Accounts (.env)
          </button>
        </nav>
      </header>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E3DCCF] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8A7969] uppercase tracking-wider">Registered Writers</span>
                <Users className="w-4 h-4 text-[#8C765E]" />
              </div>
              <p className="mt-2 text-3xl font-serif-display font-bold text-[#24201C]">
                {overview?.totalUsers ?? '…'}
              </p>
              <p className="mt-1 text-[11px] text-[#7A6D5F]">
                {overview?.activeToday ?? 0} active in last 24 hours
              </p>
            </div>

            <div className="bg-white border border-[#E3DCCF] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8A7969] uppercase tracking-wider">Total Words Stamped</span>
                <PenTool className="w-4 h-4 text-[#8C765E]" />
              </div>
              <p className="mt-2 text-3xl font-serif-display font-bold text-[#24201C]">
                {overview?.totalWordsWritten ? overview.totalWordsWritten.toLocaleString() : '0'}
              </p>
              <p className="mt-1 text-[11px] text-[#7A6D5F]">
                ~{(overview?.totalCharacters ? (overview.totalCharacters / 1024).toFixed(1) : '0')} KB total data written
              </p>
            </div>

            <div className="bg-white border border-[#E3DCCF] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8A7969] uppercase tracking-wider">Diary Entries Created</span>
                <FileText className="w-4 h-4 text-[#8C765E]" />
              </div>
              <p className="mt-2 text-3xl font-serif-display font-bold text-[#24201C]">
                {overview?.totalEntries ?? '…'}
              </p>
              <p className="mt-1 text-[11px] text-[#7A6D5F]">
                {overview?.publicEntriesCount ?? 0} public · {overview?.privateEntriesCount ?? 0} private
              </p>
            </div>

            <div className="bg-white border border-[#E3DCCF] rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-[#8A7969] uppercase tracking-wider">Email System Status</span>
                <Mail className="w-4 h-4 text-[#8C765E]" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${overview?.emailService.configured ? 'bg-[#4A7C49]' : 'bg-[#D48B38]'}`} />
                <p className="text-sm font-semibold text-[#24201C]">
                  {overview?.emailService.configured ? 'Live Delivery Active' : 'Dev Sandbox Mode'}
                </p>
              </div>
              <p className="mt-1 text-[11px] text-[#7A6D5F] font-mono-type truncate" title={overview?.emailService.senderEmail}>
                {overview?.emailService.senderEmail || 'Not configured'}
              </p>
            </div>
          </div>

          {/* Privacy Guarantee Reminder Card */}
          <div className="bg-[#FAF4EB] border border-[#E8DEC8] rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-serif-display text-base font-bold text-[#2B2621]">
                <Lock className="w-4 h-4 text-[#8C765E]" />
                <span>Zero-Knowledge Writer Privacy Guarantee</span>
              </div>
              <p className="text-xs text-[#5C4F42] max-w-3xl leading-relaxed">
                Admins can inspect platform health and how much writing each user has created (word count and timestamp aggregates),
                but <strong>never</strong> their personal, private diaries or titles. Private thoughts remain completely confidential.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('users')}
              className="px-4 py-2 bg-[#2B2621] hover:bg-[#403932] text-white text-xs font-semibold rounded-xl shrink-0 transition-colors"
            >
              Browse Writers
            </button>
          </div>
        </div>
      )}

      {/* TAB 2: USER DIRECTORY & WRITING VOLUME */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E3DCCF] rounded-2xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-serif-display text-lg font-bold text-[#24201C]">
                  Writers Directory & Data Volume
                </h2>
                <p className="text-xs text-[#7A6D5F]">
                  View writer activity and data written. Private journal entries and titles are strictly shielded from view.
                </p>
              </div>

              {/* Filters & Sorting */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search name, @handle, email…"
                    className="pl-8 pr-3 py-1.5 text-xs bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-[#24201C] focus:outline-none focus:border-[#8C765E] w-52"
                  />
                </div>

                <select
                  value={userSortBy}
                  onChange={(e: any) => setUserSortBy(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-[#24201C] focus:outline-none"
                >
                  <option value="words">Sort: Most Words Written</option>
                  <option value="entries">Sort: Most Entries</option>
                  <option value="recent">Sort: Recently Active</option>
                  <option value="name">Sort: Name (A-Z)</option>
                </select>

                <select
                  value={userFilter}
                  onChange={(e: any) => setUserFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-[#24201C] focus:outline-none"
                >
                  <option value="all">Filter: All Users</option>
                  <option value="opted_in">Filter: Opted-In Only</option>
                  <option value="admins">Filter: Admins Only</option>
                </select>
              </div>
            </div>

            {/* Table of Users */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EAE4DC] text-[#8A7969] uppercase font-mono-type text-[10px] tracking-wider">
                    <th className="py-3 px-3">Writer</th>
                    <th className="py-3 px-3">Email & Opt-In</th>
                    <th className="py-3 px-3 text-right">Entries</th>
                    <th className="py-3 px-3 text-right">Words Written</th>
                    <th className="py-3 px-3 text-right">Data Stamped</th>
                    <th className="py-3 px-3 text-right">Avg WPM</th>
                    <th className="py-3 px-3">Last Active</th>
                    <th className="py-3 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F2EDE4]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-[#8A7969]">
                        No writers match your search query.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-[#FAF8F5] transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            {user.avatar ? (
                              <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover border border-[#D5CBBB]" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-[#E5DDD0] text-[#51463A] flex items-center justify-center font-bold text-[10px]">
                                {user.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-[#24201C]">{user.name}</span>
                                {user.isAdmin && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[8px] font-bold uppercase tracking-wider rounded bg-[#2B2621] text-[#FAF8F5]">
                                    <ShieldCheck className="w-2.5 h-2.5 text-[#E6C35C]" />
                                    {user.adminRank || 'ADMIN'}
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-[#8A7969] font-mono-type">@{user.username}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <div className="text-[11px] text-[#3D342C] font-mono-type">{user.email}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {user.emailOptIn ? (
                              <span className="text-[9px] text-[#3E6B35] bg-[#EAF5EC] px-1.5 py-0.2 rounded font-medium">✓ Opted-in</span>
                            ) : (
                              <span className="text-[9px] text-[#8C7A6B] bg-[#F2EDE4] px-1.5 py-0.2 rounded font-medium">Opt-out</span>
                            )}
                            {user.termsAccepted && (
                              <span className="text-[9px] text-[#594C3F] bg-[#FAF4EB] px-1.5 py-0.2 rounded font-medium">Terms OK</span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <span className="font-bold text-[#24201C]">{user.totalEntries}</span>
                          <span className="text-[10px] text-[#8A7969] block">
                            {user.publicCount} pub / {user.privateCount} priv
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right font-mono-type font-semibold text-[#24201C]">
                          {user.totalWords.toLocaleString()}
                        </td>

                        <td className="py-3 px-3 text-right font-mono-type text-[11px] text-[#6B5E52]">
                          {(user.totalCharacters / 1024).toFixed(1)} KB
                        </td>

                        <td className="py-3 px-3 text-right font-mono-type text-[11px] text-[#6B5E52]">
                          {user.avgWpm > 0 ? `${user.avgWpm} WPM` : '—'}
                        </td>

                        <td className="py-3 px-3 text-[11px] text-[#7A6D5F]">
                          {user.online ? (
                            <span className="inline-flex items-center gap-1 text-[#3E6B35] font-semibold">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#3E6B35]" /> Online
                            </span>
                          ) : (
                            new Date(user.lastSeenAt || user.createdAt).toLocaleDateString()
                          )}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => openEmailToUser(user.email)}
                            title="Compose email to this writer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#4A3E33] bg-[#F2EDE4] hover:bg-[#E8E1D5] border border-[#DDD6CB] rounded-lg transition-colors"
                          >
                            <Mail className="w-3 h-3" /> Email
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: BROADCAST EMAIL COMPOSER */}
      {activeTab === 'email' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 bg-white border border-[#E3DCCF] rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-[#EAE4DC] pb-4">
              <h2 className="font-serif-display text-lg font-bold text-[#24201C] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#8C765E]" />
                <span>Send Platform Update from Typing Diary</span>
              </h2>
              <p className="text-xs text-[#736558] mt-1">
                Dispatches an announcement email to users using the official Typing Diary email address configured in your backend environment.
              </p>
            </div>

            <div className="p-3 bg-[#FAF6F0] rounded-xl border border-[#EBE3D7] text-xs text-[#6B5E52] flex items-center justify-between">
              <div>
                <span className="font-semibold text-[#24201C] block">From Sender:</span>
                <span className="font-mono-type text-[11px]">{overview?.emailService.senderEmail || 'Default Typing Diary Address'}</span>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${overview?.emailService.configured ? 'bg-[#EAF5EC] text-[#2F6136]' : 'bg-[#FAF0E1] text-[#A66E2E]'}`}>
                {overview?.emailService.configured ? 'Live Provider' : 'Dev Sandbox'}
              </span>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-4">
              {/* Target Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#4A3E33] mb-1.5">
                  Recipient Audience
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer ${emailTarget === 'opted_in' ? 'border-[#8C765E] bg-[#FAF6F0] font-semibold text-[#2B2621]' : 'border-[#DDD5C7] bg-[#FCFBF9] text-[#6B5E52]'}`}>
                    <input
                      type="radio"
                      name="emailTarget"
                      value="opted_in"
                      checked={emailTarget === 'opted_in'}
                      onChange={() => setEmailTarget('opted_in')}
                      className="accent-[#2B2621]"
                    />
                    <span>Opted-In Writers ({adminUsers.filter((u) => u.emailOptIn).length})</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer ${emailTarget === 'all' ? 'border-[#8C765E] bg-[#FAF6F0] font-semibold text-[#2B2621]' : 'border-[#DDD5C7] bg-[#FCFBF9] text-[#6B5E52]'}`}>
                    <input
                      type="radio"
                      name="emailTarget"
                      value="all"
                      checked={emailTarget === 'all'}
                      onChange={() => setEmailTarget('all')}
                      className="accent-[#2B2621]"
                    />
                    <span>All Registered Writers ({adminUsers.length})</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer ${emailTarget === 'test_admin' ? 'border-[#8C765E] bg-[#FAF6F0] font-semibold text-[#2B2621]' : 'border-[#DDD5C7] bg-[#FCFBF9] text-[#6B5E52]'}`}>
                    <input
                      type="radio"
                      name="emailTarget"
                      value="test_admin"
                      checked={emailTarget === 'test_admin'}
                      onChange={() => setEmailTarget('test_admin')}
                      className="accent-[#2B2621]"
                    />
                    <span>Send Test to Myself ({currentUser.email || 'Admin'})</span>
                  </label>

                  <label className={`flex items-center gap-2 p-3 rounded-xl border text-xs cursor-pointer ${emailTarget === 'specific' ? 'border-[#8C765E] bg-[#FAF6F0] font-semibold text-[#2B2621]' : 'border-[#DDD5C7] bg-[#FCFBF9] text-[#6B5E52]'}`}>
                    <input
                      type="radio"
                      name="emailTarget"
                      value="specific"
                      checked={emailTarget === 'specific'}
                      onChange={() => setEmailTarget('specific')}
                      className="accent-[#2B2621]"
                    />
                    <span>Specific Writer Address</span>
                  </label>
                </div>
              </div>

              {emailTarget === 'specific' && (
                <div>
                  <label className="block text-xs font-semibold text-[#4A3E33] mb-1">
                    Specific Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={specificEmail}
                    onChange={(e) => setSpecificEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-xs text-[#24201C] focus:outline-none focus:border-[#8C765E]"
                  />
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-[#4A3E33] mb-1">
                  Email Subject
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Typing Diary Update: New Paper Styles & Enhanced Focus"
                  className="w-full px-3 py-2 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-xs text-[#24201C] focus:outline-none focus:border-[#8C765E]"
                />
              </div>

              {/* Message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-[#4A3E33]">
                    Announcement Message (Paragraphs preserved)
                  </label>
                  <button
                    type="button"
                    onClick={() => setPreviewEmail((p) => !p)}
                    className="text-[11px] text-[#8C765E] hover:underline"
                  >
                    {previewEmail ? 'Hide Preview' : 'Show Stationery Preview'}
                  </button>
                </div>
                <textarea
                  required
                  rows={8}
                  value={emailMessage}
                  onChange={(e) => setEmailMessage(e.target.value)}
                  placeholder="Dear Writers,&#10;&#10;We are delighted to share our latest improvements with you...&#10;&#10;Happy writing,&#10;Typing Diary Team"
                  className="w-full p-3 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-xs text-[#24201C] focus:outline-none focus:border-[#8C765E] font-serif leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-[#8A7969]">
                  Dispatched via blind individual delivery (recipients cannot see each other's addresses).
                </p>
                <button
                  type="submit"
                  disabled={isSendingEmail}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#2B2621] hover:bg-[#403932] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  {isSendingEmail ? 'Dispatching...' : 'Send Broadcast Email'}
                </button>
              </div>
            </form>
          </div>

          {/* Stationery Preview Column */}
          <div className="lg:col-span-5 bg-[#FCFBF9] border border-[#E3DCCF] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif-display text-sm font-bold text-[#24201C]">
              Stationery Email Preview
            </h3>
            <p className="text-[11px] text-[#7A6D5F]">
              This is how your email will appear inside the recipient's inbox.
            </p>

            <div className="bg-white border border-[#EAE4DC] rounded-xl p-6 shadow-sm space-y-4 font-serif text-xs text-[#3A322A]">
              <div className="text-center pb-3 border-b border-[#FAF4EB]">
                <div className="w-8 h-8 rounded-lg bg-[#2B2621] text-white flex items-center justify-center mx-auto mb-2 text-sm">
                  ✎
                </div>
                <h4 className="font-bold text-sm text-[#2B2621] font-serif-display">Typing Diary</h4>
                <p className="text-[10px] text-[#8A7969] uppercase tracking-wider font-mono-type">Platform Announcement</p>
              </div>

              <div>
                <h5 className="font-bold text-sm text-[#24201C] mb-2 font-serif-display">
                  {emailSubject || 'Your Email Subject Here'}
                </h5>
                <div className="space-y-2 leading-relaxed whitespace-pre-line text-[#4A3E33]">
                  {emailMessage || 'Your announcement message will be formatted neatly onto vintage stationery letterhead...'}
                </div>
              </div>

              <div className="bg-[#FAF6F0] p-3 rounded-lg border-l-2 border-[#8C765E] text-[11px] italic text-[#6E5F52]">
                — Stamped by {currentUser.name || 'Founder Admin'} at Typing Diary
              </div>

              <div className="pt-3 border-t border-[#EFEAE2] text-[10px] text-center text-[#9E9285]">
                You received this update because you are a registered writer on Typing Diary.<br/>
                Your personal journal entries remain private and encrypted.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PUBLIC POSTS MODERATION */}
      {activeTab === 'moderation' && (
        <div className="bg-white border border-[#E3DCCF] rounded-2xl p-6 shadow-xs space-y-5">
          <div>
            <h2 className="font-serif-display text-lg font-bold text-[#24201C]">
              Public Community Posts Moderation
            </h2>
            <p className="text-xs text-[#736558] mt-1">
              Review and moderate public entries shared on the Community Blog. Removing a post removes it from the platform.
            </p>
          </div>

          <div className="space-y-3">
            {publicEntries.length === 0 ? (
              <p className="text-xs text-[#8A7969] py-8 text-center">No public posts yet on the platform.</p>
            ) : (
              publicEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 rounded-xl border border-[#EAE4DC] bg-[#FAF8F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-[#24201C]">
                        {entry.isAnonymous ? 'Anonymous Writer' : entry.authorName}
                      </span>
                      {entry.authorIsAdmin && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 text-[8px] font-bold uppercase rounded bg-[#2B2621] text-white">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#E6C35C]" />
                          {entry.authorRank || 'ADMIN'}
                        </span>
                      )}
                      <span className="text-[11px] text-[#8A7969]">· {new Date(entry.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3 className="font-serif-display font-bold text-sm text-[#2B2621]">{entry.title || 'Untitled Post'}</h3>
                    <p className="text-xs text-[#6B5E52] line-clamp-2">{entry.content}</p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDeletePublicEntry(entry.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#8B3328] bg-[#FDEAE8] hover:bg-[#F8D2CD] border border-[#F2C4BE] rounded-xl transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Post
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: SYSTEM ANNOUNCEMENT BANNER */}
      {activeTab === 'announcement' && (
        <div className="bg-white border border-[#E3DCCF] rounded-2xl p-6 shadow-xs max-w-2xl space-y-5">
          <div>
            <h2 className="font-serif-display text-lg font-bold text-[#24201C] flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#8C765E]" />
              <span>Platform Announcement Banner</span>
            </h2>
            <p className="text-xs text-[#736558] mt-1">
              Displays a notification banner at the top of the application for all visiting writers.
            </p>
          </div>

          <form onSubmit={handleSaveAnnouncement} className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-semibold text-[#24201C] cursor-pointer">
              <input
                type="checkbox"
                checked={isAnnouncementActive}
                onChange={(e) => setIsAnnouncementActive(e.target.checked)}
                className="w-4 h-4 accent-[#2B2621] rounded"
              />
              <span>Activate Announcement Banner</span>
            </label>

            <div>
              <label className="block text-xs font-semibold text-[#4A3E33] mb-1">
                Banner Message
              </label>
              <textarea
                rows={3}
                value={announcementText}
                onChange={(e) => setAnnouncementText(e.target.value)}
                placeholder="e.g. Scheduled maintenance tonight at 10 PM UTC. Happy writing!"
                className="w-full p-3 bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl text-xs text-[#24201C] focus:outline-none focus:border-[#8C765E]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#4A3E33] mb-1">
                Banner Tone / Style
              </label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 text-xs text-[#4A3E33] cursor-pointer">
                  <input
                    type="radio"
                    name="bType"
                    value="info"
                    checked={announcementType === 'info'}
                    onChange={() => setAnnouncementType('info')}
                    className="accent-[#2B2621]"
                  />
                  <span>Informative (Parchment)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#4A3E33] cursor-pointer">
                  <input
                    type="radio"
                    name="bType"
                    value="warning"
                    checked={announcementType === 'warning'}
                    onChange={() => setAnnouncementType('warning')}
                    className="accent-[#2B2621]"
                  />
                  <span>Warning (Amber)</span>
                </label>
                <label className="flex items-center gap-1.5 text-xs text-[#4A3E33] cursor-pointer">
                  <input
                    type="radio"
                    name="bType"
                    value="success"
                    checked={announcementType === 'success'}
                    onChange={() => setAnnouncementType('success')}
                    className="accent-[#2B2621]"
                  />
                  <span>Success (Green)</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingAnnouncement}
              className="px-5 py-2.5 bg-[#2B2621] hover:bg-[#403932] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              {isSavingAnnouncement ? 'Saving…' : 'Save Banner Settings'}
            </button>
          </form>
        </div>
      )}

      {/* TAB 6: ADMIN ACCOUNTS (.ENV CONFIGURATION) */}
      {activeTab === 'env' && (
        <div className="bg-white border border-[#E3DCCF] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="font-serif-display text-lg font-bold text-[#24201C] flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-[#8C765E]" />
              <span>Admin Environment Configuration</span>
            </h2>
            <p className="text-xs text-[#736558] mt-1">
              Admin accounts can only be added by the Founder directly in the backend environment variables (<code className="bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code>).
              Admins log in directly using their configured credentials without requiring email OTP verification.
            </p>
          </div>

          <div className="bg-[#FCFBF9] border border-[#DDD5C7] rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-[#24201C] uppercase tracking-wider font-mono-type">
              Currently Configured Admins ({overview?.configuredAdmins.length || 0})
            </h3>
            <div className="divide-y divide-[#EAE4DC]">
              {overview?.configuredAdmins.map((admin, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[#2B2621] text-white flex items-center justify-center font-bold text-[10px]">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-[#24201C]">{admin.name}</span>
                      <span className="text-[11px] text-[#8A7969] block font-mono-type">{admin.email}</span>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-[#EFE9DF] text-[#6B5E52]">
                    {admin.rank}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold text-[#24201C]">
              How to add more Admin accounts in <code className="bg-[#EFE9DF] px-1 py-0.5 rounded">backend/.env</code>:
            </h3>
            <p className="text-xs text-[#6B5E52]">
              The founder can add as many admin accounts as desired using numbered suffixes <code className="bg-[#EFE9DF] px-1 py-0.5 rounded">_1</code>, <code className="bg-[#EFE9DF] px-1 py-0.5 rounded">_2</code>, <code className="bg-[#EFE9DF] px-1 py-0.5 rounded">_3</code>, etc.:
            </p>
            <pre className="bg-[#2B2621] text-[#F3EFEA] p-4 rounded-xl text-xs font-mono-type overflow-x-auto leading-relaxed">
{`# Admin #1 (Founder)
ADMIN_EMAIL_1=founder@typingdiary.com
ADMIN_PASSWORD_1=SuperSecurePassword123!
ADMIN_NAME_1=Founder Admin

# Admin #2 (Co-Admin / Moderator)
ADMIN_EMAIL_2=moderator@typingdiary.com
ADMIN_PASSWORD_2=AnotherSecurePassword456!
ADMIN_NAME_2=Head Moderator

# Admin #3 (Support Admin)
ADMIN_EMAIL_3=support@typingdiary.com
ADMIN_PASSWORD_3=ThirdAdminPass789!
ADMIN_NAME_3=Community Admin`}
            </pre>
            <p className="text-[11px] text-[#8A7969]">
              💡 After updating your <code className="bg-[#EFE9DF] px-1 py-0.5 rounded">.env</code>, restart your backend service. Any admin can immediately sign in using their email and password!
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
