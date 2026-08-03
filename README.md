# Wordora - Ứng dụng Học Ngoại ngữ Cá nhân & Local-First

**Wordora** là ứng dụng học từ vựng, cụm từ và mẫu câu ngoại ngữ cá nhân với kiến trúc local-first, hoạt động hoàn toàn ngoại tuyến (offline-first) trên thiết bị của người dùng sử dụng **IndexedDB** và **Dexie.js**.

---

## 🛠️ Công Nghệ Nền Tảng (Tech Stack)

- **Framework**: Next.js (App Router, React 19, TypeScript Strict Mode)
- **Styling**: Tailwind CSS v4, Lucide Icons
- **Database & Storage**: IndexedDB qua Dexie.js (Zero backend, local-first)
- **Form & Validation**: React Hook Form + Zod
- **Testing**: Vitest + React Testing Library + `fake-indexeddb` + JSDOM
- **State Management**: Zustand (dùng duy nhất cho trạng thái UI & phiên làm việc)

---

## 🏗️ Kiến Trúc Thư Mục (Clean Architecture & Feature-First)

```text
src/
├── app/                  # Next.js App Router (Routes & AppShell)
├── components/           # UI Primitives (Button, Card, Input, Dialog...) & Layout (Header, Sidebar, MobileNav)
├── domain/               # Core Business Entities, Value Objects, Repository Interfaces & Zod Schemas
│   ├── entities/         # Deck, LearningItem, ReviewState, ReviewLog, StudySession, Recording, AppSettings
│   ├── repositories/     # DeckRepository, LearningItemRepository... (Abstract Async Interfaces)
│   ├── schemas/          # Zod validation schemas & ExportEnvelope schema
│   └── value-objects/    # Enums & Value types (LearningItemType, ReviewStatus...)
├── infrastructure/       # Data Persistence & Adapters (Decoupled from Domain)
│   ├── database/         # WordoraDatabase (Dexie.js), Schema Version 1, DB Factory, Seed data
│   └── repositories/     # DexieDeckRepository, DexieLearningItemRepository... (Dexie implementations)
├── features/             # Feature modules (decks, learning-items, flashcards, exercises, reviews...)
├── hooks/                # Custom React Hooks (useDatabase...)
├── lib/                  # Utilities (cn, generateUUID, date formatters, feature-support)
└── test/                 # Test setup & configuration
```

---

## 💾 Kiến Trúc Lưu Trữ IndexedDB (Dexie.js Schema Version 1)

Database Name: `wordora_db`

### Các Bảng và Chỉ Mục (Indexes):

| Bảng | Primary Key (PK) | Chỉ mục (Indexes) | Mô tả |
| :--- | :--- | :--- | :--- |
| `decks` | `id` (UUID) | `name`, `sourceLanguage`, `targetLanguage`, `createdAt`, `updatedAt`, `archivedAt` | Bộ học từ vựng/cụm từ/mẫu câu |
| `learningItems` | `id` (UUID) | `deckId`, `type`, `createdAt`, `updatedAt` | Từ vựng, cụm từ, hoặc mẫu câu |
| `reviewStates` | `id` (UUID) | `itemId`, `status`, `dueAt`, `createdAt`, `updatedAt` | Trạng thái ôn tập ngắt quãng (SRS) |
| `reviewLogs` | `id` (UUID) | `itemId`, `sessionId`, `reviewedAt` | Nhật ký lịch sử các lượt ôn tập |
| `studySessions` | `id` (UUID) | `deckId`, `mode`, `startedAt`, `completedAt`, `createdAt` | Phiên học & kết quả phiên |
| `recordings` | `id` (UUID) | `itemId`, `createdAt` | Bản ghi âm luyện phát âm (Blob) |
| `settings` | `id` (`default`) | `updatedAt` | Cấu hình ứng dụng (TTS, SRS, limits) |
| `appMetadata` | `key` | N/A | Metadata ứng dụng (schemaVersion, version info) |

### Nguyên Tắc Local-First & Sẵn Sàng Import:
1. **UUID Primary Keys**: Mọi ID entity sử dụng UUID v4 ngẫu nhiên, không dùng auto-increment để tránh xung đột khi Import/Export bulk data.
2. **Standard Timestamps**: Mọi mốc thời gian lưu trữ ở dạng chuỗi chuẩn ISO 8601 UTC (`YYYY-MM-DDTHH:mm:ss.sssZ`).
3. **Repository Abstraction**: UI và Application layer tương tác với cơ sở dữ liệu hoàn toàn qua Repository Interfaces, không truy cập trực tiếp bảng hay collection của Dexie.
4. **Transaction Safety**: Các thao tác xóa liên hoàn (cascade delete deck -> learning items -> review states) hoặc ghi nhiều bảng được bọc trong Dexie Transactions.

---

## 🔍 Cách Kiểm Tra Dữ Liệu bằng Chrome DevTools

1. Mở trang web ứng dụng (`npm run dev`).
2. Nhấn `F12` hoặc chuột phải chọn **Inspect** -> Chuyển sang tab **Application**.
3. Tại menu bên trái, mở **Storage** -> **IndexedDB** -> **wordora_db**.
4. Bạn sẽ thấy danh sách các bảng (`decks`, `learningItems`, `reviewStates`, `settings`...) và có thể xem trực tiếp các bản ghi.

---

## 📜 Các Lệnh Kiểm Tra & Chạy Dự Án (Scripts)

```bash
# Khởi chạy dev server
npm run dev

# Kiểm tra TypeScript strict mode
npm run typecheck

# Kiểm tra ESLint
npm run lint

# Chạy unit & integration tests với Vitest
npm run test

# Chạy test ở chế độ watch
npm run test:watch

# Build bản production
npm run build
```

---

## 🗺️ Lộ Trình Triển Khai (Phase Roadmap)

- [x] **Phase 1**: Khởi tạo dự án, App Router, Tailwind CSS, UI Primitives & Application Shell.
- [x] **Phase 2**: Domain model, IndexedDB (Dexie.js), Repository interfaces & implementations, integration testing with `fake-indexeddb`.
- [ ] **Phase 3**: Quản lý bộ học & từ vựng (CRUD Decks & Learning Items UI).
- [ ] **Phase 4**: Thuật toán ôn tập ngắt quãng (SRS) & Flashcard học tập.
- [ ] **Phase 5**: Bài tập tương tác (Trắc nghiệm, Điền từ, Sắp xếp câu).
- [ ] **Phase 6**: Web Speech API (TTS) & MediaRecorder API (Ghi âm phát âm).
- [ ] **Phase 7**: Thống kê học tập & Cài đặt ứng dụng.
- [ ] **Phase 8**: Sao lưu, khôi phục & Import/Export dữ liệu (JSON/CSV).
- [ ] **Phase 9**: Tối ưu PWA offline & Đóng gói sản phẩm.
