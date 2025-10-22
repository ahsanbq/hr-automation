// Shared types for progress tracking
export type ProgressData = {
  percentage: number;
  currentBatch: number;
  totalBatches: number;
  currentFile?: string | null;
  isComplete: boolean;
  timestamp: number;
  processed?: number;
  successful?: number;
  failed?: number;
  total?: number;
  errors?: Array<{ file: string; error: string }>;
};

// Extend globalThis to include our progress store
declare global {
  var progressStore: Map<string, ProgressData> | undefined;
}

// Initialize the global store if it doesn't exist
if (!global.progressStore) {
  global.progressStore = new Map();
}

export const getGlobalProgressStore = (): Map<string, ProgressData> => {
  if (!global.progressStore) {
    global.progressStore = new Map();
  }
  return global.progressStore;
};

export function updateProgress(
  userId: number,
  jobId: string,
  update: Partial<ProgressData>
) {
  const progressKey = `${userId}-${jobId}`;
  const store = getGlobalProgressStore();
  const existing = store.get(progressKey) || {
    percentage: 0,
    currentBatch: 0,
    totalBatches: 0,
    isComplete: false,
    timestamp: Date.now(),
  };

  const updated = {
    ...existing,
    ...update,
    timestamp: Date.now(),
  };

  store.set(progressKey, updated);
  console.log("🔄 Updating progress for key:", progressKey, update);
  console.log("✅ Updated progress stored:", updated);
}

export function getProgress(userId: string, jobId: string): ProgressData {
  const progressKey = `${userId}-${jobId}`;
  const store = getGlobalProgressStore();

  console.log("🔍 Getting progress for key:", progressKey);
  console.log("📊 Progress store has keys:", Array.from(store.keys()));

  const progress = store.get(progressKey);

  if (!progress) {
    console.log("📊 No progress found, returning default");
    return {
      percentage: 0,
      currentBatch: 0,
      totalBatches: 0,
      currentFile: null,
      isComplete: false,
      timestamp: Date.now(),
      processed: 0,
      successful: 0,
      failed: 0,
      total: 0,
    };
  }

  console.log("📈 Returning progress:", progress);
  return progress;
}
