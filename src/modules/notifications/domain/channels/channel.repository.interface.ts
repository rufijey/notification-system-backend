import { Channel, ChannelRole } from './channel.entity';

export interface ChannelWithLastNotification {
  id: string;
  title?: string;
  photoUrl?: string;
  role?: string;
  createdAt: Date;
  memberIds: string[];
  lastNotification?: {
    text: string;
    createdAt: Date;
    sequence: number;
    senderId: string;
    status: 'PENDING' | 'DELIVERED' | 'READ';
  };
  unreadCount: number;
  lastReadSequence: number;
  othersLastReadSequence: number;
}

export interface ChannelMemberDetails {
  userId: string;
  username: string;
  fullName: string | null;
  avatarUrl?: string;
  role: ChannelRole;
  lastReadSequence: number;
  joinedAt: Date;
}

export interface IChannelRepository {
  create(
    creatorId: string,
    memberIds: string[],
    title?: string,
    id?: string,
    photoUrl?: string,
  ): Promise<Channel>;
  findById(id: string): Promise<Channel | null>;
  findUserChannelIds(userId: string): Promise<string[]>;
  getChannelsByUserId(userId: string): Promise<ChannelWithLastNotification[]>;
  updateLastReadSequence(
    channelId: string,
    userId: string,
    sequence: number,
  ): Promise<void>;
  getUserLastReadSequence(channelId: string, userId: string): Promise<number>;
  getOtherMembersLastReadSequence(
    channelId: string,
    userId: string,
  ): Promise<number>;
  isMember(channelId: string, userId: string): Promise<boolean>;
  getMemberRole(channelId: string, userId: string): Promise<ChannelRole | null>;
  addMember(
    channelId: string,
    userId: string,
    role?: ChannelRole,
  ): Promise<void>;
  removeMember(channelId: string, userId: string): Promise<void>;
  getUnreadCount(channelId: string, userId: string): Promise<number>;
  searchChannels(
    query: string,
    limit: number,
    isId: boolean,
  ): Promise<Channel[]>;
  getMembers(channelId: string): Promise<ChannelMemberDetails[]>;
  updateDetails(channelId: string, title?: string, photoUrl?: string): Promise<Channel>;
  isBanned(channelId: string): Promise<boolean>;
}
