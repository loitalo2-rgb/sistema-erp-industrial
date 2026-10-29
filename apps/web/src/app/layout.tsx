import type { Metadata } from 'next';
import './globals.css';
import { Sidebar } from '../components/Sidebar';

export const metadata: Metadata = {
  title: 'ERP Industrial & MRP I',
  description: 'Sistema Integrado de Gestão de Manufatura e Produtividade',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 antialiased flex">
        <Sidebar />
        <div className="flex-1 ml-64 min-h-screen flex flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
