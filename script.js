// Lost & Found Portal JavaScript
class LostFoundPortal {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('lostItems')) || [];
        this.archivedItems = JSON.parse(localStorage.getItem('archivedItems')) || [];
        this.foundItems = JSON.parse(localStorage.getItem('foundItems')) || [];
        
        this.init();
        this.checkForAutoArchive();
    }

    init() {
        // Event listeners
        document.getElementById('lost-item-form').addEventListener('submit', (e) => this.handleSubmit(e));
        
        // Initial render
        this.renderDashboard();
        this.renderActiveItems();
        this.renderArchivedItems();
        this.updateStats();
        this.renderChart();
        this.updateAdminPanel();
    }

    // Generate unique ID for items
    generateId() {
        return 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Handle form submission
    handleSubmit(e) {
        e.preventDefault();
        
        const formData = {
            id: this.generateId(),
            name: document.getElementById('item-name').value,
            description: document.getElementById('description').value,
            category: document.getElementById('category').value,
            location: document.getElementById('location').value,
            contactInfo: document.getElementById('contact-info').value,
            dateSubmitted: new Date().toISOString(),
            status: 'active'
        };

        this.items.push(formData);
        this.saveToStorage();
        
        // Clear form
        document.getElementById('lost-item-form').reset();
        
        // Show success message
        this.showMessage('Item submitted successfully!', 'success');
        
        // Switch to dashboard tab and refresh
        this.showTab('dashboard');
        this.renderDashboard();
        this.renderActiveItems();
        this.updateStats();
        this.renderChart();
        this.updateAdminPanel();
    }

    // Save data to localStorage
    saveToStorage() {
        localStorage.setItem('lostItems', JSON.stringify(this.items));
        localStorage.setItem('archivedItems', JSON.stringify(this.archivedItems));
        localStorage.setItem('foundItems', JSON.stringify(this.foundItems));
    }

    // Auto-archive items older than 1 month
    checkForAutoArchive() {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        
        const itemsToArchive = this.items.filter(item => 
            new Date(item.dateSubmitted) < oneMonthAgo
        );
        
        if (itemsToArchive.length > 0) {
            // Move items to archive
            itemsToArchive.forEach(item => {
                item.status = 'archived';
                item.archivedDate = new Date().toISOString();
                this.archivedItems.push(item);
            });
            
            // Remove from active items
            this.items = this.items.filter(item => 
                new Date(item.dateSubmitted) >= oneMonthAgo
            );
            
            this.saveToStorage();
            console.log(`Auto-archived ${itemsToArchive.length} items`);
        }
    }

    // Render active items
    renderActiveItems(filteredItems = null) {
        const itemsList = document.getElementById('active-items-list');
        const itemsToShow = filteredItems || this.items;
        
        if (itemsToShow.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-state">
                    <h3>No active items found</h3>
                    <p>No lost items match your current filters.</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = itemsToShow.map(item => this.createItemCard(item)).join('');
    }

    // Render archived items
    renderArchivedItems() {
        const itemsList = document.getElementById('archived-items-list');
        
        if (this.archivedItems.length === 0) {
            itemsList.innerHTML = `
                <div class="empty-state">
                    <h3>No archived items</h3>
                    <p>Items older than 1 month will automatically appear here.</p>
                </div>
            `;
            return;
        }

        itemsList.innerHTML = this.archivedItems.map(item => this.createItemCard(item, true)).join('');
    }

    // Create item card HTML
    createItemCard(item, isArchived = false) {
        const submitDate = new Date(item.dateSubmitted).toLocaleDateString();
        const categoryColors = {
            electronics: '#e74c3c',
            clothing: '#9b59b6',
            accessories: '#f39c12',
            books: '#27ae60',
            keys: '#34495e',
            other: '#95a5a6'
        };

        return `
            <div class="item-card">
                <div class="item-header">
                    <h3 class="item-name">${item.name}</h3>
                    <span class="item-category" style="background: ${categoryColors[item.category] || '#95a5a6'}">
                        ${item.category}
                    </span>
                </div>
                <div class="item-details">
                    <p><strong>Description:</strong> ${item.description}</p>
                    <p><strong>Location:</strong> ${item.location}</p>
                    <p><strong>Contact:</strong> ${item.contactInfo}</p>
                </div>
                <div class="item-meta">
                    <p>Submitted: ${submitDate}</p>
                    ${item.archivedDate ? `<p>Archived: ${new Date(item.archivedDate).toLocaleDateString()}</p>` : ''}
                </div>
                ${!isArchived ? `
                    <div class="item-actions">
                        <button class="btn btn-success" onclick="portal.markAsFound('${item.id}')">
                            Mark as Found
                        </button>
                        <button class="btn btn-danger" onclick="portal.deleteItem('${item.id}')">
                            Delete
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Mark item as found
    markAsFound(itemId) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        if (itemIndex !== -1) {
            const item = this.items[itemIndex];
            item.status = 'found';
            item.foundDate = new Date().toISOString();
            
            this.foundItems.push(item);
            this.items.splice(itemIndex, 1);
            
            this.saveToStorage();
            this.renderActiveItems();
            this.renderDashboard();
            this.updateStats();
            this.renderChart();
            this.updateAdminPanel();
            this.addToAdminLog('Item marked as found: ' + item.name);
            
            this.showMessage('Item marked as found!', 'success');
        }
    }

    // Delete item
    deleteItem(itemId) {
        if (confirm('Are you sure you want to delete this item?')) {
            this.items = this.items.filter(item => item.id !== itemId);
            this.saveToStorage();
            this.renderActiveItems();
            this.renderDashboard();
            this.updateStats();
            this.renderChart();
            this.updateAdminPanel();
            this.addToAdminLog('Item deleted: ID ' + itemId);
            
            this.showMessage('Item deleted successfully!', 'success');
        }
    }

    // Update statistics
    updateStats() {
        document.getElementById('total-active').textContent = this.items.length;
        document.getElementById('total-archived').textContent = this.archivedItems.length;
        document.getElementById('total-found').textContent = this.foundItems.length;
    }

    // Render monthly chart
    renderChart() {
        const ctx = document.getElementById('monthlyChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.chart) {
            this.chart.destroy();
        }
        
        const monthlyData = this.getMonthlyStats();
        
        this.chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthlyData.labels,
                datasets: [{
                    label: 'Items Lost',
                    data: monthlyData.data,
                    backgroundColor: 'rgba(52, 152, 219, 0.8)',
                    borderColor: 'rgba(52, 152, 219, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    // Get monthly statistics
    getMonthlyStats() {
        const allItems = [...this.items, ...this.archivedItems, ...this.foundItems];
        const monthlyCount = {};
        
        // Get last 6 months
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            months.push({ key: monthKey, label: monthLabel });
            monthlyCount[monthKey] = 0;
        }
        
        // Count items by month
        allItems.forEach(item => {
            const date = new Date(item.dateSubmitted);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (monthlyCount.hasOwnProperty(monthKey)) {
                monthlyCount[monthKey]++;
            }
        });
        
        return {
            labels: months.map(m => m.label),
            data: months.map(m => monthlyCount[m.key])
        };
    }

    // Show message to user
    showMessage(message, type = 'info') {
        // Create message element
        const messageEl = document.createElement('div');
        messageEl.className = `message message-${type}`;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            animation: slideIn 0.3s ease;
        `;
        
        switch(type) {
            case 'success':
                messageEl.style.background = '#27ae60';
                break;
            case 'error':
                messageEl.style.background = '#e74c3c';
                break;
            default:
                messageEl.style.background = '#3498db';
        }
        
        messageEl.textContent = message;
        document.body.appendChild(messageEl);
        
        // Remove message after 3 seconds
        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }

    // Show specific tab
    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[onclick="showTab('${tabName}')"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');
        
        // Refresh content for specific tabs
        if (tabName === 'dashboard') {
            this.renderDashboard();
            this.updateStats();
        } else if (tabName === 'stats') {
            this.updateStats();
            this.renderChart();
        } else if (tabName === 'admin') {
            this.updateAdminPanel();
        }
    }
    
    // Render dashboard
    renderDashboard() {
        this.updateDashboardStats();
        this.renderRecentActivity();
    }
    
    // Update dashboard statistics
    updateDashboardStats() {
        const totalItems = this.items.length + this.archivedItems.length + this.foundItems.length;
        const successRate = totalItems > 0 ? Math.round((this.foundItems.length / totalItems) * 100) : 0;
        
        document.getElementById('dash-total-active').textContent = this.items.length;
        document.getElementById('dash-total-archived').textContent = this.archivedItems.length;
        document.getElementById('dash-total-found').textContent = this.foundItems.length;
        document.getElementById('dash-success-rate').textContent = successRate + '%';
    }
    
    // Render recent activity
    renderRecentActivity() {
        const recentList = document.getElementById('recent-activity-list');
        const allItems = [...this.items, ...this.foundItems]
            .sort((a, b) => new Date(b.dateSubmitted) - new Date(a.dateSubmitted))
            .slice(0, 5);
        
        if (allItems.length === 0) {
            recentList.innerHTML = `
                <div class="empty-state">
                    <h3>No recent activity</h3>
                    <p>Recent reports and updates will appear here.</p>
                </div>
            `;
            return;
        }
        
        recentList.innerHTML = allItems.map(item => {
            const date = new Date(item.dateSubmitted).toLocaleDateString();
            const icon = item.status === 'found' ? '✅' : '🔍';
            const statusText = item.status === 'found' ? 'Found' : 'Reported';
            
            return `
                <div class="activity-item">
                    <div class="activity-icon">${icon}</div>
                    <div class="activity-content">
                        <div class="activity-title">${item.name} - ${statusText}</div>
                        <div class="activity-time">${date} • ${item.category}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    // Update admin panel
    updateAdminPanel() {
        this.updateAdminStats();
        this.renderCategoryAnalytics();
    }
    
    // Update admin statistics
    updateAdminStats() {
        const totalReports = this.items.length + this.archivedItems.length + this.foundItems.length;
        const successRate = totalReports > 0 ? Math.round((this.foundItems.length / totalReports) * 100) : 0;
        const avgTime = this.calculateAverageResolutionTime();
        const topCategory = this.getMostLostCategory();
        
        document.getElementById('admin-total-reports').textContent = totalReports;
        document.getElementById('admin-success-rate').textContent = successRate + '%';
        document.getElementById('admin-avg-time').textContent = avgTime + ' days';
        document.getElementById('admin-top-category').textContent = topCategory;
    }
    
    // Calculate average resolution time
    calculateAverageResolutionTime() {
        if (this.foundItems.length === 0) return 0;
        
        const totalDays = this.foundItems.reduce((sum, item) => {
            const submitted = new Date(item.dateSubmitted);
            const found = new Date(item.foundDate);
            const days = Math.ceil((found - submitted) / (1000 * 60 * 60 * 24));
            return sum + days;
        }, 0);
        
        return Math.round(totalDays / this.foundItems.length);
    }
    
    // Get most lost category
    getMostLostCategory() {
        const allItems = [...this.items, ...this.archivedItems, ...this.foundItems];
        if (allItems.length === 0) return 'N/A';
        
        const categoryCount = {};
        allItems.forEach(item => {
            categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        });
        
        return Object.keys(categoryCount).reduce((a, b) => 
            categoryCount[a] > categoryCount[b] ? a : b
        );
    }
    
    // Render category analytics
    renderCategoryAnalytics() {
        const analyticsContainer = document.getElementById('category-analytics');
        const allItems = [...this.items, ...this.archivedItems, ...this.foundItems];
        
        const categoryCount = {};
        allItems.forEach(item => {
            categoryCount[item.category] = (categoryCount[item.category] || 0) + 1;
        });
        
        if (Object.keys(categoryCount).length === 0) {
            analyticsContainer.innerHTML = `
                <div class="empty-state">
                    <h3>No category data</h3>
                    <p>Category analytics will appear here as items are reported.</p>
                </div>
            `;
            return;
        }
        
        analyticsContainer.innerHTML = Object.entries(categoryCount)
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => `
                <div class="category-stat">
                    <div class="category-name">${category}</div>
                    <div class="category-count">${count}</div>
                </div>
            `).join('');
    }
    
    // Add to admin log
    addToAdminLog(action) {
        const logContainer = document.getElementById('admin-log');
        const timestamp = new Date().toLocaleString();
        
        const newEntry = document.createElement('div');
        newEntry.className = 'log-entry';
        newEntry.innerHTML = `
            <span class="log-time">${timestamp}</span>
            <span class="log-action">${action}</span>
        `;
        
        logContainer.insertBefore(newEntry, logContainer.firstChild);
        
        // Keep only last 10 entries
        const entries = logContainer.querySelectorAll('.log-entry');
        if (entries.length > 10) {
            entries[entries.length - 1].remove();
        }
    }
    }
}

// Date filter functions
function applyDateFilter() {
    const fromDate = document.getElementById('date-from').value;
    const toDate = document.getElementById('date-to').value;
    
    if (!fromDate && !toDate) {
        portal.showMessage('Please select at least one date', 'error');
        return;
    }
    
    let filteredItems = portal.items;
    
    if (fromDate) {
        filteredItems = filteredItems.filter(item => 
            new Date(item.dateSubmitted) >= new Date(fromDate)
        );
    }
    
    if (toDate) {
        const toDateEnd = new Date(toDate);
        toDateEnd.setHours(23, 59, 59, 999); // End of day
        filteredItems = filteredItems.filter(item => 
            new Date(item.dateSubmitted) <= toDateEnd
        );
    }
    
    portal.renderActiveItems(filteredItems);
    portal.showMessage(`Found ${filteredItems.length} items in date range`, 'success');
}

function clearDateFilter() {
    document.getElementById('date-from').value = '';
    document.getElementById('date-to').value = '';
    portal.renderActiveItems();
    portal.showMessage('Date filter cleared', 'success');
}

// Global tab switching function
function showTab(tabName) {
    portal.showTab(tabName);
}

// Initialize the portal when page loads
let portal;
document.addEventListener('DOMContentLoaded', function() {
    portal = new LostFoundPortal();
    
    // Load admin settings
    loadSettings();
    
    // Add some sample data if none exists
    if (portal.items.length === 0 && portal.archivedItems.length === 0 && portal.foundItems.length === 0) {
        portal.addSampleData();
    }
    
    // Add initial admin log entry
    portal.addToAdminLog('Portal initialized successfully');
});

// Add sample data method to the class
LostFoundPortal.prototype.addSampleData = function() {
    const sampleItems = [
        {
            id: 'sample_1',
            name: 'iPhone 13',
            description: 'Blue iPhone 13 with a clear case',
            category: 'electronics',
            location: 'Library - 2nd Floor',
            contactInfo: 'john.doe@email.com',
            dateSubmitted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
            status: 'active'
        },
        {
            id: 'sample_2',
            name: 'Black Backpack',
            description: 'Nike black backpack with laptop compartment',
            category: 'accessories',
            location: 'Student Center',
            contactInfo: '555-0123',
            dateSubmitted: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
            status: 'active'
        },
        {
            id: 'sample_3',
            name: 'Car Keys',
            description: 'Toyota keys with red keychain',
            category: 'keys',
            location: 'Parking Lot B',
            contactInfo: 'jane.smith@email.com',
            dateSubmitted: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago (should be archived)
            status: 'archived',
            archivedDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        }
    ];
    
    // Add items to appropriate arrays
    sampleItems.forEach(item => {
        if (item.status === 'active') {
            this.items.push(item);
        } else if (item.status === 'archived') {
            this.archivedItems.push(item);
        }
    });
    
    // Add a found item for stats
    this.foundItems.push({
        id: 'sample_found_1',
        name: 'Chemistry Textbook',
        description: 'Organic Chemistry 3rd Edition',
        category: 'books',
        location: 'Cafeteria',
        contactInfo: 'student@email.com',
        dateSubmitted: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'found',
        foundDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    });
    
    this.saveToStorage();
    this.renderActiveItems();
    this.renderArchivedItems();
    this.updateStats();
    this.renderChart();
};

// Admin panel functions
function exportData() {
    const allData = {
        activeItems: portal.items,
        archivedItems: portal.archivedItems,
        foundItems: portal.foundItems,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `lost-found-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    portal.addToAdminLog('Data exported successfully');
    portal.showMessage('Data exported successfully!', 'success');
}

function clearOldItems() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    const oldArchivedItems = portal.archivedItems.filter(item => 
        new Date(item.dateSubmitted) < sixMonthsAgo
    );
    
    if (oldArchivedItems.length === 0) {
        portal.showMessage('No old items to clear', 'info');
        return;
    }
    
    if (confirm(`This will permanently delete ${oldArchivedItems.length} items older than 6 months. Continue?`)) {
        portal.archivedItems = portal.archivedItems.filter(item => 
            new Date(item.dateSubmitted) >= sixMonthsAgo
        );
        
        portal.saveToStorage();
        portal.renderArchivedItems();
        portal.updateStats();
        portal.updateAdminPanel();
        
        portal.addToAdminLog(`Cleared ${oldArchivedItems.length} old items`);
        portal.showMessage(`Successfully cleared ${oldArchivedItems.length} old items`, 'success');
    }
}

function resetAllData() {
    const confirmation = prompt('This will delete ALL data. Type "RESET" to confirm:');
    
    if (confirmation === 'RESET') {
        portal.items = [];
        portal.archivedItems = [];
        portal.foundItems = [];
        
        portal.saveToStorage();
        portal.renderDashboard();
        portal.renderActiveItems();
        portal.renderArchivedItems();
        portal.updateStats();
        portal.renderChart();
        portal.updateAdminPanel();
        
        portal.addToAdminLog('All data reset by administrator');
        portal.showMessage('All data has been reset!', 'success');
    } else if (confirmation !== null) {
        portal.showMessage('Reset cancelled - confirmation text did not match', 'error');
    }
}

function saveSettings() {
    const archiveDays = document.getElementById('auto-archive-days').value;
    const maxDisplay = document.getElementById('max-items-display').value;
    const notifications = document.getElementById('enable-notifications').checked;
    
    const settings = {
        autoArchiveDays: parseInt(archiveDays),
        maxItemsDisplay: parseInt(maxDisplay),
        enableNotifications: notifications,
        lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('portalSettings', JSON.stringify(settings));
    
    portal.addToAdminLog('System settings updated');
    portal.showMessage('Settings saved successfully!', 'success');
}

// Load settings on page load
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('portalSettings'));
    
    if (settings) {
        document.getElementById('auto-archive-days').value = settings.autoArchiveDays || 30;
        document.getElementById('max-items-display').value = settings.maxItemsDisplay || 20;
        document.getElementById('enable-notifications').checked = settings.enableNotifications !== false;
    }
}
