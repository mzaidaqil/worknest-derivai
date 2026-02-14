import "./globals.css";

export const metadata = {
  title: "WorkNest Assistant",
  description: "AI-powered HR assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
