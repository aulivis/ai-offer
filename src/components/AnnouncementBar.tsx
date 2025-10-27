import Link from 'next/link';
import { t } from '@/copy';

export default function AnnouncementBar() {
  return (
    <div className="w-full bg-[#111827] text-[#F8FAFC]">
      <div className="mx-auto flex h-11 max-w-6xl items-center justify-center gap-3 px-6 text-sm">
        <span className="text-center">Új ajánlat sablonok a Proponóban</span>
        <Link
          href="/elofizetes"
          className="inline-flex items-center rounded-full border border-white/20 px-3 py-1 text-xs font-semibold text-white/90 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5B0]"
        >
          Próbáld ki most
        </Link>
      </div>
    </div>
  );
}
