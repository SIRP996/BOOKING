import React, { useMemo, useState } from 'react';
import { Booking, BookingStatus, Platform, Campaign } from '../types';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip as RechartsTooltip,
  BarChart, Bar, Legend, ComposedChart
} from 'recharts';
import { 
  Users, Filter, RefreshCcw, 
  Activity, Box, Share2, Crown, Wallet, FileClock, Target
} from 'lucide-react';

interface DashboardProps {
  bookings: Booking[];
  campaigns?: Campaign[];
}

interface StatItem {
  name: string;
  cost: number;
  count: number;
}

// Modern Vivid Palette for Charts
const THEME = {
  primary: '#3b82f6',   // Blue 500 (Brighter than Indigo)
  secondary: '#06b6d4', // Cyan 500
  accent: '#f59e0b',    // Amber 500
  danger: '#ef4444',    // Red 500
  success: '#10b981',   // Emerald 500
  dark: '#1e293b',      // Slate 800
  grid: '#e2e8f0',      // Slate 200
};

// Expanded vivid color set for Pie Charts to ensure distinction
const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f97316', // Orange
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#06b6d4', // Cyan
  '#eab308', // Yellow
  '#f43f5e', // Rose
  '#6366f1', // Indigo
  '#84cc16', // Lime
];

