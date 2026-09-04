
import React, { useState } from 'react';
import { NffNode, ProseNode, QcmNode } from '../core/schema';
import { TONE_STYLES } from '../core/visual-mapping';

interface NffRendererProps {
  nodes: NffNode[];
  onAnswer?: (id: string, value: string | string[]) => void;
}

function ProseBlock({ node }: { node: ProseNode }) {
  const raw = node as any;
  const tone = raw.tone || 'neutral';
  const style = TONE_STYLES[tone] || TONE_STYLES.neutral;
  const content = raw.content ?? raw.text ?? '';
  return (
    <div className={`${style.bg} ${style.text} ${style.weight} border-r-4 ${style.accent} p-4 rounded-lg mb-4 transition-all duration-200 leading-relaxed text-sm`}>
      {content}
    </div>
  );
}

function QcmBlock({ node, onAnswer }: { node: QcmNode; onAnswer?: (id: string, value: string | string[]) => void }) {
  const [selected, setSelected] = useState<string | string[]>(node.qcmType === 'multi_choice' ? [] : '');

  return (
    <div className="border-2 border-[#D9B892]/40 bg-[#D9B892]/10 rounded-xl p-6 mb-4 shadow-sm transition-all duration-200">
      <p className="font-semibold text-[#0F3D36] mb-4 flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-[#B75A3C]" /> {node.question}
      </p>
      <div className="space-y-2">
        {node.qcmType !== 'text_input' && node.options?.map(opt => (
          <label key={opt.value} className="flex items-center gap-2 py-2 px-4 rounded-lg hover:bg-[#D9B892]/20 cursor-pointer transition-colors">
            <input
              type={node.qcmType === 'single_choice' ? 'radio' : 'checkbox'}
              name={node.id}
              className="accent-[#5DB87F]"
              onChange={() => {
                const next = node.qcmType === 'single_choice'
                  ? opt.value
                  : Array.from(new Set(Array.isArray(selected) ? (selected.includes(opt.value) ? selected.filter(v => v !== opt.value) : [...selected, opt.value]) : [opt.value]));
                setSelected(next);
                onAnswer?.(node.id, next);
              }}
            />
            <span className="text-[#0F3D36]">{opt.label}</span>
          </label>
        ))}
        {node.qcmType === 'text_input' && (
          <input
            className="w-full border-b border-[#0F3D36]/30 bg-transparent py-2 px-2 outline-none focus:border-[#5DB87F] transition-colors text-[#0F3D36]"
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
  console.log(`[NffRenderer] Rendering ${nodes?.length ?? 0} nodes:`, nodes);
  if (!nodes || nodes.length === 0) {
    return null;
  }

  return (
    <div className="nff-content space-y-4 text-right" dir="rtl">
      {nodes.map((node, i) => {
        const rawNode = node as any;
        const nodeType = rawNode?.type || rawNode?.kind;
        console.log(`[NffRenderer] Node #${i}:`, nodeType, rawNode);

        if (nodeType === 'prose') {
          return <ProseBlock key={i} node={node as ProseNode} />;
        }
        if (nodeType === 'qcm') {
          return <QcmBlock key={i} node={node as QcmNode} onAnswer={onAnswer} />;
        }
        if (nodeType === 'section') {
          const title = rawNode?.attributes?.title || rawNode?.title || 'قسم بدون عنوان';
          return (
            <div key={i} className="pt-6 pb-2 border-b border-[#0F3D36]/10 mb-4">
              <h3 className="text-base font-bold text-[#0F3D36] flex items-center gap-2">
                <span className="w-2 h-4 bg-[#B75A3C] rounded-sm inline-block" />
                {title}
              </h3>
            </div>
          );
        }
        if (nodeType === 'error') {
          return (
            <div key={i} className="text-xs text-[#B75A3C] bg-[#B75A3C]/10 p-4 rounded-xl italic border border-[#B75A3C]/30 mb-4">
              ⚠ {rawNode?.reason || 'خطأ في معالجة العنصر'}
            </div>
          );
        }
        return (
          <div key={i} className="text-xs text-[#0F3D36]/60 italic bg-stone-50 p-4 rounded-lg border border-[#0F3D36]/10 mb-4">
            ⚠ عنصر غير معروف ({String(nodeType)}): {rawNode?.content || JSON.stringify(rawNode)}
          </div>
        );
      })}
    </div>
  );
}
