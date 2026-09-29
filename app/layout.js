import { Prompt } from 'next/font/google';
import './globals.css';

const prompt = Prompt({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
});

export const metadata = {
  title: 'สวีทไอติม',
  description: 'ระบบสั่งอาหารร้านสวีทไอติม',
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body className={prompt.className}>{children}</body>
    </html>
  );
}
