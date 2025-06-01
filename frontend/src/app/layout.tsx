import type { Metadata } from "next";
import '@picocss/pico/css/pico.min.css';
import { AuthProvider } from '@/lib/auth';

export const metadata: Metadata = {
  title: "Frame Picker - AI Video Frame Selection",
  description: "Extract the best frames from your videos using AI. Perfect for profile pictures and action shots.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
