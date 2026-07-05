import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Loader2, FileText, Table2 } from 'lucide-react';
import { formatCurrency } from '../utils/chartData';

function toCSV(headers, rows) {
  const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => lines.push(r.map(escape).join(',')));
  return lines.join('\n');
}

function downloadFile(content, filename, mime = 'text/csv') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8;` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportOrdersButton({ orders = [] }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const headers = ['ID', 'Type', 'Asset', 'Quantity', 'Price', 'Status', 'Timestamp'];
      const rows = orders.map((o) => [
        o.id,
        o.orderType,
        o.orderItem?.coin?.symbol?.toUpperCase() || '',
        o.orderItem?.quantity ?? '',
        o.price ?? '',
        o.status,
        o.timestamp ? new Date(o.timestamp).toISOString() : '',
      ]);
      downloadFile(toCSV(headers, rows), `cryptovault-orders-${new Date().toISOString().slice(0, 10)}.csv`);
      setExporting(false);
    }, 300);
  };

  if (!orders.length) return null;

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/10 text-xs text-ink-muted font-display font-semibold hover:bg-white/[0.05] hover:text-ink transition-all disabled:opacity-50"
    >
      {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      Export CSV
    </button>
  );
}

export function ExportTransactionsButton({ transactions = [] }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      const headers = ['ID', 'Type', 'Amount', 'Purpose', 'Date'];
      const rows = transactions.map((t) => [
        t.id,
        t.type,
        t.amount,
        t.purpose || '',
        t.date ? new Date(t.date).toISOString() : '',
      ]);
      downloadFile(toCSV(headers, rows), `cryptovault-transactions-${new Date().toISOString().slice(0, 10)}.csv`);
      setExporting(false);
    }, 300);
  };

  if (!transactions.length) return null;

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-white/10 text-xs text-ink-muted font-display font-semibold hover:bg-white/[0.05] hover:text-ink transition-all disabled:opacity-50"
    >
      {exporting ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
      Export
    </button>
  );
}
