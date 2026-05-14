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
}
