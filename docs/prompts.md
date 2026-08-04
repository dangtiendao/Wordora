# 📝 Danh sách Prompt Mẫu Tái Sử Dụng (Wordora Prompt Reference)

Tài liệu này tổng hợp các prompt quy chuẩn phục vụ cho việc mở rộng tính năng Import nâng cao và thực hiện sửa lỗi có kiểm soát (Controlled Fix) trong tương lai.

---

## 1. PROMPT BỔ SUNG IMPORT SAU NÀY (Future Import Extension Prompt)

```text
Hãy phân tích và đề xuất PHASE IMPORT dựa trên codebase hiện tại.

Yêu cầu nguồn dữ liệu của tôi:
- Định dạng: [JSON/CSV/XLSX].
- Cấu trúc cột hoặc file: [mô tả hoặc đính kèm mẫu].
- Dữ liệu chứa: [deck/từ vựng/cụm từ/mẫu câu].
- Quy tắc trùng: [skip/overwrite/duplicate].
- Có nhập lịch sử học không: [có/không].
- Có nhập recording không: [có/không].
- Kích thước dữ liệu dự kiến: [số dòng/dung lượng].
- Encoding dự kiến: [UTF-8/...].
- Ngôn ngữ dữ liệu: [mô tả].

Trước tiên chỉ thực hiện:
1. Kiểm tra kiến trúc import đã có.
2. Phân tích file mẫu.
3. Đề xuất mapping cột vào domain model.
4. Xác định validation rule.
5. Xác định conflict strategy.
6. Xác định transaction và rollback.
7. Xác định preview và error report.
8. Đề xuất chia phase nhỏ.
9. Liệt kê rủi ro dữ liệu.
10. Trình bày kế hoạch triển khai.

CHƯA ĐƯỢC VIẾT CODE trong bước phân tích này.
DỪNG LẠI SAU KHI TRÌNH BÀY KẾ HOẠCH.
CHỜ TÔI XÁC NHẬN TRƯỚC KHI TRIỂN KHAI IMPORT.
```

---

## 2. PROMPT SỬA LỖI CÓ KIỂM SOÁT (Controlled Fix Prompt)

