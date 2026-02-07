# Check Instagram Following Back

Script to check which Instagram users don't follow you back.

## 📋 Description

This script analyzes your Instagram following list and generates a JSON file with all users who don't follow you back. It runs directly in the browser console while you're on your Instagram profile.

## ✨ Features

- ✅ Complete analysis of all your following
- ✅ Real-time progress in the console
- ✅ Automatic download of results in JSON format
- ✅ Random delays to avoid temporary blocks
- ✅ Automatic pauses every certain number of requests

## 🚀 How to Use

1. **Log in to Instagram** from your web browser (Chrome, Firefox, Safari, etc.)

2. **Go to your profile** by clicking on your profile picture or visiting `https://www.instagram.com/your_username`

3. **Open the browser console:**
   - **Chrome/Edge:** `Cmd + Option + J` (Mac) or `Ctrl + Shift + J` (Windows/Linux)
   - **Firefox:** `Cmd + Option + K` (Mac) or `Ctrl + Shift + K` (Windows/Linux)
   - **Safari:** `Cmd + Option + C` (Mac) - first enable the developer menu in Preferences

4. **Copy and paste** the entire content of the `check-instagram-following-back.js` file into the console

5. **Press Enter** and wait for the script to finish

6. **Automatic download:** When finished, a file `usersNotFollowingBack.json` will be downloaded with the list of users

## 📊 Output

The script generates a JSON file with the following information for each user who doesn't follow you:

```json
[
  {
    "id": "123456789",
    "username": "example_user",
    "full_name": "Full Name",
    "profile_pic_url": "https://...",
    "is_verified": false,
    "follows_viewer": false
  }
]
```

## ⚠️ Warnings

- **Responsible use:** This script makes multiple requests to Instagram's API. Use it moderately.
- **Possible temporary block:** Instagram may temporarily limit your account if it detects many requests. The script includes delays to minimize this risk.
- **Against policies:** Using automated scripts may be against Instagram's terms of service. Use it at your own risk.
- **Don't save credentials:** Never modify the script to include your username or password.

## 🔧 Technical Configuration

The script includes the following constants that you can adjust if necessary:

- `FETCH_FIRST_COUNT`: Number of users per request (24)
- `MIN_DELAY`: Minimum delay between requests (1000ms)
- `MAX_RANDOM_DELAY`: Additional random delay (400ms)
- `SCROLL_CYCLES_BEFORE_BREAK`: Cycles before long pause (6)
- `SLEEP_TIME_TO_PREVENT_BLOCK`: Long pause time (10000ms)

---

**Note:** This script is for educational and personal analysis purposes only. Use it responsibly.
