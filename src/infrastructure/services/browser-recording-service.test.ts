import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BrowserRecordingService } from './browser-recording-service';

/**
 * Bộ kiểm thử đơn vị cho BrowserRecordingService sử dụng Vitest.
 *
 * @remarks
 * - **MOCK LIMITATION NOTICE**:
 *   - Môi trường Node.js / JSDOM không có phần cứng micro thực cũng như đối tượng `MediaRecorder`.
 *   - Bài test sử dụng mock giả lập `navigator.mediaDevices.getUserMedia` và lớp `MockMediaRecorder`.
 *   - **TRÌNH DUYỆT THẬT**: Trên thiết bị thực tế, việc ghi âm đòi hỏi quyền truy cập micro từ người dùng, ngữ cảnh bảo mật HTTPS (`window.isSecureContext`), và việc hỗ trợ các MIME codecs khác nhau giữa Chrome (WebM Opus) và Safari iOS (MP4/AAC). Cần thực hiện kiểm thử thủ công trên thiết bị thực tế.
 */
describe('BrowserRecordingService Tests', () => {
  let mockTrackStop: ReturnType<typeof vi.fn>;
  let mockStream: MediaStream;

  beforeEach(() => {
    mockTrackStop = vi.fn();
    mockStream = {
      getTracks: vi.fn().mockReturnValue([{ stop: mockTrackStop }]),
    } as unknown as MediaStream;

    // Mock getUserMedia
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
    });

    // Mock MediaRecorder
    class MockMediaRecorder {
      static isTypeSupported = vi.fn().mockImplementation((type: string) => {
        return type.includes('webm');
      });

      mimeType = 'audio/webm';
      ondataavailable: ((e: { data: Blob }) => void) | null = null;
      onstop: (() => void) | null = null;
      onerror: (() => void) | null = null;

      start() {}
      stop() {
        if (this.ondataavailable) {
          this.ondataavailable({ data: new Blob(['audio-content'], { type: 'audio/webm' }) });
        }
        if (this.onstop) {
          this.onstop();
        }
      }
    }

    vi.stubGlobal('MediaRecorder', MockMediaRecorder);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('isSupported returns true when mediaDevices and MediaRecorder exist', () => {
    const service = new BrowserRecordingService();
    expect(service.isSupported()).toBe(true);
  });

  it('requestPermission requests audio stream and immediately cleans up tracks', async () => {
    const service = new BrowserRecordingService();
    const granted = await service.requestPermission();

    expect(granted).toBe(true);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({ audio: true });
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('start and stop returns RecordingResult Blob and cleans up tracks', async () => {
    const service = new BrowserRecordingService();
    await service.start(30);

    expect(service.getState()).toBe('recording');

    const result = await service.stop();

    expect(result.blob).toBeDefined();
    expect(result.blob.size).toBeGreaterThan(0);
    expect(service.getState()).toBe('idle');
    expect(mockTrackStop).toHaveBeenCalled();
  });

  it('cancel stops stream tracks and resets state to idle without saving Blob', async () => {
    const service = new BrowserRecordingService();
    await service.start(30);
    expect(service.getState()).toBe('recording');

    service.cancel();

    expect(service.getState()).toBe('idle');
    expect(mockTrackStop).toHaveBeenCalled();
  });
});