```text
Hãy thực hiện CONTROLLED FIX cho Phase [SỐ_PHASE]: [TÊN_PHASE].

Chỉ được sửa các phát hiện sau:
[DANH_SÁCH_ID]

Ví dụ:
- RV-4-001
- RV-4-003
- RV-4-007

Báo cáo review là nguồn xác định lỗi, nhưng phải xác minh lại từng lỗi trực tiếp
trên codebase trước khi sửa.

==================================================
1. MỤC TIÊU
==================================================

Sửa đúng nguyên nhân gốc của các phát hiện được chọn với thay đổi nhỏ nhất, an
toàn nhất và có thể kiểm chứng.

Không được:
- Sửa lỗi ngoài danh sách.
- Thực hiện phase tiếp theo.
- Thêm feature mới.
- Refactor diện rộng.
- Nâng cấp dependency không cần thiết.
- Thay đổi kiến trúc ngoài phần cần thiết để sửa lỗi.
- Làm thay đổi hành vi nghiệp vụ không liên quan.
- Xóa test, giảm assertion hoặc làm yếu validation để test pass.
- Tắt TypeScript, ESLint hoặc rule kiểm tra để né lỗi.
- Dùng any, ts-ignore hoặc eslint-disable để che lỗi nếu chưa được chấp thuận.
- Reset hoặc xóa thay đổi hiện có.
- Thực hiện migration phá hủy dữ liệu.
- Sửa trực tiếp dữ liệu production.

==================================================
2. XÁC MINH TRƯỚC KHI SỬA
==================================================

Với từng ID trong danh sách:

1. Đọc nội dung phát hiện.
2. Xác định file và symbol liên quan.
3. Tái hiện lỗi bằng:
   - test hiện có;
   - test nhỏ có mục tiêu;
   - lệnh kiểm tra;
   - hoặc các bước thủ công rõ ràng.
4. Xác nhận nguyên nhân gốc.
5. Xác định phạm vi ảnh hưởng.
6. Đề xuất cách sửa tối thiểu.
7. Xác định test hồi quy cần có.

Nếu không tái hiện được:
- Không tự ý sửa theo phỏng đoán.
- Đánh dấu NOT REPRODUCED.
- Ghi bằng chứng đã kiểm tra.
- Chuyển sang lỗi tiếp theo.

Nếu phát hiện review không chính xác:
- Đánh dấu INVALID FINDING.
- Giải thích bằng bằng chứng.
- Không thay đổi code cho phát hiện đó.

==================================================
3. LẬP KẾ HOẠCH TRƯỚC KHI CHỈNH SỬA
==================================================

Trước khi sửa code, trình bày kế hoạch ngắn gồm:
- ID lỗi.
- Nguyên nhân gốc.
- File dự kiến sửa.
- Test dự kiến thêm hoặc cập nhật.
- Rủi ro.
- Cách rollback.
- Xác nhận không vượt phạm vi.

Sau đó mới bắt đầu sửa.

Không dừng để hỏi xác nhận, trừ khi gặp một trong các trường hợp:
- Có nguy cơ mất dữ liệu.
- Cần migration không tương thích ngược.
- Cần thay đổi public contract lớn.
- Cần gỡ hoặc nâng major version dependency.
- Có nhiều hướng sửa làm thay đổi nghiệp vụ khác nhau.
- Báo cáo lỗi mâu thuẫn với yêu cầu phase.

==================================================
4. THỨ TỰ SỬA
==================================================

Thực hiện theo thứ tự:
1. BLOCKER.
2. CRITICAL.
3. MAJOR.
4. MINOR.
5. SUGGESTION chỉ khi được liệt kê rõ trong danh sách.

Nếu một lỗi phụ thuộc lỗi khác:
- Sửa dependency trước.
- Ghi rõ quan hệ.
- Không mở rộng sang lỗi chưa được chọn, trừ khi đó là điều kiện kỹ thuật không
  thể tách rời.
- Nếu bắt buộc chạm đến phần ngoài danh sách, dừng và báo cáo để xin xác nhận.

==================================================
5. QUY TẮC THAY ĐỔI TỐI THIỂU
==================================================

Đối với mỗi lỗi:
- Chỉ sửa file cần thiết.
- Giữ nguyên public API nếu có thể.
- Không đổi tên hàng loạt.
- Không format toàn repository.
- Không di chuyển thư mục nếu không bắt buộc.
- Không thay đổi UI ngoài vùng liên quan.
- Không sửa nội dung hoặc terminology không liên quan.
- Không tối ưu hiệu năng khi lỗi không liên quan hiệu năng.
- Không thay đổi schema database nếu có thể sửa ở application layer.
- Không thêm abstraction chỉ dùng một lần nếu không cần thiết.
- Tái sử dụng pattern sẵn có của codebase.
- Giữ tương thích với dữ liệu đã tồn tại.

Nếu formatter làm thay đổi nhiều file ngoài phạm vi:
- Không chấp nhận thay đổi đó một cách máy móc.
- Giới hạn format ở file đã sửa nếu công cụ hỗ trợ.

==================================================
6. QUY TẮC TEST-FIRST VÀ REGRESSION
==================================================

Khi lỗi có thể kiểm thử tự động:
1. Thêm hoặc cập nhật test để tái hiện lỗi.
2. Xác nhận test thất bại vì đúng nguyên nhân.
3. Sửa code.
4. Xác nhận test mới thành công.
5. Chạy các test liên quan.
6. Chạy regression test thích hợp.

Không được:
- Thay expected value để phù hợp hành vi sai.
- Xóa assertion.
- Mock chính phần logic đang cần kiểm tra.
- Dùng snapshot mới thay thế assertion nghiệp vụ.
- Làm test phụ thuộc thời gian thực hoặc random không kiểm soát.
- Bỏ qua test thất bại.

Nếu không thể viết test tự động:
- Giải thích lý do.
- Cung cấp checklist kiểm thử thủ công chi tiết.
- Không tuyên bố sửa thành công khi chưa có bằng chứng phù hợp.

==================================================
7. QUY TẮC RIÊNG CHO DỮ LIỆU
==================================================

Nếu lỗi liên quan IndexedDB, repository hoặc transaction:
- Không xóa database để làm lỗi biến mất.
- Không đổi database name để né migration.
- Không xóa dữ liệu người dùng hiện có.
- Multi-table write phải atomic khi nghiệp vụ yêu cầu.
- Kiểm tra rollback.
- Kiểm tra dữ liệu cũ và dữ liệu mới.
- Kiểm tra orphan record.
- Kiểm tra duplicate ID.
- Kiểm tra refresh và khởi động lại ứng dụng.
- Nếu cần migration, migration phải:
  - tăng schema version đúng;
  - có tính xác định;
  - giữ dữ liệu cũ;
  - có test nâng cấp từ phiên bản trước;
  - không phụ thuộc UI;
  - có phương án khi migration thất bại.

Nếu migration có nguy cơ mất dữ liệu:
- Dừng lại trước khi triển khai.
- Báo cáo tác động và phương án an toàn.
- Chờ tôi xác nhận.

==================================================
8. QUY TẮC RIÊNG CHO BROWSER API
==================================================

Nếu lỗi liên quan TTS, microphone, PWA hoặc browser API:
- Không truy cập browser API ở module scope.
- Có feature detection.
- Có unsupported state.
- Cleanup listener, utterance, stream, track, timer và object URL.
- Không yêu cầu microphone nếu chưa có thao tác người dùng.
- Không để TTS và recording tranh chấp nếu thiết kế không cho phép.
- Không giả định mọi trình duyệt hỗ trợ cùng MIME type hoặc voice.
- Không làm workaround chỉ hoạt động trong mock test.
- Cung cấp kiểm thử thủ công trên trình duyệt thật.

==================================================
9. QUY TẮC RIÊNG CHO BẢO MẬT
==================================================

Nếu lỗi liên quan bảo mật:
- Không log secret hoặc dữ liệu nhạy cảm.
- Không render raw HTML không tin cậy.
- Không eval dữ liệu.
- Không tin MIME type hoặc extension.
- Không deep merge object không kiểm soát.
- Không bỏ validation để chấp nhận dữ liệu.
- Không trả stack trace kỹ thuật cho người dùng.
- Thêm test cho payload hoặc tình huống gây lỗi nếu phù hợp.
- Không mở rộng quyền truy cập để giải quyết lỗi quyền.

==================================================
10. QUẢN LÝ THAY ĐỔI NGOÀI DỰ KIẾN
==================================================

Trong quá trình sửa, nếu phát hiện lỗi mới:
- Không tự sửa nếu lỗi mới không chặn việc sửa lỗi được chọn.
- Ghi lại dưới dạng NEW FINDING.
- Nêu mức độ, bằng chứng và tác động.
- Tiếp tục phần sửa hiện tại nếu vẫn an toàn.

Nếu lỗi mới là BLOCKER hoặc CRITICAL và việc tiếp tục có thể gây mất dữ liệu hoặc
bảo mật:
- Dừng triển khai.
- Báo cáo ngay.
- Không thực hiện thêm thay đổi rủi ro.

Nếu phát hiện codebase có thay đổi ngoài phạm vi do người khác hoặc tiến trình khác:
- Không ghi đè.
- Không reset.
- Nêu file bị ảnh hưởng.
- Cố gắng cô lập thay đổi nếu an toàn.
- Dừng nếu có nguy cơ xung đột.

==================================================
11. KIỂM TRA SAU KHI SỬA
==================================================

Sau khi sửa xong, chạy:
- Test tái hiện từng lỗi.
- Test của feature liên quan.
- Test hồi quy của các phần bị ảnh hưởng.
- Lint.
- Typecheck.
- Production build.
- E2E liên quan nếu có hoặc nếu thay đổi ảnh hưởng luồng người dùng chính.

Yêu cầu:
- Dùng package manager hiện có.
- Không dùng cờ bỏ qua lỗi.
- Không sửa config để lệnh pass.
- Ghi chính xác command và kết quả.
- Nếu một kiểm tra không chạy được, không được báo PASS.
- Phân biệt:
  - PASSED
  - FAILED
  - NOT RUN
  - NOT VERIFIED

Kiểm tra git diff cuối cùng:
- Chỉ có file cần thiết.
- Không có debug log.
- Không có file tạm.
- Không có secret.
- Không có package hoặc lockfile thay đổi ngoài dự kiến.
- Không có format noise lớn.
- Không có feature của phase sau.

==================================================
12. XÁC MINH TỪNG PHÁT HIỆN
==================================================

Với mỗi ID được chọn, kết luận một trong các trạng thái:
- FIXED:
  Đã tái hiện, sửa và có bằng chứng regression test.
- PARTIALLY FIXED:
  Một phần đã sửa nhưng vẫn còn điều kiện chưa giải quyết.
- NOT FIXED:
  Không sửa được hoặc kiểm tra vẫn thất bại.
- NOT REPRODUCED:
  Không tái hiện được.
- INVALID FINDING:
  Phát hiện ban đầu không đúng, có bằng chứng.
- BLOCKED:
  Cần quyết định hoặc thay đổi vượt phạm vi.

Không đánh dấu FIXED chỉ vì code đã thay đổi.

==================================================
13. ĐỊNH DẠNG BÁO CÁO
==================================================

Trả kết quả theo cấu trúc:

# CONTROLLED FIX REPORT
## Phase [SỐ_PHASE]: [TÊN_PHASE]

## 1. Kết quả tổng
- Trạng thái: COMPLETED / PARTIAL / BLOCKED / FAILED
- Số lỗi fixed
- Số lỗi partial
- Số lỗi not reproduced hoặc invalid
- Số lỗi blocked
- Phase đã sẵn sàng review lại hay chưa: CÓ / KHÔNG

## 2. Kế hoạch đã thực hiện
Bảng gồm:
- Finding ID
- Nguyên nhân gốc
- Phương án sửa
- File liên quan
- Rủi ro

## 3. Chi tiết từng lỗi
Với mỗi ID:
- Trạng thái cuối.
- Cách tái hiện.
- Nguyên nhân gốc.
- Thay đổi đã thực hiện.
- Vì sao cách sửa không vượt phạm vi.
- Test được thêm hoặc cập nhật.
- Bằng chứng xác minh.
- Hạn chế còn lại.

## 4. File đã thay đổi
Bảng gồm:
- File
- Loại thay đổi
- Lý do
- Finding ID liên quan

## 5. Kết quả kiểm tra
Bảng gồm:
- Lệnh hoặc kiểm thử
- Trạng thái
- Kết quả
- Finding ID được xác minh

## 6. Kiểm thử hồi quy
- Phạm vi.
- Kết quả.
- Phần chưa xác minh.
- Kiểm thử thủ công cần thực hiện.

## 7. New findings
- Chỉ báo cáo, không sửa.
- Nếu không có, ghi “Không có”.

## 8. Rủi ro và giới hạn còn lại
- Rủi ro.
- Tác động.
- Hướng xử lý sau này.

## 9. Kết luận
- Có thể gửi lại Prompt Review Phase [SỐ_PHASE] hay chưa.
- Có lỗi nào vẫn chặn nghiệm thu hay không.
- Không đề xuất bắt đầu phase tiếp theo khi chưa review lại.

==================================================
14. QUY TẮC KẾT THÚC
==================================================

Sau khi hoàn thành báo cáo:
- DỪNG LẠI.
- KHÔNG tự review lại toàn phase.
- KHÔNG thực hiện phase tiếp theo.
- KHÔNG tự sửa new finding.
- Chờ tôi gửi prompt re-review hoặc yêu cầu sửa tiếp.
```
