import "./globals.css";

export const metadata = {
  title: "Masderiv Chatbot",
  description: "End-to-end chatbot interface"
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
