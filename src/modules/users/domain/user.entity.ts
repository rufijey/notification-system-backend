export enum UserRole {
  USER = 'USER',
  GLOBAL_ADMIN = 'GLOBAL_ADMIN',
}

export class User {
  constructor(
    public readonly username: string,
    public readonly fullName: string,
    public readonly email: string,
    public readonly passwordHash: string,
    public readonly role: UserRole,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    public readonly avatarUrl?: string,
  ) {}
}
