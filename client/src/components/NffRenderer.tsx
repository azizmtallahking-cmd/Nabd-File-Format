
import React, { useState } from 'react';
import { NffNode, ProseNode, QcmNode } from '../core/schema';
import { TONE_STYLES } from '../core/visual-mapping';

interface NffRendererProps {
  nodes: NffNode[];
  onAnswer?: (id: string, value: string | string[]) => void;
}

function ProseBlock({ node }: { node: ProseNode }) {
  const style = TONE_STYLES[node.tone] || TONE_STYLES.neutral;
  return (
    <div className={`${style.bg} ${style.text} ${style.weight} border-r-4 ${style.accent} p-4 rounded-lg mb-3 transition-all duration-200`}>
      {node.content}
    </div>
  );
}

function QcmBlock({ node, onAnswer }: { node: QcmNode; onAnswer?: (id: string, value: string | string[]) => void }) {
  const [selected, setSelected] = useState<string | string[]>(node.qcmType === 'multi_choice' ? [] : '');

  return (
    <div className="border-2 border-amber-500/40 bg-amber-50/50 rounded-xl p-5 mb-3 shadow-sm transition-all duration-200">
      <p className="font-semibold text-stone-900 mb-3 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-amber-500" /> {node.question}
      </p>
      <div className="space-y-2">
        {node.qcmType !== 'text_input' && node.options?.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 py-1.5 px-3 rounded-lg hover:bg-amber-100/50 cursor-pointer transition-colors">
            <input
              type={node.qcmType === 'single_choice' ? 'radio' : 'checkbox'}
              name={node.id}
              className="accent-amber-600"
              onChange={() => {
                const next = node.qcmType === 'single_choice'
                  ? opt.value
                  : Array.from(new Set(Array.isArray(selected) ? (selected.includes(opt.value) ? selected.filter(v => v !== opt.value) : [...selected, opt.value]) : [opt.value]));
                setSelected(next);
                onAnswer?.(node.id, next);
              }}
            />
            <span className="text-stone-800">{opt.label}</span>
          </label>
        ))}
        {node.qcmType === 'text_input' && (
          <input
            className="w-full border-b border-stone-300 bg-transparent py-2 px-1 outline-none focus:border-amber-500 transition-colors"
            placeholder="اكتب إجابتك هنا..."
            onChange={e => { 
              setSelected(e.target.value); 
              onAnswer?.(node.id, e.target.value); 
            }}
          />
        )}
      </div>
    </div>
  );
}

export function NffRenderer({ nodes, onAnswer }: NffRendererProps) {
  return (
    <div className="nff-content space-y-2 text-right" dir="rtl">
      {nodes.map((node, i) => {
        if ('type' in node) {
          if (node.type === 'prose') return <ProseBlock key={i} node={node} />;
          if (node.type === 'qcm') return <QcmBlock key={i} node={node} onAnswer={onAnswer} />;
          if (node.type === 'error') return <div key={i} className="text-xs text-rose-500 bg-rose-50 p-2 rounded italic border border-rose-200">⚠ {node.reason}</div>;
        }
        return <div key={i} className="text-xs text-stone-400 italic">⚠ عنصر غير معروف</div>;
      })}
    </div>
  );
}
