import type { Metadata } from 'next';
import Script from 'next/script';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ClientErrorSuppress from '@/components/ClientErrorSuppress';
import { getSiteConfig } from '@/lib/site-server';
import { getActiveTheme } from '@/lib/theme';
import { serializeThemeCSS } from '@/lib/themes';
import { resolveAssetPath, faviconMimeType } from '@/lib/asset-path';
import { getCustomCss } from '@/lib/custom-css';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://taehyuklee.github.io/Archive/blog';
const ADSENSE = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'TayLee Tech & Career Lab',
    template: '%s — TayLee Tech & Career Lab',
  },
  description: '엔지니어 TayLee의 기술/커리어 기록 아카이브',
  openGraph: {
    type: 'website',
    siteName: 'TayLee Tech & Career Lab',
    locale: 'ko_KR',
    url: SITE_URL,
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
  alternates: { canonical: SITE_URL },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const site = getSiteConfig();
  const goatcounter = site.analytics?.goatcounter;
  const theme = getActiveTheme();
  const themeCSS = serializeThemeCSS(theme);
  const customCSS = getCustomCss();
  const faviconHref = resolveAssetPath(site.favicon);
  const faviconType = faviconMimeType(site.favicon);

  return (
    <html
      lang="ko"
      suppressHydrationWarning
      data-theme={theme.id}
      data-table-style={site.tableStyle ?? 'classic'}
    >
      <head>
        {faviconHref && (
          <link rel="icon" href={faviconHref} {...(faviconType ? { type: faviconType } : {})} />
        )}
        <style dangerouslySetInnerHTML={{ __html: themeCSS }} />
        {customCSS && (
          <style data-custom-css="true" dangerouslySetInnerHTML={{ __html: customCSS }} />
        )}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');var d=t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches;if(d)document.documentElement.classList.add('dark');if(localStorage.getItem('gh_pat'))document.documentElement.classList.add('has-gh-pat');}catch(e){}`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.__SITE_ANALYTICS__=${JSON.stringify({ goatcounter: goatcounter ?? '' })};`,
          }}
        />
        {goatcounter && (
          <Script
            id="goatcounter"
            async
            strategy="afterInteractive"
            data-goatcounter={`https://${goatcounter}.goatcounter.com/count`}
            src="//gc.zgo.at/count.js"
          />
        )}
        {ADSENSE && (
          <Script
            id="adsense-init"
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE}`}
            crossOrigin="anonymous"
          />
        )}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${GA_ID}');`}
            </Script>
          </>
        )}
      </head>
      <body className="min-h-screen flex flex-col">
        <ClientErrorSuppress />
        <Header />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
