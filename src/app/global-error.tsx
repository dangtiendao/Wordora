'use client';

import * as React from 'react';

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="vi">
      <body style={{ backgroundColor: '#090d16', color: '#f1f5f9', fontFamily: 'sans-serif', padding: '2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '400px', margin: '4rem auto', background: '#0f172a', padding: '2rem', borderRadius: '1rem', border: '1px solid #334155' }}>
          <h1 style={{ fontSize: '1.25rem', color: '#f43f5e', marginBottom: '1rem' }}>Lỗi ứng dụng nghiêm trọng</h1>
          <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Đã xảy ra sự cố giao diện ngoài ý muốn. Dữ liệu học tập local vẫn được lưu an toàn.
          </p>
          <button
            onClick={() => reset()}
            style={{ backgroundColor: '#10b981', color: '#090d16', border: 'none', padding: '0.5rem 1rem', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Thử tải lại ứng dụng
          </button>
        </div>
      </body>
    </html>
  );
}
