export default function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <div className="card p-8 text-center">
        <h1 className="mb-4 text-3xl font-bold text-slate-800">{title}</h1>
        <p className="text-slate-600">{description}</p>
        <p className="mt-4 text-sm text-slate-400">Coming in a later milestone.</p>
      </div>
    </div>
  );
}