// Formatters
const formatCurrency = (value: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
const formatCompactNumber = (value: number) => new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(value);

const CustomTooltip = ({ active, payload, label, currency = false }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl border border-slate-700">
        <p className="font-bold mb-1 text-slate-300">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="capitalize">{entry.name}: </span>
            <span className="font-mono font-bold">
              {currency || entry.name === 'Chi phí' || entry.name === 'Ngân sách' || entry.name === 'Đã chi' || (entry.name === 'value' && entry.payload.cost) 
                ? formatCurrency(entry.value) 
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC<DashboardProps> = ({ bookings, campaigns = [] }) => {
  // --- FILTER STATES ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [filterCampaign, setFilterCampaign] = useState('All');
  const [filterProduct, setFilterProduct] = useState('All');
  const [filterPlatform, setFilterPlatform] = useState('All');

  // --- UNIQUE VALUES ---
  const uniqueCampaigns = useMemo(() => Array.from(new Set(bookings.map(b => b.campaignName).filter(Boolean))), [bookings]);
  const uniqueProducts = useMemo(() => Array.from(new Set(bookings.map(b => b.productName).filter(Boolean))), [bookings]);

  // --- FILTER LOGIC ---
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      if (startDate && b.startDate < startDate) return false;
      if (endDate && b.startDate > endDate) return false;
      if (filterCampaign !== 'All' && b.campaignName !== filterCampaign) return false;
      if (filterProduct !== 'All' && b.productName !== filterProduct) return false;
      if (filterPlatform !== 'All' && b.platform !== filterPlatform) return false;
      return true;
    });
  }, [bookings, startDate, endDate, filterCampaign, filterProduct, filterPlatform]);

  // --- STATS & DATA TRANSFORMATION ---
  const stats = useMemo(() => {
    const data = filteredBookings;
    const totalBookings = data.length;
    
    // --- FINANCIAL SPLIT LOGIC ---
    // 1. Ngân sách đã chi: Status === COMPLETED
    const spentCost = data
        .filter(b => b.status === BookingStatus.COMPLETED)
        .reduce((sum, b) => sum + b.cost, 0);

    // 2. Ngân sách Báo giá (Dự kiến): Status !== COMPLETED && Status !== CANCELLED
    const quotedCost = data
        .filter(b => b.status !== BookingStatus.COMPLETED && b.status !== BookingStatus.CANCELLED)
        .reduce((sum, b) => sum + b.cost, 0);

    const completed = data.filter(b => b.status === BookingStatus.COMPLETED).length;
    const completionRate = totalBookings > 0 ? Math.round((completed / totalBookings) * 100) : 0;

    // 1. Timeline Data (For Area Chart)
    const timelineMap = data.reduce((acc, b) => {
      const month = b.startDate.substring(0, 7); // "2024-10"
      if (!acc[month]) acc[month] = { name: month, cost: 0, count: 0 };
      acc[month].cost += b.cost;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, StatItem>);
    const timelineData = Object.values(timelineMap).sort((a: StatItem, b: StatItem) => a.name.localeCompare(b.name));

    // 2. Platform Distribution (Donut)
    const platformMap = data.reduce((acc, b) => {
      acc[b.platform] = (acc[b.platform] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const platformData = Object.keys(platformMap).map(k => ({ name: k, value: platformMap[k] }));

    // 3. Top Products (Leaderboard)
    const productMap = data.reduce((acc, b) => {
      const p = b.productName || 'N/A';
      if (!acc[p]) acc[p] = { name: p, cost: 0, count: 0 };
      acc[p].cost += b.cost;
      acc[p].count += 1;
      return acc;
    }, {} as Record<string, StatItem>);
    const topProducts = Object.values(productMap)
      .sort((a: StatItem, b: StatItem) => b.cost - a.cost)
      .slice(0, 5);

    // 4. Status Funnel
    const statusOrder = [
      BookingStatus.CONTACTED,
      BookingStatus.AGREED,
      BookingStatus.SAMPLE_SENT,
      BookingStatus.CONFIRMED,
      BookingStatus.COMPLETED
    ];
    const statusCounts = data.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const funnelData = statusOrder.map(s => ({
      name: s,
      value: statusCounts[s] || 0,
      percent: totalBookings > 0 ? ((statusCounts[s] || 0) / totalBookings) * 100 : 0
    }));

    // 5. PIC Performance
    const picMap = data.reduce((acc, b) => {
        const p = b.pic || 'N/A';
        if (!acc[p]) acc[p] = { name: p, count: 0, cost: 0 };
        acc[p].count += 1;
        acc[p].cost += b.cost;
        return acc;
    }, {} as Record<string, StatItem>);
    const picData = Object.values(picMap).sort((a: StatItem, b: StatItem) => b.count - a.count);

    // 6. Campaign Budget Performance (New)
    const campaignStats = campaigns.map(camp => {
        const spent = bookings.filter(b => b.campaignName === camp.name).reduce((sum, b) => sum + b.cost, 0);
        return {
            name: camp.name,
            budget: camp.budget,
            spent: spent,
        };
    }).sort((a, b) => b.spent - a.spent).slice(0, 7); // Top 7 spenders

    return { 
      totalBookings, spentCost, quotedCost, completed, completionRate,
      timelineData, platformData, topProducts, funnelData, picData, campaignStats
    };
  }, [filteredBookings, campaigns]);

  const clearFilters = () => {
    setStartDate(''); setEndDate('');
    setFilterCampaign('All'); setFilterProduct('All'); setFilterPlatform('All');
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* --- 1. SMART FILTER BAR --- */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
           <div className="flex items-center gap-2">
              <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                <Filter className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Bộ lọc thông minh</h3>
                <p className="text-xs text-slate-500">Lọc dữ liệu theo thời gian thực</p>
              </div>
           </div>
           {(startDate || endDate || filterCampaign !== 'All') && (
              <button onClick={clearFilters} className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 font-medium bg-red-50 px-3 py-1.5 rounded-full transition-colors">
                  <RefreshCcw className="w-3 h-3" /> Đặt lại
              </button>
           )}
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
             <div className="col-span-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Từ ngày</label>
                 <input type="date" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={startDate} onChange={e => setStartDate(e.target.value)} />
             </div>
             <div className="col-span-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Đến ngày</label>
                 <input type="date" className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-slate-50 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={endDate} onChange={e => setEndDate(e.target.value)} />
             </div>
             <div className="col-span-2 md:col-span-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Chiến dịch</label>
                 <select className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={filterCampaign} onChange={e => setFilterCampaign(e.target.value)}>
                      <option value="All">Tất cả chiến dịch</option>
                      {uniqueCampaigns.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
             </div>
             <div className="col-span-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Sản phẩm</label>
                 <select className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={filterProduct} onChange={e => setFilterProduct(e.target.value)}>
                      <option value="All">Tất cả sản phẩm</option>
                      {uniqueProducts.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
             </div>
             <div className="col-span-1">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Nền tảng</label>
                 <select className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none"
                      value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)}>
                      <option value="All">Tất cả nền tảng</option>
                      {Object.values(Platform).map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
             </div>
        </div>
      </div>

      {filteredBookings.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-slate-300">
               <div className="mx-auto w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                    <Filter className="text-slate-400 w-8 h-8" />
               </div>
               <h3 className="text-slate-800 font-bold text-lg">Không có dữ liệu</h3>
               <p className="text-slate-500 text-sm mt-1 mb-4">Thử thay đổi bộ lọc để xem kết quả.</p>
               <button onClick={clearFilters} className="px-5 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-shadow shadow-lg shadow-slate-200">
                   Xóa bộ lọc
               </button>
          </div>
      ) : (
      <>
        {/* --- 2. HERO CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: Estimated/Quoted Cost */}
            <div className="bg-gradient-to-br from-amber-400 to-orange-500 p-5 rounded-2xl text-white shadow-lg shadow-orange-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                    <FileClock className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                         <p className="text-orange-50 text-xs font-bold uppercase tracking-wider mb-1">Ngân sách Báo giá</p>
                         <h3 className="text-2xl font-bold">{formatCompactNumber(stats.quotedCost)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                        <span>Đang xử lý / Chưa hoàn thành</span>
                    </div>
                </div>
            </div>

            {/* Card 2: Actual Spent */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-5 rounded-2xl text-white shadow-lg shadow-teal-200 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110">
                    <Wallet className="w-24 h-24" />
                </div>
                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                         <p className="text-emerald-50 text-xs font-bold uppercase tracking-wider mb-1">Thực tế Đã chi</p>
                         <h3 className="text-2xl font-bold">{formatCompactNumber(stats.spentCost)}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-xs bg-white/20 w-fit px-2 py-1 rounded-lg backdrop-blur-sm">
                        <span>Đã hoàn thành</span>
                    </div>
                </div>
            </div>

            {/* Card 3: Bookings Volume */}
            <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between group hover:border-blue-300 transition-colors">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Tổng Bookings</p>
                        <h3 className="text-2xl font-bold text-slate-800">{stats.totalBookings}</h3>
                    </div>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                        <Users className="w-6 h-6" />
                    </div>
                </div>
                <div>
                     <div className="w-full bg-slate-100 h-2 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{width: `${Math.min(stats.completionRate, 100)}%`}}></div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-right">{stats.completionRate}% hoàn thành</p>
                </div>
            </div>
        </div>

        {/* --- 3. MAIN CHARTS AREA (Grid Masonry) --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
            
            {/* LEFT: Spending Trend (2/3 width) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-500" />
                            Xu hướng Chi tiêu
                        </h3>
                        <p className="text-xs text-slate-500">Dòng tiền chi cho booking theo thời gian</p>
                    </div>
                </div>
                <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.timelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={THEME.primary} stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor={THEME.primary} stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.grid} />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `${v/1000000}M`} />
                            <RechartsTooltip content={<CustomTooltip currency />} />
                            <Area type="monotone" dataKey="cost" stroke={THEME.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" name="Chi phí" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* RIGHT: Platform Distribution (1/3 width) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                    <Share2 className="w-5 h-5 text-cyan-500" />
                    Nền tảng
                </h3>
                <p className="text-xs text-slate-500 mb-4">Tỷ lệ booking phân bổ</p>
                
                <div className="flex-1 min-h-[250px] relative">
                     <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={stats.platformData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                            >
                                {stats.platformData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Text */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="text-center">
                            <span className="block text-2xl font-bold text-slate-800">{stats.platformData.length}</span>
                            <span className="text-[10px] uppercase text-slate-400 font-bold">Platforms</span>
                         </div>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-2">
                    {stats.platformData.map((entry, index) => (
                        <div key={entry.name} className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded-md">
                            <div className="w-2 h-2 rounded-full" style={{backgroundColor: COLORS[index % COLORS.length]}}></div>
                            {entry.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* NEW CHART: CAMPAIGN BUDGET VS SPENT */}
            {campaigns.length > 0 && (
                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                        <Target className="w-5 h-5 text-rose-500" />
                        Hiệu quả Ngân sách Chiến dịch
                    </h3>
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={stats.campaignStats} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.grid} />
                                <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} tick={{fontSize: 12, fill: '#64748b'}} />
                                <YAxis tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `${v/1000000}M`} />
                                <RechartsTooltip content={<CustomTooltip currency />} />
                                <Legend />
                                <Bar dataKey="budget" name="Ngân sách" barSize={20} fill={THEME.grid} />
                                <Bar dataKey="spent" name="Đã chi" barSize={20} fill={THEME.danger} />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* BOTTOM ROW: Lists & Pipelines */}
            
            {/* 1. Leaderboard Products */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <Crown className="w-5 h-5 text-amber-500" />
                    Top Sản Phẩm (Chi phí)
                </h3>
                <div className="space-y-4">
                    {stats.topProducts.map((prod, index) => (
                        <div key={prod.name} className="group">
                            <div className="flex justify-between items-center text-sm mb-1.5">
                                <span className="font-medium text-slate-700 flex items-center gap-2">
                                    <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold ${index === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                                        #{index + 1}
                                    </span>
                                    {prod.name}
                                </span>
                                <span className="font-bold text-slate-900">{formatCompactNumber(prod.cost)}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                    style={{ 
                                        width: `${(prod.cost / (stats.topProducts[0]?.cost || 1)) * 100}%`,
                                        backgroundColor: COLORS[index % COLORS.length]
                                    }}
                                ></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

             {/* 2. Status Pipeline */}
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <Box className="w-5 h-5 text-emerald-500" />
                    Pipeline Trạng thái
                </h3>
                <div className="relative pt-2">
                    {/* Connector Line */}
                    <div className="absolute left-3 top-3 bottom-3 w-0.5 bg-slate-100 -z-10"></div>
                    
                    <div className="space-y-5">
                        {stats.funnelData.map((status, index) => (
                            <div key={status.name} className="flex items-center gap-4 relative">
                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-white
                                    ${status.value > 0 ? 'border-emerald-500 text-emerald-500' : 'border-slate-300 text-slate-300'}`}>
                                    <div className={`w-2 h-2 rounded-full ${status.value > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-end mb-1">
                                        <span className="text-xs font-bold uppercase text-slate-500">{status.name}</span>
                                        <span className="text-sm font-bold text-slate-800">{status.value}</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-400 rounded-full" 
                                            style={{ width: `${status.percent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            
            {/* 3. PIC Workload (Simple List) */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-6">
                    <Users className="w-5 h-5 text-purple-500" />
                    Nhân sự (PIC)
                </h3>
                <div className="grid grid-cols-1 gap-3">
                    {stats.picData.map((pic) => (
                        <div key={pic.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                                    {pic.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{pic.name}</p>
                                    <p className="text-[10px] text-slate-500">{pic.count} bookings</p>
                                </div>
                            </div>
                            <span className="text-xs font-mono font-semibold text-slate-600 bg-white px-2 py-1 rounded border border-slate-100">
                                {formatCompactNumber(pic.cost)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

        </div>
      </>
      )}
    </div>
  );
};

export default Dashboard;