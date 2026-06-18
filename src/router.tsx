import {
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import App from "./App";
import Home from "./pages/Home";
import Structsmake from "./pages/Structsmake";
import Tokenizer from "./pages/Tokenizer";
import MemoLinker from "./pages/MemoLinker";
import MemoMaker from "./pages/MemoMaker";
import WindowChecker from "./pages/WindowChecker";
import ConceptSearch from "./pages/ConceptSearch";
import Schedule from "./pages/Schedule";
import ViewAndroidMemo from "./pages/ViewAndroidMemo";
import LlmMemoPage from "./pages/LlmMemo";
import UserRegister from "./pages/UserRegister";
import { DataProvider } from "./store/dataBox";
import { NotesProvider } from "./store/note";

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <DataProvider>
      <Home />
    </DataProvider>
  ),
});

const structsmakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/structsmake",
  component: Structsmake,
});

const tokenizerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tokenizer",
  component: Tokenizer,
});

const memolinkerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/memolinker",
  component: () => (
    <NotesProvider>
      <MemoLinker />
    </NotesProvider>
  ),
});

const scheduleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/schedule",
  component: Schedule,
});

const memoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/memo",
  component: () => (
    <NotesProvider>
      <MemoMaker />
    </NotesProvider>
  ),
});

const windowcheckerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/windowchecker",
  component: WindowChecker,
});

const conceptsSearchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/conceptsSearch",
  component: ConceptSearch,
});

const viewAndroidMemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/viewAndroidMemo",
  component: ViewAndroidMemo,
});

const llmMemoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/llmMemo",
  component: LlmMemoPage,
});

const userRegisterRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/user-register",
  component: UserRegister,
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  structsmakeRoute,
  tokenizerRoute,
  memolinkerRoute,
  scheduleRoute,
  memoRoute,
  windowcheckerRoute,
  conceptsSearchRoute,
  viewAndroidMemoRoute,
  llmMemoRoute,
  userRegisterRoute,
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
