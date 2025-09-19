<<<<<<< HEAD
# apcoer-lost-found-portal
Hackathon
=======
# Lost & Found Portal

A simple web-based Lost & Found Portal with advanced features for 3rd year teams. This is a front-end only implementation with all required 3rd year features.

## Features

### Core Features
- **Submit Lost Items**: Report lost items with details like name, description, category, location, and contact info
- **View Active Items**: Browse all currently active lost items
- **Mark as Found**: Mark items as found when they're recovered
- **Delete Items**: Remove items that are no longer relevant

### 3rd Year Required Features

#### 1. Search/Filter by Date ✅
- Filter lost items by upload date range
- Select "from" and "to" dates to narrow down results
- Clear filters to view all items

#### 2. Simple Stats with Charts ✅
- Dashboard showing:
  - Total active items
  - Total archived items  
  - Total found items
- **Monthly Chart**: Bar chart showing how many items were lost each month (last 6 months)
- Uses Chart.js for visualization

#### 3. Auto-Archive ✅
- Items automatically move to "Archive" section after 1 month from upload date
- Archived items are read-only and cannot be modified
- Separate archive tab for viewing old items

## Technical Implementation

- **Frontend**: Pure HTML, CSS, JavaScript (no frameworks)
- **Data Storage**: localStorage for persistence
- **Charts**: Chart.js library for statistics visualization
- **Responsive**: Works on desktop and mobile devices

## File Structure

```
lost-found-portal/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling
├── script.js          # JavaScript functionality
└── README.md          # Documentation
```

## How to Use

1. **Open the Application**: Open `index.html` in any modern web browser

2. **Report a Lost Item**:
   - Click "Report Lost Item" tab
   - Fill out the form with item details
   - Submit to add to active items

3. **View Items**:
   - "Active Items" tab shows current lost items
   - Use date filters to narrow results
   - Mark items as found or delete them

4. **Check Archives**:
   - "Archive" tab shows items older than 1 month
   - These are automatically moved from active items

5. **View Statistics**:
   - "Statistics" tab shows summary numbers
   - Monthly chart displays trends over time

## Sample Data

The application includes sample data when first loaded:
- 2 active items (iPhone, Backpack)
- 1 archived item (Car Keys - older than 1 month)
- 1 found item (Chemistry Textbook)

## Browser Compatibility

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Features Demonstration

### Date Filtering
- Try filtering items by selecting date ranges
- Sample items have different submission dates for testing

### Auto-Archive
- The sample car keys item demonstrates auto-archiving (45+ days old)
- New items will auto-archive after 1 month

### Statistics & Charts
- View the monthly trend chart in the Statistics tab
- Numbers update automatically when items are added/found/archived

## Local Storage

All data is stored in browser's localStorage:
- `lostItems`: Active lost items
- `archivedItems`: Auto-archived items
- `foundItems`: Items marked as found

To reset data, clear browser localStorage or delete the keys manually.

## Quick Start

1. Simply open `index.html` in your browser
2. No server setup required - it's a pure front-end application
3. All features work immediately with sample data loaded

**Perfect for demonstrating all 3rd year required features!**

login = admin
password = admin247
>>>>>>> 8d377e7 (Inital commit - Lost and Found  portal)
