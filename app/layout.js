import { Inter, Jost, Poppins } from 'next/font/google';
import './globals.css';

// Load all three fonts
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jost = Jost({ 
  subsets: ['latin'],
  variable: '--font-jost',
  display: 'swap',
});

const poppins = Poppins({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata = {
  title: 'Muslifie Admin Dashboard',
  description: 'Admin dashboard for Muslifie platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body 
        className={`${inter.variable} ${jost.variable} ${poppins.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}