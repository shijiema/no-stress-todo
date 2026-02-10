const DB_NAME = 'no-stress-todo';
const DB_VERSION = 1;
const STORE_NAME = 'tasks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadTasks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => {
      const tasks = request.result.map(t => ({
        ...t,
        start: new Date(t.start),
        end: t.end ? new Date(t.end) : null,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
      }));
      resolve(tasks);
    };
    request.onerror = () => reject(request.error);
  });
}

export async function saveTasks(tasks) {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  store.clear();
  for (const task of tasks) {
    store.put({
      ...task,
      start: task.start instanceof Date ? task.start.toISOString() : task.start,
      end: task.end instanceof Date ? task.end.toISOString() : task.end,
      createdAt: task.createdAt instanceof Date ? task.createdAt.toISOString() : task.createdAt,
    });
  }
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
