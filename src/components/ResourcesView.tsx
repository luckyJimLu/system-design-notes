import React, { useState, useMemo } from 'react';
import { ADDITIONAL_RESOURCES } from '../data/resourcesData';
import { ExternalLink, BookOpen, FileText, Code2, Video, Search, ArrowLeft } from 'lucide-react';
import { Language } from '../types';
import { I18N_STRINGS } from '../data/i18n';

interface ResourcesViewProps {
  onBackToChapters: () => void;
  language?: Language;
}

export const ResourcesView: React.FC<ResourcesViewProps> = ({ onBackToChapters, language = 'en' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const t = I18N_STRINGS[language].resources;

  const topics = useMemo(() => {
    const set = new Set<string>();
    ADDITIONAL_RESOURCES.forEach(r => set.add(r.topic));
    return ['all', ...Array.from(set)];
  }, []);

  const filtered = useMemo(() => {
    return ADDITIONAL_RESOURCES.filter(r => {
      const matchesSearch =
        searchQuery === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.publisher.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.topic.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesType = selectedType === 'all' || r.type === selectedType;
      const matchesTopic = selectedTopic === 'all' || r.topic === selectedTopic;

      return matchesSearch && matchesType && matchesTopic;
    });
  }, [searchQuery, selectedType, selectedTopic]);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'paper':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'code':
        return <Code2 className="w-4 h-4 text-emerald-600" />;
      case 'video':
        return <Video className="w-4 h-4 text-purple-600" />;
      default:
        return <BookOpen className="w-4 h-4 text-amber-600" />;
    }
  };

  const getTypeName = (type: string) => {
    if (language === 'zh') {
      switch (type) {
        case 'all': return '全部';
        case 'paper': return '学术论文';
        case 'blog': return '工程博客';
        case 'code': return '源码/仓库';
        default: return type;
      }
    }
    return type;
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          type="button"
          onClick={onBackToChapters}
          className="flex items-center gap-1.5 text-xs font-medium text-neutral-700 hover:text-neutral-900 bg-white border border-neutral-200 hover:bg-neutral-50 px-3 py-1.5 rounded-md transition-colors shadow-2xs focus-visible:ring-2 focus-visible:ring-neutral-900"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {t.backBtn}
        </button>
      </div>

      <div className="mb-6">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-500">
          {t.badge}
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-1 tracking-tight">
          {t.title}
        </h1>
        <p className="text-sm text-neutral-600 mt-2 max-w-2xl leading-relaxed">
          {t.description}
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-neutral-200 rounded-md focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <select
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            className="text-xs bg-white border border-neutral-200 rounded-md px-2.5 py-2 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          >
            <option value="all">{t.allTopics}</option>
            {topics.filter(t => t !== 'all').map(topic => (
              <option key={topic} value={topic}>{topic}</option>
            ))}
          </select>

          <div className="flex items-center bg-neutral-200/70 p-0.5 rounded-md text-xs">
            {['all', 'paper', 'blog', 'code'].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`px-2.5 py-1 rounded text-xs transition-all ${
                  selectedType === type
                    ? 'bg-white text-neutral-900 font-semibold shadow-2xs'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                {getTypeName(type)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {filtered.map((item, idx) => (
          <a
            key={idx}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col justify-between p-4 bg-white border border-neutral-200 rounded-md hover:border-neutral-400 transition-colors"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200/60">
                  {item.topic}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-neutral-500 font-mono">
                  {getTypeIcon(item.type)}
                  <span className="capitalize text-[11px]">{getTypeName(item.type)}</span>
                </div>
              </div>

              <h3 className="text-sm font-semibold text-neutral-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                {item.title}
              </h3>

              <p className="text-xs text-neutral-600 mt-2 line-clamp-2 leading-relaxed">
                {item.summary}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-100 text-xs">
              <span className="text-neutral-500 font-mono text-[11px] truncate max-w-[200px]">
                {item.publisher}
              </span>
              <span className="inline-flex items-center gap-1 text-neutral-900 font-medium group-hover:underline">
                {t.readSource}
                <ExternalLink className="w-3 h-3 text-neutral-500" />
              </span>
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-neutral-500 text-sm">
          {t.noResults}
        </div>
      )}
    </div>
  );
};
