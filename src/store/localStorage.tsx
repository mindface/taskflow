import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

const STORAGE_PREFIX = "taskflow:";

type LocalStorageState = Record<string, unknown>;

type LocalStorageContextValue = {
  values: LocalStorageState;
  getAll: () => LocalStorageState;
  refresh: () => LocalStorageState;
  save: <T>(key: string, value: T) => void;
  update: <T>(key: string, updater: (current: T | undefined) => T) => void;
  remove: (key: string) => void;
};

const LocalStorageContext = createContext<LocalStorageContextValue | undefined>(
  undefined,
);

function storageKey(key: string): string {
  if (!key.trim()) {
    throw new Error("LocalStorage key must not be empty");
  }
  return `${STORAGE_PREFIX}${key}`;
}

function readValues(): LocalStorageState {
  const values: LocalStorageState = {};
  for (let index = 0; index < localStorage.length; index += 1) {
    const fullKey = localStorage.key(index);
    if (fullKey?.startsWith(STORAGE_PREFIX)) {
      const key = fullKey.slice(STORAGE_PREFIX.length);
      const value = localStorage.getItem(fullKey);
      if (value !== null) {
        values[key] = JSON.parse(value);
      }
    }
  }
  return values;
}

function serialize(value: unknown): string {
  const serialized = JSON.stringify(value);
  if (serialized === undefined) {
    throw new Error("LocalStorage value must be JSON-serializable");
  }
  return serialized;
}

export function LocalStorageProvider({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<LocalStorageState>(readValues);

  function getAll() {
    return readValues();
  }

  function refresh() {
    const storedValues = getAll();
    setValues(storedValues);
    return storedValues;
  }

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.storageArea !== localStorage) {
        return;
      }

      if (event.key === null) {
        setValues({});
        return;
      }
      if (!event.key.startsWith(STORAGE_PREFIX)) {
        return;
      }

      const key = event.key.slice(STORAGE_PREFIX.length);
      if (event.newValue === null) {
        setValues((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
      } else {
        const value: unknown = JSON.parse(event.newValue);
        setValues((current) => ({
          ...current,
          [key]: value,
        }));
      }
    }

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  function save<T>(key: string, value: T) {
    const fullKey = storageKey(key);
    localStorage.setItem(fullKey, serialize(value));
    setValues((current) => ({ ...current, [key]: value }));
  }

  function update<T>(key: string, updater: (current: T | undefined) => T) {
    const fullKey = storageKey(key);
    const storedValue = localStorage.getItem(fullKey);
    const current =
      storedValue === null ? undefined : (JSON.parse(storedValue) as T);
    save(key, updater(current));
  }

  function remove(key: string) {
    const fullKey = storageKey(key);
    localStorage.removeItem(fullKey);
    setValues((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  }

  return (
    <LocalStorageContext.Provider
      value={{ values, getAll, refresh, save, update, remove }}
    >
      {children}
    </LocalStorageContext.Provider>
  );
}

export function useLocalStorageStore() {
  const context = useContext(LocalStorageContext);
  if (!context) {
    throw new Error(
      "useLocalStorageStore must be used within LocalStorageProvider",
    );
  }
  return context;
}
