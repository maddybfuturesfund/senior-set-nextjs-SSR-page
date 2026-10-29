import './globals.css';

export const metadata = {
  title: 'Supply Chain Dashboard Benchmark',
  description: 'Next.js SSR vs CSR Comparative Report',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
