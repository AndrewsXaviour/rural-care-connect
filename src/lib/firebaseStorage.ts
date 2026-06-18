import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from "firebase/storage";
import { storage } from "./firebase";

/**
 * Upload a file to Firebase Storage
 */
export const uploadFile = (filePath: string, file: File) => {
  const fileRef = ref(storage, filePath);
  return uploadBytes(fileRef, file).then(() => getDownloadURL(fileRef));
};

/**
 * Get download URL for a file
 */
export const getFileURL = (filePath: string) => {
  return getDownloadURL(ref(storage, filePath));
};

/**
 * Delete a file from Firebase Storage
 */
export const deleteFile = (filePath: string) => {
  return deleteObject(ref(storage, filePath));
};

/**
 * List all files in a directory
 */
export const listFiles = async (dirPath: string) => {
  const dirRef = ref(storage, dirPath);
  const result = await listAll(dirRef);
  const urls: { name: string; url: string }[] = [];

  for (const fileRef of result.items) {
    const url = await getDownloadURL(fileRef);
    urls.push({ name: fileRef.name, url });
  }

  return urls;
};

/**
 * Upload an image and get its URL
 * Preserves the original file extension for correct content-type detection
 */
export const uploadImage = (
  userId: string,
  imageType: string,
  file: File
) => {
  const timestamp = Date.now();
  const nameParts = file.name.split(".");
  const extension = nameParts.length > 1 ? `.${nameParts.pop()}` : "";
  const baseName = nameParts.join(".");
  const filename = `${baseName}_${timestamp}${extension}`;
  const filePath = `users/${userId}/${imageType}/${filename}`;
  return uploadFile(filePath, file);
};
