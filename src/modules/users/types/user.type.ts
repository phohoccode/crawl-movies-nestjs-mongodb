export type Role = 'member' | 'admin';
export type Gender = 'male' | 'female' | 'other';
export type Status = 'active' | 'banned' | 'pending';
export type TypeAccount = 'credentials' | 'google';
export interface IUser {
  user_id: string;
  email: string;
  username: string;
  avatar: string;
  password?: string;
  type_account?: TypeAccount;
  role?: Role;
  status?: Status;
}
