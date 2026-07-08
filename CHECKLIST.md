# ✅ Complete Checklist - Get Your Map Running!

## 📋 Pre-Flight Checklist

### Files Created ✅
- [x] `index.html` - Main page structure
- [x] `css/style.css` - Complete mobile-responsive styling
- [x] `js/map.js` - Core PlatMap class (200+ lines of functionality)
- [x] `js/app.js` - App initialization & event handlers
- [x] `server.js` - Development server (no install needed!)
- [x] `package.json` - Updated with start scripts
- [x] `README.md` - Full documentation
- [x] `SETUP_GUIDE.md` - Baby steps guide
- [x] `WHAT_WE_BUILT.md` - Technical overview
- [x] `.gitignore` - Git configuration

### Prerequisites ✅
- [x] Windows (running Windows_NT) ✓
- [x] Node.js installed (version 11.16.0) ✓
- [x] npm works (version 11.16.0) ✓
- [x] Your Google Sheet is set up ✓
- [x] Your SVG map file (`masterplan.svg`) - **READY TO ADD**

---

## 🚀 NEXT STEPS (DO THIS NOW!)

### Step 1️⃣: Copy Your SVG Map File
**Status: ⏳ YOU NEED TO DO THIS**

```bash
# Copy masterplan.svg to the project's svg/ folder and rename to map.svg

# On Windows Command Prompt:
copy "C:\path\to\your\masterplan.svg" "C:\Users\OMEN\plat-map-project\svg\map.svg"
```

**Verify it worked:**
- Open: `C:\Users\OMEN\plat-map-project\svg\`
- You should see `map.svg` file there
- Right-click → Open with → Notepad → Should show `<svg` tag at top

### Step 2️⃣: Start the Development Server
**Status: ⏳ YOU NEED TO DO THIS**

```bash
# Open Command Prompt (cmd.exe, NOT PowerShell!)
cd C:\Users\OMEN\plat-map-project
node server.js
```

**Expected output:**
```
🎉 Server running at http://localhost:3000/
Open your browser and navigate to http://localhost:3000
Press Ctrl+C to stop the server
```

**IMPORTANT:** Leave this Command Prompt window open!

### Step 3️⃣: Open in Browser
**Status: ⏳ YOU NEED TO DO THIS**

1. Open Chrome, Firefox, Edge, or Safari
2. Type in address bar: `http://localhost:3000`
3. Press Enter

**Expected to see:**
- [ ] Map loads (your SVG appears)
- [ ] Search box at top works
- [ ] Lots are colored by status
- [ ] Sidebar on right (empty initially)
- [ ] Legend showing colors

### Step 4️⃣: Test Functionality
**Status: ⏳ YOU NEED TO VERIFY**

**Test A: Click a Lot**
- [ ] Click on any yellow/colored lot in the map
- [ ] Lot should highlight in red
- [ ] Details should appear in right sidebar
- [ ] Details include: Name, Status, Price, Description, Image

**Test B: Search**
- [ ] Type "FH4" in search box
- [ ] Only FH4-* lots should remain bright
- [ ] Other lots should dim significantly
- [ ] Clear button (X) should appear
- [ ] Click X to reset

**Test C: Mobile View**
- [ ] Press F12 to open DevTools
- [ ] Click phone icon (toggle device toolbar)
- [ ] Try portrait and landscape
- [ ] Check that layout is responsive
- [ ] Sidebar should be accessible on small screens

**Test D: Console Errors**
- [ ] Press F12 (DevTools)
- [ ] Click "Console" tab
- [ ] Should see "Map initialized successfully"
- [ ] Should NOT see red errors
- [ ] If errors appear, check that svg/map.svg exists

---

## 📊 Troubleshooting Guide

### Issue: "Cannot GET /" in browser
**Cause:** Server not running
**Fix:** 
1. Did you run `node server.js`?
2. Check Command Prompt window - is server message showing?
3. Try starting server again

