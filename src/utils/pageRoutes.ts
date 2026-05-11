export const pageRoutes = [
  { viewtype: "home", path: "/" },
  { viewtype: "structsmake", path: "/structsmake" },
  { viewtype: "tokenizer", path: "/tokenizer" },
  { viewtype: "memolinker", path: "/memolinker" },
  { viewtype: "schedule", path: "/schedule" },
  { viewtype: "memo", path: "/memo" },
  { viewtype: "windowchecker", path: "/windowchecker" },
  { viewtype: "conceptsSearch", path: "/conceptsSearch" },
  { viewtype: "viewAndroidMemo", path: "/viewAndroidMemo" },
  { viewtype: "llmMemo", path: "/llmMemo" },
] as const;

export type AppViewType = (typeof pageRoutes)[number]["viewtype"];
export type AppRoutePath = (typeof pageRoutes)[number]["path"];

export function viewTypeToPath(viewtype: string): AppRoutePath {
  return pageRoutes.find((route) => route.viewtype === viewtype)?.path ?? "/";
}

export function pathToViewType(path: string): AppViewType {
  return pageRoutes.find((route) => route.path === path)?.viewtype ?? "home";
}
