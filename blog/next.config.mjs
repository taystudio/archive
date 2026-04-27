/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';
const basePath = isProd ? '/Archive/blog' : '';

const nextConfig = {
  ...(isProd ? { output: 'export' } : {}),
  basePath,
  assetPrefix: basePath,
  images: { unoptimized: true },
  trailingSlash: true,
  transpilePackages: [
    '@toast-ui/editor',
    '@toast-ui/editor-plugin-code-syntax-highlight',
    '@toast-ui/editor-plugin-color-syntax',
  ],
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_SITE_URL: 'https://taehyuklee.github.io/Archive/blog',
  },
};

export default nextConfig;
