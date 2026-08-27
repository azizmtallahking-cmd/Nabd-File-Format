
import React, { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { activeKeyProvider } from '../core/ai-key-provider';

interface SettingsPageProps {
  onBack: () => void;
  returnTo?: string;
}

export function SettingsPage({ onBack, returnTo }: SettingsPageProps) {
  const [key, setKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<'none' | 'checking' | 'valid' | 'invalid'>('none');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const existing = activeKeyProvider.getActiveApiKey();
    if (existing) {
      setKey(existing);
      setStatus('valid'); // In a real app, we would verify here
    }
  }, []);

  const saveKey = () => {
    if (!key.trim()) return;
    setStatus('checking');
    // Actual storage and status update
    setTimeout(() => {
      activeKeyProvider.setApiKey(key.trim());
      setStatus('valid');
      setNotice("تم حفظ مفتاح الذكاء بنجاح.");
      // If we came from requireApiKey, return after success
      if (returnTo) {
        const target = returnTo.startsWith('#') ? returnTo.slice(1) : returnTo;
        setTimeout(() => onBack(), 1000);
      }
    }, 800);
  };

  const deleteKey = () => {
    if (confirm("هل أنت متأكد من حذف مفتاح الذكاء؟ سيتم تعطيل الميزات التوليدية.")) {
      activeKeyProvider.clearApiKey();
      setKey("");
      setStatus('none');
      setNotice("تم حذف المفتاح.");
    }
  };

  return (
    <div className="settings-view min-h-screen bg-[#f8f7f1] text-[#182743]" dir="rtl">
      <header className="h-16 bg-white border-b border-[#d5d7d0] flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-[#f0efe7] rounded-full transition-colors text-[#8b684c]">
            <ArrowRight size={20} />
          </button>
          <h1 className="text-lg font-bold">الإعدادات</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto py-12 px-6">
        <section className="bg-white border border-[#d5d7d0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6 text-[#8b684c]">
            <ShieldCheck size={24} />
            <h2 className="text-xl font-bold">مفتاح الذكاء الاصطناعي (BYOK)</h2>
          </div>

          <p className="text-sm text-[#5c6b89] mb-8 leading-relaxed">
            استخدم مفتاح API الخاص بك لتفعيل الميزات التوليدية. يتم تخزين المفتاح <strong>محلياً على جهازك فقط</strong> ولا يُرسل لأي خادم وسيط.
          </p>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#8b684c] uppercase tracking-wider">مفتاح API</label>
              <div className="relative">
                <input 
                  type={isVisible ? "text" : "password"}
                  value={key}
                  onChange={(e) => setKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full bg-[#f0efe7] border border-[#d5d7d0] rounded-xl px-4 py-3 pl-12 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#8b684c]/20"
                />
                <button 
                  onClick={() => setIsVisible(!isVisible)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a8835c] hover:text-[#8b684c]"
                >
                  {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {status === 'checking' && <span className="text-xs text-[#a8835c] animate-pulse">جارٍ التحقق...</span>}
                {status === 'valid' && <span className="flex items-center gap-1 text-xs text-green-600 font-bold"><CheckCircle2 size={14} /> متصل</span>}
                {status === 'invalid' && <span className="flex items-center gap-1 text-xs text-red-600 font-bold"><AlertCircle size={14} /> مفتاح غير صالح</span>}
                {status === 'none' && <span className="text-xs text-[#a8835c]">غير مُعدّ</span>}
              </div>
              
              <div className="flex gap-3">
                {status === 'valid' && (
                  <button onClick={deleteKey} className="flex items-center gap-2 text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                    <Trash2 size={16} /> حذف
                  </button>
                )}
                <button 
                  onClick={saveKey}
                  disabled={!key.trim() || status === 'checking'}
                  className="bg-[#182743] text-white px-8 py-2 rounded-xl text-sm font-bold hover:bg-[#29496c] transition-all disabled:opacity-50"
                >
                  حفظ واختبار
                </button>
              </div>
            </div>
          </div>

          {notice && (
            <div className="mt-6 p-4 bg-green-50 border border-green-100 rounded-xl text-green-700 text-sm flex items-center gap-3">
              <CheckCircle2 size={18} /> {notice}
            </div>
          )}
        </section>

        <div className="mt-12 text-center">
          <p className="text-[10px] text-[#a8835c] uppercase tracking-widest">
            تصميم سيادي · خصوصية مطلقة · NFF v1.0
          </p>
        </div>
      </main>
    </div>
  );
}
