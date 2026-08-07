'use client';

import { useState, useEffect } from 'react';
import { isIndexedDBSupported } from '@/lib/feature-support';
import { getRepositoryContainer, RepositoryContainer } from '@/infrastructure/database/db-factory';
import { initializeDefaultSettings } from '@/infrastructure/database/seed-data';

/** Trạng thái vòng đời khởi tạo cơ sở dữ liệu IndexedDB. */
export type DatabaseStatus = 'initializing' | 'ready' | 'error' | 'unsupported';

/** Kết quả trả về của custom hook `useDatabase`. */
export interface UseDatabaseResult {
  status: DatabaseStatus;
  errorMessage?: string;
  container?: RepositoryContainer;
}

/**
 * Custom React Hook quản lý việc khởi tạo và cung cấp IoC Repository Container (`useDatabase`).
 *
 * @remarks
 * - **CLIENT-ONLY REQUIREMENT**: Bắt buộc chỉ thực thi ở Client Side (`'use client'`).
 * - **FEATURE SUPPORT GUARD**:
 *   - Kiểm tra `isIndexedDBSupported()`. Nếu trình duyệt không hỗ trợ IndexedDB (ví dụ: Chế độ Incognito bị khoá của một số trình duyệt cũ), lập tức chuyển trạng thái về `'unsupported'`.
 * - **MOUNT CLEANUP SAFETY**:
 *   - Sử dụng cờ `isMounted` bên trong `useEffect` để ngăn chặn việc `setState` khi component đã bị unmount trong quá trình khởi tạo bất đồng bộ.
 * - **SEED DEFAULT SETTINGS**:
 *   - Gọi `initializeDefaultSettings(repoContainer.db)` để tự động chèn cấu hình mặc định vào CSDL IndexedDB ở lần đầu khởi chạy ứng dụng.
 *
 * @returns Đối tượng `UseDatabaseResult` chứa `status`, `errorMessage`, và `container` repositories.
 */
export function useDatabase(): UseDatabaseResult {
  const [status, setStatus] = useState<DatabaseStatus>('initializing');
  const [errorMessage, setErrorMessage] = useState<string>();
  const [container, setContainer] = useState<RepositoryContainer>();

  useEffect(() => {
    let isMounted = true;

    async function initDB() {
      if (!isIndexedDBSupported()) {
        if (isMounted) {
          setStatus('unsupported');
          setErrorMessage('Trình duyệt của bạn không hỗ trợ IndexedDB. Vui lòng sử dụng trình duyệt hiện đại hơn.');
        }
        return;
      }

      try {
        const repoContainer = getRepositoryContainer();
        await initializeDefaultSettings(repoContainer.db);

        if (isMounted) {
          setContainer(repoContainer);
          setStatus('ready');
        }
      } catch (err: unknown) {
        if (isMounted) {
          setStatus('error');
          setErrorMessage(err instanceof Error ? err.message : 'Không thể khởi tạo cơ sở dữ liệu IndexedDB.');
        }
      }
    }

    initDB();

    return () => {
      isMounted = false;
    };
  }, []);

  return { status, errorMessage, container };
}

