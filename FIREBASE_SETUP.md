# Firebase Setup Guide

This guide will help you connect your Rural Care Connect application to Google Firebase.

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project" or select an existing one
3. Follow the setup wizard to create your project
4. Enable Google Analytics (optional, but recommended)

## Step 2: Get Your Firebase Configuration

1. In Firebase Console, go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click on the web app (</> icon) or create a new web app if needed
4. Copy the Firebase SDK configuration object
5. You'll see something like:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD...",
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123def456"
   };
   ```

## Step 3: Configure Environment Variables

1. Open `.env.local` in your project root
2. Fill in the values from your Firebase config:
   ```
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain_here
   VITE_FIREBASE_PROJECT_ID=your_project_id_here
   VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket_here
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id_here
   VITE_FIREBASE_APP_ID=your_app_id_here
   ```

## Step 4: Enable Firebase Services

### Authentication
1. Go to **Authentication** in Firebase Console
2. Click "Get started"
3. Enable sign-in methods you want (Email/Password, Google, etc.)

### Firestore Database
1. Go to **Firestore Database**
2. Click "Create database"
3. Start in test mode (for development)
4. Choose a location close to your users

### Storage
1. Go to **Storage**
2. Click "Get started"
3. Start in test mode (for development)

## Step 5: Use Firebase in Your Application

### Authentication Example

```typescript
import { loginUser, registerUser, logoutUser, onAuthChange } from "@/lib/firebaseAuth";

// Register a new user
const handleRegister = async (email: string, password: string) => {
  try {
    const userCredential = await registerUser(email, password);
    console.log("User registered:", userCredential.user);
  } catch (error) {
    console.error("Registration error:", error);
  }
};

// Login
const handleLogin = async (email: string, password: string) => {
  try {
    const userCredential = await loginUser(email, password);
    console.log("User logged in:", userCredential.user);
  } catch (error) {
    console.error("Login error:", error);
  }
};

// Listen to auth state
useEffect(() => {
  const unsubscribe = onAuthChange((user) => {
    if (user) {
      console.log("User is signed in:", user);
    } else {
      console.log("User is signed out");
    }
  });
  
  return () => unsubscribe();
}, []);

// Logout
const handleLogout = async () => {
  await logoutUser();
};
```

### Database Example

```typescript
import {
  addDocument,
  getDocuments,
  updateDocument,
  deleteDocument,
  findDocumentsByField,
} from "@/lib/firebaseDb";

// Add a new appointment
const handleAddAppointment = async (appointmentData) => {
  try {
    const docRef = await addDocument("appointments", appointmentData);
    console.log("Appointment created with ID:", docRef.id);
  } catch (error) {
    console.error("Error adding appointment:", error);
  }
};

// Get all appointments
const handleGetAppointments = async () => {
  try {
    const appointments = await getDocuments("appointments");
    console.log("Appointments:", appointments);
  } catch (error) {
    console.error("Error getting appointments:", error);
  }
};

// Update an appointment
const handleUpdateAppointment = async (appointmentId, updatedData) => {
  try {
    await updateDocument("appointments", appointmentId, updatedData);
    console.log("Appointment updated");
  } catch (error) {
    console.error("Error updating appointment:", error);
  }
};

// Delete an appointment
const handleDeleteAppointment = async (appointmentId) => {
  try {
    await deleteDocument("appointments", appointmentId);
    console.log("Appointment deleted");
  } catch (error) {
    console.error("Error deleting appointment:", error);
  }
};

// Find appointments by user ID
const handleFindAppointmentsByUser = async (userId) => {
  try {
    const appointments = await findDocumentsByField("appointments", "userId", userId);
    console.log("User appointments:", appointments);
  } catch (error) {
    console.error("Error finding appointments:", error);
  }
};
```

### Storage Example

```typescript
import { uploadImage, getFileURL, deleteFile } from "@/lib/firebaseStorage";

// Upload a profile image
const handleUploadProfileImage = async (userId: string, file: File) => {
  try {
    const imageURL = await uploadImage(userId, "profile", file);
    console.log("Image uploaded:", imageURL);
    
    // Save the URL to Firestore
    await updateDocument("users", userId, { profileImage: imageURL });
  } catch (error) {
    console.error("Error uploading image:", error);
  }
};

// Delete a file
const handleDeleteFile = async (filePath: string) => {
  try {
    await deleteFile(filePath);
    console.log("File deleted");
  } catch (error) {
    console.error("Error deleting file:", error);
  }
};
```

## Step 6: Security Rules

### Firestore Rules (for test mode - DO NOT use in production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Updated Security Rules (production)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Appointments collection
    match /appointments/{appointmentId} {
      allow read, write: if request.auth != null;
    }
    
    // Doctors collection (public read)
    match /doctors/{doctorId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### Storage Rules (for test mode)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Troubleshooting

- **"Firebase is not initialized"**: Make sure your `.env.local` file has all required variables
- **"Permission denied"**: Check your Firestore/Storage security rules
- **"CORS errors"**: This is usually a configuration issue - verify your Firebase config
- **"Module not found"**: Make sure Firebase is installed: `npm install firebase`

## Next Steps

- Create a context provider for auth state management
- Integrate authentication into your LoginPage
- Set up Firestore collections matching your data model
- Configure storage for user uploads (documents, images, etc.)
- Implement real-time listeners using `onSnapshot` for live data updates
