export enum BookingType {
  SEEDING = 'Seeding',
  PRESS = 'Báo chí',
  VIDEO = 'Video',
  LIVESTREAM = 'Livestream',
  VIRAL = 'Viral',
  PROFESSIONAL = 'Chuyên môn',
  CUSTOM = 'Tùy chọn',
}

export enum Platform {
  FACEBOOK = 'Facebook',
  TIKTOK = 'TikTok',
  YOUTUBE = 'YouTube',
  INSTAGRAM = 'Instagram',
  BLOG = 'Blog',
  NEWSPAPER = 'Báo chí',
  OTHER = 'Khác',
}

export enum Format {
  VIDEO = 'Video',
  LIVESTREAM = 'Livestream',
  POST = 'Bài đăng (Post)',
  STORY = 'Story',
  ARTICLE = 'Bài viết',
}

export enum BookingStatus {
  CONTACTED = 'Đã liên hệ',
  AGREED = 'KOL Đồng ý',
  CONFIRMED = 'Xác nhận Book',
  SAMPLE_SENT = 'Đã gửi mẫu',
  COMPLETED = 'Hoàn thành',
  CANCELLED = 'Hủy',
}

export enum PaymentStatus {
  UNPAID = 'Chưa thanh toán',
  DEPOSITED = 'Đã cọc',
  PAID = 'Đã tất toán'
}

export interface PerformanceMetrics {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  cpv?: number; // Cost Per View
  cpe?: number; // Cost Per Engagement
}

export interface KOLInfo {
  id?: string; // Link to KOL Profile if exists
  name: string;
  channelId: string;
  writerName?: string;
  address: string;
  phone: string;
  followers: number;
}

export interface KOLProfile {
  id: string;
  userId: string; // Owner ID
  name: string;
  channelId: string;
  platform: Platform;
  followers: number;
  phone?: string;
  address?: string;
  rateCard?: number;
  avgViews?: number;
  rating?: number; // 1-5 stars
  tags?: string[];
  notes?: string; // "Hay delay", "Nhiệt tình"
}

export interface Campaign {
  id: string;
  userId: string; // Owner ID
  name: string;
  target: string; // Mục tiêu (Awareness, Conversion...)
  budget: number; // Ngân sách dự kiến
  startDate: string;
  endDate: string;
  status: 'Active' | 'Completed' | 'Planned';
  description?: string;
}

export interface Booking {
  id: string;
  userId: string; // Owner ID
  campaignName: string; // Linking by name for simplicity, or ID
  productName: string;
  kol: KOLInfo;
  cost: number;
  deposit: number; // Tiền cọc
  paymentStatus: PaymentStatus;
  content: string;
  pic: string;
  platform: Platform;
  format: Format;
  type: BookingType;
  status: BookingStatus;
  startDate: string;
  airDate?: string;
  postLink?: string;
  note?: string;
  performance: PerformanceMetrics;
  createdAt: number;
}

export interface DashboardStats {
  totalBookings: number;
  totalCost: number;
  byStatus: { name: string; value: number; color: string }[];
  byPlatform: { name: string; value: number }[];
}