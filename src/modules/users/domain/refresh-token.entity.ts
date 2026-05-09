export class RefreshToken {
  constructor(
    public readonly id: string,
    public readonly hashedToken: string,
    public readonly userId: string,
    public readonly expiresAt: Date,
    public readonly userAgent: string | null,
    public readonly ip: string | null,
    public readonly createdAt: Date,
  ) {}
}
