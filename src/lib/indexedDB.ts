export const DB_NAME = 'PriceEntryDB';
export const DB_VERSION = 1;
export const STORE_NAME = 'priceInputs';

// 打开数据库连接
export const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error("IndexedDB error:", event);
      reject("无法打开数据库");
    };
    
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      // 创建对象存储
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'orgName' });
      }
    };
  });
};

// 从 IndexedDB 加载数据
export const loadFromIndexedDB = async (orgName: string): Promise<any> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(orgName);
      
      request.onsuccess = () => {
        db.close();
        resolve(request.result ? request.result.data : null);
      };
      
      request.onerror = (event) => {
        db.close();
        console.error("读取数据失败:", event);
        reject("读取数据失败");
      };
    });
  } catch (error) {
    console.error("加载数据时出错:", error);
    // 尝试从 localStorage 恢复（兼容旧数据）
    const savedPrices = localStorage.getItem(`price_inputs_${orgName}`);
    if (savedPrices) {
      try {
        return JSON.parse(savedPrices);
      } catch (e) {
        console.error("解析 localStorage 数据失败", e);
      }
    }
    return null;
  }
};

// 保存数据到 IndexedDB
export const saveToIndexedDB = async (orgName: string, data: any): Promise<boolean> => {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      
      const request = store.put({
        orgName: orgName,
        data: data,
        timestamp: new Date().getTime()
      });
      
      transaction.oncomplete = () => {
        db.close();
        resolve(true);
      };
      
      transaction.onerror = (event) => {
        db.close();
        console.error("保存数据失败:", event);
        reject("保存数据失败");
      };
    });
  } catch (error) {
    console.error("保存数据时出错:", error);
    // 尝试回退到 localStorage
    try {
      localStorage.setItem(`price_inputs_${orgName}`, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("回退到 localStorage 失败", e);
      return false;
    }
  }
};
