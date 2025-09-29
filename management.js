// Management Panel JavaScript
// Real-time sync with Google Sheets via Airtable

// Global variables
let table = null;
let allData = [];
let filteredData = [];
let currentLocation = 'all';
let autoSyncInterval = null;
let charts = {};
let debugMode = false;
let logs = [];

// Configuration
const CONFIG = {
    autoSyncIntervalMinutes: 15,
    cacheExpiryMinutes: 5,
    maxRecordsDisplay: 10000,
    debugMode: true  // Enable debug by default for troubleshooting
};

// Logging System
const Logger = {
    logs: [],
    maxLogs: 1000,

    log: function(level, message, data = null) {
        const timestamp = new Date().toISOString();
        const logEntry = {
            timestamp,
            level,
            message,
            data
        };

        this.logs.push(logEntry);
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }

        // Console output
        const consoleMsg = `[${timestamp.split('T')[1].split('.')[0]}] [${level}] ${message}`;
        switch(level) {
            case 'ERROR':
                console.error(consoleMsg, data || '');
                break;
            case 'WARN':
                console.warn(consoleMsg, data || '');
                break;
            case 'DEBUG':
                if (CONFIG.debugMode) console.log(consoleMsg, data || '');
                break;
            default:
                console.log(consoleMsg, data || '');
        }

        // Update UI console if visible
        this.updateUIConsole(logEntry);
    },

    updateUIConsole: function(logEntry) {
        const logContent = document.getElementById('logContent');
        if (logContent) {
            const colorMap = {
                'ERROR': 'text-red-400',
                'WARN': 'text-yellow-400',
                'INFO': 'text-green-400',
                'DEBUG': 'text-gray-400',
                'SUCCESS': 'text-blue-400'
            };

            const logDiv = document.createElement('div');
            logDiv.className = colorMap[logEntry.level] || 'text-gray-400';
            logDiv.innerHTML = `[${logEntry.timestamp.split('T')[1].split('.')[0]}] [${logEntry.level}] ${logEntry.message}`;

            if (logEntry.data) {
                const dataDiv = document.createElement('div');
                dataDiv.className = 'ml-4 text-gray-500 text-xs';
                dataDiv.textContent = typeof logEntry.data === 'object' ?
                    JSON.stringify(logEntry.data, null, 2) : logEntry.data;
                logDiv.appendChild(dataDiv);
            }

            logContent.appendChild(logDiv);
            logContent.scrollTop = logContent.scrollHeight;
        }
    },

    clear: function() {
        this.logs = [];
        const logContent = document.getElementById('logContent');
        if (logContent) {
            logContent.innerHTML = '<div class="text-yellow-400">[System] Debug console cleared...</div>';
        }
    },

    download: function() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const blob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
};

