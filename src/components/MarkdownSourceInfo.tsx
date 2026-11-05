type MarkdownSourceInfoProps = {
  sourcePath: string;
  location: string;
};

export default function MarkdownSourceInfo({
  sourcePath,
  location,
}: MarkdownSourceInfoProps) {
  return (
    <p className="mb-2 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600">
      <span className="font-semibold">Markdownソース:</span>{" "}
      <code className="break-all">{sourcePath}</code>
      <span className="mx-2 text-gray-400">|</span>
      <span className="font-semibold">表示場所:</span> {location}
    </p>
  );
}
