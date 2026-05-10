import './globals.css';

export const metadata = {
  title: 'PVANK — verankerd in tijd',
  description: 'Cryptografisch bewijs voor elke Nederlander.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nl">
      <body>{children}</body>
    </html>
  );
}
