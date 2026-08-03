'use client';

import { useState, useEffect } from 'react';
import { isIndexedDBSupported } from '@/lib/feature-support';
import { getRepositoryContainer, RepositoryContainer } from '@/infrastructure/database/db-factory';
import { initializeDefaultSettings } from '@/infrastructure/database/seed-data';

export type DatabaseStatus = 'initializing' | 'ready' | 'error' | 'unsupported';

export interface UseDatabaseResult {
  status: DatabaseStatus;
  errorMessage?: string;
  container?: RepositoryContainer;
}

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
