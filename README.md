# 🌐 Wordora - Cá nhân hóa Học ngoại ngữ & Local-First PWA

Wordora là ứng dụng học từ vựng, cụm từ và mẫu câu ngoại ngữ cá nhân hóa hoạt động theo triết lý **Local-First**, ưu tiên quyền riêng tư và có khả năng hoạt động **100% ngoại tuyến (Offline-First PWA)** với cơ sở dữ liệu **IndexedDB**.

---

## 🚀 Tính năng nổi bật

- **📚 Quản lý Bộ học (Decks) & Từ vựng (Learning Items)**: Tạo, chỉnh sửa, lưu trữ (archive) các bộ học theo ngôn ngữ nguồn và ngôn ngữ đích. Hỗ trợ 3 loại mục học: Từ vựng (Vocabulary), Cụm từ (Phrase) và Mẫu câu (Sentence).
- **🎴 Phiên học Flashcard Lật mặt thông minh**: Học từ vựng với giao diện lật mặt linh hoạt, phím tắt nhanh (`[Space]`, `[1]`, `[2]`, `[3]`, `[4]`), thanh tiến trình thời gian thực và xem trước khoảng thời gian SRS.
- **🧠 Thuật toán Ôn tập Ngắt quãng (Spaced Repetition SM-2 v1.0.0)**: Lập lịch ôn tập ngắt quãng tự động theo thuật toán SM-2 MVP:
  - Ease Factor ($EF$) tự động điều chỉnh trong khoảng $[1.3, 3.5]$.
  - Khoảng thời gian hẹn ôn ($Interval$) tăng dần tối đa $365$ ngày.
  - Tự động đánh giá trạng thái **Thành thạo (Mastered)** khi `repetitions >= 5` và `intervalDays >= 30`.
- **🧩 Động cơ Bài tập Đa dạng (Exercise Engine)**:
  - **Trắc nghiệm (Multiple Choice)**: Tự động tạo 3 phương án nhiễu thông minh cùng bộ học/POS.
  - **Điền từ vào chỗ trống (Fill in the Blank)**: Thay thế từ mục tiêu bằng `___`, bảo tồn dấu câu và diacritics với Unicode NFC.
  - **Sắp xếp câu (Sentence Ordering)**: Tách từ thành các token độc lập với ID riêng biệt, hỗ trợ phím bấm điều khiển bên cạnh thao tác Kéo-Thả (Drag & Drop).
- **🔊 Phát âm tự động (Web Speech API TTS)**: Tự động tìm kiếm và phát âm bằng giọng đọc offline có sẵn trên trình duyệt/thiết bị với tùy chỉnh ngôn ngữ, tốc độ (Rate) và cao độ (Pitch).
- **🎙️ Ghi âm & Luyện phát âm (MediaRecorder API)**: Cho phép người dùng tự ghi âm cách phát âm của mình, nghe lại và lưu trữ trực tiếp trên thiết bị (dữ liệu âm thanh lưu dạng Blob trong IndexedDB local, không tải lên server).
- **📊 Bảng Thống kê & Theo dõi Tiến độ**:
  - Chuỗi ngày học liên tục (**Streak**).
  - Tỷ lệ chính xác (**Accuracy %**).
  - Phân bố trạng thái từ vựng (Từ mới, Đang học, Đang ôn, Thành thạo).
  - Biểu đồ hoạt động ôn tập theo ngày (7 ngày, 30 ngày, Tất cả thời gian).
- **📱 Progressive Web App (PWA) & Offline Shell**:
  - Tự động pre-cache Application Shell qua Service Worker (`sw.js`).
  - Phục vụ trang offline fallback (`/offline.html`) khi không có mạng.
  - Hỗ trợ cài đặt lên màn hình chính (Chrome, Android, iOS Safari).
  - Cập nhật phiên bản an toàn, không gián đoạn phiên học.
