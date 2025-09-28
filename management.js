// Management Panel JavaScript
// Real-time sync with Google Sheets via Airtable

// Global variables
let table = null;
let allData = [];
let filteredData = [];
let currentLocation = 'all';
let autoSyncInterval = null;
let charts = {};

// Configuration
const CONFIG = {
    autoSyncIntervalMinutes: 15,
    cacheExpiryMinutes: 5,
    maxRecordsDisplay: 10000
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    try {
        showLoading();

        // Initialize Tabulator table
        initializeTable();

        // Initialize charts
        initializeCharts();

        // Load initial data
        await loadData();

        // Set up event listeners
        setupEventListeners();

        // Update UI
        updateStatistics();
        updateSyncStatus();

        hideLoading();

        // Show welcome message
        showToast('Management Panel loaded successfully', 'success');

    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Failed to initialize panel', 'error');
        hideLoading();
    }
}

function initializeTable() {
    table = new Tabulator("#dataTable", {
        data: [],
        layout: "fitDataTable",
        height: "600px",
        virtualDom: true,
        movableColumns: true,
        resizableColumns: true,
        selectable: true,
        pagination: false,
        columns: [
            {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                width: 40,
                headerSort: false
            },
            { title: "UID", field: "uid", width: 200, headerFilter: "input", frozen: true },
            { title: "Name", field: "name", width: 150, headerFilter: "input" },
            { title: "Phone", field: "phone", width: 130, headerFilter: "input" },
            { title: "Email", field: "email", width: 200, headerFilter: "input" },
            { title: "Gender", field: "gender", width: 80,
              headerFilter: "select",
              headerFilterParams: {values: {"": "All", "Male": "Male", "Female": "Female"}} },
            { title: "Location", field: "reservation_location", width: 100,
              headerFilter: "select",
              headerFilterParams: {values: {"": "All", "Seoul": "Seoul", "Suwon": "Suwon"}},
              formatter: function(cell) {
                  const value = cell.getValue();
                  const color = value === 'Seoul' ? 'purple' : 'indigo';
                  return `<span class="px-2 py-1 bg-${color}-100 text-${color}-700 rounded text-xs font-medium">${value || '-'}</span>`;
              }
            },
            { title: "Date", field: "reservation_date", width: 110, sorter: "date",
              formatter: function(cell) {
                  const value = cell.getValue();
                  if (!value) return '-';
                  const date = new Date(value);
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const isToday = date.toDateString() === today.toDateString();
                  return isToday ? `<span class="font-bold text-blue-600">${value}</span>` : value;
              }
            },
            { title: "Time Slot", field: "reservation_time_slot", width: 100 },
            { title: "Status", field: "participation_result", width: 120,
              headerFilter: "select",
              headerFilterParams: {values: {"": "All", "participated": "Participated", "not_participated": "Not Participated", "pending": "Pending", "cancelled": "Cancelled"}},
              formatter: function(cell) {
                  const value = cell.getValue();
                  let badgeClass = "";
                  let icon = "";

                  switch(value) {
                      case "participated":
                          badgeClass = "bg-green-100 text-green-700";
                          icon = "✅";
                          break;
                      case "not_participated":
                          badgeClass = "bg-red-100 text-red-700";
                          icon = "❌";
                          break;
                      case "pending":
                          badgeClass = "bg-yellow-100 text-yellow-700";
                          icon = "⏳";
                          break;
                      case "cancelled":
                          badgeClass = "bg-gray-100 text-gray-700";
                          icon = "🚫";
                          break;
                      default:
                          return '-';
                  }

                  return `<span class="px-2 py-1 ${badgeClass} rounded text-xs font-medium">${icon} ${value}</span>`;
              }
            },
            { title: "Confirmed", field: "confirmation_status", width: 90,
              formatter: function(cell) {
                  const value = cell.getValue();
                  if (value === 'confirmed') return '<i class="fas fa-check text-green-600"></i>';
                  if (value === 'not_confirmed') return '<i class="fas fa-times text-red-600"></i>';
                  return '<i class="fas fa-question text-gray-400"></i>';
              }
            },
            { title: "Source", field: "data_source", width: 80 },
            { title: "Sync Time", field: "sync_timestamp", width: 150,
              formatter: function(cell) {
                  const value = cell.getValue();
                  if (!value) return '-';
                  const date = new Date(value);
                  return date.toLocaleString('ko-KR');
              }
            }
        ],
        rowClick: function(e, row) {
            // Handle row click if needed
        }
    });

    // Update selected count when selection changes
    table.on("rowSelectionChanged", function(data, rows) {
        document.getElementById("selectedCount").textContent = rows.length;
    });
}

