export default function LoadingSpinner({ message = 'Generating question…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-8 h-8 border-2 border-raised border-t-indigo-500 rounded-full animate-spin" />
      <p className="text-xs font-mono text-slate-500">{message}</p>
    </div>
  );
}
