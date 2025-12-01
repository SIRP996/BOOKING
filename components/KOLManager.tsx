import React, { useState } from 'react';
import { KOLProfile, Platform } from '../types';
import { Search, Star, Edit2, Trash2, Plus, User, Tag, Phone, MapPin, Youtube, Facebook, Instagram } from 'lucide-react';

interface KOLManagerProps {
  kols: KOLProfile[];
  onAdd: (kol: KOLProfile) => void;
  onEdit: (kol: KOLProfile) => void;
  onDelete: (id: string) => void;
}

const KOLManager: React.FC<KOLManagerProps> = ({ kols, onAdd, onEdit, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKOL, setEditingKOL] = useState<KOLProfile | null>(null);

  // Form State
  const [formData, setFormData] = useState<Partial<KOLProfile>>({});

  const filteredKOLs = kols.filter(k => 
    k.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.channelId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    k.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (kol?: KOLProfile) => {
    if (kol) {
      setEditingKOL(kol);
      setFormData(kol);
    } else {
      setEditingKOL(null);
      setFormData({
        name: '', channelId: '', platform: Platform.TIKTOK, followers: 0, rating: 3, tags: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKOL) {
      onEdit({ ...editingKOL, ...formData } as KOLProfile);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as KOLProfile);
    }
    setIsModalOpen(false);
  };

  const renderPlatformIcon = (p: Platform) => {
    switch (p) {
      case Platform.YOUTUBE: return <Youtube className="w-4 h-4 text-red-600" />;
      case Platform.FACEBOOK: return <Facebook className="w-4 h-4 text-blue-600" />;
      case Platform.TIKTOK: return <span className="text-black font-bold text-[10px]">TiK</span>;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  // Format Helpers
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) return '';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const parseNumber = (value: string) => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  const inputClass = "w-full p-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 outline-none placeholder-gray-400";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div className="relative w-full md:max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
           <input 
              type="text" 
              placeholder="Tìm kiếm KOL theo tên, tag..." 
              className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-400"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-purple-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-purple-700 shadow-lg shadow-purple-200 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm KOL
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredKOLs.map(kol => (
          <div key={kol.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all group relative flex flex-col h-full">
             <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                   <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center text-purple-600 font-bold text-lg shrink-0">
                      {kol.name.charAt(0).toUpperCase()}
                   </div>
                   <div className="min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm truncate" title={kol.name}>{kol.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 truncate">
                         {renderPlatformIcon(kol.platform)}
                         <span className="truncate">{kol.channelId}</span>
                      </div>
                   </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3 bg-white p-1 rounded-lg shadow-sm z-10">
                   <button onClick={() => handleOpenModal(kol)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit2 className="w-3.5 h-3.5" /></button>
                   <button onClick={() => onDelete(kol.id)} className="p-1.5 hover:bg-gray-100 rounded text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
             </div>
             
             <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="bg-gray-50 p-2 rounded-lg text-center">
                   <p className="text-[10px] text-gray-400 uppercase font-bold">Followers</p>
                   <p className="text-sm font-bold text-gray-800">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(kol.followers)}</p>
                </div>
                 <div className="bg-gray-50 p-2 rounded-lg text-center">
                   <p className="text-[10px] text-gray-400 uppercase font-bold">Rate Card</p>
                   <p className="text-sm font-bold text-gray-800">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(kol.rateCard || 0)}</p>
                </div>
             </div>

             <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-1">
                   {[1,2,3,4,5].map(star => (
                      <Star key={star} className={`w-3.5 h-3.5 ${star <= (kol.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                   ))}
                </div>
                {kol.tags && kol.tags.length > 0 && (
                   <div className="flex flex-wrap gap-1">
                      {kol.tags.map(tag => (
                         <span key={tag} className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded border border-blue-100">#{tag}</span>
                      ))}
                   </div>
                )}
                {kol.notes && (
                   <p className="text-xs text-gray-500 italic truncate bg-yellow-50 p-1.5 rounded border border-yellow-100">
                      Note: {kol.notes}
                   </p>
                )}
             </div>
          </div>
        ))}
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in duration-200 shadow-2xl">
              <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-purple-600" /> 
                  {editingKOL ? 'Cập nhật Hồ sơ KOL' : 'Thêm KOL mới'}
              </h2>
              <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên KOL <span className="text-red-500">*</span></label>
                    <input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">ID Kênh / Handle <span className="text-red-500">*</span></label>
                    <input type="text" required className={inputClass} value={formData.channelId} onChange={e => setFormData({...formData, channelId: e.target.value})} />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nền tảng</label>
                    <select className={inputClass} value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value as Platform})}>
                       {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Followers</label>
                    <input 
                        type="text" 
                        className={inputClass} 
                        value={formatNumber(formData.followers)} 
                        onChange={e => setFormData({...formData, followers: parseNumber(e.target.value)})} 
                        placeholder="0"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Rate Card (VND)</label>
                    <input 
                        type="text" 
                        className={inputClass} 
                        value={formatNumber(formData.rateCard)} 
                        onChange={e => setFormData({...formData, rateCard: parseNumber(e.target.value)})} 
                        placeholder="0"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Đánh giá (1-5)</label>
                    <input type="number" min="1" max="5" className={inputClass} value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value) || 0})} />
                 </div>
                 <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ghi chú (CRM)</label>
                    <textarea className={inputClass} placeholder="VD: Nhiệt tình, trả lời nhanh, hay delay..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} />
                 </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tags (cách nhau bởi dấu phẩy)</label>
                    <input type="text" className={inputClass} placeholder="VD: Beauty, Mom&Baby, Viral..." 
                      value={formData.tags?.join(', ')} 
                      onChange={e => setFormData({...formData, tags: e.target.value.split(',').map(t => t.trim())})} 
                    />
                 </div>
                 
                 <div className="md:col-span-2 flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 text-gray-600">Hủy</button>
                    <button type="submit" className="px-5 py-2.5 bg-purple-600 text-white rounded-lg text-sm font-bold hover:bg-purple-700 shadow-lg shadow-purple-200">Lưu Hồ Sơ</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default KOLManager;