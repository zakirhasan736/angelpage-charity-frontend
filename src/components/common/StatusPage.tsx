import Link from 'next/link';
import { ArrowRight, Compass, Heart, ShoppingBag, Store } from 'lucide-react';

type Props = {
  code: string;
  title: string;
  body: string;
  primary?: { href: string; label: string };
  children?: React.ReactNode;
};

const LINKS = [
  { href: '/product', label: 'Shop pre-loved', icon: ShoppingBag },
  { href: '/charity/find-a-charity', label: 'Find a charity', icon: Store },
  { href: '/events', label: 'Events', icon: Heart },
  { href: '/how-it-works', label: 'How it works', icon: Compass },
];

/** Shared layout for 404 / 403 / 500 pages. Server component, no client JS. */
export default function StatusPage({ code, title, body, primary = { href: '/', label: 'Back to home' }, children }: Props) {
  return (
    <section className="custom-container flex min-h-[70vh] items-center py-16 sm:py-10">
      <div className="mx-auto w-full max-w-[640px] text-center">
        <p className="font-primary text-[96px] leading-none text-[#E9D8F5] sm:text-[72px]" aria-hidden>
          {code}
        </p>
        <h1 className="ap-display mt-2 text-[36px] leading-tight sm:text-[28px]">{title}</h1>
        <p className="mx-auto mt-3 max-w-[460px] text-[15px] leading-relaxed text-[#6B686E]">{body}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href={primary.href} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#611192] px-6 text-[15px] font-medium text-white transition hover:bg-[#4C0D73]">
            {primary.label} <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
          {children}
        </div>
        <nav aria-label="Popular pages" className="mt-10 grid grid-cols-4 gap-3 sm:grid-cols-2">
          {LINKS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="flex flex-col items-center gap-2 rounded-2xl bg-[#FAF8FB] px-3 py-4 text-[13px] font-medium text-[#0B0112] ring-1 ring-[#F0EBF2] transition hover:bg-[#F6EEFA] hover:text-[#611192]">
              <Icon className="h-5 w-5 text-[#611192]" aria-hidden />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  );
}
