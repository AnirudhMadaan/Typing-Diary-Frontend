import React, { useState } from 'react';
import { useDiary } from '../context/DiaryContext';
import { DiaryEntry, User } from '../types/diary';
import { 
  Users, 
  UserPlus, 
  UserCheck, 
  Shield, 
  Lock, 
  Eye, 
  EyeOff, 
  Check, 
  X, 
  Search, 
  BookOpen, 
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface FriendsAndPrivacyProps {
  onSelectEntry: (entry: DiaryEntry) => void;
  onOpenTypewriter: () => void;
}

const UserAvatar: React.FC<{ user: User; className: string }> = ({ user, className }) => (
  user.avatar
    ? <img src={user.avatar} alt={user.displayName} referrerPolicy="no-referrer" className={className} />
    : <span className={`${className} bg-[#DED3C3] text-[#51463A] flex items-center justify-center font-semibold`}>
        {user.displayName.trim().slice(0, 1).toUpperCase() || 'W'}
      </span>
);

export const FriendsAndPrivacy: React.FC<FriendsAndPrivacyProps> = ({ onSelectEntry, onOpenTypewriter }) => {
  const { 
    currentUser, 
    users, 
    entries, 
    canUserViewEntry, 
    sendFriendRequest, 
    acceptFriendRequest, 
    declineFriendRequest, 
    removeFriend,
    toggleFriendDiaryAccess
  } = useDiary();

  const [activeTab, setActiveTab] = useState<'my-friends' | 'requests' | 'explore' | 'privacy-matrix'>('my-friends');
  const [selectedFriendForPreview, setSelectedFriendForPreview] = useState<User | null>(null);
  const [searchWriterQuery, setSearchWriterQuery] = useState('');

  // Current user's friends
  const myFriends = users.filter((u) => currentUser.friendIds.includes(u.id));

  // Pending incoming requests
  const incomingRequests = users.filter((u) => currentUser.friendRequestsReceived.includes(u.id));

  // Pending outgoing requests
  const outgoingRequests = users.filter((u) => currentUser.friendRequestsSent.includes(u.id));

  // Other community members not yet friends
  const otherWriters = users.filter(
    (u) => u.id !== currentUser.id && !currentUser.friendIds.includes(u.id)
  );

  // Filtered other writers
  const filteredOtherWriters = otherWriters.filter((u) => {
    if (!searchWriterQuery.trim()) return true;
    const q = searchWriterQuery.toLowerCase();
    return u.displayName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q) || u.bio.toLowerCase().includes(q);
  });

  // Entries shared by selected friend that the current user is permitted to see
  const entriesBySelectedFriend = selectedFriendForPreview
    ? entries.filter((e) => e.authorId === selectedFriendForPreview.id && canUserViewEntry(e, currentUser.id))
    : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
      {/* Header */}
      <div className="border-b border-[#EAE4DC] pb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono-type uppercase tracking-wider text-[#8A7969]">
              <Users className="w-3.5 h-3.5" />
              <span>Circle Governance & Privacy Hub</span>
            </div>
            <h1 className="font-serif-display text-2xl sm:text-3xl font-bold text-[#24201C] mt-1">
              Friends & Granular Sharing Settings
            </h1>
            <p className="text-xs text-[#736558] mt-0.5 max-w-2xl">
              Control exactly who can read your diary entries. Grant or revoke friend-level diary access 
              per individual, manage circles, and verify viewing permissions.
            </p>
          </div>

        </div>

        {/* Tab selection */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('my-friends')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'my-friends'
                ? 'bg-[#2B2621] text-[#FAF8F5]'
                : 'bg-[#EFE9DF] text-[#63574B] hover:text-[#24201C]'
            }`}
          >
            My Friends ({myFriends.length})
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'bg-[#2B2621] text-[#FAF8F5]'
                : 'bg-[#EFE9DF] text-[#63574B] hover:text-[#24201C]'
            }`}
          >
            Friend Requests
            {incomingRequests.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#B3402C] text-white text-[10px] flex items-center justify-center font-mono-type">
                {incomingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('privacy-matrix')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'privacy-matrix'
                ? 'bg-[#2B2621] text-[#FAF8F5]'
                : 'bg-[#EFE9DF] text-[#63574B] hover:text-[#24201C]'
            }`}
          >
            Granular Sharing Matrix
          </button>

          <button
            onClick={() => setActiveTab('explore')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
              activeTab === 'explore'
                ? 'bg-[#2B2621] text-[#FAF8F5]'
                : 'bg-[#EFE9DF] text-[#63574B] hover:text-[#24201C]'
            }`}
          >
            Find Writers ({otherWriters.length})
          </button>
        </div>
      </div>

      {/* TAB 1: My Friends */}
      {activeTab === 'my-friends' && (
        <div className="space-y-6">
          {myFriends.length === 0 ? (
            <div className="text-center py-16 px-4 bg-[#FCFBF9] rounded-2xl border border-dashed border-[#DDD6CB] max-w-lg mx-auto space-y-3">
              <Users className="w-8 h-8 text-[#8C7D6F] mx-auto" />
              <h3 className="font-serif-display text-lg font-semibold text-[#24201C]">No friends connected yet</h3>
              <p className="text-xs text-[#736558] max-w-sm mx-auto">
                Connect with other diary writers to share intimate entries, exchange comments, and enjoy quiet mutual readings.
              </p>
              <button
                onClick={() => setActiveTab('explore')}
                className="px-4 py-2 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] rounded-lg hover:bg-[#403932] transition-colors"
              >
                Browse Community Writers
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {myFriends.map((friend) => {
                const friendRule = currentUser.perFriendSettings?.[friend.id] ?? { canViewFriendOnlyPosts: true };
                const canView = friendRule.canViewFriendOnlyPosts !== false;

                // Count entries this account is allowed to read from the selected friend.
                const sharedCount = entries.filter((e) => e.authorId === friend.id && canUserViewEntry(e, currentUser.id)).length;

                return (
                  <div
                    key={friend.id}
                    className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-5"
                  >
                    <div>
                      {/* Friend Header */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <UserAvatar user={friend} className="w-12 h-12 rounded-full object-cover border border-[#D5CBBB] text-lg" />
                            {friend.online && <span className="absolute right-0 bottom-0 w-3 h-3 rounded-full bg-[#6B8D57] border-2 border-[#FCFBF9]" title="Online now" />}
                          </div>
                          <div>
                            <h3 className="font-serif-display text-base font-bold text-[#24201C]">
                              {friend.displayName}
                            </h3>
                            <p className="text-xs text-[#8A7969] font-mono-type">@{friend.username}</p>
                            <p className="text-[11px] text-[#A39587] mt-0.5">{friend.online ? 'Online now' : `Joined ${new Date(friend.joinedDate).toLocaleDateString()}`}</p>
                          </div>
                        </div>

                      </div>

                      <p className="text-xs text-[#52463B] mt-3 leading-relaxed">
                        {friend.bio}
                      </p>

                      {/* Granular Privacy Toggle Box (The user's key feature!) */}
                      <div className="mt-4 p-3 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#24201C]">
                            {canView ? (
                              <Eye className="w-3.5 h-3.5 text-[#5B794A]" />
                            ) : (
                              <EyeOff className="w-3.5 h-3.5 text-[#A14436]" />
                            )}
                            <span>Friend-Only Diary Access</span>
                          </div>

                          {/* Interactive Toggle Switch */}
                          <button
                            type="button"
                            onClick={() => { void toggleFriendDiaryAccess(friend.id, !canView).catch(() => undefined); }}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              canView ? 'bg-[#3E342B]' : 'bg-[#D1C9BE]'
                            }`}
                            aria-label={`Toggle diary visibility for ${friend.displayName}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                canView ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>

                        <p className="text-[11px] text-[#736558] leading-normal">
                          {canView ? (
                            <span>
                              <strong className="text-[#3E5232]">Allowed:</strong> {friend.displayName} can see entries you publish with <em>Friends Only</em> visibility.
                            </span>
                          ) : (
                            <span>
                              <strong className="text-[#8C3A2F]">Revoked:</strong> {friend.displayName} is blocked from viewing your friends-only entries.
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center justify-between pt-3 border-t border-[#EFE9DF] text-xs">
                      <button
                        onClick={() => setSelectedFriendForPreview(friend)}
                        className="flex items-center gap-1.5 text-[#3D3328] hover:text-[#1F1B17] font-semibold transition-colors"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-[#8A7969]" />
                        <span>View Shared Diary ({sharedCount})</span>
                      </button>

                      <button
                        onClick={() => { void removeFriend(friend.id).catch(() => undefined); }}
                        className="text-[#96473D] hover:text-[#7A362D] text-[11px] transition-colors"
                      >
                        Remove Friend
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Modal / Panel for viewing Friend's shared diaries */}
          {selectedFriendForPreview && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-[#FAF8F5] border border-[#E3DCcf] rounded-2xl max-w-2xl w-full p-6 shadow-xl max-h-[85vh] overflow-y-auto space-y-5 animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between pb-4 border-b border-[#EAE4DC]">
                  <div className="flex items-center gap-3">
                    <UserAvatar user={selectedFriendForPreview} className="w-10 h-10 rounded-full object-cover" />
                    <div>
                      <h3 className="font-serif-display text-lg font-bold text-[#24201C]">
                        {selectedFriendForPreview.displayName}’s Shared Diary
                      </h3>
                      <p className="text-xs text-[#7A6C5E]">
                        Entries shared with you based on current mutual friendship and privacy toggles.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedFriendForPreview(null)}
                    className="p-1 text-[#8A7A6D] hover:text-[#24201C] rounded-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {entriesBySelectedFriend.length === 0 ? (
                  <div className="text-center py-10 text-xs text-[#7A6C5E] space-y-1">
                    <p className="font-semibold text-[#24201C]">No visible entries currently</p>
                    <p>This friend either hasn't posted or has restricted their posts to custom groups.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {entriesBySelectedFriend.map((entry) => (
                      <div
                        key={entry.id}
                        onClick={() => {
                          setSelectedFriendForPreview(null);
                          onSelectEntry(entry);
                        }}
                        className="p-4 bg-[#FCFBF9] border border-[#E2DBD0] rounded-xl hover:border-[#C7BEAF] cursor-pointer transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between text-[11px] text-[#8A7969]">
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                          <span className="capitalize">{entry.visibility.replace('_', ' ')}</span>
                        </div>
                        <h4 className="font-serif-display text-base font-bold text-[#24201C]">
                          {entry.title}
                        </h4>
                        <p className="text-xs text-[#54473C] line-clamp-2 leading-relaxed">
                          {entry.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Friend Requests */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs space-y-4">
            <h3 className="font-serif-display text-lg font-bold text-[#24201C]">
              Incoming Friend Requests ({incomingRequests.length})
            </h3>
            <p className="text-xs text-[#736558]">
              When you accept a friend request, both authors are placed into mutual friend circles. 
              You can fine-tune what they see using the granular toggle at any time.
            </p>

            {incomingRequests.length === 0 ? (
              <p className="text-xs text-[#8A7969] italic py-4">No pending friend requests.</p>
            ) : (
              <div className="space-y-3 pt-2">
                {incomingRequests.map((requestingUser) => (
                  <div
                    key={requestingUser.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-[#FAF8F5] border border-[#DDD5C7] rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <UserAvatar user={requestingUser} className="w-10 h-10 rounded-full object-cover" />
                      <div>
                        <p className="text-xs font-bold text-[#24201C]">{requestingUser.displayName}</p>
                        <p className="text-[11px] text-[#8A7969] font-mono-type">@{requestingUser.username}</p>
                        <p className="text-[11px] text-[#5C4F42] mt-0.5 line-clamp-1">{requestingUser.bio}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => { void acceptFriendRequest(requestingUser.id).catch(() => undefined); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Friend</span>
                      </button>

                      <button
                        onClick={() => { void declineFriendRequest(requestingUser.id).catch(() => undefined); }}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#736558] hover:text-[#963A2E] hover:bg-[#EFE9DF] rounded-lg transition-colors whitespace-nowrap"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {outgoingRequests.length > 0 && (
            <div className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs space-y-3">
              <h3 className="font-serif-display text-base font-bold text-[#24201C]">
                Outgoing Friend Requests Sent ({outgoingRequests.length})
              </h3>
              <div className="space-y-2">
                {outgoingRequests.map((targetUser) => (
                  <div key={targetUser.id} className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl text-xs">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar user={targetUser} className="w-7 h-7 rounded-full object-cover text-[10px]" />
                      <span className="font-medium text-[#24201C]">{targetUser.displayName}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#8C7A68]">Pending approval...</span>
                      <button onClick={() => { void declineFriendRequest(targetUser.id).catch(() => undefined); }} className="text-[11px] text-[#8D463C] hover:underline">Cancel</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Granular Sharing Matrix */}
      {activeTab === 'privacy-matrix' && (
        <div className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs space-y-6">
          <div>
            <h3 className="font-serif-display text-lg font-bold text-[#24201C]">
              Granular Sharing & Access Matrix
            </h3>
            <p className="text-xs text-[#736558] mt-0.5">
              Review who currently has permission to read each level of your typing journal entries.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#EAE4DC] text-[#8A7969] font-mono-type uppercase text-[11px]">
                  <th className="py-3 px-3">Friend / Circle</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Public Entries</th>
                  <th className="py-3 px-3">Anonymous Posts</th>
                  <th className="py-3 px-3">Friends-Only Posts</th>
                  <th className="py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DF]">
                {/* Everyone row */}
                <tr className="hover:bg-[#FAF8F5]">
                  <td className="py-3 px-3 font-semibold text-[#24201C]">Global Visitors / Public</td>
                  <td className="py-3 px-3 text-[#7A6C5E]">Anonymous / Public</td>
                  <td className="py-3 px-3 text-[#4A6B3D] font-medium">Visible</td>
                  <td className="py-3 px-3 text-[#4A6B3D] font-medium">Visible (Anonymous)</td>
                  <td className="py-3 px-3 text-[#A14436] font-medium">Hidden 🔒</td>
                  <td className="py-3 px-3 text-[#8A7969]">—</td>
                </tr>

                {/* Per friend rows */}
                {myFriends.map((f) => {
                  const rule = currentUser.perFriendSettings?.[f.id] ?? { canViewFriendOnlyPosts: true };
                  const canView = rule.canViewFriendOnlyPosts !== false;

                  return (
                    <tr key={f.id} className="hover:bg-[#FAF8F5]">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <UserAvatar user={f} className="w-6 h-6 rounded-full object-cover text-[9px]" />
                          <span className="font-semibold text-[#24201C]">{f.displayName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-[#6E5F52]">Confirmed Friend</td>
                      <td className="py-3 px-3 text-[#4A6B3D]">Visible</td>
                      <td className="py-3 px-3 text-[#4A6B3D]">Visible</td>
                      <td className="py-3 px-3">
                        {canView ? (
                          <span className="text-[#4A6B3D] font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5" /> Allowed
                          </span>
                        ) : (
                          <span className="text-[#A14436] font-medium flex items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Blocked
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => { void toggleFriendDiaryAccess(f.id, !canView).catch(() => undefined); }}
                          className="px-2.5 py-1 text-[11px] rounded border border-[#DDD5C7] hover:bg-[#EFE9DF] text-[#473D33]"
                        >
                          {canView ? 'Revoke Access' : 'Grant Access'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Explore & Add Writers */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="font-serif-display text-lg font-bold text-[#24201C]">
                Explore Community Writers
              </h3>
              <p className="text-xs text-[#736558] mt-0.5">
                Send a friend request to swap diaries and read mutual friends-only entries.
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-4 h-4 text-[#8C7D6F] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchWriterQuery}
                onChange={(e) => setSearchWriterQuery(e.target.value)}
                placeholder="Search by name or bio..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#FCFBF9] border border-[#DDD6CB] rounded-lg text-[#24201C] focus:outline-none focus:border-[#8C765E]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredOtherWriters.map((writer) => {
              const isPending = currentUser.friendRequestsSent.includes(writer.id);
              const hasSentToMe = currentUser.friendRequestsReceived.includes(writer.id);

              return (
                <div
                  key={writer.id}
                  className="bg-[#FCFBF9] border border-[#E3DCcf] rounded-2xl p-6 shadow-xs flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UserAvatar user={writer} className="w-12 h-12 rounded-full object-cover border border-[#D5CBBB] text-lg" />
                      <div>
                        <h4 className="font-serif-display text-base font-bold text-[#24201C]">
                          {writer.displayName}
                        </h4>
                        <p className="text-xs text-[#8A7969] font-mono-type">@{writer.username}</p>
                      </div>
                    </div>

                  </div>

                  <p className="text-xs text-[#52463B] leading-relaxed">
                    {writer.bio}
                  </p>

                  <div className="pt-3 border-t border-[#EFE9DF] flex items-center justify-between">
                    <span className="text-[11px] text-[#8C7A68]">
                      Default: <strong className="capitalize">{writer.defaultPrivacy}</strong>
                    </span>

                    {hasSentToMe ? (
                      <button
                        onClick={() => { void acceptFriendRequest(writer.id).catch(() => undefined); }}
                        className="px-3 py-1.5 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] rounded-lg hover:bg-[#403932]"
                      >
                        Accept Pending Request
                      </button>
                    ) : isPending ? (
                      <span className="text-xs text-[#8A7969] font-medium">Request Sent</span>
                    ) : (
                      <button
                        onClick={() => { void sendFriendRequest(writer.id).catch(() => undefined); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FAF8F5] bg-[#2B2621] hover:bg-[#403932] rounded-lg transition-colors"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Send Friend Request</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
