import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SolidTracker - Professional Time Tracking Platform",
  description: "Complete time tracking solution with admin dashboard, employee portal, and desktop apps. Track productivity, manage projects, and monitor screenshots.",
  keywords: "time tracking, productivity, employee monitoring, project management, screenshots",
  authors: [{ name: "SolidTracker Team" }],
  openGraph: {
    title: "SolidTracker - Professional Time Tracking Platform",
    description: "Complete time tracking solution with admin dashboard, employee portal, and desktop apps.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-orange-50 to-amber-50">
        {children}
      </body>
    </html>
  );
} 