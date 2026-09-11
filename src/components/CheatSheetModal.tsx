import React, { useState } from 'react';
import { X, Clock, HardDrive, ShieldCheck, Compass } from 'lucide-react';
import { Language } from '../types';
import {
  POWER_OF_TWO,
  AVAILABILITY_LEVELS
} from '../data/cheatSheetData';
import {
  I18N_STRINGS,
  LATENCY_NUMBERS_BILINGUAL,
  FOUR_STEP_FRAMEWORK_BILINGUAL
} from '../data/i18n';

interface CheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: Language;
}

export const CheatSheetModal: React.FC<CheatSheetModalProps> = ({ isOpen, onClose, language = 'en' }) => {
  const [activeTab, setActiveTab] = useState<'latency' | 'power' | 'availability' | 'framework'>('latency');
  const t = I18N_STRINGS[language].cheatSheet;

  if (!isOpen) return null;

  return (
    <div
      id="cheatsheet-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs animate-in fade-in duration-100"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="presentation"
    >
      <div
        id="cheatsheet-modal-container"
        role="dialog"
        aria-modal="true"
        aria-label={t.title}
        className="w-full max-w-3xl bg-white rounded-xl shadow-xl border border-neutral-200 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-white">
          <div>
            <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-neutral-500">
              {t.badge}
            </span>
            <h3 className="text-base font-bold text-neutral-900">
              {t.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.closeBtn}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-md hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher - Segmented bar */}
        <div className="px-6 py-2.5 border-b border-neutral-200 bg-neutral-50/70">
          <div className="inline-flex rounded-lg bg-neutral-200/70 p-0.5 text-xs font-medium w-full sm:w-auto overflow-x-auto" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'latency'}
              onClick={() => setActiveTab('latency')}
              className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'latency'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              {t.tabs.latency}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'power'}
              onClick={() => setActiveTab('power')}
              className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'power'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <HardDrive className="w-3.5 h-3.5" />
              {t.tabs.power}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'availability'}
              onClick={() => setActiveTab('availability')}
              className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'availability'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              {t.tabs.availability}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'framework'}
              onClick={() => setActiveTab('framework')}
              className={`flex items-center justify-center gap-1.5 py-1 px-3 rounded-md transition-all whitespace-nowrap ${
                activeTab === 'framework'
                  ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              {t.tabs.framework}
            </button>
          </div>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'latency' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 leading-relaxed">
                <span className="font-semibold text-neutral-900">{language === 'zh' ? '核心要点：' : 'Key Takeaway:'}</span> {t.latencyTakeaway}
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.latencyColOp}</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.latencyColTime}</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.latencyColNotes}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800">
                    {LATENCY_NUMBERS_BILINGUAL.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2 px-3 font-medium">
                          {language === 'zh' ? item.opZh : item.opEn}
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-900 bg-neutral-50/40 font-semibold">
                          {item.time}
                        </td>
                        <td className="py-2 px-3 text-neutral-500">
                          {(language === 'zh' ? item.notesZh : item.notesEn) || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'power' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 leading-relaxed">
                <span>{t.powerIntro}</span>
                <div className="mt-1.5 flex flex-wrap gap-2 text-neutral-900 font-mono text-[11px]">
                  <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">2^10 ≈ 10^3 (1 KB)</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">2^20 ≈ 10^6 (1 MB)</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">2^30 ≈ 10^9 (1 GB)</span>
                  <span className="bg-white px-2 py-0.5 rounded border border-neutral-200">2^40 ≈ 10^12 (1 TB)</span>
                </div>
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.powerColPow}</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.powerColExact}</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.powerColApprox}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800">
                    {POWER_OF_TWO.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-neutral-900">{item.power}</td>
                        <td className="py-2.5 px-3 font-mono text-neutral-600">{item.exact}</td>
                        <td className="py-2.5 px-3 font-semibold text-neutral-900">{item.approx}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'availability' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 leading-relaxed">
                {t.availIntro}
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.availColTier}</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.availColDay}</th>
                      <th className="py-2.5 px-3 uppercase tracking-wider text-[11px]">{t.availColYear}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100 text-neutral-800">
                    {AVAILABILITY_LEVELS.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-semibold text-emerald-800 font-mono">{item.availability}</td>
                        <td className="py-2.5 px-3 font-mono text-neutral-700">{item.downtimePerDay}</td>
                        <td className="py-2.5 px-3 font-mono text-neutral-700">{item.downtimePerYear}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'framework' && (
            <div className="space-y-4">
              <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-700 leading-relaxed">
                {t.frameworkIntro}
              </div>

              <div className="grid gap-2.5">
                {FOUR_STEP_FRAMEWORK_BILINGUAL.map(step => (
                  <div
                    key={step.step}
                    className="p-3.5 bg-white border border-neutral-200 rounded-lg shadow-2xs hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-neutral-900 text-white text-xs font-mono font-semibold flex items-center justify-center">
                          {step.step}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900">
                          {language === 'zh' ? step.titleZh : step.titleEn}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-600 bg-neutral-100 border border-neutral-200/60 px-2 py-0.5 rounded">
                        {language === 'zh' ? step.durationZh : step.durationEn}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-2 pl-7 leading-relaxed">
                      {language === 'zh' ? step.focusZh : step.focusEn}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
          <span className="text-[11px]">{t.source}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors text-xs font-medium shadow-2xs"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
