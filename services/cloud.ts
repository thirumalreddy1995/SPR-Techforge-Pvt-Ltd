// services/cloud.ts
import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  writeBatch,
  getDoc,
  // types
  type QuerySnapshot,
  type DocumentSnapshot,
  type DocumentData,
  type FirestoreError
} from 'firebase/firestore';

const STORAGE_KEY_CONFIG = 'SPR_TECHFORGE_FIREBASE_CONFIG';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

class CloudService {
  private app: FirebaseApp | null = null;
  private db: Firestore | null = null;
  private isInitialized = false;

  constructor() {
    this.tryInit();
  }

  private tryInit() {
    try {
      const storedConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
      if (storedConfig) {
        const config = JSON.parse(storedConfig) as FirebaseConfig;
        if (config.projectId && config.apiKey) {
           try {
              this.app = initializeApp(config);
              this.db = getFirestore(this.app);
              this.isInitialized = true;
              console.log("Firebase Firestore Initialized");
           } catch (err) {
              console.error("Firebase initialization failed:", err);
              this.isInitialized = false;
           }
        }
      }
    } catch (e) {
      console.error("Failed to initialize firebase from stored config", e);
    }
  }

  public saveConfig(config: FirebaseConfig) {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
    window.location.reload();
  }

  public clearConfig() {
    localStorage.removeItem(STORAGE_KEY_CONFIG);
    window.location.reload();
  }

  public isConfigured(): boolean {
    return this.isInitialized && !!this.db;
  }

  public getConfig(): FirebaseConfig | null {
    const s = localStorage.getItem(STORAGE_KEY_CONFIG);
    return s ? JSON.parse(s) : null;
  }

  // --- Connection Testing ---
  
  public async testConfig(configString: string): Promise<{ success: boolean; error?: string }> {
    try {
      const config = JSON.parse(configString) as FirebaseConfig;
      
      // Validate basic fields
      if (!config.projectId || !config.apiKey || !config.appId) {
          return { success: false, error: "Invalid Configuration object. Missing projectId, apiKey, or appId." };
      }

      const tempApp = initializeApp(config, 'testApp');
      const tempDb = getFirestore(tempApp);
      
      // Try to access a dummy document to verify connection permissions
      try {
        const ref = doc(tempDb, 'system_check', 'connection_test');
        await getDoc(ref); // This will fail if network or permissions are blocked
      } catch (dbErr: any) {
         // If it's a permission denied, we are connected but rules block us (which is okay for connectivity check)
         // If it's network error, it will throw code 'unavailable'
         const code = (dbErr && dbErr.code) ? dbErr.code : undefined;
         if (code === 'unavailable' || code === 'failed-precondition') {
            return { success: false, error: "Could not reach Firebase. Check your internet connection." };
         }
         // permission errors (e.g., 'permission-denied') are fine — config is valid
      }
      
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Invalid JSON format." };
    }
  }

  // --- Real-time Listeners ---

  /**
   * Subscribe to a collection and receive typed callbacks.
   * callback receives an array of items (document data plus .id)
   */
  public subscribe(
    tableName: string, 
    callback: (data: any[]) => void, 
    onError?: (error: FirestoreError) => void
  ) {
    if (!this.db) return () => {};
    
    // In Firestore, 'tableName' maps to 'Collection Name'
    const colRef = collection(this.db, tableName);

    const unsubscribe = onSnapshot(
      colRef, 
      (snapshot: QuerySnapshot<DocumentData>) => {
        const items: any[] = [];
        snapshot.forEach((d: DocumentSnapshot<DocumentData>) => {
            items.push({ ...d.data(), id: d.id });
        });
        console.log(`Sync: Received ${items.length} items from ${tableName}`);
        callback(items);
      }, 
      (error: FirestoreError) => {
        console.error(`Error subscribing to ${tableName}:`, error);
        if (onError) onError(error);
      }
    );

    return unsubscribe;
  }

  // --- CRUD Operations ---

  public async saveItem(tableName: string, item: any) {
    if (!this.db) throw new Error("DB not configured");
    if (!item.id) throw new Error("Item must have an ID");

    // setDoc overwrites or creates. doc(db, collection, id)
    await setDoc(doc(this.db, tableName, item.id), item);
  }

  public async deleteItem(tableName: string, id: string) {
    if (!this.db) throw new Error("DB not configured");
    await deleteDoc(doc(this.db, tableName, id));
  }

  public async uploadBatch(tableName: string, items: any[]) {
    if (!this.db) throw new Error("DB not configured");
    if (items.length === 0) return;

    // Firestore batches allow up to 500 operations
    const batchSize = 500;
    for (let i = 0; i < items.length; i += batchSize) {
        const chunk = items.slice(i, i + batchSize);
        const batch = writeBatch(this.db);
        
        chunk.forEach(item => {
            const ref = doc(this.db!, tableName, item.id);
            batch.set(ref, item);
        });

        await batch.commit();
        console.log(`Uploaded batch of ${chunk.length} to ${tableName}`);
    }
  }
  
  public getSchemaSQL() {
      return "Firestore is a NoSQL database. No Schema definition is required. Collections are created automatically when you add data.";
  }
}

export const cloudService = new CloudService();
