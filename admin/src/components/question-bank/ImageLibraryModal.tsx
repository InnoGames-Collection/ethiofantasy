import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Plus,
  Check,
  Copy,
  Image as ImageIcon,
  Tag,
  ExternalLink,
  Layers,
  Sparkles,
} from 'lucide-react';
import { QuestionImage } from '../../types';
import { api } from '../../services/api';

interface ImageLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectImage?: (img: QuestionImage) => void;
  isSelectingForQuestion?: boolean;
}

export const ImageLibraryModal: React.FC<ImageLibraryModalProps> = ({
  isOpen,
  onClose,
  onSelectImage,
  isSelectingForQuestion = false,
}) => {
  const [images, setImages] = useState<QuestionImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchImages = async () => {
      try {
        setLoading(true);
        const data = await api.getQuizImages();
        setImages(data || []);
      } catch (err) {
        console.error('Failed to load images from PostgreSQL:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchImages();
  }, [isOpen]);

  // Add new image state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newAlt, setNewAlt] = useState('');
  const [newCategory, setNewCategory] = useState<QuestionImage['category']>('GENERAL');
  const [newTags, setNewTags] = useState('');

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Photos' },
    { id: 'STADIUMS', label: 'Stadiums' },
    { id: 'PLAYERS', label: 'Players' },
    { id: 'TROPHIES', label: 'Trophies' },
    { id: 'ETHIOPIAN', label: 'Ethiopian' },
    { id: 'MATCHES', label: 'Match Moments' },
    { id: 'GENERAL', label: 'General' },
  ];

  const filteredImages = images.filter((img) => {
    const matchesCat = activeCategory === 'ALL' || img.category === activeCategory;
    const matchesSearch =
      img.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.altText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleCopyUrl = (url: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const handleAddNewImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) {
      alert('Please provide Image URL and Title.');
      return;
    }

    const created: QuestionImage = {
      id: `img-${Date.now()}`,
      url: newUrl.trim(),
      title: newTitle.trim(),
      altText: newAlt.trim() || newTitle.trim(),
      category: newCategory,
      dimensions: '1920x1080',
      fileSize: '1.2 MB',
      usageCount: 0,
      tags: newTags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean),
      credit: 'Custom Operator Asset',
      uploadedAt: new Date().toISOString(),
    };

    setImages([created, ...images]);
    setNewUrl('');
    setNewTitle('');
    setNewAlt('');
    setNewTags('');
    setIsAddOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden my-auto">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold tracking-tight">Football Image & Media Library</h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800">
                  {images.length} ASSETS
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Curated high-resolution football assets for quiz questions, levels, and daily tournaments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar: Category tabs, Search, Add Image */}
        <div className="px-6 py-3 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Categories */}
          <div className="flex space-x-1 overflow-x-auto no-scrollbar py-0.5">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-blue-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search images or tags..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:ring-1 focus:ring-blue-500 w-48 sm:w-56"
              />
            </div>

            {/* Add Image Toggle */}
            <button
              type="button"
              onClick={() => setIsAddOpen(!isAddOpen)}
              className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Image</span>
            </button>
          </div>
        </div>

        {/* Add Image Form Drawer */}
        {isAddOpen && (
          <form
            onSubmit={handleAddNewImage}
            className="p-4 bg-blue-50/70 border-b border-blue-200 animate-in fade-in duration-150 space-y-3 shrink-0 text-xs"
          >
            <div className="flex items-center justify-between font-bold text-blue-900">
              <span>Register New Football Image Asset</span>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">IMAGE URL</label>
                <input
                  type="url"
                  required
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">TITLE</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. World Cup Gold Trophy"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">CATEGORY</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as QuestionImage['category'])}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                >
                  <option value="STADIUMS">Stadiums</option>
                  <option value="PLAYERS">Players</option>
                  <option value="TROPHIES">Trophies</option>
                  <option value="ETHIOPIAN">Ethiopian Football</option>
                  <option value="MATCHES">Match Moments</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">TAGS (COMMA-SEPARATED)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. trophy, final, gold, winner"
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>
            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-800 text-white rounded-lg font-semibold hover:bg-blue-900 transition-colors shadow-xs"
              >
                Save to Library
              </button>
            </div>
          </form>
        )}

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {filteredImages.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <ImageIcon className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No images match your search</p>
              <p className="text-xs text-slate-400">Try selecting a different category or adding an image.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredImages.map((img) => (
                <div
                  key={img.id}
                  className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-blue-400 transition-all group flex flex-col"
                >
                  {/* Image container */}
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={img.url}
                      alt={img.altText}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-900/80 text-white backdrop-blur-xs">
                      {img.category}
                    </span>
                    <span className="absolute top-2 right-2 text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/90 text-slate-700 shadow-xs">
                      Used in {img.usageCount} Qs
                    </span>
                  </div>

                  {/* Metadata */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 truncate" title={img.title}>
                        {img.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {img.altText}
                      </p>
                      <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-1.5">
                        <span>{img.dimensions}</span>
                        <span>•</span>
                        <span>{img.fileSize}</span>
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1">
                      {img.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono"
                        >
                          #{tag}
                        </span>
                      ))}
                      {img.tags.length > 3 && (
                        <span className="text-[9px] text-slate-400 self-center">
                          +{img.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleCopyUrl(img.url, e)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors text-xs flex items-center space-x-1"
                        title="Copy direct URL"
                      >
                        {copiedUrl === img.url ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[10px] text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[10px]">URL</span>
                          </>
                        )}
                      </button>

                      {isSelectingForQuestion && onSelectImage ? (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectImage(img);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition-colors shadow-2xs"
                        >
                          Use Image
                        </button>
                      ) : (
                        <a
                          href={img.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-slate-100 rounded-md transition-colors"
                          title="Open original image"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Football Image assets are licensed for EthioFantasy game distribution.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors"
          >
            Close Library
          </button>
        </div>
      </div>
    </div>
  );
};