function initializeCharts() {
    // Chart default options
    Chart.defaults.font.size = 12;
    Chart.defaults.plugins.legend.display = true;
    Chart.defaults.plugins.legend.position = 'bottom';

    // Location Chart
    const ctxLocation = document.getElementById('chartLocation').getContext('2d');
    charts.location = new Chart(ctxLocation, {
        type: 'doughnut',
        data: {
            labels: ['Seoul', 'Suwon'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#9333ea', '#6366f1']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Status Chart
    const ctxStatus = document.getElementById('chartStatus').getContext('2d');
    charts.status = new Chart(ctxStatus, {
        type: 'pie',
        data: {
            labels: ['Participated', 'Not Participated', 'Pending', 'Cancelled'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6b7280']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });

    // Daily Chart
    const ctxDaily = document.getElementById('chartDaily').getContext('2d');
    charts.daily = new Chart(ctxDaily, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Reservations',
                data: [],
                backgroundColor: '#3b82f6'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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

async function loadData() {
    try {
        // Fetch from Airtable via Netlify Function
        const response = await fetch('/.netlify/functions/management-api', {
            method: 'GET'
        });

        if (!response.ok) {
            // Fallback to existing airtable function
            const fallbackResponse = await fetch('/.netlify/functions/airtable', {
                method: 'GET'
            });

            if (!fallbackResponse.ok) {
                throw new Error('Failed to fetch data');
            }

            const data = await fallbackResponse.json();
            allData = data.records || [];
        } else {
            const data = await response.json();
            allData = data.records || [];
        }

        // Apply location filter
        filterByLocation();

        // Update table
        table.setData(filteredData);

        // Update UI
        updateStatistics();
        updateCharts();
        updateSyncStatus();

        console.log(`Loaded ${allData.length} records`);

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    }
}

function filterByLocation() {
    if (currentLocation === 'all') {
        filteredData = [...allData];
    } else if (currentLocation === 'seoul') {
        filteredData = allData.filter(d =>
            d.reservation_location === 'Seoul' ||
            d.reservation_location === '서울' ||
            d.data_source === '서울'
        );
    } else if (currentLocation === 'suwon') {
        filteredData = allData.filter(d =>
            d.reservation_location === 'Suwon' ||
            d.reservation_location === '수원' ||
            d.data_source === '수원'
        );
    }

    // Sort by date and time
    filteredData.sort((a, b) => {
        if (a.reservation_date !== b.reservation_date) {
            return (a.reservation_date || '').localeCompare(b.reservation_date || '');
        }
        return (a.reservation_time_slot || '').localeCompare(b.reservation_time_slot || '');
    });
}

function switchLocation(location) {
    currentLocation = location;

    // Update tab UI
    document.querySelectorAll('.location-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event.target.closest('.location-tab').classList.add('active');

    // Filter and update
    filterByLocation();
    table.setData(filteredData);
    updateStatistics();
    updateCharts();
}

function updateStatistics() {
    const total = filteredData.length;
    const seoul = filteredData.filter(d => d.reservation_location === 'Seoul' || d.data_source === '서울').length;
    const suwon = filteredData.filter(d => d.reservation_location === 'Suwon' || d.data_source === '수원').length;
    const participated = filteredData.filter(d => d.participation_result === 'participated').length;
    const notParticipated = filteredData.filter(d => d.participation_result === 'not_participated').length;
    const pending = filteredData.filter(d => d.participation_result === 'pending').length;

    // Today's reservations
    const today = new Date().toISOString().split('T')[0];
    const todayCount = filteredData.filter(d => d.reservation_date === today).length;

    // Update stats
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statSeoul').textContent = seoul;
    document.getElementById('statSuwon').textContent = suwon;
    document.getElementById('statParticipated').textContent = participated;
    document.getElementById('statNotParticipated').textContent = notParticipated;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statToday').textContent = todayCount;

    // Update percentages
    if (total > 0) {
        document.getElementById('statSeoulPercent').textContent = Math.round(seoul / total * 100) + '%';
        document.getElementById('statSuwonPercent').textContent = Math.round(suwon / total * 100) + '%';
        document.getElementById('statParticipatedPercent').textContent = Math.round(participated / total * 100) + '%';
        document.getElementById('statNotParticipatedPercent').textContent = Math.round(notParticipated / total * 100) + '%';
        document.getElementById('statPendingPercent').textContent = Math.round(pending / total * 100) + '%';
    }

    // Update counts
    document.getElementById('visibleCount').textContent = filteredData.length;
    document.getElementById('totalCount').textContent = allData.length;
}

function updateCharts() {
    // Update Location Chart
    const seoulCount = filteredData.filter(d => d.reservation_location === 'Seoul' || d.data_source === '서울').length;
    const suwonCount = filteredData.filter(d => d.reservation_location === 'Suwon' || d.data_source === '수원').length;
    charts.location.data.datasets[0].data = [seoulCount, suwonCount];
    charts.location.update();

    // Update Status Chart
    const statusCounts = {
        participated: filteredData.filter(d => d.participation_result === 'participated').length,
        not_participated: filteredData.filter(d => d.participation_result === 'not_participated').length,
        pending: filteredData.filter(d => d.participation_result === 'pending').length,
        cancelled: filteredData.filter(d => d.participation_result === 'cancelled').length
    };
    charts.status.data.datasets[0].data = Object.values(statusCounts);
    charts.status.update();

    // Update Daily Chart
    const dailyCounts = {};
    filteredData.forEach(record => {
        const date = record.reservation_date;
        if (date) {
            dailyCounts[date] = (dailyCounts[date] || 0) + 1;
        }
    });

    // Get last 7 days
    const dates = Object.keys(dailyCounts).sort().slice(-7);
    charts.daily.data.labels = dates.map(d => new Date(d).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }));
    charts.daily.data.datasets[0].data = dates.map(d => dailyCounts[d]);
    charts.daily.update();
}

function updateSyncStatus() {
    // Get most recent sync timestamp
    if (filteredData.length > 0) {
        const timestamps = filteredData
            .map(d => d.sync_timestamp)
            .filter(t => t)
            .map(t => new Date(t));

        if (timestamps.length > 0) {
            const latestSync = new Date(Math.max(...timestamps));
            const now = new Date();
            const ageMinutes = Math.round((now - latestSync) / 60000);

            document.getElementById('lastSyncTime').textContent = latestSync.toLocaleTimeString('ko-KR');
            document.getElementById('statSyncAge').textContent = ageMinutes;

            // Update sync indicator color
            const indicator = document.querySelector('.sync-indicator');
            if (indicator) {
                if (ageMinutes < 5) {
                    indicator.classList.remove('bg-yellow-500', 'bg-red-500');
                    indicator.classList.add('bg-green-500');
                } else if (ageMinutes < 15) {
                    indicator.classList.remove('bg-green-500', 'bg-red-500');
                    indicator.classList.add('bg-yellow-500');
                } else {
                    indicator.classList.remove('bg-green-500', 'bg-yellow-500');
                    indicator.classList.add('bg-red-500');
                }
            }
        }
    }
}

async function manualSync() {
    const syncBtn = document.getElementById('manualSyncBtn');
    const syncStatus = document.getElementById('syncStatus');

    try {
        // Show sync status
        syncStatus.classList.add('active');
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';

        // Trigger sync via API
        const response = await fetch('/.netlify/functions/management-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync' })
        });

        if (!response.ok) {
            throw new Error('Sync failed');
        }

        // Reload data
        await loadData();

        showToast('Data synchronized successfully', 'success');

    } catch (error) {
        console.error('Sync error:', error);
        showToast('Failed to sync data', 'error');

    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Manual Sync';
        setTimeout(() => {
            syncStatus.classList.remove('active');
        }, 3000);
    }
}

function toggleAutoSync() {
    const btn = document.getElementById('autoSyncToggle');
    const label = document.getElementById('autoSyncLabel');

    if (autoSyncInterval) {
        // Stop auto sync
        clearInterval(autoSyncInterval);
        autoSyncInterval = null;
        btn.classList.remove('bg-green-600');
        btn.classList.add('bg-gray-600');
        label.textContent = 'Auto Sync: OFF';
        showToast('Auto sync disabled', 'info');
    } else {
        // Start auto sync
        autoSyncInterval = setInterval(async () => {
            await manualSync();
        }, CONFIG.autoSyncIntervalMinutes * 60 * 1000);
        btn.classList.remove('bg-gray-600');
        btn.classList.add('bg-green-600');
        label.textContent = 'Auto Sync: ON';
        showToast(`Auto sync enabled (every ${CONFIG.autoSyncIntervalMinutes} minutes)`, 'success');
    }
}

function applyFilters() {
    const name = document.getElementById('searchName').value.toLowerCase();
    const phone = document.getElementById('searchPhone').value;
    const date = document.getElementById('searchDate').value;
    const status = document.getElementById('searchStatus').value;

    let filtered = [...filteredData];

    if (name) {
        filtered = filtered.filter(d => (d.name || '').toLowerCase().includes(name));
    }
    if (phone) {
        filtered = filtered.filter(d => (d.phone || '').includes(phone));
    }
    if (date) {
        filtered = filtered.filter(d => d.reservation_date === date);
    }
    if (status) {
        filtered = filtered.filter(d => d.participation_result === status);
    }

    table.setData(filtered);
    document.getElementById('visibleCount').textContent = filtered.length;
}

function clearFilters() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchStatus').value = '';
    table.setData(filteredData);
    document.getElementById('visibleCount').textContent = filteredData.length;
}

function exportData() {
    table.download("csv", "management_panel_export.csv");
    showToast('Data exported successfully', 'success');
}

function setupEventListeners() {
    // Search on Enter key
    ['searchName', 'searchPhone'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') applyFilters();
        });
    });

    // Auto-apply filters on change
    ['searchDate', 'searchStatus'].forEach(id => {
        document.getElementById(id).addEventListener('change', applyFilters);
    });
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
    const colors = {
        success: 'linear-gradient(to right, #10b981, #059669)',
        error: 'linear-gradient(to right, #ef4444, #dc2626)',
        info: 'linear-gradient(to right, #3b82f6, #2563eb)',
        warning: 'linear-gradient(to right, #f59e0b, #d97706)'
    };

    Toastify({
        text: message,
        duration: 3000,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: colors[type] || colors.info,
        }
    }).showToast();
}