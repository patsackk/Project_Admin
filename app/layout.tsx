import './globals.css';
import ClientLayout from './client-layout';
import { LanguageProvider } from '@/components/LanguageProvider';
import { getLang } from '@/lib/i18n-server';

export const metadata = {
  title: 'Uto Admin',
  description: 'UTO Advance Website',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const lang = await getLang();

  return (
    <html lang={lang}>
      <body className="antialiased min-h-screen flex flex-col">
        <LanguageProvider initialLang={lang}>
          <ClientLayout>{children}</ClientLayout>
        </LanguageProvider>
      </body>
    </html>
  );
}
