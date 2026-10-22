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
    <div className="rounded-lg border border-slate-200 overflow-hidden font-mono text-xs bg-white shadow-sm">
      <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-slate-700">
        <span className="font-semibold text-slate-800">{filePath || 'Unified Diff'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-0.5 rounded hover:bg-slate-200 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy Diff'}</span>
        </button>
      </div>

      <div className="overflow-x-auto max-h-96">
        <table className="w-full text-left border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              let rowBg = 'bg-white text-slate-700';
              if (line.startsWith('+') && !line.startsWith('+++')) {
                rowBg = 'bg-emerald-50 text-emerald-800 font-medium';
              } else if (line.startsWith('-') && !line.startsWith('---')) {
                rowBg = 'bg-rose-50 text-rose-800 font-medium';
              } else if (line.startsWith('@@')) {
                rowBg = 'bg-blue-50/70 text-blue-700 font-bold';
              } else if (line.startsWith('diff --git') || line.startsWith('index ')) {
                rowBg = 'bg-slate-50 text-slate-400 italic';
              }

              return (
                <tr key={idx} className={`${rowBg} hover:bg-slate-100/50 transition-colors`}>
                  <td className="w-10 px-2 py-0.5 text-right text-slate-400 select-none text-[10px] border-r border-slate-200">
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
