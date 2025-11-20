# 🎯 HUMAN ANT TEST - REAL COLLABORATION VERIFICATION

**Date**: 2025-11-20  
**Phase**: Real Daily.co Video + Ably Messaging  
**Token Count**: ~108,313 / 200,000 (54% used)

---

## 🐜 ANT METHODOLOGY - WHY WE TEST LIKE ANTS

Just like Japanese subway engineers used ants to find optimal pathways through a maze-model of Tokyo, we use systematic "ant tests" to verify every pathway in GeoForge actually works.

**Ant Philosophy:**
- ✅ Test EVERY pathway, not just some
- ✅ Verify REAL APIs, not mocks
- ✅ Multi-user testing (ants travel in groups)
- ✅ Document exact steps (reproducible)
- ✅ PASS/FAIL - no ambiguity

---

## 🔑 SETUP REQUIREMENTS

### Step 1: Add API Keys to `.env.local`

```bash
cd /Users/justincronk/Desktop/GEO

# Add these keys to .env.local:
VITE_DAILY_API_KEY=8e48004b61c4a821639bc0e758f3b8f9a98401b6098f1d0d80edd988c742a15c
VITE_ABLY_API_KEY=5VgiQQ.5m0sdg:09jLRjTeJpfN35J0zcRNb8CWbmNgjfaZETFk60d_fW8
```

**Verify keys exist:**
```bash
grep "VITE_DAILY_API_KEY" .env.local
grep "VITE_ABLY_API_KEY" .env.local
```

### Step 2: Start Dev Server

```bash
npm run dev
```

