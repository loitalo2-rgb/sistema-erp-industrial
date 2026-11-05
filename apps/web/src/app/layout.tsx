import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '../components/AppShell';

export const metadata: Metadata = {
  title: 'ERP Industrial & MRP I',
  description:
    'Sistema Integrado de Gestão de Manufatura, Estoque, Compras, Vendas e DRE',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-50 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
