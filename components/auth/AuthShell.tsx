import Link from "next/link";
import { MessageSquareText } from "lucide-react";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2 text-lg font-bold text-slate-950">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-rescue-600 text-white">
            <MessageSquareText className="h-5 w-5" />
          </span>
          LeadRescue
        </Link>
        {children}
      </div>
    </main>
  );
}