// Sync Process Monitor
const SyncMonitor = {
    steps: ['fetch', 'process', 'update'],
    currentStep: null,
    progress: 0,

    start: function() {
        Logger.log('INFO', 'Starting sync process...');
        document.getElementById('syncProcessMonitor')?.classList.remove('hidden');
        this.reset();
    },

    reset: function() {
        this.steps.forEach(step => {
            const stepEl = document.getElementById(`step-${step}`);
            if (stepEl) {
                stepEl.querySelector('.step-icon').className = 'step-icon w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center';
                stepEl.querySelector('.step-icon i').className = stepEl.querySelector('.step-icon i').className.replace(/text-\w+-500/, 'text-gray-500');
                stepEl.querySelector('.step-status span').textContent = 'Waiting';
                stepEl.querySelector('.step-status span').className = 'text-gray-400';
                document.getElementById(`step-${step}-details`)?.classList.add('hidden');
            }
        });
        this.updateProgress(0);
    },

    updateStep: function(step, status, message = '', details = '') {
        Logger.log('DEBUG', `Sync step: ${step} - ${status}`, {message, details});

        const stepEl = document.getElementById(`step-${step}`);
        if (stepEl) {
            const statusEl = stepEl.querySelector('.step-status span');
            const iconEl = stepEl.querySelector('.step-icon');
            const iconClass = stepEl.querySelector('.step-icon i');

            switch(status) {
                case 'processing':
                    iconEl.className = 'step-icon w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse';
                    iconClass.className = iconClass.className.replace('text-gray-500', 'text-blue-500');
                    statusEl.textContent = 'Processing...';
                    statusEl.className = 'text-blue-500';
                    break;
                case 'success':
                    iconEl.className = 'step-icon w-8 h-8 rounded-full bg-green-100 flex items-center justify-center';
                    iconClass.className = iconClass.className.replace(/text-\w+-500/, 'text-green-500');
                    statusEl.textContent = 'Complete';
                    statusEl.className = 'text-green-500';
                    break;
                case 'error':
                    iconEl.className = 'step-icon w-8 h-8 rounded-full bg-red-100 flex items-center justify-center';
                    iconClass.className = iconClass.className.replace(/text-\w+-500/, 'text-red-500');
                    statusEl.textContent = 'Error';
                    statusEl.className = 'text-red-500';
                    break;
            }

            if (message) {
                stepEl.querySelector('.text-sm.text-gray-500').textContent = message;
            }

            if (details) {
                const detailsEl = document.getElementById(`step-${step}-details`);
                if (detailsEl) {
                    detailsEl.classList.remove('hidden');
                    detailsEl.querySelector('div').textContent = details;
                }
            }
        }
    },

    updateProgress: function(percent) {
        this.progress = percent;
        const progressBar = document.getElementById('syncProgressBar');
        const progressText = document.getElementById('syncProgressPercent');
        if (progressBar) progressBar.style.width = `${percent}%`;
        if (progressText) progressText.textContent = `${percent}%`;
    },

    complete: function(success = true) {
        this.updateProgress(100);
        Logger.log(success ? 'SUCCESS' : 'ERROR',
            success ? 'Sync process completed successfully' : 'Sync process failed');

        setTimeout(() => {
            document.getElementById('syncProcessMonitor')?.classList.add('hidden');
        }, 3000);
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    try {
        Logger.log('INFO', 'Initializing Management Panel...');
        showLoading();

        // Initialize Tabulator table
        Logger.log('DEBUG', 'Initializing data table...');
        initializeTable();

        // Initialize charts
        Logger.log('DEBUG', 'Initializing charts...');
        initializeCharts();

        // Load initial data
        Logger.log('INFO', 'Loading initial data from Airtable...');
        await loadData();

        // Set up event listeners
        Logger.log('DEBUG', 'Setting up event listeners...');
        setupEventListeners();

        // Update UI
        Logger.log('DEBUG', 'Updating statistics and sync status...');
        updateStatistics();
        updateSyncStatus();

        hideLoading();

        // Show welcome message
        Logger.log('SUCCESS', 'Management Panel initialized successfully');
        showToast('Management Panel loaded successfully', 'success');

    } catch (error) {
        Logger.log('ERROR', 'Initialization failed', error);
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
        // Start sync monitor
        SyncMonitor.start();

        // Step 1: Fetching from Airtable
        SyncMonitor.updateStep('fetch', 'processing', 'Connecting to Airtable...');
        Logger.log('INFO', 'Fetching data from Airtable...');

        const startTime = Date.now();

        // Fetch from Airtable via Netlify Function
        Logger.log('DEBUG', 'Calling management-api endpoint...');
        const response = await fetch('/.netlify/functions/management-api', {
            method: 'GET'
        });

        let data = null;
        let usedFallback = false;

        if (!response.ok) {
            Logger.log('WARN', `Primary API failed: ${response.status} ${response.statusText}`);

            // Fallback to existing airtable function
            Logger.log('INFO', 'Trying fallback Airtable function...');
            SyncMonitor.updateStep('fetch', 'processing', 'Using fallback API...');

            const fallbackResponse = await fetch('/.netlify/functions/airtable', {
                method: 'GET'
            });

            if (!fallbackResponse.ok) {
                Logger.log('ERROR', `Both APIs failed. Status: ${fallbackResponse.status}`);
                SyncMonitor.updateStep('fetch', 'error', 'Failed to connect',
                    `Primary: ${response.status}, Fallback: ${fallbackResponse.status}`);
                throw new Error(`Failed to fetch data: ${fallbackResponse.status} ${fallbackResponse.statusText}`);
            }

            data = await fallbackResponse.json();
            usedFallback = true;
            Logger.log('SUCCESS', 'Data fetched using fallback API');
        } else {
            data = await response.json();
            Logger.log('SUCCESS', 'Data fetched from primary API');
        }

        const fetchTime = Date.now() - startTime;
        allData = data.records || [];

        Logger.log('INFO', `Fetched ${allData.length} records in ${fetchTime}ms`, {
            api: usedFallback ? 'fallback' : 'primary',
            recordCount: allData.length,
            statistics: data.statistics || null
        });

        // Enhanced logging for empty data
        if (allData.length === 0) {
            Logger.log('WARNING', 'No records found in Airtable', {
                table: 'ManagementPanel',
                possible_causes: [
                    'Table is empty',
                    'Table name mismatch',
                    'Permission issues',
                    'Environment variable misconfiguration'
                ]
            });

            console.warn('⚠️ No records returned from Airtable');
            console.warn('Please check:');
            console.warn('1. Table "ManagementPanel" exists and has data');
            console.warn('2. Environment variables are set correctly:');
            console.warn('   - Airtable_API_Key');
            console.warn('   - Airtable_Base_ID');
            console.warn('   - Airtable_ManagementPanel_ID');
        }

        SyncMonitor.updateStep('fetch', 'success',
            `Fetched ${allData.length} records`,
            `Time: ${fetchTime}ms, API: ${usedFallback ? 'Fallback' : 'Primary'}`);
        SyncMonitor.updateProgress(33);

        // Step 2: Processing Data
        SyncMonitor.updateStep('process', 'processing', 'Processing and filtering data...');
        Logger.log('DEBUG', 'Processing data...');

        // Apply location filter
        filterByLocation();

        Logger.log('INFO', `Filtered to ${filteredData.length} records for location: ${currentLocation}`);

        SyncMonitor.updateStep('process', 'success',
            `Processed ${filteredData.length} records`,
            `Location: ${currentLocation}, Filtered from ${allData.length} total`);
        SyncMonitor.updateProgress(66);

        // Step 3: Updating UI
        SyncMonitor.updateStep('update', 'processing', 'Updating interface...');
        Logger.log('DEBUG', 'Updating UI components...');

        // Update table
        table.setData(filteredData);
        Logger.log('DEBUG', 'Table updated with filtered data');

        // Update UI components
        updateStatistics();
        updateCharts();
        updateSyncStatus();

        Logger.log('SUCCESS', `Data load complete: ${allData.length} total, ${filteredData.length} displayed`);

        SyncMonitor.updateStep('update', 'success',
            'Interface updated successfully',
            `Displaying ${filteredData.length} records`);
        SyncMonitor.updateProgress(100);
        SyncMonitor.complete(true);

        console.log(`✅ Loaded ${allData.length} records from Airtable`);

        // Handle empty state UI
        if (allData.length === 0) {
            showEmptyState();
        } else {
            hideEmptyState();
        }

    } catch (error) {
        Logger.log('ERROR', 'Failed to load data', {
            error: error.message,
            stack: error.stack
        });

        SyncMonitor.complete(false);
        console.error('Error loading data:', error);
        showToast(`Failed to load data: ${error.message}`, 'error');
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

// Show empty state message when no data is available
function showEmptyState() {
    const tableContainer = document.getElementById('dataTable');
    const existingEmpty = document.getElementById('emptyStateMessage');

    if (!existingEmpty && tableContainer) {
        const emptyMessage = document.createElement('div');
        emptyMessage.id = 'emptyStateMessage';
        emptyMessage.className = 'text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300';
        emptyMessage.innerHTML = `
            <div class="text-gray-500">
                <svg class="mx-auto h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <h3 class="text-lg font-medium mb-2">No Data Available</h3>
                <p class="text-sm mb-4">The Airtable table appears to be empty.</p>
                <div class="text-left max-w-md mx-auto bg-white p-4 rounded border border-gray-200">
                    <p class="text-xs font-semibold mb-2 text-gray-700">Troubleshooting:</p>
                    <ul class="text-xs space-y-1 text-gray-600 mb-3">
                        <li>• Verify table "ManagementPanel" exists in Airtable</li>
                        <li>• Check if the table contains any records</li>
                        <li>• Confirm environment variables are set correctly</li>
                        <li>• Verify API key has read permissions</li>
                    </ul>
                    <p class="text-xs font-semibold mb-2 text-gray-700">Required Netlify environment variables:</p>
                    <pre class="text-xs bg-gray-900 text-green-400 p-2 rounded overflow-x-auto">Airtable_API_Key=pat...
Airtable_Base_ID=app...
Airtable_ManagementPanel_ID=ManagementPanel</pre>
                </div>
                <button onclick="loadData()" class="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium">
                    🔄 Retry Loading Data
                </button>
            </div>
        `;
        tableContainer.parentElement.insertBefore(emptyMessage, tableContainer);
        tableContainer.style.display = 'none';
    }
}

// Hide empty state message when data is available
function hideEmptyState() {
    const emptyMessage = document.getElementById('emptyStateMessage');
    const tableContainer = document.getElementById('dataTable');

    if (emptyMessage) {
        emptyMessage.remove();
    }

    if (tableContainer) {
        tableContainer.style.display = 'block';
    }
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

// Debug Console Functions
function toggleDebugConsole() {
    const console = document.getElementById('debugConsole');
    if (console) {
        console.classList.toggle('hidden');
        if (!console.classList.contains('hidden')) {
            Logger.log('DEBUG', 'Debug console opened');
        }
    }
}

function clearLogs() {
    Logger.clear();
}

function downloadLogs() {
    Logger.download();
}

// Manual Sync with enhanced logging
async function manualSync() {
    const syncBtn = document.getElementById('manualSyncBtn');
    const syncStatus = document.getElementById('syncStatus');

    try {
        Logger.log('INFO', 'Manual sync initiated by user');

        // Show sync status
        syncStatus.classList.add('active');
        syncBtn.disabled = true;
        syncBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Syncing...';

        // Start sync monitor
        SyncMonitor.start();

        // Trigger sync via API
        Logger.log('DEBUG', 'Calling sync API...');
        SyncMonitor.updateStep('fetch', 'processing', 'Initiating sync...');

        const response = await fetch('/.netlify/functions/management-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'sync' })
        });

        if (!response.ok) {
            Logger.log('ERROR', `Sync API failed: ${response.status}`);
            throw new Error(`Sync failed: ${response.status}`);
        }

        const result = await response.json();
        Logger.log('SUCCESS', 'Sync triggered successfully', result);

        // Reload data
        await loadData();

        showToast('Data synchronized successfully', 'success');

    } catch (error) {
        Logger.log('ERROR', 'Manual sync failed', {
            error: error.message,
            stack: error.stack
        });
        console.error('Sync error:', error);
        showToast('Failed to sync data', 'error');
        SyncMonitor.complete(false);

    } finally {
        syncBtn.disabled = false;
        syncBtn.innerHTML = '<i class="fas fa-sync-alt mr-2"></i>Manual Sync';
        setTimeout(() => {
            syncStatus.classList.remove('active');
        }, 3000);
    }
}

// Error boundary for initialization
window.addEventListener('error', function(event) {
    Logger.log('ERROR', 'Global error caught', {
        message: event.message,
        filename: event.filename,
        line: event.lineno,
        column: event.colno,
        error: event.error
    });
});

// Log unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    Logger.log('ERROR', 'Unhandled promise rejection', {
        reason: event.reason,
        promise: event.promise
    });
});

// Initialize debug mode from URL parameter
(function initDebugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('debug') === 'true') {
        CONFIG.debugMode = true;
        Logger.log('INFO', 'Debug mode enabled via URL parameter');
    }
})();