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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm animate-in fade-in duration-100"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="cheatsheet-modal-container"
        className="w-full max-w-3xl bg-white rounded-xl shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[88vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 bg-neutral-50/70">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-600">
              {t.badge}
            </span>
            <h3 className="text-base font-bold text-neutral-900">
              {t.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg hover:bg-neutral-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-neutral-200 px-6 bg-white gap-2 text-xs font-medium overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('latency')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'latency'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            {t.tabs.latency}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('power')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'power'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            {t.tabs.power}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('availability')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'availability'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            {t.tabs.availability}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('framework')}
            className={`flex items-center gap-1.5 py-3 px-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'framework'
                ? 'border-blue-600 text-blue-600 font-semibold'
                : 'border-transparent text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            {t.tabs.framework}
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-neutral-50/30">
          {activeTab === 'latency' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
                <strong>{language === 'zh' ? '核心要点：' : 'Key Takeaway:'}</strong> {t.latencyTakeaway}
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2.5 px-3">{t.latencyColOp}</th>
                      <th className="py-2.5 px-3">{t.latencyColTime}</th>
                      <th className="py-2.5 px-3">{t.latencyColNotes}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800">
                    {LATENCY_NUMBERS_BILINGUAL.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50/80">
                        <td className="py-2 px-3 font-medium">
                          {language === 'zh' ? item.opZh : item.opEn}
                        </td>
                        <td className="py-2 px-3 font-mono text-neutral-700 bg-neutral-50/50">
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
              <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-lg text-xs text-neutral-700 leading-relaxed">
                {t.powerIntro}
                <br />
                <code className="font-mono text-neutral-900">2^10 ≈ 10^3 (1 KB)</code> | <code className="font-mono text-neutral-900">2^20 ≈ 10^6 (1 MB)</code> | <code className="font-mono text-neutral-900">2^30 ≈ 10^9 (1 GB)</code> | <code className="font-mono text-neutral-900">2^40 ≈ 10^12 (1 TB)</code>
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2.5 px-3">{t.powerColPow}</th>
                      <th className="py-2.5 px-3">{t.powerColExact}</th>
                      <th className="py-2.5 px-3">{t.powerColApprox}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800">
                    {POWER_OF_TWO.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50/80">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{item.power}</td>
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
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900 leading-relaxed">
                {t.availIntro}
              </div>

              <div className="overflow-hidden border border-neutral-200 rounded-lg bg-white shadow-xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-neutral-100 text-neutral-700 font-semibold border-b border-neutral-200">
                      <th className="py-2.5 px-3">{t.availColTier}</th>
                      <th className="py-2.5 px-3">{t.availColDay}</th>
                      <th className="py-2.5 px-3">{t.availColYear}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 text-neutral-800">
                    {AVAILABILITY_LEVELS.map((item, i) => (
                      <tr key={i} className="hover:bg-neutral-50/80">
                        <td className="py-2.5 px-3 font-semibold text-emerald-800">{item.availability}</td>
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
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-purple-900 leading-relaxed">
                {t.frameworkIntro}
              </div>

              <div className="grid gap-3">
                {FOUR_STEP_FRAMEWORK_BILINGUAL.map(step => (
                  <div
                    key={step.step}
                    className="p-3.5 bg-white border border-neutral-200 rounded-lg shadow-xs hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 text-xs font-bold flex items-center justify-center">
                          {step.step}
                        </span>
                        <h4 className="text-sm font-semibold text-neutral-900">
                          {language === 'zh' ? step.titleZh : step.titleEn}
                        </h4>
                      </div>
                      <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                        {language === 'zh' ? step.durationZh : step.durationEn}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-600 mt-2 pl-8 leading-relaxed">
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
          <span>{t.source}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-neutral-900 text-white rounded-md hover:bg-neutral-800 transition-colors text-xs font-medium"
          >
            {t.closeBtn}
          </button>
        </div>
      </div>
    </div>
  );
};
