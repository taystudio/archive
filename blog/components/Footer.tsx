export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-2)] mt-20 pb-24 lg:pb-8">
      <div className="mx-auto max-w-[1240px] px-4 py-8 text-sm text-[var(--muted)] flex flex-col sm:flex-row gap-3 sm:justify-between items-start sm:items-center">
        <span>© {new Date().getFullYear()} TayLee</span>
        <div className="flex gap-4">
          <a href="/privacy" className="no-underline hover:underline">Privacy</a>
          <a href="/about" className="no-underline hover:underline">About</a>
          <a href="https://github.com/taehyuklee" target="_blank" rel="noreferrer">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
