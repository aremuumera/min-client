const DB_NAME = 'FileStorageDB';
let DB_VERSION = 1;

export const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event: any) => {
            console.error('Database error:', event.target.error);
            reject(`Database error: ${event.target.error}`);
        };

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            console.log('Database upgrade needed, creating stores...');

            const stores = [
                'ProductImages',
                'ProductAttachment',
                'supplierProfileLogo',
                'supplierProfileBanner'
            ];

            stores.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                    console.log(`Created object store: ${storeName}`);
                }
            });
        };

        request.onsuccess = (event: any) => {
            const db = event.target.result;

            const requiredStores = [
                'ProductImages',
                'ProductAttachment',
                'supplierProfileLogo',
                'supplierProfileBanner'
            ];

            const missingStores = requiredStores.filter(
                store => !db.objectStoreNames.contains(store)
            );

            if (missingStores.length > 0) {
                DB_VERSION++;
                console.warn(`Missing stores: ${missingStores.join(', ')}. Retrying with new version...`);
                db.close();
                openDB().then(resolve).catch(reject);
            } else {
                resolve(db);
            }
        };

        request.onblocked = () => {
            console.warn('Database upgrade blocked - please close other tabs');
            reject('Database upgrade blocked - please close other tabs');
        };
    });
};

export const storeFileInIndexedDB = async (files: File[], dbTable: string): Promise<any[]> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(dbTable, "readwrite");
        const store = transaction.objectStore(dbTable);

        const fileDataForRedux: any[] = [];

        const filePromises = files.map((file) => {
            const url = URL.createObjectURL(file);
            const fileData = {
                file,
                name: file.name,
                type: file.type,
                size: file.size,
                url,
            };

            fileDataForRedux.push({
                name: file.name,
                type: file.type,
                size: file.size,
                url
            });

            return new Promise((res, rej) => {
                const putRequest = store.put(fileData);
                putRequest.onsuccess = () => res(putRequest.result);
                putRequest.onerror = () => rej(putRequest.error);
            });
        });

        await Promise.all(filePromises);
        console.log(`${files.length} files stored successfully in ${dbTable}`);
        return fileDataForRedux;
    } catch (error) {
        console.error('Error storing files:', error);
        throw error;
    }
};

export const getAllFilesFromIndexedDBForServer = async (dbTable: string): Promise<File[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(dbTable, 'readonly');
            const store = transaction.objectStore(dbTable);
            const getRequest = store.getAll();
            getRequest.onsuccess = () => {
                const filesData = getRequest.result.map(fileData => fileData.file);
                resolve(filesData);
            };
            getRequest.onerror = (error) => reject(error);
        } catch (error) {
            reject(error);
        }
    });
};

export const clearAllFilesFromIndexedDB = async (dbTable: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const transaction = db.transaction(dbTable, 'readwrite');
            const store = transaction.objectStore(dbTable);
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const files = getAllRequest.result;
                files.forEach(file => {
                    if (file.url) {
                        URL.revokeObjectURL(file.url);
                    }
                });
                const clearRequest = store.clear();
                clearRequest.onsuccess = () => resolve('All files cleared');
                clearRequest.onerror = (error) => reject(error);
            };
            getAllRequest.onerror = (error) => reject(error);
        } catch (error) {
            reject(error);
        }
    });
};

export const deleteFileByNameFromIndexedDB = async (dbTable: string, fileName: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            if (!db.objectStoreNames.contains(dbTable)) {
                return reject(new Error(`Object store ${dbTable} does not exist in the database`));
            }
            const transaction = db.transaction(dbTable, 'readwrite');
            const store = transaction.objectStore(dbTable);
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const files = getAllRequest.result;
                const fileToDelete = files.find(file => file.name && file.name === fileName);
                if (fileToDelete) {
                    if (fileToDelete.url) {
                        URL.revokeObjectURL(fileToDelete.url);
                    }
                    const deleteRequest = store.delete(fileToDelete.id);
                    deleteRequest.onsuccess = () => resolve(`File ${fileName} deleted`);
                    deleteRequest.onerror = (error) => reject(error);
                } else {
                    resolve(`File ${fileName} not found`);
                }
            };
            getAllRequest.onerror = (error) => reject(error);
        } catch (error) {
            reject(error);
        }
    });
};

export const logAllDataFromIndexedDB = async (dbTable: string): Promise<any[]> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            if (!db.objectStoreNames.contains(dbTable)) {
                return reject(new Error(`Object store ${dbTable} does not exist`));
            }
            const transaction = db.transaction(dbTable, 'readonly');
            const store = transaction.objectStore(dbTable);
            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = () => {
                const data = getAllRequest.result;
                console.log(`Data in ${dbTable}:`, data);
                resolve(data);
            };
            getAllRequest.onerror = (error) => reject(error);
        } catch (error) {
            reject(error);
        }
    });
};

export const clearAllIndexedDBData = (): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const storeNames = Array.from(db.objectStoreNames);
            if (storeNames.length === 0) {
                resolve('Database already empty.');
                return;
            }
            const revokeUrlsAndClearPromises = storeNames.map((storeName) => {
                return new Promise((res, rej) => {
                    const transaction = db.transaction(storeName, 'readwrite');
                    const store = transaction.objectStore(storeName);
                    const getAllRequest = store.getAll();
                    getAllRequest.onsuccess = () => {
                        const files = getAllRequest.result;
                        files.forEach(file => {
                            if (file.url) {
                                URL.revokeObjectURL(file.url);
                            }
                        });
                        const clearRequest = store.clear();
                        clearRequest.onsuccess = () => res(`${storeName} cleared`);
                        clearRequest.onerror = (error) => rej(error);
                    };
                    getAllRequest.onerror = (error) => rej(error);
                });
            });
            Promise.all(revokeUrlsAndClearPromises)
                .then(() => resolve('All object stores cleared and URLs revoked.'))
                .catch((error) => reject(error));
        } catch (error) {
            reject(error);
        }
    });
};

export const storeSingleFileInIndexedDB = async (file: File, dbTable: string): Promise<{ name: string; type: string; size: number }> => {
    try {
        const db = await openDB();
        const transaction = db.transaction(dbTable, "readwrite");
        const store = transaction.objectStore(dbTable);
        const fileData = {
            file,
            name: file.name,
            type: file.type,
            size: file.size,
        };
        await new Promise((res, rej) => {
            const putRequest = store.put(fileData);
            putRequest.onsuccess = () => res(putRequest.result);
            putRequest.onerror = () => rej(putRequest.error);
        });
        return {
            name: file.name,
            type: file.type,
            size: file.size,
        };
    } catch (error) {
        console.error("Error storing file:", error);
        throw error;
    }
};

export const deleteSingleFileByNameFromIndexedDB = async (dbTable: string, fileName: string): Promise<string> => {
    return deleteFileByNameFromIndexedDB(dbTable, fileName);
};