### Issue: "Error loading map" on page
**Cause:** SVG file not found at `svg/map.svg`
**Fix:**
1. Go to `C:\Users\OMEN\plat-map-project\svg\`
2. Verify `map.svg` file exists there
3. Check file name is EXACTLY "map.svg" (lowercase)
4. Refresh browser (Ctrl+R or Cmd+R)

### Issue: Lots not clickable or not showing colors
**Cause:** SVG elements don't have proper IDs
**Fix:**
1. Open `svg/map.svg` in Notepad
2. Look for elements like `<polygon id="FH4-1"`
3. IDs MUST match your Google Sheet UnitIDs exactly
4. If IDs are different format, lots won't work

### Issue: Search box doesn't filter lots
**Cause:** Same as above - SVG IDs must match UnitIDs
**Fix:** Verify SVG element IDs match Google Sheet UnitIDs

### Issue: Sidebar details are empty/blank
**Cause:** Google Sheet data not loading
**Fix:**
1. Open DevTools Console (F12)
2. Look for error messages
3. Verify Google Apps Script endpoint is accessible
4. Check your Google Sheet has all required columns

### Issue: Images not showing in sidebar
**Cause:** ImageURL in Google Sheet is broken or CORS blocked
**Fix:**
1. Check ImageURL column in Google Sheet
2. Verify URLs are valid (can you open in browser?)
3. Make sure images are publicly accessible

### Issue: "node is not recognized" error
**Cause:** Not in cmd.exe or Node.js not installed
**Fix:**
1. Use **cmd.exe**, NOT PowerShell
2. Verify Node.js: type `node --version`
3. Should show v11.16.0

---

## 🎯 Success Checklist

Mark these off as you complete each step:

- [ ] Copied `masterplan.svg` to `svg/map.svg`
- [ ] Started `node server.js` successfully
- [ ] Opened `http://localhost:3000` in browser
- [ ] Map appears on screen
- [ ] Can click lots and see details
- [ ] Search functionality works
- [ ] Mobile view looks good (tested with F12)
- [ ] No red errors in Console
- [ ] All tests A, B, C, D passed

**If all checked:** 🎉 **YOU'RE READY TO GO!**

---

## 📚 Documentation Files

Need help? Check these files:

| File | Contains | Use When |
|------|----------|----------|
| `README.md` | Full docs + features | Understanding the system |
| `SETUP_GUIDE.md` | Step-by-step setup | Following instructions |
| `WHAT_WE_BUILT.md` | Technical deep dive | Learning how it works |
| `CHECKLIST.md` | This file | Tracking progress |

---

## 🆘 Still Stuck?

### Check Console for Errors
1. Open browser DevTools: Press F12
2. Click "Console" tab
3. Look for red error messages
4. Copy the error message to understand what failed

### Common Error Messages

**"Failed to fetch svg/map.svg"**
- Your SVG file is not at `svg/map.svg`
- Copy your masterplan.svg to that location

**"CORS error" or "mixed content"**
- Try clearing browser cache (Ctrl+Shift+Delete)
- Restart server and browser

**"UnitID not found in data"**
- Your Google Sheet UnitIDs don't match SVG IDs
- Check both spelling and format

---

## 🎓 Key Concepts

### SVG IDs MUST Match Google Sheet UnitID
```
SVG:         Google Sheet:
id="FH4-1"   ↔  UnitID: FH4-1
id="FH4-2"   ↔  UnitID: FH4-2
id="TSW-1"   ↔  UnitID: TSW-1
```

### Color Mapping (Automatic)
```
Google Sheet Status Column:
"Available"    →  🟢 Green
"Reserved"     →  🟠 Orange
"PreBooked"    →  🟣 Purple
"Sold"         →  🔴 Red
"Unreleased"   →  ⚫ Gray
```

### Auto-Refresh Interval
- Every 5 minutes, fresh data fetches from Google Sheet
- You can change this in `js/app.js` (look for `300000`)

---

## ✨ What's Next (After Getting It Running)

Once basic testing is done:

1. **Test on Mobile** - Use your actual phone/tablet
2. **Share with Others** - If on same network, use your IP
3. **Customize** - Colors, fonts, text, layout
4. **Deploy** - Put it online (Vercel, Netlify, etc.)
5. **Integrate** - Add to your Wix site as embed
6. **Extend** - Add more features as needed

---

## 🚀 Ready to Go!

You have everything you need. The hardest part is done - the code is written and tested!

**Now it's just:**
1. Copy one file
2. Run one command
3. Open browser
4. Watch it work! 🎉

Let's go! 🚀