**Expected output:**
```
VITE v7.2.4  ready in 543 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

**Open in browser:** http://localhost:5173/dashboard

---

## 🧪 ANT TEST SUITE - COLLABORATION PATHWAYS

### TEST 1: Daily.co - Create Video Room ✅/❌

**Pathway:** User → Dashboard → Team Call → Video Tab → Create Room → Live Video

**Steps:**
1. Open http://localhost:5173/dashboard
2. Click "Team Call" button (top right, collaboration icon)
3. Verify CollaborationHub opens (full-screen overlay)
4. Click "Video" tab
5. Verify "Create New Room" button visible
6. Click "Create New Room"
7. Wait 2-3 seconds

**EXPECTED:**
- ✅ Daily.co iframe loads
- ✅ Camera/mic permission prompt appears
- ✅ Can see yourself in video
- ✅ Video controls visible (mute, camera, screen share)
- ✅ Room name displays (e.g., "Project default - 10:23:45 AM")

**If FAILS:**
- Check browser console for errors
- Verify `VITE_DAILY_API_KEY` in `.env.local`
- Check Daily.co API key is valid at https://dashboard.daily.co
- Try hard refresh (Cmd+Shift+R)

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 2: Daily.co - Multi-User Video ✅/❌

**Pathway:** Ant 1 creates room → Ant 2 joins → Both see each other

**Steps:**
1. **Ant 1 (Browser 1):** Create room (from TEST 1)
2. **Ant 2 (Incognito/Different Browser):** Open http://localhost:5173/dashboard
3. **Ant 2:** Click "Team Call" → Video tab
4. **Ant 2:** Click "Browse Active Rooms"
5. **Ant 2:** Verify room created by Ant 1 appears
6. **Ant 2:** Click "Join Room"
7. Wait 2-3 seconds

**EXPECTED:**
- ✅ Ant 2 sees Ant 1's video
- ✅ Ant 1 sees Ant 2's video
- ✅ Audio works both directions
- ✅ Video is smooth (< 2 second latency)

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 3: Daily.co - Screen Share ✅/❌

**Pathway:** User shares screen → Other users see screen

**Steps:**
1. In active video call (from TEST 2)
2. **Ant 1:** Click screen share button in Daily.co UI
3. Select window/screen to share
4. Click "Share"
5. **Ant 2:** Observe video feed

**EXPECTED:**
- ✅ Ant 1's screen appears in Ant 2's video
- ✅ Screen is visible and clear
- ✅ No lag or stuttering

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 4: Daily.co - Leave Call ✅/❌

**Pathway:** User leaves → Video destroys → Back to dashboard

**Steps:**
1. In active video call
2. Click "Leave Call" button (red button above video)
3. Observe behavior

**EXPECTED:**
- ✅ Video iframe disappears
- ✅ Returns to "Create New Room" screen
- ✅ No console errors
- ✅ Camera/mic stop recording (indicator light off)

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 5: Ably - Send Message ✅/❌

**Pathway:** User → Team Chat → Type message → Send

**Steps:**
1. Open http://localhost:5173/dashboard
2. Click "Team Call" button
3. Verify "Team Chat" tab is active (default)
4. Type message: "Test message from User 1"
5. Press Enter (or click Send button)

**EXPECTED:**
- ✅ Message appears in chat immediately
- ✅ Message shows timestamp
- ✅ Message aligned right (blue background)
- ✅ Green dot shows "1 online"

**If FAILS:**
- Check browser console for Ably errors
- Verify `VITE_ABLY_API_KEY` in `.env.local`
- Check Ably API key is valid at https://ably.com/dashboard

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 6: Ably - Real-Time Sync (Multi-User) ✅/❌

**Pathway:** Ant 1 sends message → Ant 2 receives instantly

**Steps:**
1. **Ant 1 (Browser 1):** Open Team Chat (from TEST 5)
2. **Ant 2 (Incognito):** Open http://localhost:5173/dashboard
3. **Ant 2:** Click "Team Call" → Verify Team Chat tab
4. **Ant 2:** Verify "2 online" appears
5. **Ant 1:** Send message: "Hello from User 1"
6. **Ant 2:** Observe chat

**EXPECTED:**
- ✅ Ant 2 sees message instantly (< 100ms)
- ✅ Message aligned left (gray background) for Ant 2
- ✅ Message shows sender name
- ✅ Both ants show "2 online"

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 7: Ably - Typing Indicators ✅/❌

**Pathway:** Ant 1 types → Ant 2 sees typing indicator

**Steps:**
1. **Ant 1:** Start typing in message input (don't send)
2. **Ant 2:** Watch chat area below messages
3. Wait 1 second
4. **Ant 1:** Stop typing
5. Wait 3 seconds

**EXPECTED:**
- ✅ Ant 2 sees "User 1 is typing..." (gray bubble)
- ✅ Indicator appears within 1 second
- ✅ Indicator disappears 3 seconds after stopping
- ✅ No lag or jitter

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 8: Ably - Emergency Alerts ✅/❌

**Pathway:** User types emergency keyword → Message highlighted

**Steps:**
1. In Team Chat
2. Type message: "emergency situation at drill site"
3. Send message
4. Observe message appearance

**EXPECTED:**
- ✅ Message has red border (border-red-500)
- ✅ Red background (bg-red-500/20)
- ✅ Alert icon visible (⚠️)
- ✅ "ALERT" label visible
- ✅ Stands out visually from normal messages

**Test Other Keywords:**
- "urgent" → Should trigger alert
- "help" → Should trigger alert
- "accident" → Should trigger alert

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 9: Ably - Presence (Online Count) ✅/❌

**Pathway:** Users join/leave → Online count updates

**Steps:**
1. **Ant 1:** Open Team Chat → Note online count
2. **Ant 2:** Open Team Chat → Note online count
3. **Ant 3:** Open Team Chat → Note online count
4. **Ant 2:** Close browser tab
5. Wait 5 seconds
6. **Ant 1 & 3:** Check online count

**EXPECTED:**
- ✅ Count increases when users join (1 → 2 → 3)
- ✅ Count decreases when users leave (3 → 2)
- ✅ Count accurate within 5 seconds
- ✅ Green dot pulses when online

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 10: Integration - Chat to Video Switch ✅/❌

**Pathway:** Team Chat → Click "Start Video" → Video tab loads

**Steps:**
1. Open Team Chat
2. Click "Start Video" button (top right of chat, blue button with video icon)
3. Observe behavior

**EXPECTED:**
- ✅ Switches to "Video" tab automatically
- ✅ Video interface loads
- ✅ "Create New Room" or room browser visible
- ✅ Smooth transition (no flicker)

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 11: Integration - Video Room Discovery ✅/❌

**Pathway:** Create multiple rooms → Browse shows all rooms

**Steps:**
1. **Ant 1:** Create Room A
2. **Ant 2:** Create Room B
3. **Ant 3:** Open Video tab → Click "Browse Active Rooms"
4. Observe room list

**EXPECTED:**
- ✅ Both Room A and Room B visible
- ✅ Room names distinct
- ✅ "Live" indicator on both
- ✅ Can click either to join

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

### TEST 12: Error Handling - Missing API Keys ✅/❌

**Pathway:** Remove API keys → Verify graceful errors

**Steps:**
1. Stop dev server
2. Remove `VITE_DAILY_API_KEY` from `.env.local`
3. Restart dev server
4. Open Video tab

**EXPECTED:**
- ✅ Shows "Daily.co Video Not Configured" message
- ✅ Displays setup instructions
- ✅ No console errors
- ✅ No white screen crash

**Repeat for Ably:**
1. Remove `VITE_ABLY_API_KEY`
2. Open Team Chat

**EXPECTED:**
- ✅ Shows "Real-Time Messaging Not Configured" message
- ✅ Displays setup instructions
- ✅ No console errors

**RESULT:** PASS ☐  FAIL ☐  
**Notes:** _______________________________________

---

## 📊 TEST SUMMARY

**Total Tests:** 12  
**Passed:** _____ / 12  
**Failed:** _____ / 12  
**Pass Rate:** _____% 

**Critical Issues:** (list any blocking issues)
- _______________________________________
- _______________________________________
- _______________________________________

**Non-Critical Issues:** (nice-to-fix)
- _______________________________________
- _______________________________________

---

## 🚀 DEPLOYMENT READINESS

**Can deploy to production?**

☐ **YES** - All 12 tests passed, no critical issues  
☐ **NO** - Critical issues found (list above)  
☐ **PARTIAL** - Some tests failed but not blocking

**Next Actions:**
1. _______________________________________
2. _______________________________________
3. _______________________________________

---

## 📝 VERCEL DEPLOYMENT CHECKLIST

Once all tests pass, deploy to production:

### 1. Add API Keys to Vercel

```bash
# Go to Vercel Dashboard
https://vercel.com/dashboard

# Select project: GeoForge
# Settings → Environment Variables

# Add:
VITE_DAILY_API_KEY = 8e48004b61c4a821639bc0e758f3b8f9a98401b6098f1d0d80edd988c742a15c
VITE_ABLY_API_KEY = 5VgiQQ.5m0sdg:09jLRjTeJpfN35J0zcRNb8CWbmNgjfaZETFk60d_fW8
```

### 2. Trigger Redeploy

```bash
git add .
git commit -m "Add real Daily.co and Ably collaboration"
git push
```

Vercel will automatically redeploy with new environment variables.

### 3. Verify Production

Open production URL and repeat CRITICAL tests:
- ☐ TEST 1: Create video room
- ☐ TEST 6: Real-time message sync
- ☐ TEST 8: Emergency alerts

**Production URL:** _______________________________________

---

**Built with ANT METHODOLOGY - Every pathway tested! 🐜✨**

*Next agent: Run these tests and document results. Only deploy if all critical tests pass.*

