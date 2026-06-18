# Firebase Phone Authentication Setup Guide

This guide explains how to enable real OTP authentication for your Rural Care Connect app.

## What's New in the Login Page

✅ **Real Phone Number Validation**
- Only accepts 10-digit Indian phone numbers
- Numbers must start with 6-9
- Example format: 9876543210

✅ **Real OTP Verification**
- Firebase sends actual SMS OTP to the provided number
- 6-digit OTP verification
- Firebase validates the OTP automatically

✅ **reCAPTCHA Integration**
- Security verification before sending OTP
- Protects against abuse and automated attacks

## Step-by-Step Setup

### Step 1: Enable Phone Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **ruralcareconnect**
3. Navigate to **Authentication** > **Sign-in method**
4. Click on **Phone** sign-in method
5. Click the **Enable** toggle (if not already enabled)
6. Click **Save**

### Step 2: Enable reCAPTCHA v3

You've already added reCAPTCHA v3 in `index.html`. To complete the setup:

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Scroll down to **reCAPTCHA** section
3. Click **Enable** if not already enabled
4. This uses invisible reCAPTCHA (no user interaction needed)

### Step 3: Configure Authorized Domains

For phone authentication to work, you need to authorize your domain:

1. In Firebase Console, go to **Authentication** > **Settings**
2. Scroll to **Authorized domains** section
3. Click **Add domain**
4. Add these domains:
   - `localhost` (for local development)
   - `localhost:8080` (for your dev server)
   - `127.0.0.1`
   - Your production domain (e.g., `ruralcareconnect.com`)

### Step 4: Test in Development

#### Local Testing
```bash
cd m:\rural-care-connect-main\rural-care-connect-main
npm run dev
```

Then open http://localhost:8080 and test the login page.

#### Test Phone Numbers
Firebase provides test phone numbers for development:

1. In Firebase Console, go to **Authentication** > **Phone** settings
2. Scroll to **Test phone numbers** section
3. Click **Add phone number**
4. Add test numbers like:
   - `+919876543210` with OTP `123456`
   - `+918765432100` with OTP `654321`

**These are for testing only. Real numbers in production.**

### Step 5: Enable SMS Provider (for Production)

For production, Firebase uses these SMS providers:
- Google Cloud Messaging (GCM) - Default
- Twilio - Optional for better reliability

**For production:**
1. Go to **Authentication** > **Phone** settings
2. Check **SMS provider** - usually set to default
3. Firebase handles SMS delivery automatically

## How Phone Authentication Works

### User Flow:

1. **User enters 10-digit phone number**
   - Validated locally (starts with 6-9, exactly 10 digits)
   - Shows helpful error messages

2. **User clicks "Send OTP"**
   - reCAPTCHA verification happens silently
   - Firebase sends SMS with 6-digit OTP to user's phone
   - User sees confirmation message

3. **User enters OTP**
   - 6-digit code from their phone
   - Validated by Firebase automatically
   - If correct, user is logged in
   - If wrong, shows "Invalid OTP" error

4. **Login Success**
   - Redirects to Dashboard
   - User session established

## Security Features Implemented

### ✅ Input Validation
- Phone number: 10 digits starting with 6-9
- OTP: Exactly 6 digits
- Real-time validation with clear error messages

### ✅ Rate Limiting
- Firebase automatically limits OTP attempts
- Too many failed attempts → user must wait
- Too many requests → 15-minute cooldown

### ✅ reCAPTCHA Protection
- Bot detection
- Prevents automated abuse
- Invisible to users (no CAPTCHA UI needed)

### ✅ Session Management
- OTP expires in 5-10 minutes
- Must verify before timeout
- Can request new OTP anytime

## Error Messages & Troubleshooting

### "Invalid phone number. Must start with 6-9"
- User entered a number starting with 0-5
- Indian phone numbers must start with 6-9
- Solution: Correct the number

### "Phone number must be 10 digits"
- User entered more or less than 10 digits
- Solution: Enter exactly 10 digits

### "Invalid OTP. Please check and try again."
- Wrong 6-digit code entered
- Solution: Check SMS and re-enter correct OTP

### "OTP has expired. Please request a new one."
- More than 10 minutes passed since OTP was sent
- Solution: Click "Change Phone Number" and request new OTP

### "Too many failed attempts. Please wait..."
- User tried too many wrong OTPs
- Solution: Wait a few minutes and try again

### "Too many requests. Please wait a few minutes..."
- Too many OTP requests from same number
- Solution: Wait 15 minutes before requesting again

### "Security verification failed. Please refresh the page."
- reCAPTCHA didn't load properly
- Solution: Refresh the page and try again

## Testing Scenarios

### ✅ Test Successful Login
1. Use a Firebase test phone number from console
2. Enter the assigned test OTP
3. Should log in successfully

### ✅ Test Invalid OTP
1. Use a test phone number
2. Enter wrong OTP (e.g., 000000)
3. Should show "Invalid OTP" error

### ✅ Test Rate Limiting
1. Request OTP multiple times quickly
2. After 3-5 requests, should get "Too many requests" error
3. Wait 15 minutes, try again

### ✅ Test Expired OTP
1. Request OTP
2. Wait 10+ minutes
3. Try to verify OTP
4. Should show "OTP has expired" error

## Configuration Check

Run this in your terminal to verify Firebase is properly configured:

```bash
# Check if Firebase is installed
npm list firebase

# Build to check for errors
npm run build

# Start dev server
npm run dev
```

All should complete without errors.

## Environment Variables

Your `.env.local` already has:
```
VITE_FIREBASE_API_KEY=AIzaSyAiRDvFqCM9qHeL3RsSZyeEjMiuCFdItvk
VITE_FIREBASE_AUTH_DOMAIN=ruralcareconnect.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ruralcareconnect
VITE_FIREBASE_STORAGE_BUCKET=ruralcareconnect.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=582303847591
VITE_FIREBASE_APP_ID=1:582303847591:web:857ec88c525b0fc700f782
VITE_FIREBASE_MEASUREMENT_ID=G-V7RLS7HSGV
```

These are already configured with your Firebase project.

## Next Steps

1. ✅ Enable Phone Authentication in Firebase Console (DO THIS FIRST!)
2. ✅ Add authorized domains (localhost, your domain)
3. ✅ Test with test phone numbers
4. ✅ Deploy to production
5. Create user profile after login
6. Add appointment booking features
7. Implement doctor/hospital search

## Support

For issues:
- Check [Firebase Phone Auth Docs](https://firebase.google.com/docs/auth/web/phone-auth)
- Check Firebase Console Authentication logs
- Verify authorized domains
- Check that SMS provider is enabled

## Important Notes

⚠️ **For Development:**
- Use Firebase test phone numbers from console
- No actual SMS sent to test numbers
- OTP is what you specify in test number setup

✅ **For Production:**
- Any valid Indian phone number works
- Real SMS sent with actual OTP
- Firebase handles SMS delivery
- You pay for SMS usage

---

Your login page is now fully integrated with real Firebase phone authentication! 🎉
