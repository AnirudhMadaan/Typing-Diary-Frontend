export type VisibilityType = 'private' | 'friends' | 'custom_friends' | 'public';

export type MoodType = 'reflective' | 'peaceful' | 'melancholy' | 'creative' | 'grateful' | 'wandering';

export interface TypingStats {
  wpm: number;
  totalKeystrokes: number;
  durationMinutes: number;
  words: number;
}

export interface DiaryPhoto {
  id: string;
  src: string;
  alt: string;
}

export interface DiaryWeather {
  date: string;
  location: string;
  weatherCode: number | null;
  temperatureMaxC: number | null;
  temperatureMinC: number | null;
  description: string;
}

export interface DiaryPrivacySettings {
  allowComments: boolean;
  allowReactions: boolean;
  showTypingStats: boolean;
  passcodeProtected?: boolean;
  passcodeHint?: string;
  passcode?: string;
}

export interface Comment {
  id: string;
  authorId: string | null;
  authorName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  text: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  title: string;
  content: string;
  authorId: string | null;
  authorName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  anonymousAlias?: string;
  visibility: VisibilityType;
  allowedFriendIds: string[]; // for custom_friends granular selection
  excludedFriendIds?: string[];
  mood: MoodType;
  tags: string[];
  location?: string;
  photos?: DiaryPhoto[];
  weather?: DiaryWeather | null;
  createdAt: string;
  updatedAt: string;
  typingStats: TypingStats;
  privacySettings: DiaryPrivacySettings;
  reactions: {
    resonance: number;
    hug: number;
    bookmark: number;
    inspire: number;
  };
  userReactions: string[]; // reaction types current user clicked
  comments: Comment[];
  isPinned?: boolean;
}

export interface UserFriendSettings {
  canViewFriendOnlyPosts: boolean;
  notificationsEnabled: boolean;
  nickname?: string;
}

export type SoundProfileType = 'mechanical' | 'typewriter' | 'soft_click' | 'bubble' | 'retro_game' | 'rain_tap' | 'wood_block' | 'mute';

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  bio: string;
  email?: string;
  authProvider?: 'google' | 'custom';
  joinedDate: string;
  defaultPrivacy: VisibilityType;
  friendIds: string[];
  friendRequestsSent: string[];
  friendRequestsReceived: string[];
  // Granular settings per friend
  perFriendSettings: Record<string, UserFriendSettings>;
  settings: {
    soundEnabled: boolean;
    soundType: SoundProfileType;
    paperTheme: 'parchment' | 'sepia' | 'midnight' | 'minimal';
    defaultAnonymous: boolean;
    allowFriendRequests: boolean;
    showStatsByDefault: boolean;
    page?: {
      font: string;
      pageStyle: string;
      fontSize: number;
      lineHeight: number;
      editorWidth: number;
      align: string;
      textColor: string;
    } | null;
    global?: {
      palette: string;
      accent: string;
      texture: boolean;
      icon: string;
      compact: boolean;
      mode?: 'light' | 'dark';
    } | null;
  };
  online?: boolean;
}
