import React, { useState, useEffect } from 'react';
import { LayoutDashboard, List, Plus, Settings, Users, Target, Loader2, AlertTriangle, LogOut, Wrench } from 'lucide-react';
import { User } from 'firebase/auth';
import Dashboard from './components/Dashboard';
import BookingList from './components/BookingList';
import BookingForm from './components/BookingForm';
import KOLManager from './components/KOLManager';
import CampaignManager from './components/CampaignManager';
import Login from './components/Login';
import { Booking, BookingStatus, KOLProfile, Campaign } from './types';
import * as firebaseService from './services/firebaseService';
import * as authService from './services/authService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [activeTab, setActiveTab] = useState<'dashboard' | 'bookings' | 'kols' | 'campaigns'>('dashboard');
  
  // Data State
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [kols, setKols] = useState<KOLProfile[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  
  // UI State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- AUTH CHECK ---
  useEffect(() => {
    const unsubscribe = authService.subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        fetchData(currentUser.uid);
      } else {
        setBookings([]);
        setKols([]);
        setCampaigns([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // --- DATA FETCHING ---
  const fetchData = async (userId: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [fetchedBookings, fetchedKOLs, fetchedCampaigns] = await Promise.all([
        firebaseService.getBookings(userId),
        firebaseService.getKOLs(userId),
        firebaseService.getCampaigns(userId)
      ]);
      setBookings(fetchedBookings);
      setKols(fetchedKOLs);
      setCampaigns(fetchedCampaigns);
    } catch (error: any) {
      console.error("Failed to fetch data:", error);
      // Check for index error
      if (error.message && error.message.includes('currently building')) {
         setErrorMsg("Firebase đang xây dựng chỉ mục (Index Building)...\nQuá trình này tự động và mất khoảng 2-5 phút.\nVui lòng đợi một lát rồi bấm 'Thử lại' nhé!");
      } else if (error.message && error.message.includes('requires an index')) {
         // Simplify error message for user
         setErrorMsg("Hệ thống cần cấu hình Database (Index) để sắp xếp dữ liệu.\nVui lòng mở Console (F12) hoặc xem link trong thông báo lỗi gốc để bấm tạo Index.");
      } else if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
        setErrorMsg("LỖI QUYỀN TRUY CẬP (Permission Denied): Bạn chưa bật quyền Đọc/Ghi cho Database trên Firebase Console. Vui lòng vào tab 'Rules' trong Firestore và sửa thành 'allow read, write: if true;' (Hoặc cấu hình theo uid)");
      } else {
        setErrorMsg("Lỗi kết nối: " + (error.message || "Vui lòng kiểm tra console log."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  // --- BOOKING HANDLERS ---
  const handleAddBooking = () => { setEditingBooking(undefined); setIsFormOpen(true); };
  
  const handleEditBooking = (booking: Booking) => { setEditingBooking(booking); setIsFormOpen(true); };
  
  const handleDeleteBooking = async (id: string) => { 
    if (window.confirm('Xóa booking này?')) {
        await firebaseService.deleteBooking(id);
        setBookings(prev => prev.filter(b => b.id !== id));
    }
  };
  
  const handleStatusChange = async (id: string, newStatus: BookingStatus) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        const updated = { ...booking, status: newStatus };
        await firebaseService.updateBooking(updated);
        setBookings(prev => prev.map(b => b.id === id ? updated : b));
    }
  };
  
  const handleUpdateLink = async (id: string, link: string) => {
    const booking = bookings.find(b => b.id === id);
    if (booking) {
        const today = new Date().toISOString().split('T')[0];
        const updated = { ...booking, postLink: link, airDate: booking.airDate || today };
        await firebaseService.updateBooking(updated);
        setBookings(prev => prev.map(b => b.id === id ? updated : b));
    }
  };
  
  const handleSaveBooking = async (booking: Booking) => {
    if (!user) return;
    try {
        if (editingBooking) {
            await firebaseService.updateBooking(booking);
            setBookings(prev => prev.map(b => b.id === booking.id ? booking : b));
        } else {
            // Attach User ID to new booking
            const newBookingData = { ...booking, userId: user.uid };
            const newBooking = await firebaseService.addBooking(newBookingData);
            setBookings(prev => [newBooking, ...prev]);
        }
        setIsFormOpen(false);
    } catch (error) {
        console.error("Error saving booking:", error);
        alert("Có lỗi khi lưu booking.");
    }
  };

  // --- KOL HANDLERS ---
  const handleAddKOL = async (kol: KOLProfile) => {
      if (!user) return;
      const newKOL = await firebaseService.addKOL({ ...kol, userId: user.uid });
      setKols(prev => [...prev, newKOL]);
  };
  
  const handleEditKOL = async (kol: KOLProfile) => {
      await firebaseService.updateKOL(kol);
      setKols(prev => prev.map(k => k.id === kol.id ? kol : k));
  };
  
  const handleDeleteKOL = async (id: string) => { 
      if (window.confirm('Xóa hồ sơ KOL này?')) {
          await firebaseService.deleteKOL(id);
          setKols(prev => prev.filter(k => k.id !== id)); 
      }
  };

  // --- CAMPAIGN HANDLERS ---
  const handleAddCampaign = async (camp: Campaign) => {
      if (!user) return;
      const newCamp = await firebaseService.addCampaign({ ...camp, userId: user.uid });
      setCampaigns(prev => [...prev, newCamp]);
  };
  
  const handleEditCampaign = async (camp: Campaign) => {
      await firebaseService.updateCampaign(camp);
      setCampaigns(prev => prev.map(c => c.id === camp.id ? camp : c));
  };
  
  const handleDeleteCampaign = async (id: string) => { 
      if (window.confirm('Xóa chiến dịch này?')) {
          await firebaseService.deleteCampaign(id);
          setCampaigns(prev => prev.filter(c => c.id !== id)); 
      }
  };

  const handleLogout = () => {
    authService.logout();
  };

  if (authLoading) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        </div>
     );
  }

  if (!user) {
    return <Login />;
  }

  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
              <p className="text-sm font-medium">Đang tải dữ liệu của bạn...</p>
          </div>
      )
  }

  if (errorMsg) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-6">
              <div className="bg-white p-8 rounded-2xl shadow-xl max-w-2xl text-center border border-red-100">
                  <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      {errorMsg.includes('Building') ? <Loader2 className="w-8 h-8 animate-spin" /> : <AlertTriangle className="w-8 h-8" />}
                  </div>
                  <h2 className="text-xl font-bold text-gray-800 mb-2">
                    {errorMsg.includes('Building') ? 'Đang thiết lập hệ thống' : 'Đã xảy ra lỗi'}
                  </h2>
                  <p className="text-sm text-red-600 mb-6 bg-red-50 p-4 rounded-lg text-left whitespace-pre-line break-words">
                      {errorMsg}
                  </p>
                  <button onClick={() => fetchData(user.uid)} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                      Thử lại
                  </button>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">KOL Manager</h1>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'dashboard' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          <button onClick={() => setActiveTab('campaigns')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'campaigns' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Target className="w-5 h-5" /> Chiến dịch
          </button>
          <button onClick={() => setActiveTab('bookings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'bookings' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <List className="w-5 h-5" /> Quản lý Booking
          </button>
          <button onClick={() => setActiveTab('kols')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${activeTab === 'kols' ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Users className="w-5 h-5" /> KOL Library <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded-full ml-auto">CRM</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3 px-4 mb-3">
               <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                   {user.email?.charAt(0).toUpperCase()}
               </div>
               <div className="overflow-hidden">
                   <p className="text-sm font-bold truncate text-gray-800">{user.email}</p>
                   <p className="text-xs text-green-600">Online</p>
               </div>
            </div>
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="w-4 h-4" /> Đăng xuất
            </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">
                {activeTab === 'dashboard' ? 'Tổng quan' : activeTab === 'bookings' ? 'Danh sách Booking' : activeTab === 'kols' ? 'Thư viện KOL (CRM)' : 'Quản lý Chiến Dịch'}
            </h2>
            {activeTab === 'bookings' && (
                <button onClick={handleAddBooking} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /><span className="hidden sm:inline">Tạo Booking</span>
                </button>
            )}
        </div>

        {isFormOpen ? (
             <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
                 <div className="w-full max-w-5xl my-auto">
                     <BookingForm 
                        initialData={editingBooking} 
                        kolLibrary={kols} 
                        campaigns={campaigns}
                        bookings={bookings}
                        onSave={handleSaveBooking} 
                        onCancel={() => setIsFormOpen(false)} 
                     />
                 </div>
             </div>
        ) : (
            <>
                {activeTab === 'dashboard' && <Dashboard bookings={bookings} campaigns={campaigns} />}
                {activeTab === 'bookings' && <BookingList bookings={bookings} onEdit={handleEditBooking} onDelete={handleDeleteBooking} onStatusChange={handleStatusChange} onUpdateLink={handleUpdateLink} />}
                {activeTab === 'kols' && <KOLManager kols={kols} onAdd={handleAddKOL} onEdit={handleEditKOL} onDelete={handleDeleteKOL} />}
                {activeTab === 'campaigns' && <CampaignManager campaigns={campaigns} bookings={bookings} onAdd={handleAddCampaign} onEdit={handleEditCampaign} onDelete={handleDeleteCampaign} />}
            </>
        )}
      </main>
    </div>
  );
};

export default App;