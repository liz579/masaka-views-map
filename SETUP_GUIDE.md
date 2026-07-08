# ⚡ Quick Setup Guide (Baby Steps!)

## Step 0: What You Have Right Now ✅

Your project folder now contains:
- `index.html` - The page
- `css/style.css` - Beautiful mobile styling
- `js/map.js` - The map logic
- `js/app.js` - Initialization code
- `server.js` - Local server to test
- `svg/` folder - **EMPTY (you need to add your map.svg here)**

## Step 1️⃣: Copy Your SVG Map

Your `masterplan.svg` file needs to go into the `svg/` folder and be renamed to `map.svg`.

**On Windows:**

Option A (Explorer):
1. Open File Explorer
2. Find your `masterplan.svg` file
3. Copy it
4. Navigate to: `C:\Users\OMEN\plat-map-project\svg\`
5. Paste it there
6. Right-click → Rename it to `map.svg`

Option B (Command Prompt):
```bash
# Copy and rename in one command
copy "C:\path\to\masterplan.svg" "C:\Users\OMEN\plat-map-project\svg\map.svg"
```

**Verify it worked:**
- Go to `C:\Users\OMEN\plat-map-project\svg\`
- You should see `map.svg` in that folder
- Open it in Notepad to verify it's an SVG file (starts with `<svg`)

## Step 2️⃣: Start the Server

1. Open **Command Prompt** (cmd.exe, NOT PowerShell!)
2. Copy and paste this:

```bash
cd C:\Users\OMEN\plat-map-project
node server.js
```

3. Press Enter
4. You should see this message:

```
🎉 Server running at http://localhost:3000/
Open your browser and navigate to http://localhost:3000
Press Ctrl+C to stop the server
```

**Leave this Command Prompt window open!** This is your server running.

## Step 3️⃣: Open in Browser

1. Open any web browser (Chrome, Firefox, Edge, Safari)
2. In the address bar, type: `http://localhost:3000`
3. Press Enter

**You should see:**
- Your plat map in the center
- A search box at the top
- A legend showing status colors
- An empty details panel on the right
- A loading message while data fetches

## Step 4️⃣: Test It!

### Test 1: Click a lot
1. Click on any yellow lot in the map
2. The sidebar on the right should show details
3. The lot should highlight in red

### Test 2: Search
1. In the search box at top, type: `FH4`
2. The map should dim all other lots
3. Only FH4-* units should remain bright
4. Click the X button to clear search

### Test 3: Mobile View
1. Press F12 in your browser (opens Developer Tools)
2. Click the phone icon in the top left (Toggle device toolbar)
3. Rotate the screen (landscape/portrait)
4. Verify everything looks good on mobile

## ✨ What's Happening Behind the Scenes

1. **Your SVG loads** → The map appears on screen
2. **Google Sheet data fetches** → Lot info from your sheet loads
3. **Data matches to SVG** → Each lot (FH4-1, etc.) gets matched to your SVG
4. **Colors apply** → Lots get colored by status (green=available, orange=reserved, etc.)
5. **You can interact** → Click, search, view details

## 🔧 Verify Everything is Working

Open browser Console to check for errors:
1. Press F12 (opens Developer Tools)
2. Click "Console" tab
3. You should see messages like:
   ```
   Map initialized successfully
   ```
4. If you see red errors, let me know!

## 🛑 If Something Goes Wrong

### "Cannot find module" error
**Solution:** Make sure you're in the right folder:
```bash
cd C:\Users\OMEN\plat-map-project
```

### "Error loading map" in browser
**Solution:** Your `svg/map.svg` file doesn't exist. Go back to Step 1.

### Lots not showing details
**Solution:** Your SVG might not have the right ID format. The IDs in your SVG must match your Google Sheet UnitIDs exactly (like FH4-1, FH4-2, etc.).

### Search box not working
**Solution:** Same as above - IDs must match.

## 🚀 Next: Deploy to Web

Once you verify everything works locally, you can:
1. Deploy to Vercel (free, easy)
2. Deploy to Netlify (free, easy)
3. Deploy to your own web server
4. Keep it running locally for now

## 📝 Files You Modified

- ✅ `index.html` - Updated with legend and better layout
- ✅ `css/style.css` - Complete mobile-first styling
- ✅ `js/map.js` - Full PlatMap class with all features
- ✅ `js/app.js` - Complete initialization code
- ✅ `server.js` - New! Local server for testing
- ✅ `README.md` - Full documentation

## 🎯 Current Status

**Ready to go!** You just need to:
1. Copy `svg/map.svg` ← **YOU ARE HERE**
2. Run `node server.js`
3. Open `http://localhost:3000`

That's it! Let me know if you get stuck on any step.