- **💾 Sao lưu & Khôi phục dữ liệu (JSON Backup Envelope v1)**:
  - Xuất toàn bộ dữ liệu ra tệp JSON an toàn.
  - Kiểm định Zod Schema nghiêm ngặt, chống mã độc Prototype Pollution.
  - Khôi phục giao dịch nguyên tử (Multi-Table Atomic Dexie Transaction) với cơ chế **Tự động sao lưu trước khi khôi phục** và Rollback hoàn tác toàn bộ khi lỗi.

---

## 🛠️ Công nghệ & Kiến trúc Clean Architecture

Ứng dụng tuân thủ nghiêm ngặt mô hình **Clean Architecture**:

```text
UI (Next.js App Router / Components / Custom Hooks)
  └─► Application / Use-Cases / Services (ReviewAppService, StatisticsService, ExportService)
        └─► Repositories Interface (DeckRepository, LearningItemRepository, ReviewStateRepository...)
              └─► Infrastructure / IndexedDB (Dexie.js / WordoraDatabase)
```

- **Core Framework**: Next.js 16 (App Router, Turbopack, React 19).
- **Styling**: Vanilla CSS + Tailwind CSS v4, Lucide React Icons.
- **State & Form**: Zustand (phiên tạm thời), React Hook Form, Zod.
- **Database**: Dexie.js (IndexedDB local wrapper).
- **Testing**: Vitest, React Testing Library, `fake-indexeddb`, Playwright E2E.

---

## 🗄️ Cấu trúc Cơ sở dữ liệu IndexedDB (`wordora_db`)

| Bảng (Table) | Mô tả & Chỉ mục (Indexes) |
| :--- | :--- |
| `decks` | `id, name, sourceLanguage, targetLanguage, archivedAt, createdAt, updatedAt` |
| `learningItems` | `id, deckId, type, prompt, answer, difficulty, createdAt, updatedAt` |
| `reviewStates` | `id, itemId, status, dueAt, intervalDays, easeFactor, repetitions, algorithmVersion` |
| `reviewLogs` | `id, itemId, sessionId, exerciseType, rating, isCorrect, reviewedAt` |
| `studySessions` | `id, deckId, mode, totalQuestions, correctAnswers, durationSeconds, startedAt, completedAt` |
| `recordings` | `id, itemId, mimeType, createdAt` (Lưu đính kèm âm thanh dạng Blob) |
| `settings` | `id, speechLanguage, preferredVoiceURI, speechRate, speechPitch, dailyNewItemLimit` |

---

## ⚡ Hướng dẫn Chạy ứng dụng & Kiểm thử

### **1. Yêu cầu môi trường**
- Node.js version `>= 18.17.0` (Khuyên dùng Node 20 LTS).
- npm version `>= 9.0.0`.

### **2. Cài đặt và Khởi chạy Dev Server**
```bash
# Cài đặt các gói phụ thuộc
npm install

# Chạy server phát triển (Development mode)
npm run dev
```
Truy cập trình duyệt tại địa chỉ: `http://localhost:3000`

### **3. Chạy các Lệnh Kiểm tra Tự động**
```bash
# Kiểm tra cú pháp TypeScript
npm run typecheck

# Kiểm tra quy tắc mã nguồn ESLint
npm run lint

# Chạy toàn bộ Unit & Integration Test Suite với Vitest
npm run test

# Chạy kiểm thử End-to-End (E2E) với Playwright
npm run test:e2e

# Biên dịch sản phẩm Production Build
npm run build
```

---

## 🎙️ Hướng dẫn Kiểm thử TTS & Ghi âm Microphone

1. **Phát âm tự động (TTS)**:
   - Truy cập **Cài đặt (`/settings`)** ➔ Chọn ngôn ngữ (ví dụ: *Tiếng Anh en-US*) ➔ Chọn giọng đọc khả dụng ➔ Nhấn **"Nghe thử âm thanh"**.
   - Khi lật thẻ Flashcard hoặc làm bài tập, nhấn nút biểu tượng loa 🔊 để nghe phát âm.
