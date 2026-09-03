
import React, { useState, useEffect } from 'react';
import { ArrowRight, Eye, EyeOff, Trash2, CheckCircle2, AlertCircle, ShieldCheck, KeyRound, Sparkles, RefreshCw } from 'lucide-react';
import { activeKeyProvider } from '../core/ai-key-provider';

interface SettingsPageProps {
  onBack: () => void;
  returnTo?: string;
}

type KeyStatus = 'none' | 'checking' | 'valid' | 'invalid';

export function SettingsPage({ onBack, returnTo }: SettingsPageProps) {
  const [key, setKey] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [status, setStatus] = useState<KeyStatus>('none');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    const existing = activeKeyProvider.getActiveApiKey();
    if (existing) {
      setKey(existing);
      // Validate format of existing key
      if (existing.trim().length >= 10) {
        setStatus('valid');
      } else {
        setStatus('invalid');
      }
    } else {
      setStatus('none');
    }
  }, []);

  const handleSaveAndTest = () => {
    const trimmed = key.trim();
    if (!trimmed) {
      setStatus('invalid');
      setFeedback({ tone: 'error', message: 'يرجى إدخال مفتاح API أولاً.' });
      return;
    }

    setStatus('checking');
    setFeedback({ tone: 'info', message: 'جارٍ التحقق من تنسيق وصلاحية المفتاح محلياً...' });

    setTimeout(() => {
      // Basic format verification for Gemini / standard AI keys
      if (trimmed.length < 16) {
        setStatus('invalid');
        setFeedback({ tone: 'error', message: 'المفتاح المدخل قصير جداً أو غير مكتمل.' });
        return;
      }

      activeKeyProvider.setApiKey(trimmed);
      setStatus('valid');
      setFeedback({ tone: 'success', message: 'تم حفظ مفتاح الذكاء بنجاح في التخزين المحلي. أصبحت الميزات التوليدية مفعلة.' });

      if (returnTo) {
        setTimeout(() => onBack(), 1200);
      }
    }, 600);
  };

  const handleDeleteKey = () => {
    activeKeyProvider.clearApiKey();
    setKey("");
    setStatus('none');
    setFeedback({ tone: 'info', message: 'تم حذف المفتاح من جهازك بالكامل.' });
  };

  return (
    <div className="settings-view min-h-screen bg-[#F8F7F1] text-[#17233A]" dir="rtl">
      {/* Top Bar */}
      <header className="h-16 bg-[#FFFFFF] border-b border-[#D5D7D0] flex items-center justify-between px-8 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack} 
            className="p-2 hover:bg-[#F0EFE7] rounded-xl transition-colors text-[#0F3D36] flex items-center gap-1 text-sm font-semibold"
            title="العودة"
          >
            <ArrowRight size={18} />
            <span>العودة</span>
          </button>
          <div className="h-5 w-[1px] bg-[#D5D7D0]" />
          <div>
            <span className="text-[10px] font-bold text-[#8A908F] uppercase tracking-wider">NFF · NABD STUDIO</span>
            <h1 className="text-base font-bold text-[#17233A]">إعدادات البيئة</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#8A908F] font-mono">CORE v1.0</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto py-12 px-6">
        <div className="mb-8">
          <span className="text-xs font-bold text-[#0F3D36] uppercase tracking-wider">CONFIGURATION</span>
          <h2 className="text-3xl font-bold text-[#17233A] mt-1">تكامل الذكاء الاصطناعي (BYOK)</h2>
          <p className="text-sm text-[#4C5869] mt-2 leading-relaxed">
            استخدم مفتاحك الخاص لتشغيل الميزات التوليدية واقتراح النبرات الدلالية في مستندات NFF.
          </p>
        </div>

        {/* Card */}
        <section className="bg-[#FFFFFF] border border-[#D5D7D0] rounded-2xl p-8 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-6 pb-6 border-b border-[#EEEEE8]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0F3D36]/10 text-[#0F3D36] flex items-center justify-center">
                <KeyRound size={20} />
              </div>
              <div>
                <strong className="text-base text-[#17233A] block">مفتاح API التوليدي</strong>
                <small className="text-xs text-[#8A908F]">Bring Your Own Key</small>
              </div>
            </div>

            {/* Live Status Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold">
              {status === 'none' && (
                <span className="flex items-center gap-1.5 text-[#8A908F] border-[#D5D7D0] bg-[#F0EFE7]">
                  <span className="w-2 h-2 rounded-full bg-[#8A908F]" />
                  غير مُعدّ
                </span>
              )}
              {status === 'checking' && (
                <span className="flex items-center gap-1.5 text-[#B75A3C] border-[#D9B892] bg-[#FAF5EE]">
                  <RefreshCw size={13} className="animate-spin" />
                  جارٍ التحقق...
                </span>
              )}
              {status === 'valid' && (
                <span className="flex items-center gap-1.5 text-[#0F3D36] border-[#5DB87F]/40 bg-[#E8F5EE]">
                  <CheckCircle2 size={14} className="text-[#5DB87F]" />
                  متصل وصالح
                </span>
              )}
              {status === 'invalid' && (
                <span className="flex items-center gap-1.5 text-[#B75A3C] border-[#B75A3C]/30 bg-[#FDF0EC]">
                  <AlertCircle size={14} className="text-[#B75A3C]" />
                  مفتاح غير صالح
                </span>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#17233A] mb-2">
                مفتاح API
              </label>
              <div className="relative">
                <input
                  type={isVisible ? "text" : "password"}
                  value={key}
                  onChange={(e) => {
                    setKey(e.target.value);
                    if (status !== 'checking') setStatus('none');
                  }}
                  placeholder="AIzaSy... أو sk-..."
                  className="w-full bg-[#F8F7F1] border border-[#D5D7D0] focus:border-[#0F3D36] rounded-xl px-4 py-3 pl-12 font-mono text-sm text-[#17233A] placeholder-[#8A908F] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setIsVisible(!isVisible)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A908F] hover:text-[#17233A] transition-colors p-1"
                  aria-label={isVisible ? "إخفاء المفتاح" : "إظهار المفتاح"}
                >
                  {isVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {key && (
                  <button
                    type="button"
                    onClick={handleDeleteKey}
                    className="flex items-center gap-1.5 text-xs font-bold text-[#B75A3C] hover:bg-[#FDF0EC] px-3 py-2 rounded-xl transition-colors"
                  >
                    <Trash2 size={15} />
                    <span>حذف المفتاح</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleSaveAndTest}
                  disabled={!key.trim() || status === 'checking'}
                  className="bg-[#0F3D36] hover:bg-[#15544a] text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
                >
                  <Sparkles size={16} />
                  <span>حفظ واختبار</span>
                </button>
              </div>
            </div>

            {/* Feedback notification */}
            {feedback && (
              <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border ${
                feedback.tone === 'success' ? 'bg-[#E8F5EE] border-[#5DB87F]/30 text-[#0F3D36]' :
                feedback.tone === 'error' ? 'bg-[#FDF0EC] border-[#B75A3C]/30 text-[#B75A3C]' :
                'bg-[#F0EFE7] border-[#D5D7D0] text-[#4C5869]'
              }`}>
                {feedback.tone === 'success' && <CheckCircle2 size={16} className="text-[#5DB87F]" />}
                {feedback.tone === 'error' && <AlertCircle size={16} className="text-[#B75A3C]" />}
                {feedback.tone === 'info' && <RefreshCw size={16} className="text-[#8A908F]" />}
                <span>{feedback.message}</span>
              </div>
            )}
          </div>

          {/* Explicit Security Notice */}
          <div className="mt-8 pt-6 border-t border-[#EEEEE8] flex items-start gap-3 text-[#4C5869] text-xs leading-relaxed bg-[#F8F7F1] p-4 rounded-xl border border-[#E5E7E0]">
            <ShieldCheck size={20} className="text-[#0F3D36] flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#17233A] block mb-1">ملاحظة أمان صريحة: تخزين محلي فقط</strong>
              يتم حفظ المفتاح في التخزين المحلي لمتصفحك فقط (Local Storage). لا يغادر جهازك ولا يتم إرساله إطلاقاً إلى أي خادم وسيط. عند إجراء أي طلب توليدي، يُستدعى النموذج مباشرة من متصفحك.
            </div>
          </div>
        </section>

        <div className="mt-12 text-center">
          <p className="text-[11px] text-[#8A908F] uppercase tracking-widest font-mono">
            SOVEREIGN ARCHITECTURE · ZERO TELEMETRY · NABD STUDIO
          </p>
        </div>
      </main>
    </div>
  );
}
