import React, { useState } from 'react';
import { Campaign, Booking } from '../types';
import { Plus, Edit2, Trash2, Target, Calendar, DollarSign, BarChart3, Search } from 'lucide-react';

interface CampaignManagerProps {
  campaigns: Campaign[];
  bookings: Booking[];
  onAdd: (campaign: Campaign) => void;
  onEdit: (campaign: Campaign) => void;
  onDelete: (id: string) => void;
}

const CampaignManager: React.FC<CampaignManagerProps> = ({ campaigns, bookings, onAdd, onEdit, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState<Partial<Campaign>>({
    name: '',
    target: '',
    budget: 0,
    startDate: '',
    endDate: '',
    status: 'Planned',
    description: ''
  });

  // Calculate Spent for each campaign
  const getSpent = (campaignName: string) => {
    return bookings
      .filter(b => b.campaignName === campaignName)
      .reduce((sum, b) => sum + b.cost, 0);
  };

  const handleOpenModal = (campaign?: Campaign) => {
    if (campaign) {
      setEditingCampaign(campaign);
      setFormData(campaign);
    } else {
      setEditingCampaign(null);
      setFormData({
        name: '',
        target: '',
        budget: 0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'Planned',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCampaign) {
      onEdit({ ...editingCampaign, ...formData } as Campaign);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as Campaign);
    }
    setIsModalOpen(false);
  };

  // Formatters
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  const formatNumber = (num: number | undefined) => num ? new Intl.NumberFormat('en-US').format(num) : '';
  const parseNumber = (val: string) => parseInt(val.replace(/,/g, ''), 10) || 0;
  
  const filteredCampaigns = campaigns.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900";

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100 gap-4">
        <div className="relative w-full md:max-w-md">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
           <input 
              type="text" 
              placeholder="Tìm kiếm chiến dịch..." 
              className="w-full pl-10 p-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
           />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="w-full md:w-auto bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all"
        >
          <Plus className="w-4 h-4" /> Thêm Chiến Dịch
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map(campaign => {
          const spent = getSpent(campaign.name);
          const percent = campaign.budget > 0 ? (spent / campaign.budget) * 100 : 0;
          const isOverBudget = percent > 100;

          return (
            <div key={campaign.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all flex flex-col h-full group">
               <div className="flex justify-between items-start mb-4">
                  <div>
                      <h3 className="font-bold text-gray-800 text-lg truncate pr-2" title={campaign.name}>{campaign.name}</h3>
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase mt-1 ${
                          campaign.status === 'Active' ? 'bg-green-100 text-green-700' : 
                          campaign.status === 'Completed' ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-700'
                      }`}>
                          {campaign.status}
                      </span>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(campaign)} className="p-1.5 hover:bg-gray-100 rounded text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => onDelete(campaign.id)} className="p-1.5 hover:bg-gray-100 rounded text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
               </div>

               <div className="space-y-3 mb-4 flex-1">
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Target className="w-4 h-4 text-indigo-500" />
                      <span>Mục tiêu: <span className="font-medium">{campaign.target}</span></span>
                   </div>
                   <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      <span>{campaign.startDate} - {campaign.endDate}</span>
                   </div>
               </div>

               <div className="mt-auto bg-gray-50 p-3 rounded-lg border border-gray-100">
                   <div className="flex justify-between items-end mb-2">
                       <div>
                           <p className="text-[10px] text-gray-400 uppercase font-bold">Đã chi / Ngân sách</p>
                           <p className="text-sm font-bold text-gray-800">
                               {formatCurrency(spent)} <span className="text-gray-400 font-normal">/ {formatCurrency(campaign.budget)}</span>
                           </p>
                       </div>
                       <div className="text-right">
                           <span className={`text-xs font-bold ${isOverBudget ? 'text-red-500' : 'text-green-600'}`}>
                               {percent.toFixed(1)}%
                           </span>
                       </div>
                   </div>
                   <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                       <div 
                          className={`h-full rounded-full transition-all duration-500 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(percent, 100)}%` }}
                       ></div>
                   </div>
               </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <h2 className="text-xl font-bold mb-6 text-gray-800 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    {editingCampaign ? 'Cập nhật Chiến Dịch' : 'Tạo Chiến Dịch Mới'}
                </h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Tên Chiến Dịch <span className="text-red-500">*</span></label>
                        <input type="text" required className={inputClass} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Ra mắt BST Hè 2025" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mục Tiêu (KPI) <span className="text-red-500">*</span></label>
                        <input type="text" required className={inputClass} value={formData.target} onChange={e => setFormData({...formData, target: e.target.value})} placeholder="VD: 1M Views, Tăng nhận diện..." />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngân sách (VND) <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            required 
                            className={inputClass} 
                            value={formatNumber(formData.budget)} 
                            onChange={e => setFormData({...formData, budget: parseNumber(e.target.value)})} 
                            placeholder="0" 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngày Bắt Đầu</label>
                            <input type="date" required className={inputClass} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Ngày Kết Thúc</label>
                            <input type="date" required className={inputClass} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Trạng Thái</label>
                        <select className={inputClass} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                            <option value="Planned">Dự kiến</option>
                            <option value="Active">Đang chạy</option>
                            <option value="Completed">Đã kết thúc</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Mô tả thêm</label>
                        <textarea className={inputClass} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Ghi chú chi tiết về chiến dịch..."></textarea>
                    </div>
                    
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 text-gray-600">Hủy</button>
                        <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200">Lưu Chiến Dịch</button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default CampaignManager;