import { GoogleGenAI } from "@google/genai";
import { Booking } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBookingBrief = async (
  campaignName: string,
  productName: string,
  kolName: string,
  platform: string,
  format: string,
  notes: string
): Promise<string> => {
  try {
    const prompt = `
      Bạn là một trợ lý ảo chuyên nghiệp cho Marketing Agency.
      Hãy viết một bản tóm tắt nội dung (brief) ngắn gọn và sáng tạo để gửi cho KOL.
      
      Thông tin:
      - Chiến dịch: ${campaignName}
      - Sản phẩm: ${productName}
      - KOL: ${kolName}
      - Nền tảng: ${platform}
      - Hình thức: ${format}
      - Ghi chú thêm: ${notes}

      Yêu cầu:
      - Giọng điệu chuyên nghiệp, thân thiện.
      - Tập trung vào tính năng (USP) của sản phẩm.
      - Gợi ý 3 ý tưởng nội dung chính (Bullet points).
      - Không dùng Markdown quá phức tạp, chỉ text rõ ràng.
      - Ngôn ngữ: Tiếng Việt.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Không thể tạo nội dung lúc này.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Đã xảy ra lỗi khi kết nối với AI. Vui lòng thử lại.";
  }
};

export const analyzeCampaignData = async (bookings: Booking[]): Promise<string> => {
    // Basic analysis of the current booking list
    try {
        const summary = bookings.map(b => `- ${b.kol.name} (${b.platform} - ${b.productName}): ${b.status} - ${b.cost} VND`).join('\n');
        
        const prompt = `
            Dựa trên danh sách booking dưới đây, hãy đưa ra nhận xét ngắn gọn (dưới 100 từ) về tình hình chi tiêu, hiệu quả phân bổ theo sản phẩm và trạng thái các booking.
            
            Dữ liệu:
            ${summary}
        `;

         const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        
        return response.text || "Không có nhận xét.";

    } catch (error) {
        console.error("Gemini Analysis Error", error);
        return "Không thể phân tích dữ liệu.";
    }
}