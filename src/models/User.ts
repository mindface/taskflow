export type User = {
  id: number;
  firebase_uid: string;
  email: string;
  display_name: string;
  activated: boolean;
  roles?: string | null;
  ui_selection?: string | null;
  created_at: string;
  updated_at: string;
};
