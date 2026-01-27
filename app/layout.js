import { Inter } from 'next/font/google';
import './globals.css';
import { NotificationProvider } from './components/NotificationProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Moto-Asistan',
  description: 'Taktiksel Motosiklet Asistanı',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <NotificationProvider>
          {children}
        </NotificationProvider>
      </body>
    </html>
  );
}
