import type { ChangeEvent } from "react";

type SearchField = {
  key: string;
  label: string;
  placeholder?: string;
  value: string;
};

type Props = {
  fields: SearchField[];
  onFieldChange: (key: string, value: string) => void;
  onSearch?: () => void;
  className?: string;
};

export default function ListSearch({
  fields,
  onFieldChange,
  onSearch,
  className = "",
}: Props) {
  return (
    <div className={`search-panel space-y-3 ${className}`.trim()}>
      {fields.map((field) => (
        <div key={field.key} className="search-field pb-2">
          <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
          <input
            type="text"
            value={field.value}
            placeholder={field.placeholder ?? field.label}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
            onChange={(event: ChangeEvent<HTMLInputElement>) =>
              onFieldChange(field.key, event.target.value)
            }
          />
        </div>
      ))}
      {onSearch && (
        <div>
          <button type="button" className="btn" onClick={onSearch}>
            検索
          </button>
        </div>
      )}
    </div>
  );
}
