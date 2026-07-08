# 🏘️ Interactive Plat Map - VS Code Edition

A mobile-first, interactive SVG-based plat map system that connects to your Google Sheet for real-time data.

## ✨ Features

- **📱 Mobile-First Design** - Optimized for all device sizes
- **🗺️ Native SVG Rendering** - Smooth, responsive map without heavyweight libraries
- **🔄 Live Google Sheet Integration** - Data syncs automatically every 5 minutes
- **🎨 Status-Based Colors** - Available, Reserved, Pre-Booked, Sold, Unreleased
- **🔍 Search & Filter** - Find lots by Unit ID or Name instantly
- **📋 Detailed Sidebar** - Click any lot to see full details with images
- **⌨️ Keyboard Shortcuts** - Press ESC to clear selection

## 📦 Project Structure

```
plat-map-project/
├── index.html              # Main HTML page
├── server.js               # Local development server
├── package.json            # Project dependencies
├── css/
│   └── style.css          # All styles (mobile-responsive)
├── js/
│   ├── map.js             # PlatMap class (core logic)
│   └── app.js             # Initialization & event handlers
├── svg/
│   └── map.svg            # Your SVG map (YOU NEED TO ADD THIS!)
└── data/
    └── lots.json          # Sample data (reference only)
```

## 🚀 Quick Start

### Step 1: Copy Your SVG Map

Copy your `masterplan.svg` to the project:

```bash
# Copy your SVG file to svg/ folder
cp C:\path\to\your\masterplan.svg C:\Users\OMEN\plat-map-project\svg\map.svg
```

**IMPORTANT:** The file MUST be named exactly `map.svg` in the `svg/` folder.

### Step 2: Start the Development Server

Open **Command Prompt (cmd.exe)** and run:

```bash
cd C:\Users\OMEN\plat-map-project
node server.js
```

You should see:
```
🎉 Server running at http://localhost:3000/
Open your browser and navigate to http://localhost:3000
Press Ctrl+C to stop the server
```

### Step 3: Open in Browser

Open your browser and go to:
```
http://localhost:3000
```

You should see:
- Your plat map loading
- Legend showing status colors
- Search box at the top
- Empty details panel (click a lot to see details)

## 📊 How It Works

### Data Flow

1. **SVG Map** (`svg/map.svg`)
   - Contains all lot polygons with IDs (FH4-1, FH4-2, etc.)
   - Must have elements with ID attributes matching your Google Sheet's UnitID

2. **Google Sheet** (Your existing sheet)
   - Columns: UnitID, Name, Description, ImageURL, PlotSize, PreBooked, Status, Price, Coordinates
   - Connected via your Apps Script endpoint:
   ```
   https://script.google.com/macros/s/AKfycbwd_sSg5XZTFJOJLrFBR0Fq3Hj3lIcVek6fExuPwHOqfPlzIR5VxJd2ZxrXMhy3hQ/exec
   ```

3. **App Initialization** (`app.js`)
   - Loads SVG → Loads Google Sheet data → Matches data to SVG elements → Adds interactivity

4. **User Interaction**
   - Click a lot → Display details in sidebar
   - Search by Unit ID or Name → Filter lots on map
   - Status colors indicate availability

## 🎨 Status Colors

| Status | Color | Hex Code |
|--------|-------|----------|
| Available | Green | #2ecc71 |
| Reserved | Orange | #f39c12 |
| Pre-Booked | Purple | #9b59b6 |
| Sold | Red | #e74c3c |
| Unreleased | Gray | #bdc3c7 |

## 🔧 Configuration

### Update Google Sheet URL (if different)

In `js/map.js`, find this line:

```javascript
this.googleSheetUrl = 'https://script.google.com/macros/s/AKfycbwd_sSg5XZTFJOJLrFBR0Fq3Hj3lIcVek6fExuPwHOqfPlzIR5VxJd2ZxrXMhy3hQ/exec';
```

Replace with your own Apps Script URL if needed.

### Adjust Auto-Refresh Interval

In `js/app.js`, find this line:

```javascript
setInterval(async () => {
    console.log('Refreshing data from Google Sheet...');
    await platMap.refreshData();
}, 300000); // 300000 ms = 5 minutes
```

Change `300000` to desired milliseconds (e.g., `600000` for 10 minutes).

## 📱 Mobile Testing

### On Your Phone/Tablet

If running on Windows:

1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for IPv4 Address (e.g., 192.168.1.100)

2. On your phone, open browser and go to:
   ```
   http://192.168.1.100:3000
   ```

3. Test on portrait/landscape orientations

## 🐛 Troubleshooting

### "Error loading map" Message

**Problem:** SVG file not found

**Solution:**
- Verify `svg/map.svg` exists in your project folder
- Check the file name is exactly `map.svg` (lowercase)
- Make sure the SVG file is valid (not corrupted)

### Map loads but lots aren't clickable

**Problem:** SVG elements don't have proper IDs

**Solution:**
- Your SVG must have lot elements with ID attributes matching your Google Sheet UnitIDs
- Examples: `id="FH4-1"`, `id="FH4-2"`, `id="TSW-1"`, etc.
- Edit your SVG in a text editor and verify ID attributes exist

### Google Sheet data not showing

**Problem:** Data fetch failed

**Check:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for error messages
4. Verify your Google Apps Script endpoint is accessible
5. Check your Google Sheet has the correct columns

### Search not working

**Problem:** Lots not filtering

**Solution:**
- Make sure lots have proper IDs in SVG
- Search is case-insensitive for Unit ID and Name
- Try searching for a known lot like "FH4-1" or "4-Bed"

## 💻 Browser Compatibility

- ✅ Chrome/Chromium (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 📚 API Reference

### PlatMap Class

```javascript
// Initialize
const map = new PlatMap('mapWrapper', 'detailsContent');

// Load SVG
await map.loadSVG('svg/map.svg');

// Load Google Sheet data
await map.loadLotData();

// Select a lot
map.selectLot('FH4-1');

// Filter lots
map.filterLots('FH4');

// Clear selection
map.clearSelection();

// Refresh data
await map.refreshData();
```

## 🎯 Next Steps

1. ✅ Copy `svg/map.svg` to project
2. ✅ Run `node server.js`
3. ✅ Test in browser at `http://localhost:3000`
4. ✅ Click lots to view details
5. ✅ Test search functionality
6. ✅ Test on mobile devices
7. (Optional) Deploy to web host

## 📝 License

MIT License - Feel free to modify and use as needed!

## 💬 Support

If you encounter issues:
1. Check the browser Console (F12 → Console tab)
2. Check the Terminal where you ran `node server.js`
3. Verify your SVG file structure
4. Verify your Google Sheet is accessible

---

**Built with ❤️ for mobile-first property visualization**
