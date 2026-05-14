export enum ChannelRole {
  ADMIN = 'ADMIN',
  PUBLISHER = 'PUBLISHER',
  SUBSCRIBER = 'SUBSCRIBER',
}

export interface ChannelMemberEntity {
  userId: string;
  role: ChannelRole;
}

export class Channel {
  constructor(
    public readonly id: string,
    public readonly createdAt: Date,
    public readonly members: ChannelMemberEntity[] = [],
    public readonly title?: string,
    public readonly photoUrl?: string,
  ) {}

  static canMemberPost(role: ChannelRole | null, isReply: boolean): boolean {
    if (!role) return false;
    
    if (role === ChannelRole.ADMIN || role === ChannelRole.PUBLISHER) {
      return true;
    }
    
    if (role === ChannelRole.SUBSCRIBER && isReply) {
      return true;
    }
    
    return false;
  }

  static canMemberDelete(role: ChannelRole | null): boolean {
    return role === ChannelRole.ADMIN;
  }
}
