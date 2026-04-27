import Sidebar from '@/components/Sidebar';
import MobileStickyAd from '@/components/MobileStickyAd';

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div className="mx-auto w-full max-w-[1200px] px-4 py-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 w-full max-w-[780px]">{children}</div>
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Sidebar />
          </div>
        </aside>
      </div>
      <MobileStickyAd />
    </>
  );
}
