import { AuthShell } from "./components/auth-shell";

export default function AuthLoading() {
  return (
    <div className="animate-in fade-in duration-200 w-full flex items-center justify-center min-h-[360px]">
      <AuthShell
        eyebrow="Loading"
        title="Please Wait..."
        description="Connecting to secure authentication service."
      >
        <div className="flex flex-col items-center justify-center py-10 space-y-4">
          <div className="w-10 h-10 border-4 border-black/20 border-t-[#E5A00D] rounded-full animate-spin" />
          <p className="font-outfit text-xs font-bold uppercase tracking-wider text-black/70 animate-pulse">
            Loading page...
          </p>
        </div>
      </AuthShell>
    </div>
  );
}
