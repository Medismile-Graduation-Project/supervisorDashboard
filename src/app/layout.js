import { Tajawal } from "next/font/google";
import "./globals.css";
import { Providers } from './providers';
import { Toaster } from 'react-hot-toast';

const tajawal = Tajawal({
  weight: ["300", "400", "500", "700", "800", "900"],
  subsets: ["arabic", "latin"],
  variable: "--font-tajawal",
});

export const metadata = {
  title: "Supervisor Dashboard - MediSmile",
  description: "لوحة تحكم المشرفين",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${tajawal.variable} font-sans antialiased`}
      >
        <Providers>
          {children}
          <Toaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}
