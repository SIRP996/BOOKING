import React, { useState, useEffect } from 'react';
import { Booking, BookingStatus, BookingType, Format, KOLInfo, KOLProfile, PaymentStatus, PerformanceMetrics, Platform, Campaign } from '../types';
import { Save, X, Calendar, Link as LinkIcon, AlertCircle, DollarSign, BarChart2, User, Search, Target } from 'lucide-react';

interface BookingFormProps {
  initialData?: Booking;
  kolLibrary?: KOLProfile[]; // CRM Data
  campaigns?: Campaign[]; // Campaign Data
  bookings?: Booking[]; // All bookings to calc current spent
  onSave: (booking: Booking) => void;
  onCancel: () => void;
}

const emptyKOL: KOLInfo = {
  name: '',
  channelId: '',
  address: '',
  phone: '',
  followers: 0,
};

const emptyPerformance: PerformanceMetrics = {
    views: 0, likes: 0, comments: 0, shares: 0, cpv: 0, cpe: 0
};

const getCurrentDate = () => new Date().toISOString().split('T')[0];

const BookingForm: React.FC<BookingFormProps> = ({ initialData, kolLibrary = [], campaigns = [], bookings = [], onSave, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'finance' | 'performance'>('info');
  
  const [formData, setFormData] = useState<Partial<Booking>>(
    initialData || {
      campaignName: '',
      productName: '',
      kol: { ...emptyKOL },
      cost: 0,
      deposit: 0,
      paymentStatus: PaymentStatus.UNPAID,
      content: '',
      pic: '',
      platform: Platform.TIKTOK,
      format: Format.VIDEO,
      type: BookingType.SEEDING,
      status: BookingStatus.CONTACTED,
      startDate: getCurrentDate(),
      airDate: '',
      postLink: '',
      note: '',
      performance: { ...emptyPerformance },
      createdAt: Date.now(),
    }
  );

  // CRM Search State
  const [showKOLSuggestions, setShowKOLSuggestions] = useState(false);
  const [kolSearchTerm, setKolSearchTerm] = useState('');

  // Calculations
  const remainingCost = (formData.cost || 0) - (formData.deposit || 0);
  
  // Campaign Budget Context
  const selectedCampaign = campaigns.find(c => c.name === formData.campaignName);
  const campaignSpent = selectedCampaign 
    ? bookings.filter(b => b.campaignName === selectedCampaign.name && b.id !== formData.id).reduce((sum, b) => sum + b.cost, 0)
    : 0;
  const campaignRemainingBudget = selectedCampaign ? selectedCampaign.budget - campaignSpent : 0;
  const willOverBudget = selectedCampaign && (campaignSpent + (formData.cost || 0) > selectedCampaign.budget);

  // Auto calculate CPV/CPE when performance changes
  useEffect(() => {
    if (formData.performance && formData.cost) {
        const views = formData.performance.views || 0;
        const engagement = (formData.performance.likes || 0) + (formData.performance.comments || 0) + (formData.performance.shares || 0);
        
        setFormData(prev => ({
            ...prev,
            performance: {
                ...prev.performance!,
                cpv: views > 0 ? Math.round(prev.cost! / views) : 0,
                cpe: engagement > 0 ? Math.round(prev.cost! / engagement) : 0
            }
        }));
    }
  }, [formData.performance?.views, formData.performance?.likes, formData.performance?.comments, formData.cost]);


  const updateKOL = (field: keyof KOLInfo, value: any) => {
    setFormData(prev => ({
      ...prev,
      kol: { ...prev.kol!, [field]: value }
    }));
  };

  const selectKOLFromLibrary = (profile: KOLProfile) => {
      setFormData(prev => ({
          ...prev,
          kol: {
              id: profile.id,
              name: profile.name,
              channelId: profile.channelId,
              followers: profile.followers,
              phone: profile.phone || '',
              address: profile.address || '',
          },
          platform: profile.platform,
      }));
      setShowKOLSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.campaignName && formData.kol?.name) {
      onSave(formData as Booking);
    }
  };

  // --- NUMBER FORMATTING HELPERS ---
  const formatNumber = (num: number | undefined) => {
    if (num === undefined || num === null || isNaN(num)) return '';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);

  const parseNumber = (value: string) => {
    return parseInt(value.replace(/,/g, ''), 10) || 0;
  };

  const inputClass = "w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400 transition-shadow text-sm";
  const labelClass = "block text-xs font-semibold text-gray-700 mb-1 uppercase tracking-wide";

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 max-w-5xl mx-auto flex flex-col h-[90vh]">
      
      {/* Header */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            {initialData ? 'Cập nhật Booking' : 'Tạo Booking Mới'}
            {initialData && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-normal">#{initialData.id.slice(-4)}</span>}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-6 h-6" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 px-6">
          <button 
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'info' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <User className="w-4 h-4"/> Thông tin chung
          </button>
           <button 
            onClick={() => setActiveTab('finance')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'finance' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <DollarSign className="w-4 h-4"/> Tài chính & Thanh toán
          </button>
           <button 
            onClick={() => setActiveTab('performance')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'performance' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
             <BarChart2 className="w-4 h-4"/> Hiệu quả & Báo cáo
          </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* --- TAB 1: INFO --- */}
        {activeTab === 'info' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* Campaign */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="md:col-span-2">
                    <label className={labelClass}>Chiến Dịch <span className="text-red-500">*</span></label>
                    <select 
                        required 
                        className={inputClass} 
                        value={formData.campaignName} 
                        onChange={e => setFormData({...formData, campaignName: e.target.value})}
                    >
                        <option value="">-- Chọn chiến dịch --</option>
                        {campaigns.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                    </select>
                    
                    {/* Campaign Budget Context */}
                    {selectedCampaign && (
                        <div className={`mt-2 p-2 rounded text-xs border flex justify-between items-center ${willOverBudget ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5" />
                                <span>Ngân sách: <b>{formatCurrency(selectedCampaign.budget)}</b></span>
                            </div>
                            <div>
                                Còn lại: <b>{formatCurrency(campaignRemainingBudget)}</b>
                            </div>
                        </div>
                    )}
                </div>
                 <div>
                    <label className={labelClass}>Sản Phẩm <span className="text-red-500">*</span></label>
                    <input required type="text" className={inputClass} value={formData.productName} onChange={e => setFormData({...formData, productName: e.target.value})} placeholder="VD: Mask tràm trà" />
                </div>
            </div>

            {/* KOL Selection with CRM */}
            <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 relative">
                <h3 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">Thông tin KOL</h3>
                
                {/* Search / Suggestion Box */}
                <div className="mb-4 relative">
                    <label className={labelClass}>Tìm kiếm từ thư viện KOL</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            className={`${inputClass} pl-9`} 
                            placeholder="Nhập tên KOL để tìm..." 
                            value={kolSearchTerm}
                            onChange={(e) => {
                                setKolSearchTerm(e.target.value);
                                setShowKOLSuggestions(true);
                            }}
                            onFocus={() => setShowKOLSuggestions(true)}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        {showKOLSuggestions && kolSearchTerm && (
                            <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-lg border border-gray-100 z-50 max-h-48 overflow-y-auto mt-1">
                                {kolLibrary.filter(k => k.name.toLowerCase().includes(kolSearchTerm.toLowerCase())).map(k => (
                                    <div 
                                        key={k.id} 
                                        className="p-3 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                        onClick={() => selectKOLFromLibrary(k)}
                                    >
                                        <div className="font-bold text-gray-800 text-sm">{k.name}</div>
                                        <div className="text-xs text-gray-500">{k.channelId} • {k.platform}</div>
                                    </div>
                                ))}
                                {kolLibrary.filter(k => k.name.toLowerCase().includes(kolSearchTerm.toLowerCase())).length === 0 && (
                                    <div className="p-3 text-xs text-gray-500 italic text-center">Không tìm thấy KOL</div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-1">
                        <label className={labelClass}>Tên KOL <span className="text-red-500">*</span></label>
                        <input required type="text" className={inputClass} value={formData.kol?.name} onChange={e => updateKOL('name', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>ID Kênh / Link</label>
                        <input type="text" className={inputClass} value={formData.kol?.channelId} onChange={e => updateKOL('channelId', e.target.value)} />
                    </div>
                    <div>
                        <label className={labelClass}>Followers</label>
                        <input 
                            type="text" 
                            className={inputClass} 
                            value={formatNumber(formData.kol?.followers)} 
                            onChange={e => updateKOL('followers', parseNumber(e.target.value))} 
                            placeholder="0"
                        />
                    </div>
                    <div>
                        <label className={labelClass}>SDT / Liên hệ</label>
                        <input type="text" className={inputClass} value={formData.kol?.phone} onChange={e => updateKOL('phone', e.target.value)} />
                    </div>
                     <div className="md:col-span-2">
                        <label className={labelClass}>Địa chỉ</label>
                        <input type="text" className={inputClass} value={formData.kol?.address} onChange={e => updateKOL('address', e.target.value)} />
                    </div>
                </div>
            </div>

            {/* Details */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                 <div>
                    <label className={labelClass}>Loại Booking</label>
                    <select className={inputClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as BookingType})}>
                        {Object.values(BookingType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClass}>Nền tảng</label>
                    <select className={inputClass} value={formData.platform} onChange={e => setFormData({...formData, platform: e.target.value as Platform})}>
                        {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClass}>Hình thức</label>
                    <select className={inputClass} value={formData.format} onChange={e => setFormData({...formData, format: e.target.value as Format})}>
                        {Object.values(Format).map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                </div>
                 <div>
                    <label className={labelClass}>Ngày Bắt Đầu</label>
                    <input type="date" className={inputClass} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                 <div>
                    <label className={labelClass}>Ngày Lên Bài (Dự kiến)</label>
                    <input type="date" className={inputClass} value={formData.airDate} onChange={e => setFormData({...formData, airDate: e.target.value})} />
                </div>
                <div>
                     <label className={labelClass}>PIC</label>
                    <input type="text" className={inputClass} value={formData.pic} onChange={e => setFormData({...formData, pic: e.target.value})} />
                </div>
            </div>
             <div>
                 <div className="flex justify-between items-center mb-1">
                    <label className={labelClass}>Trạng thái</label>
                 </div>
                 <select className={`${inputClass} font-bold`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as BookingStatus})}>
                    {Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
            </div>
            <div>
                 <label className={labelClass}>Nội dung / Brief</label>
                 <textarea className={`${inputClass} h-24 resize-none`} value={formData.content} onChange={e => setFormData({...formData, content: e.target.value})} />
            </div>
        </div>
        )}

        {/* --- TAB 2: FINANCE --- */}
        {activeTab === 'finance' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                     <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">Chi phí Booking</h3>
                     <div className="space-y-4">
                         <div>
                            <label className={labelClass}>Tổng Chi Phí (VND)</label>
                            <input 
                                type="text" 
                                className={`w-full p-3 text-lg font-bold border rounded-lg bg-white ${willOverBudget ? 'text-red-600 border-red-300 ring-1 ring-red-200' : 'text-blue-600 border-gray-300'}`} 
                                value={formatNumber(formData.cost)} 
                                onChange={e => setFormData({...formData, cost: parseNumber(e.target.value)})} 
                                placeholder="0"
                            />
                            {willOverBudget && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> Cảnh báo: Vượt quá ngân sách chiến dịch còn lại</p>
                            )}
                         </div>
                         <div>
                            <label className={labelClass}>Đã Tạm Ứng / Cọc (VND)</label>
                            <input 
                                type="text" 
                                className="w-full p-3 text-gray-700 border border-gray-300 rounded-lg bg-white" 
                                value={formatNumber(formData.deposit)} 
                                onChange={e => setFormData({...formData, deposit: parseNumber(e.target.value)})} 
                                placeholder="0"
                            />
                         </div>
                     </div>
                 </div>

                 <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                     <h3 className="font-bold text-green-800 mb-4 flex items-center gap-2">Theo dõi Thanh toán</h3>
                      <div className="space-y-4">
                         <div>
                            <label className={labelClass}>Số tiền còn lại (Balance)</label>
                            <div className="w-full p-3 text-lg font-bold text-red-500 bg-white/50 border border-green-200 rounded-lg">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(remainingCost)}
                            </div>
                         </div>
                         <div>
                            <label className={labelClass}>Trạng thái Thanh toán</label>
                            <select className="w-full p-3 border border-green-200 rounded-lg bg-white text-green-900 font-medium outline-none" 
                                value={formData.paymentStatus} onChange={e => setFormData({...formData, paymentStatus: e.target.value as PaymentStatus})}>
                                {Object.values(PaymentStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                         </div>
                     </div>
                 </div>
             </div>
             
             <div>
                 <label className={labelClass}>Thông tin chuyển khoản / Ghi chú thanh toán</label>
                 <textarea className={`${inputClass} h-24`} placeholder="STK, Tên ngân hàng..." value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
             </div>
        </div>
        )}

        {/* --- TAB 3: PERFORMANCE --- */}
        {activeTab === 'performance' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
             <div>
                <label className={labelClass}>Link Kết Quả (Bài viết/Video)</label>
                <div className="relative">
                    <input type="url" className={inputClass} placeholder="https://..." value={formData.postLink} onChange={e => setFormData({...formData, postLink: e.target.value})} />
                    <LinkIcon className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4"/>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <label className="text-xs text-purple-600 font-bold uppercase mb-1 block">Views</label>
                    <input 
                        type="text" 
                        className="w-full bg-white border border-purple-200 rounded p-2 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-purple-500"
                        value={formatNumber(formData.performance?.views)} 
                        onChange={e => setFormData({...formData, performance: {...formData.performance!, views: parseNumber(e.target.value)}})} 
                    />
                 </div>
                 <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <label className="text-xs text-purple-600 font-bold uppercase mb-1 block">Likes</label>
                    <input 
                        type="text" 
                        className="w-full bg-white border border-purple-200 rounded p-2 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-purple-500"
                        value={formatNumber(formData.performance?.likes)} 
                        onChange={e => setFormData({...formData, performance: {...formData.performance!, likes: parseNumber(e.target.value)}})} 
                    />
                 </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <label className="text-xs text-purple-600 font-bold uppercase mb-1 block">Comments</label>
                    <input 
                        type="text" 
                        className="w-full bg-white border border-purple-200 rounded p-2 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-purple-500"
                        value={formatNumber(formData.performance?.comments)} 
                        onChange={e => setFormData({...formData, performance: {...formData.performance!, comments: parseNumber(e.target.value)}})} 
                    />
                 </div>
                  <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                    <label className="text-xs text-purple-600 font-bold uppercase mb-1 block">Shares</label>
                    <input 
                        type="text" 
                        className="w-full bg-white border border-purple-200 rounded p-2 font-bold text-gray-800 outline-none focus:ring-1 focus:ring-purple-500"
                        value={formatNumber(formData.performance?.shares)} 
                        onChange={e => setFormData({...formData, performance: {...formData.performance!, shares: parseNumber(e.target.value)}})} 
                    />
                 </div>
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">CPV (Chi phí / Views)</span>
                    <span className="text-xl font-bold text-blue-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.performance?.cpv || 0)}</span>
                </div>
                 <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-600">CPE (Chi phí / Tương tác)</span>
                    <span className="text-xl font-bold text-purple-600">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(formData.performance?.cpe || 0)}</span>
                </div>
             </div>
        </div>
        )}

      </form>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
            <button type="button" onClick={onCancel} className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium text-sm">
                Hủy bỏ
            </button>
            <button onClick={handleSubmit} type="button" className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 text-sm">
                <Save className="w-4 h-4" />
                Lưu Booking
            </button>
      </div>
    </div>
  );
};

export default BookingForm;