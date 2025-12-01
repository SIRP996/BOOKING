import React, { useState, useMemo, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Booking, BookingStatus, Platform, BookingType, PaymentStatus } from '../types';
import { Edit2, Trash2, Search, Filter, Calendar, Link as LinkIcon, AlertCircle, RefreshCcw, ArrowUpDown, ArrowUp, ArrowDown, Check, ChevronDown, XCircle, Globe, Save, Users, ArrowRight, List, LayoutGrid, Eye, DollarSign, BarChart2, FileText, User, X } from 'lucide-react';
import CalendarView from './CalendarView';

interface BookingListProps {
  bookings: Booking[];
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, newStatus: BookingStatus) => void;
  onUpdateLink: (id: string, link: string) => void;
}

type SortKey = keyof Booking | 'kol.name' | 'kol.followers';

interface SortConfig {
  key: SortKey;
  direction: 'asc' | 'desc';
}

// --- CONFIG FLOW TRẠNG THÁI ---
const STATUS_FLOW = [
  { status: BookingStatus.CONTACTED, label: '1. Đã liên hệ', color: 'bg-blue-500', text: 'text-blue-600 bg-blue-50 border-blue-200' },
  { status: BookingStatus.AGREED, label: '2. KOL Đồng ý', color: 'bg-yellow-500', text: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  { status: BookingStatus.CONFIRMED, label: '3. Xác nhận Book', color: 'bg-orange-500', text: 'text-orange-600 bg-orange-50 border-orange-200' },
  { status: BookingStatus.SAMPLE_SENT, label: '4. Đã gửi mẫu', color: 'bg-purple-500', text: 'text-purple-600 bg-purple-50 border-purple-200' },
  { status: BookingStatus.COMPLETED, label: '5. Hoàn thành', color: 'bg-emerald-500', text: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
];

// --- COMPONENT: STATUS STEPPER ---
const BookingStatusStepper = ({ currentStatus, onChange }: { currentStatus: BookingStatus, onChange: (s: BookingStatus) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setCoords({
            top: rect.bottom + 4, // 4px gap
            left: rect.left,
            width: rect.width
        });
    }
    setIsOpen(!isOpen);
  };

  // Close when scrolling to avoid detached menu
  useEffect(() => {
    if (isOpen) {
        const handleScroll = () => setIsOpen(false);
        window.addEventListener('scroll', handleScroll, true);
        window.addEventListener('resize', handleScroll);
        return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', handleScroll);
        };
    }
  }, [isOpen]);

  const currentIndex = STATUS_FLOW.findIndex(s => s.status === currentStatus);
  const isCancelled = currentStatus === BookingStatus.CANCELLED;

  const currentConfig = STATUS_FLOW.find(s => s.status === currentStatus);
  const badgeStyle = isCancelled 
    ? 'bg-red-50 text-red-600 border-red-200' 
    : (currentConfig?.text || 'bg-gray-50 text-gray-600 border-gray-200');

  return (
    <>
        <div ref={buttonRef} onClick={toggleDropdown} className={`cursor-pointer rounded-lg border px-2.5 py-1.5 transition-all hover:shadow-sm select-none ${badgeStyle}`}>
            <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] font-bold truncate uppercase tracking-tight">{isCancelled ? 'Đã Hủy' : currentStatus}</span>
                <ChevronDown className="w-3 h-3 opacity-50" />
            </div>
            {!isCancelled && (
                <div className="flex gap-0.5">
                    {STATUS_FLOW.map((step, idx) => (
                        <div key={step.status} className={`h-1 flex-1 rounded-full transition-colors ${idx <= currentIndex ? step.color : 'bg-gray-200/60'}`}></div>
                    ))}
                </div>
            )}
            {isCancelled && <div className="h-1 w-full bg-red-400 rounded-full"></div>}
        </div>
        
        {/* Render Dropdown via Portal to escape table overflow */}
        {isOpen && createPortal(
            <div className="fixed inset-0 z-[9999] isolate">
                {/* Backdrop to close */}
                <div className="absolute inset-0 bg-transparent" onClick={() => setIsOpen(false)} />
                
                {/* Menu */}
                <div 
                    className="absolute bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden ring-1 ring-black ring-opacity-5 animate-in fade-in zoom-in-95 duration-100 flex flex-col"
                    style={{ 
                        top: coords.top, 
                        left: coords.left,
                        minWidth: '240px' // Đảm bảo đủ rộng để hiển thị
                    }}
                >
                    <div className="p-2 space-y-1">
                        {STATUS_FLOW.map((step, idx) => (
                            <div key={step.status} onClick={() => { onChange(step.status); setIsOpen(false); }} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border ${idx <= currentIndex ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-400 bg-gray-50'}`}>
                                    {idx + 1}
                                </div>
                                <span className={`text-xs font-medium ${currentStatus === step.status ? 'text-blue-700 font-bold' : 'text-gray-700'}`}>{step.label}</span>
                                {currentStatus === step.status && <Check className="w-3 h-3 text-blue-600 ml-auto" />}
                            </div>
                        ))}
                        <div className="h-px bg-gray-100 my-1"></div>
                        <div onClick={() => { onChange(BookingStatus.CANCELLED); setIsOpen(false); }} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-red-50 text-red-600 text-xs font-medium group">
                             <XCircle className="w-4 h-4" />
                             <span>Hủy Booking</span>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </>
  );
};

// --- COMPONENT: BOOKING DETAIL MODAL ---
const BookingDetailModal = ({ booking, onClose }: { booking: Booking, onClose: () => void }) => {
    if (!booking) return null;

    const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
    const formatNumber = (v: number) => new Intl.NumberFormat('en-US').format(v);
    const formatDate = (d?: string) => d ? d.split('-').slice(1).reverse().join('/') : 'N/A';

    return createPortal(
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-blue-50 to-indigo-50">
                    <div>
                        <div className="flex items-center gap-3">
                            <h2 className="text-lg font-bold text-gray-800">{booking.campaignName}</h2>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${booking.status === BookingStatus.COMPLETED ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {booking.status}
                            </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">ID: #{booking.id} • Tạo ngày {new Date(booking.createdAt).toLocaleDateString('vi-VN')}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Card 1: KOL Info */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><User className="w-4 h-4 text-purple-500" /> Thông tin KOL</h3>
                            <div className="flex items-start gap-4">
                                <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-2xl">
                                    {booking.kol.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="space-y-1">
                                    <div className="font-bold text-gray-900 text-lg">{booking.kol.name}</div>
                                    <div className="text-sm text-blue-600 font-medium">{booking.kol.channelId}</div>
                                    <div className="text-xs text-gray-500 flex items-center gap-2">
                                        <Users className="w-3 h-3" /> {formatNumber(booking.kol.followers)} Followers
                                    </div>
                                    <div className="text-xs text-gray-500 mt-2">
                                        <p>SĐT: {booking.kol.phone || '---'}</p>
                                        <p>Đ/C: {booking.kol.address || '---'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Card 2: Campaign Info */}
                        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                             <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> Chi tiết Chiến dịch</h3>
                             <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Sản phẩm</p>
                                    <p className="font-medium text-gray-800">{booking.productName}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">PIC</p>
                                    <p className="font-medium text-gray-800">{booking.pic || 'Chưa gán'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Nền tảng / Hình thức</p>
                                    <p className="font-medium text-gray-800">{booking.platform} • {booking.format}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Loại Booking</p>
                                    <span className="inline-block px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600">{booking.type}</span>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-[10px] text-gray-400 uppercase font-bold">Timeline</p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="bg-blue-50 px-2 py-1 rounded border border-blue-100 text-blue-700 text-xs">Bắt đầu: {formatDate(booking.startDate)}</div>
                                        <ArrowRight className="w-3 h-3 text-gray-300" />
                                        <div className="bg-green-50 px-2 py-1 rounded border border-green-100 text-green-700 text-xs">Lên bài: {formatDate(booking.airDate)}</div>
                                    </div>
                                </div>
                             </div>
                        </div>

                         {/* Card 3: Finance */}
                         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                             <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><DollarSign className="w-4 h-4 text-green-500" /> Tài chính & Thanh toán</h3>
                             <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs text-gray-500">Tổng chi phí</p>
                                    <p className="text-xl font-bold text-gray-900">{formatCurrency(booking.cost)}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-500">Đã cọc</p>
                                    <p className="text-sm font-bold text-gray-600">{formatCurrency(booking.deposit)}</p>
                                </div>
                             </div>
                             
                             <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 mb-3">
                                 <div className="flex justify-between items-center">
                                     <span className="text-xs font-bold text-gray-500">CÒN LẠI</span>
                                     <span className="text-base font-bold text-red-500">{formatCurrency(booking.cost - booking.deposit)}</span>
                                 </div>
                             </div>

                             <div>
                                 <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Trạng thái thanh toán</p>
                                 <span className={`inline-block w-full text-center py-1.5 rounded-lg text-xs font-bold border ${
                                     booking.paymentStatus === PaymentStatus.PAID ? 'bg-green-100 text-green-700 border-green-200' :
                                     booking.paymentStatus === PaymentStatus.DEPOSITED ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                     'bg-red-50 text-red-600 border-red-200'
                                 }`}>
                                     {booking.paymentStatus}
                                 </span>
                             </div>
                         </div>

                         {/* Card 4: Performance */}
                         <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                             <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2"><BarChart2 className="w-4 h-4 text-orange-500" /> Hiệu quả & Link</h3>
                             
                             <div className="mb-4">
                                <p className="text-[10px] text-gray-400 uppercase font-bold mb-1">Link bài viết</p>
                                {booking.postLink ? (
                                    <a href={booking.postLink} target="_blank" className="text-sm text-blue-600 hover:underline break-all flex items-start gap-1">
                                        <Globe className="w-3.5 h-3.5 mt-0.5 shrink-0" /> {booking.postLink}
                                    </a>
                                ) : (
                                    <span className="text-sm text-gray-400 italic">Chưa cập nhật link</span>
                                )}
                             </div>

                             <div className="grid grid-cols-3 gap-2 text-center">
                                 <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                     <p className="text-[10px] text-orange-600 font-bold uppercase">Views</p>
                                     <p className="font-bold text-gray-800">{formatNumber(booking.performance?.views || 0)}</p>
                                 </div>
                                 <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                     <p className="text-[10px] text-orange-600 font-bold uppercase">Likes</p>
                                     <p className="font-bold text-gray-800">{formatNumber(booking.performance?.likes || 0)}</p>
                                 </div>
                                  <div className="bg-orange-50 p-2 rounded border border-orange-100">
                                     <p className="text-[10px] text-orange-600 font-bold uppercase">CPV</p>
                                     <p className="font-bold text-gray-800">{booking.performance?.cpv || 0}đ</p>
                                 </div>
                             </div>
                         </div>

                         {/* Full width: Content/Brief */}
                         <div className="md:col-span-2 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                             <h3 className="text-sm font-bold text-gray-800 mb-2">Nội dung / Ghi chú</h3>
                             <p className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[80px]">
                                 {booking.content || booking.note || 'Không có ghi chú thêm.'}
                             </p>
                         </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 shadow-sm">
                        Đóng
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};


const BookingList: React.FC<BookingListProps> = ({ bookings, onEdit, onDelete, onStatusChange, onUpdateLink }) => {
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // --- FILTER STATES ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCampaign, setFilterCampaign] = useState<string>('All');
  const [filterProduct, setFilterProduct] = useState<string>('All');
  const [filterPlatform, setFilterPlatform] = useState<string>('All');
  const [filterType, setFilterType] = useState<string>('All');
  const [filterPIC, setFilterPIC] = useState<string>('All');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [filterCostMin, setFilterCostMin] = useState<string>('');
  const [filterCostMax, setFilterCostMax] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'createdAt', direction: 'desc' });
  const [linkModalOpen, setLinkModalOpen] = useState(false);
  const [currentLinkId, setCurrentLinkId] = useState<string | null>(null);
  const [linkValue, setLinkValue] = useState('');
  
  // --- DETAIL VIEW STATE ---
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);

  // --- UNIQUE DATA ---
  const uniqueCampaigns = useMemo(() => Array.from(new Set(bookings.map(b => b.campaignName).filter(Boolean))), [bookings]);
  const uniqueProducts = useMemo(() => Array.from(new Set(bookings.map(b => b.productName).filter(Boolean))), [bookings]);
  const uniquePICs = useMemo(() => Array.from(new Set(bookings.map(b => b.pic).filter(Boolean))), [bookings]);

  // --- LOGIC ---
  const filteredAndSortedBookings = useMemo(() => {
    let result = bookings.filter(b => {
      const matchesSearch = 
        b.campaignName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.kol.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.productName.toLowerCase().includes(searchTerm.toLowerCase());

      const cost = b.cost;
      const min = filterCostMin ? parseInt(filterCostMin) : 0;
      const max = filterCostMax ? parseInt(filterCostMax) : Infinity;

      return matchesSearch &&
             (filterCampaign === 'All' || b.campaignName === filterCampaign) &&
             (filterProduct === 'All' || b.productName === filterProduct) &&
             (filterPlatform === 'All' || b.platform === filterPlatform) &&
             (filterType === 'All' || b.type === filterType) &&
             (filterPIC === 'All' || b.pic === filterPIC) &&
             (filterStatus === 'All' || b.status === filterStatus) &&
             (cost >= min && cost <= max);
    });

    result.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Booking];
        let bValue: any = b[sortConfig.key as keyof Booking];
        if (sortConfig.key === 'kol.name') { aValue = a.kol.name; bValue = b.kol.name; }
        else if (sortConfig.key === 'kol.followers') { aValue = a.kol.followers; bValue = b.kol.followers; }
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });
    return result;
  }, [bookings, searchTerm, filterCampaign, filterProduct, filterPlatform, filterType, filterPIC, filterStatus, filterCostMin, filterCostMax, sortConfig]);

  const handleSort = (key: SortKey) => setSortConfig(c => ({ key, direction: c.key === key && c.direction === 'asc' ? 'desc' : 'asc' }));
  const getSortIcon = (key: SortKey) => sortConfig.key !== key ? <ArrowUpDown className="w-3 h-3 opacity-30 ml-1"/> : sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 text-blue-600 ml-1"/> : <ArrowDown className="w-3 h-3 text-blue-600 ml-1"/>;
  const clearFilters = () => { setSearchTerm(''); setFilterCampaign('All'); setFilterProduct('All'); setFilterPlatform('All'); setFilterType('All'); setFilterPIC('All'); setFilterStatus('All'); setFilterCostMin(''); setFilterCostMax(''); };
  
  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Chiến dịch", "Sản phẩm", "KOL Name", "Followers", "Nền tảng", "Chi phí", "Trạng thái", "Ngày bắt đầu", "Ngày lên bài", "Link"];
    const rows = filteredAndSortedBookings.map(b => [
        `"${b.campaignName}"`, `"${b.productName}"`, `"${b.kol.name}"`, b.kol.followers, b.platform, b.cost, `"${b.status}"`, b.startDate, b.airDate || '', `"${b.postLink || ''}"`
    ]);
    const csvContent = "\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `booking_list_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenLinkModal = (id: string, currentLink?: string) => { setCurrentLinkId(id); setLinkValue(currentLink || ''); setLinkModalOpen(true); };
  const handleSaveLink = () => { if (currentLinkId) { onUpdateLink(currentLinkId, linkValue); setLinkModalOpen(false); }};
  const formatCurrency = (v: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(v);
  const filterInputClass = "w-full text-xs p-2.5 border border-gray-200 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 outline-none transition-shadow";

  return (
    <div className="space-y-6">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-5 gap-4">
                 <div className="relative flex-1 w-full md:w-auto max-w-md">
                    <input type="text" placeholder="Tìm kiếm..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white text-gray-900 placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                </div>
                <div className="flex gap-2 items-center">
                    {/* View Toggle */}
                    <div className="bg-gray-100 p-1 rounded-lg flex gap-1 mr-2">
                         <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Danh sách"><List className="w-4 h-4"/></button>
                         <button onClick={() => setViewMode('calendar')} className={`p-1.5 rounded-md transition-all ${viewMode === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`} title="Lịch"><Calendar className="w-4 h-4"/></button>
                    </div>
                    
                    <button onClick={clearFilters} className="text-gray-500 hover:text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5"><RefreshCcw className="w-3.5 h-3.5" /> Reset</button>
                    <button onClick={handleExportCSV} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-200">Xuất Excel</button>
                </div>
            </div>
            {viewMode === 'list' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                 <select className={filterInputClass} value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}><option value="All">Chiến dịch</option>{uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}</select>
                 <select className={filterInputClass} value={filterProduct} onChange={e => setFilterProduct(e.target.value)}><option value="All">Sản phẩm</option>{uniqueProducts.map(c => <option key={c} value={c}>{c}</option>)}</select>
                 <select className={filterInputClass} value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}><option value="All">Nền tảng</option>{Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}</select>
                 <select className={filterInputClass} value={filterType} onChange={e => setFilterType(e.target.value)}><option value="All">Loại</option>{Object.values(BookingType).map(t => <option key={t} value={t}>{t}</option>)}</select>
                 <select className={filterInputClass} value={filterPIC} onChange={e => setFilterPIC(e.target.value)}><option value="All">PIC</option>{uniquePICs.map(p => <option key={p} value={p}>{p}</option>)}</select>
                 <select className={filterInputClass} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}><option value="All">Trạng thái</option>{Object.values(BookingStatus).map(s => <option key={s} value={s}>{s}</option>)}</select>
                 <div className="flex items-center gap-1.5 min-w-[140px] bg-white rounded-lg border border-gray-200 px-2 py-0.5"><input type="number" placeholder="Từ" className="w-full text-xs py-2 bg-transparent outline-none text-gray-900 placeholder-gray-400" value={filterCostMin} onChange={e => setFilterCostMin(e.target.value)} /><span className="text-gray-300">-</span><input type="number" placeholder="Đến" className="w-full text-xs py-2 bg-transparent outline-none text-gray-900 placeholder-gray-400" value={filterCostMax} onChange={e => setFilterCostMax(e.target.value)} /></div>
            </div>
            )}
        </div>

        {viewMode === 'calendar' ? (
             <CalendarView bookings={filteredAndSortedBookings} />
        ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
                <tr className="bg-gray-50/80 text-gray-500 text-[11px] uppercase tracking-wider border-b border-gray-200">
                    <th className="p-4 font-semibold cursor-pointer" onClick={() => handleSort('campaignName')}>Info {getSortIcon('campaignName')}</th>
                    <th className="p-4 font-semibold cursor-pointer" onClick={() => handleSort('kol.name')}>KOL {getSortIcon('kol.name')}</th>
                    <th className="p-4 font-semibold text-right cursor-pointer" onClick={() => handleSort('kol.followers')}>Followers {getSortIcon('kol.followers')}</th>
                    <th className="p-4 font-semibold">Nền tảng</th>
                    <th className="p-4 font-semibold text-right cursor-pointer" onClick={() => handleSort('cost')}>Finance {getSortIcon('cost')}</th>
                    <th className="p-4 font-semibold text-right">Hiệu quả</th>
                    <th className="p-4 font-semibold">Trạng thái</th>
                    <th className="p-4 font-semibold cursor-pointer" onClick={() => handleSort('airDate')}>Timeline {getSortIcon('airDate')}</th>
                    <th className="p-4 font-semibold text-center w-24">Action</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
                {filteredAndSortedBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-blue-50/30 transition-colors group">
                    <td className="p-4 align-top max-w-[180px]">
                        <div className="font-bold text-gray-800 truncate cursor-pointer hover:text-blue-600" onClick={() => setViewingBooking(booking)} title={booking.campaignName}>{booking.campaignName}</div>
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-600 font-medium truncate max-w-full mt-1">{booking.productName}</span>
                    </td>
                    <td className="p-4 align-top">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">{booking.kol.name.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                                <div className="font-semibold text-gray-900 truncate" title={booking.kol.name}>{booking.kol.name}</div>
                                <div className="text-xs text-blue-500 truncate">{booking.kol.channelId}</div>
                            </div>
                        </div>
                    </td>
                    <td className="p-4 align-top text-right"><span className="px-2 py-1 rounded bg-gray-50 text-gray-700 text-xs font-bold font-mono">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(booking.kol.followers)}</span></td>
                    <td className="p-4 align-top">
                        <div className="flex flex-col gap-1">
                             <span className="text-xs font-medium">{booking.platform}</span>
                             <span className="text-[10px] text-gray-500">{booking.format}</span>
                        </div>
                    </td>
                    <td className="p-4 align-top text-right">
                        <div className="font-mono font-bold text-gray-900">{formatCurrency(booking.cost)}</div>
                        <div className={`text-[10px] font-medium mt-1 ${booking.paymentStatus === PaymentStatus.PAID ? 'text-green-600' : booking.paymentStatus === PaymentStatus.DEPOSITED ? 'text-orange-500' : 'text-red-500'}`}>
                            {booking.paymentStatus || 'Chưa TT'}
                        </div>
                    </td>
                    <td className="p-4 align-top text-right">
                        <div className="text-xs font-bold text-gray-800">{new Intl.NumberFormat('en-US', { notation: "compact" }).format(booking.performance?.views || 0)} views</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{booking.performance?.cpv ? `${booking.performance.cpv}đ/view` : '-'}</div>
                    </td>
                    <td className="p-4 align-top w-[200px]">
                        <BookingStatusStepper currentStatus={booking.status} onChange={(newStatus) => onStatusChange(booking.id, newStatus)} />
                    </td>
                    <td className="p-4 align-top">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{booking.startDate ? booking.startDate.split('-').slice(1).reverse().join('/') : '--'}</span>
                            <ArrowRight className="w-3 h-3 text-gray-300" />
                            <span className={`font-medium ${booking.airDate ? 'text-emerald-600' : 'text-orange-600'}`}>{booking.airDate ? booking.airDate.split('-').slice(1).reverse().join('/') : '???'}</span>
                        </div>
                        {booking.postLink ? (<a href={booking.postLink} target="_blank" className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1"><Globe className="w-3 h-3" /> Link</a>) : 
                        (<button onClick={() => handleOpenLinkModal(booking.id)} className="text-[10px] text-gray-400 hover:text-blue-500 mt-1 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> +Link</button>)}
                    </td>
                    <td className="p-4 align-top text-center">
                        <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setViewingBooking(booking)} className="p-1.5 text-purple-600 hover:bg-purple-50 rounded" title="Xem chi tiết"><Eye className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onEdit(booking)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded" title="Chỉnh sửa"><Edit2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => onDelete(booking.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Xóa"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
            </div>
        )}

        {linkModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md animate-in fade-in zoom-in duration-200">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" /> Cập nhật Link Bài Viết</h3>
                    <input type="text" autoFocus className="w-full p-3.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-900 placeholder-gray-400 mb-6 shadow-sm" placeholder="Dán link vào đây..." value={linkValue} onChange={e => setLinkValue(e.target.value)} />
                    <div className="flex justify-end gap-3">
                        <button onClick={() => setLinkModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium text-sm">Hủy</button>
                        <button onClick={handleSaveLink} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 text-sm shadow-lg shadow-blue-200">Lưu Link</button>
                    </div>
                </div>
            </div>
        )}

        {viewingBooking && <BookingDetailModal booking={viewingBooking} onClose={() => setViewingBooking(null)} />}
    </div>
  );
};
export default BookingList;