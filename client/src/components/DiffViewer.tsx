import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface DiffViewerProps {
  diffText: string;
  filePath?: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ diffText, filePath }) => {
  const [copied, setCopied] = useState(false);
  const lines = diffText.split('\n');

  const handleCopy = () => {
    navigator.clipboard.writeText(diffText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-warm-border overflow-hidden font-mono text-xs bg-warm-card shadow-xs">
      <div className="bg-warm-sidebar px-4 py-2.5 border-b border-warm-border flex items-center justify-between text-warm-primary">
        <span className="font-semibold text-warm-primary">{filePath || 'Unified Diff'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-warm-secondary hover:text-warm-primary px-2 py-0.5 rounded hover:bg-warm-border/60 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Diff'}</span>
        </button>
      </div>

      <div className="overflow-x-auto max-h-96 bg-warm-card">
        <table className="w-full text-left border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              let rowBg = 'bg-warm-card text-warm-primary';
              if (line.startsWith('+') && !line.startsWith('+++')) {
                rowBg = 'bg-emerald-50 text-emerald-800 font-medium';
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                rowBg = 'bg-rose-50 text-rose-800 font-medium';
              } else if (line.startsWith('@@')) {
                rowBg = 'bg-blue-50/70 text-blue-800 font-bold';
              } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
                rowBg = 'bg-warm-bg text-warm-secondary italic';
              }

              return (
                <tr key={idx} className={`${rowBg} hover:opacity-90 transition-opacity`}>
                  <td className="w-10 px-2 py-0.5 text-right text-warm-secondary select-none text-[10px] border-r border-warm-border/80">
                    {idx + 1}
                  </td>
                  <td className="px-3 py-0.5 whitespace-pre font-mono">
                    {line}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
