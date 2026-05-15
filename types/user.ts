export type Profile = {
  id: string;
  email?: string | null;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  role?: "user" | "admin";
  created_at?: string;
};
