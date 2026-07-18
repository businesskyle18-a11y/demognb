export default function Restricted({ moduleLabel }: { moduleLabel: string }) {
  return (
    <div className="max-w-lg mx-auto mt-16 text-center">
      <div className="text-4xl mb-3">🔒</div>
      <h1 className="text-lg font-semibold text-slate-800">Access restricted</h1>
      <p className="text-slate-500 mt-1 text-sm">
        Your current role does not have access to {moduleLabel}. Switch to a role with
        permission using the selector in the top-right corner.
      </p>
    </div>
  );
}
