export interface IUser {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  companyName?: string;
  currency?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}