2. **Ghi âm & Luyện phát âm (Microphone)**:
   - Khi ở màn hình học Flashcard, vị trí bên dưới thẻ học có Widget **Luyện phát âm**.
   - Nhấn nút 🎙️ **"Bắt đầu ghi âm"** ➔ Trình duyệt sẽ hỏi quyền truy cập Microphone ➔ Nhấn **Cho phép (Allow)**.
   - Nhấn ⏹️ **"Dừng & Lưu"** để hoàn tất ➔ Nhấn ▶️ **"Phát lại"** để nghe lại giọng mình. Dữ liệu âm thanh được lưu an toàn trong thiết bị.

---

## 📲 Hướng dẫn Cài đặt PWA & Sử dụng Offline

1. **Trên Chrome / Edge (Desktop & Android)**:
   - Mở ứng dụng ➔ Thanh địa chỉ trình duyệt hoặc góc dưới màn hình xuất hiện nút **"Cài đặt ngay"**.
   - Nhấn Cài đặt để thêm ứng dụng vào Màn hình chính / Desktop.
2. **Trên Safari (iOS iPhone / iPad)**:
   - Mở ứng dụng trên trình duyệt Safari ➔ Bấm nút **Chia sẻ (Share)** ➔ Chọn **"Thêm vào Màn hình chính" (Add to Home Screen)**.
3. **Trải nghiệm Ngoại tuyến (Offline)**:
   - Tắt Wi-Fi / 4G ➔ Mở ứng dụng Wordora từ màn hình chính ➔ Ứng dụng khởi chạy tức thì nhờ Service Worker App Shell. Mọi thao tác thêm/sửa/xóa từ vựng, học flashcard, làm bài tập và xem thống kê hoạt động 100% không cần mạng.

---

## 💾 Chính sách Sao lưu & Dữ liệu Local

- **Chính sách Quyền riêng tư**: 100% dữ liệu của người dùng nằm trên thiết bị của bạn. Không có dữ liệu nào bị gửi lên bất kỳ máy chủ trung gian nào.
- **Tệp Sao lưu JSON (`v1`)**:
  - File sao lưu có cấu trúc dạng `wordora-backup-YYYY-MM-DD-HHmm.json`.
  - Bao gồm: Toàn bộ Bộ học, Từ vựng, Trạng thái SRS, Lịch sử ôn tập, Phiên học và Cài đặt.
  - **Chính sách Bản ghi âm**: Các bản ghi âm giọng nói luyện phát âm được giữ cục bộ trên thiết bị và không gộp vào file text JSON để tránh làm phình dung lượng file.

---

## 📌 Các giới hạn đã biết (Known Limitations)

1. **TTS Web Speech API**: Chất lượng giọng đọc phụ thuộc vào hệ điều hành và trình duyệt của người dùng (Google Chrome cung cấp nhiều giọng đọc tự nhiên hơn trình duyệt mặc định trên một số thiết bị cũ).
2. **Giới hạn Lưu trữ ghi âm**: Dung lượng lưu trữ ghi âm giọng nói phụ thuộc vào hạn ngạch IndexedDB do trình duyệt cấp cho trang web.

---

## 🔮 Lộ trình Phát triển Tương lai (Roadmap)

- **Backend & Cloud Sync**: Phát triển máy chủ Backend đồng bộ đa thiết bị end-to-end mã hóa.
- **Import nâng cao**: Bổ sung bộ nhập dữ liệu linh hoạt từ file CSV, Anki `.apkg` và Quizlet.
- **Đồng bộ giọng đọc AI TTS**: Tích hợp các nhà cung cấp TTS chất lượng cao ngoài trình duyệt.

---

*Wordora MVP được hoàn thiện với tiêu chuẩn chất lượng cao, sẵn sàng phục vụ việc học ngoại ngữ cá nhân hàng ngày!*
