import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  QueryConstraint,
  doc,
  setDoc,
  DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import { Hospital } from "./mockData";

/**
 * Add a new document to a collection
 */
export const addDocument = <T extends DocumentData>(
  collectionName: string,
  data: T
) => {
  return addDoc(collection(db, collectionName), data);
};

/**
 * Get all documents from a collection
 * Uses _docId to ensure Firestore document ID is never overwritten by data fields
 */
export const getDocuments = async <T extends DocumentData>(
  collectionName: string
): Promise<(T & { _docId: string })[]> => {
  const querySnapshot = await getDocs(collection(db, collectionName));
  return querySnapshot.docs.map(
    (docSnap) => ({ _docId: docSnap.id, id: docSnap.id, ...docSnap.data() } as unknown as T & { _docId: string })
  );
};

/**
 * Get a single document by ID
 */
export const getDocument = async <T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<T | null> => {
  const docSnapshot = await getDoc(doc(db, collectionName, docId));
  if (docSnapshot.exists()) {
    return { _docId: docSnapshot.id, id: docSnapshot.id, ...docSnapshot.data() } as unknown as T;
  }
  return null;
};

/**
 * Query documents with conditions
 */
export const queryDocuments = async <T extends DocumentData>(
  collectionName: string,
  conditions: QueryConstraint[]
): Promise<T[]> => {
  const q = query(collection(db, collectionName), ...conditions);
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(
    (docSnap) => ({ _docId: docSnap.id, id: docSnap.id, ...docSnap.data() } as unknown as T)
  );
};

/**
 * Update a document
 */
export const updateDocument = (
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
) => {
  return updateDoc(doc(db, collectionName, docId), data);
};

/**
 * Set a document (create or overwrite)
 */
export const setDocument = <T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T
) => {
  return setDoc(doc(db, collectionName, docId), data);
};

/**
 * Delete a document
 */
export const deleteDocument = (collectionName: string, docId: string) => {
  return deleteDoc(doc(db, collectionName, docId));
};

/**
 * Common query helper - find documents where a field equals a value
 */
export const findDocumentsByField = async <T extends DocumentData>(
  collectionName: string,
  field: string,
  value: string | number | boolean
): Promise<T[]> => {
  return queryDocuments<T>(collectionName, [where(field, "==", value)]);
};

/**
 * Hospital-specific functions
 */

/**
 * Cache hospitals in Firebase
 */
export const cacheHospitals = async (hospitals: Hospital[]) => {
  try {
    const timestamp = new Date().toISOString();
    for (const hospital of hospitals) {
      await setDocument("hospitals", hospital.id, {
        ...hospital,
        cachedAt: timestamp,
      });
    }
    console.log(`Cached ${hospitals.length} hospitals in Firebase`);
  } catch (error) {
    console.error("Error caching hospitals:", error);
  }
};

interface CachedHospital extends Hospital {
  _docId: string;
  cachedAt?: string;
}

/**
 * Get cached hospitals from Firebase
 */
export const getCachedHospitals = async (maxAgeMinutes: number = 60) => {
  try {
    const hospitals = await getDocuments<CachedHospital>("hospitals");
    const now = new Date();

    return hospitals.filter((hospital) => {
      if (!hospital.cachedAt) return false;
      const cachedTime = new Date(hospital.cachedAt);
      const ageMinutes = (now.getTime() - cachedTime.getTime()) / (1000 * 60);
      return ageMinutes < maxAgeMinutes;
    });
  } catch (error) {
    console.error("Error getting cached hospitals:", error);
    return [];
  }
};

/**
 * Clear hospital cache
 * Uses _docId (Firestore document ID) to ensure correct deletion
 */
export const clearHospitalCache = async () => {
  try {
    const hospitals = await getDocuments<CachedHospital>("hospitals");
    for (const hospital of hospitals) {
      await deleteDocument("hospitals", hospital._docId);
    }
    console.log("Cleared hospital cache");
  } catch (error) {
    console.error("Error clearing hospital cache:", error);
  }
};
