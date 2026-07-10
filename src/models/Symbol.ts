
type SymbolStruct = {
  id: number;
  title: string;
  detail: string;
  tag: string;
  user: string;
  created_at: string;
  updated_at: string;
}

export type Symbol = {
  id: number;
  _id?: string;
  title: string;
  content: string;
  structs: SymbolStruct[];
  created_at: string;
  updated_at: string;
};

export type AndroidSymbol = {
  id: string;
  _id?: string;
  user_id?: string;
  title?: string;
  content?: string;
  created_at?: string;
  updated_at?: string;
  symbol_type?: string;
  extension?: string;
  language?: string;
}
