/**
 * Domain Value Objects và Enums cho Wordora.
 * Hoàn toàn decoupled khỏi UI, React, Next.js, và Dexie.
 */

/**
 * Phân loại mục học trong bộ học.
 *
 * @remarks
 * - `vocabulary`: Từ đơn (ví dụ: "apple").
 * - `phrase`: Cụm từ (ví dụ: "break the ice").
 * - `sentence`: Mẫu câu hoàn chỉnh (ví dụ: "How are you doing today?").
 */
export type LearningItemType = 'vocabulary' | 'phrase' | 'sentence';

/**
 * Trạng thái ôn tập của một mục học theo thuật toán Lặp lại ngắt quãng (SRS/SM-2).
 *
 * @remarks
 * - `new`: Thẻ mới tạo, chưa thực hiện ô tập lượt nào.
 * - `learning`: Đang trong giai đoạn học ban đầu (khoảng cách lặp lại ngắn).
 * - `review`: Đã ghi nhớ ban đầu, nằm trong lộ trình ôn tập định kỳ dài hạn.
 * - `mastered`: Đã đạt trạng thái thành thạo hoàn toàn.
 */
export type ReviewStatus = 'new' | 'learning' | 'review' | 'mastered';

/**
 * Mức độ tự đánh giá phản hồi của người dùng sau mỗi lượt lật thẻ / trả lời (thang điểm SM-2).
 *
 * @remarks
 * - `again`: Không nhớ / trả lời sai -> Reset interval và tăng số lần tái phạm (lapses).
 * - `hard`: Nhớ nhưng gặp nhiều khó khăn -> Giảm Ease Factor (EF), tăng nhẹ interval.
 * - `good`: Trả lời đúng mức tiêu chuẩn -> Giữ nguyên hoặc điều chỉnh nhẹ EF, tăng interval tiêu chuẩn.
 * - `easy`: Nhớ phản xạ dễ dàng -> Tăng Ease Factor (EF), mở rộng interval lớn hơn.
 */
export type ReviewRating = 'again' | 'hard' | 'good' | 'easy';

/**
 * Dạng bài tập luyện tập được sinh ra cho các mục học trong phiên làm bài.
 *
 * @remarks
 * - `multipleChoice`: Bài tập trắc nghiệm (1 đáp án đúng trong các lựa chọn nhiễu).
 * - `fillInBlank`: Bài tập điền từ còn thiếu vào ô trống trong câu ví dụ.
 * - `sentenceOrdering`: Bài tập xáo trộn token và yêu cầu sắp xếp thành câu đúng.
 */
export type ExerciseType = 'multipleChoice' | 'fillInBlank' | 'sentenceOrdering';

/**
 * Chế độ hoạt động của một phiên học (Study Session).
 *
 * @remarks
 * - `flashcard`: Học/ôn lật thẻ tự do hai mặt (prompt - answer).
 * - `quiz`: Thực hành giải các dạng bài tập trắc nghiệm / điền từ / sắp xếp câu.
 * - `srsReview`: Phiên ôn tập ngắt quãng chỉ lấy các thẻ đã đến hạn (due date <= thời điểm hiện tại).
 */
export type SessionMode = 'flashcard' | 'quiz' | 'srsReview';

