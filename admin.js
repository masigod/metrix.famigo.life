// Global variables
let table = null;
let allData = [];
let filteredData = [];
let charts = {};

// Field definitions for the form
const FIELD_DEFINITIONS = [
    { field: 'UID', title: 'UID', type: 'text', required: true, editable: true },
    { field: 'name', title: 'Name', type: 'text', required: true, editable: true },
    { field: 'email', title: 'Email', type: 'email', required: true, editable: true },
    { field: 'phone', title: 'Phone', type: 'tel', required: true, editable: true },
    { field: 'gender', title: 'Gender', type: 'select', options: ['Female', 'Male'], editable: true },
    { field: 'birth_year', title: 'Birth Date', type: 'date', editable: true },
    { field: 'nationality', title: 'Nationality', type: 'text', editable: true },
    { field: 'culture_region', title: 'Culture Region', type: 'text', editable: true },
    { field: 'ethnicity', title: 'Ethnicity', type: 'text', editable: true },
    { field: 'visa_type', title: 'Visa Type', type: 'text', editable: true },
    { field: 'reservation_location', title: 'Location', type: 'select',
      options: ['서울(Seoul)', '수원(Suwon)', 'cancel', '취소'], editable: true },
    { field: 'reservation_date', title: 'Reservation Date', type: 'date', editable: true },
    { field: 'reservation_time', title: 'Reservation Time', type: 'time', editable: true },
    { field: 'participation_result', title: 'Participation', type: 'select',
      options: ['참여', '불참', '보류', '취소'], editable: true },
    { field: 'confirmation_status', title: 'Confirmation', type: 'select',
      options: ['o', 'x', 'pending'], editable: true },
    { field: 'application_date', title: 'Application Date', type: 'date', editable: true },
    { field: 'famigo_match_key', title: 'Famigo Key', type: 'text', editable: false },
    { field: 'match_type', title: 'Match Type', type: 'select',
      options: ['완전매칭', '이메일매칭', '전화번호매칭', '미매칭'], editable: true },
    { field: 'match_confidence', title: 'Match Confidence', type: 'number', editable: false },
    { field: 'notes', title: 'Notes', type: 'textarea', editable: true }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    try {
        showLoading();

        // Initialize Tabulator table
        initializeTable();

        // Load data from Airtable - load ALL data
        await loadAllData();

        // Initialize charts
        initializeCharts();

        // Set up event listeners
        setupEventListeners();

        // Update all statistics and charts
        updateAllStatistics();

        hideLoading();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('Initialization error occurred', 'error');
        hideLoading();
    }
}

function initializeTable() {
    table = new Tabulator("#dataTable", {
        data: [],
        layout: "fitData",
        height: "650px",
        virtualDom: true,
        movableColumns: true,
        resizableColumns: true,
        selectable: true,
        pagination: false, // Show all data
        columns: [
            {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                width: 40,
                headerSort: false,
                cellClick: function(e, cell) {
                    cell.getRow().toggleSelect();
                    updateSelectedCount();
                }
            },
            {
                title: "Actions",
                width: 100,
                formatter: function(cell) {
                    return `
                        <div class="flex gap-1">
                            <button class="edit-btn text-blue-600 hover:text-blue-800 p-1">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="delete-btn text-red-600 hover:text-red-800 p-1">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                },
                cellClick: function(e, cell) {
                    const row = cell.getRow();
                    if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
                        editRecord(row.getData());
                    } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
                        deleteRecord(row.getData());
                    }
                },
                headerSort: false
            },
            { title: "UID", field: "UID", width: 200, headerFilter: "input" },
            { title: "Name", field: "name", width: 150, headerFilter: "input" },
            { title: "Email", field: "email", width: 200, headerFilter: "input" },
            { title: "Phone", field: "phone", width: 130, headerFilter: "input" },
            { title: "Gender", field: "gender", width: 80, headerFilter: "select",
              headerFilterParams: {values: {"": "All", "Female": "Female", "Male": "Male"}} },
            { title: "Birth", field: "birth_year", width: 110 },
            { title: "Nationality", field: "nationality", width: 120, headerFilter: "input" },
            { title: "Location", field: "reservation_location", width: 120, headerFilter: "input" },
            { title: "Date", field: "reservation_date", width: 110, sorter: "date" },
            { title: "Time", field: "reservation_time", width: 80 },
            { title: "Status", field: "participation_result", width: 100,
              headerFilter: "select",
              headerFilterParams: {values: {"": "All", "참여": "참여", "불참": "불참", "보류": "보류", "취소": "취소"}},
              formatter: function(cell) {
                  const value = cell.getValue();
                  let badgeClass = "badge-info";

                  if (value === "참여") badgeClass = "badge-success";
                  else if (value === "불참") badgeClass = "badge-danger";
                  else if (value === "보류") badgeClass = "badge-warning";
                  else if (value === "취소") badgeClass = "badge-danger";

                  return value ? `<span class="badge ${badgeClass}">${value}</span>` : '-';
              }
            },
            { title: "Confirmed", field: "confirmation_status", width: 90,
              formatter: function(cell) {
                  const value = cell.getValue();
                  if (value === 'o') return '<i class="fas fa-check text-green-600"></i>';
                  if (value === 'x') return '<i class="fas fa-times text-red-600"></i>';
                  return '<i class="fas fa-question text-gray-400"></i>';
              }
            },
            { title: "Match", field: "match_type", width: 120,
              formatter: function(cell) {
                  const value = cell.getValue();
                  if (!value || value === '미매칭') return '<span class="text-gray-400">Unmatched</span>';
                  return `<span class="text-blue-600">${value}</span>`;
              }
            },
            { title: "Score", field: "match_confidence", width: 70,
              formatter: function(cell) {
                  const value = cell.getValue();
                  if (!value) return '-';
                  const color = value >= 80 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600';
                  return `<span class="${color} font-semibold">${value}%</span>`;
              }
            },
            { title: "Notes", field: "notes", width: 200 }
        ]
    });
}

async function loadAllData() {
    try {
        const response = await fetch('/.netlify/functions/airtable', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        allData = data.records || [];

        // Load ALL data without filtering
        filteredData = [...allData];
        table.setData(filteredData);

        console.log(`Loaded ${allData.length} records`);

        updateRecordCount();
        document.getElementById('lastSync').textContent = `Last sync: ${new Date().toLocaleString('en-US')}`;

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data', 'error');
    }
}

function updateAllStatistics() {
    // Calculate comprehensive statistics
    const stats = {
        total: allData.length,
        participated: 0,
        notParticipated: 0,
        pending: 0,
        cancelled: 0,
        matched: 0,
        unmatched: 0,
        female: 0,
        male: 0,
        locations: {}
    };

    allData.forEach(record => {
        // Participation stats
        if (record.participation_result === '참여') stats.participated++;
        else if (record.participation_result === '불참') stats.notParticipated++;
        else if (record.participation_result === '보류') stats.pending++;
        else if (record.participation_result === '취소') stats.cancelled++;

        // Match stats
        if (record.match_type && record.match_type !== '미매칭') stats.matched++;
        else stats.unmatched++;

        // Gender stats
        if (record.gender === 'Female') stats.female++;
        else if (record.gender === 'Male') stats.male++;

        // Location stats
        if (record.reservation_location) {
            stats.locations[record.reservation_location] = (stats.locations[record.reservation_location] || 0) + 1;
        }
    });

    // Update count displays
    document.getElementById('totalRecords').textContent = stats.total;
    document.getElementById('participatedCount').textContent = stats.participated;
    document.getElementById('notParticipatedCount').textContent = stats.notParticipated;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('matchedCount').textContent = stats.matched;
    document.getElementById('unmatchedCount').textContent = stats.unmatched;
    document.getElementById('femaleCount').textContent = stats.female;
    document.getElementById('maleCount').textContent = stats.male;

    // Update percentages
    if (stats.total > 0) {
        document.getElementById('participatedPercent').textContent = `${((stats.participated/stats.total)*100).toFixed(1)}%`;
        document.getElementById('notParticipatedPercent').textContent = `${((stats.notParticipated/stats.total)*100).toFixed(1)}%`;
        document.getElementById('pendingPercent').textContent = `${((stats.pending/stats.total)*100).toFixed(1)}%`;
        document.getElementById('matchedPercent').textContent = `${((stats.matched/stats.total)*100).toFixed(1)}%`;
        document.getElementById('unmatchedPercent').textContent = `${((stats.unmatched/stats.total)*100).toFixed(1)}%`;
        document.getElementById('femalePercent').textContent = `${((stats.female/stats.total)*100).toFixed(1)}%`;
        document.getElementById('malePercent').textContent = `${((stats.male/stats.total)*100).toFixed(1)}%`;
    }

    // Update charts
    updateCharts(stats);
}

function initializeCharts() {
    // Participation Status Chart
    const ctxParticipation = document.getElementById('participationChart').getContext('2d');
    charts.participation = new Chart(ctxParticipation, {
        type: 'doughnut',
        data: {
            labels: ['Participated', 'Not Participated', 'Pending', 'Cancelled'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#10b981', '#ef4444', '#f59e0b', '#6b7280'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        font: { size: 10 }
                    }
                }
            }
        }
    });

    // Gender Distribution Chart
    const ctxGender = document.getElementById('genderChart').getContext('2d');
    charts.gender = new Chart(ctxGender, {
        type: 'pie',
        data: {
            labels: ['Female', 'Male'],
            datasets: [{
                data: [0, 0],
                backgroundColor: ['#ec4899', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        font: { size: 10 }
                    }
                }
            }
        }
    });

    // Location Distribution Chart
    const ctxLocation = document.getElementById('locationChart').getContext('2d');
    charts.location = new Chart(ctxLocation, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Participants',
                data: [],
                backgroundColor: '#6366f1',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1,
                        font: { size: 10 }
                    }
                },
                x: {
                    ticks: {
                        font: { size: 10 }
                    }
                }
                }
            }
        }
    });
}

function updateCharts(stats) {
    // Update Participation Chart
    charts.participation.data.datasets[0].data = [
        stats.participated,
        stats.notParticipated,
        stats.pending,
        stats.cancelled
    ];
    charts.participation.update();

    // Update Gender Chart
    charts.gender.data.datasets[0].data = [stats.female, stats.male];
    charts.gender.update();

    // Update Location Chart
    const locationLabels = Object.keys(stats.locations);
    const locationData = Object.values(stats.locations);
    charts.location.data.labels = locationLabels;
    charts.location.data.datasets[0].data = locationData;
    charts.location.update();
}

function setupEventListeners() {
    // Search button
    document.getElementById('searchBtn').addEventListener('click', performSearch);

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearSearch);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        showLoading();
        await loadAllData();
        updateAllStatistics();
        hideLoading();
        showToast('Data refreshed successfully', 'success');
    });

    // Add new record button
    document.getElementById('addBtn').addEventListener('click', () => {
        editRecord({});
    });

    // Export CSV button
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);

    // Import CSV
    document.getElementById('importFile').addEventListener('change', handleFileImport);

    // Edit form submit
    document.getElementById('editForm').addEventListener('submit', handleFormSubmit);

    // Real-time search on Enter key
    ['searchName', 'searchPhone', 'searchEmail'].forEach(id => {
        document.getElementById(id).addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });
    });
}

function performSearch() {
    const searchCriteria = {
        name: document.getElementById('searchName').value.toLowerCase(),
        phone: document.getElementById('searchPhone').value,
        email: document.getElementById('searchEmail').value.toLowerCase(),
        reservation_date: document.getElementById('searchDate').value,
        reservation_time: document.getElementById('searchTime').value,
        participation_result: document.getElementById('searchParticipation').value
    };

    filteredData = allData.filter(record => {
        let match = true;

        if (searchCriteria.name && !record.name?.toLowerCase().includes(searchCriteria.name)) {
            match = false;
        }
        if (searchCriteria.phone && !record.phone?.includes(searchCriteria.phone)) {
            match = false;
        }
        if (searchCriteria.email && !record.email?.toLowerCase().includes(searchCriteria.email)) {
            match = false;
        }
        if (searchCriteria.reservation_date && record.reservation_date !== searchCriteria.reservation_date) {
            match = false;
        }
        if (searchCriteria.reservation_time && record.reservation_time !== searchCriteria.reservation_time) {
            match = false;
        }
        if (searchCriteria.participation_result && record.participation_result !== searchCriteria.participation_result) {
            match = false;
        }

        return match;
    });

    table.setData(filteredData);
    updateRecordCount();
    showToast(`Found ${filteredData.length} records`, 'info');
}

function clearSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchEmail').value = '';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchTime').value = '';
    document.getElementById('searchParticipation').value = '';

    filteredData = [...allData];
    table.setData(filteredData);
    updateRecordCount();
}

function editRecord(record) {
    const modal = document.getElementById('editModal');
    const form = document.getElementById('editForm');

    // Clear form
    form.innerHTML = '';

    // Create form fields grid
    const gridDiv = document.createElement('div');
    gridDiv.className = 'grid grid-cols-1 md:grid-cols-2 gap-4';

    FIELD_DEFINITIONS.forEach(fieldDef => {
        const fieldDiv = document.createElement('div');
        fieldDiv.className = fieldDef.type === 'textarea' ? 'md:col-span-2' : '';

        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-gray-700 mb-1';
        label.textContent = fieldDef.title;
        if (fieldDef.required) {
            label.innerHTML += ' <span class="text-red-500">*</span>';
        }

        let input;
        if (fieldDef.type === 'select') {
            input = document.createElement('select');
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Choose...';
            input.appendChild(emptyOption);

            fieldDef.options.forEach(option => {
                const optionElement = document.createElement('option');
                optionElement.value = option;
                optionElement.textContent = option;
                input.appendChild(optionElement);
            });
        } else if (fieldDef.type === 'textarea') {
            input = document.createElement('textarea');
            input.rows = 3;
        } else {
            input = document.createElement('input');
            input.type = fieldDef.type;
        }

        input.name = fieldDef.field;
        input.value = record[fieldDef.field] || '';
        input.className = 'w-full px-3 py-2 bg-white rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition';

        if (fieldDef.required) {
            input.required = true;
        }

        if (!fieldDef.editable && record.id) {
            input.disabled = true;
            input.className += ' bg-gray-100 cursor-not-allowed';
        }

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        gridDiv.appendChild(fieldDiv);
    });

    form.appendChild(gridDiv);

    // Add hidden field for record ID
    if (record.id) {
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'id';
        idInput.value = record.id;
        form.appendChild(idInput);
    }

    // Add buttons
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-6 flex justify-end gap-3';
    buttonDiv.innerHTML = `
        <button type="button" onclick="closeEditModal()"
                class="btn bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 px-5 py-2 rounded-lg">
            Cancel
        </button>
        <button type="submit"
                class="btn bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg">
            ${record.id ? 'Update' : 'Create'}
        </button>
    `;
    form.appendChild(buttonDiv);

    modal.classList.add('active');
}

function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const formData = new FormData(e.target);
    const record = {};

    for (let [key, value] of formData.entries()) {
        record[key] = value;
    }

    try {
        showLoading();

        const method = record.id ? 'PUT' : 'POST';
        const response = await fetch('/.netlify/functions/airtable', {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            throw new Error('Failed to save record');
        }

        closeEditModal();
        await loadAllData();
        updateAllStatistics();
        showToast(record.id ? 'Record updated successfully' : 'Record created successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error saving record:', error);
        showToast('Error saving record', 'error');
        hideLoading();
    }
}

async function deleteRecord(record) {
    if (!confirm(`Delete record for "${record.name}"?`)) {
        return;
    }

    try {
        showLoading();

        const response = await fetch('/.netlify/functions/airtable', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: record.id })
        });

        if (!response.ok) {
            throw new Error('Failed to delete record');
        }

        await loadAllData();
        updateAllStatistics();
        showToast('Record deleted successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error deleting record:', error);
        showToast('Error deleting record', 'error');
        hideLoading();
    }
}

function exportToCSV() {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `k-beauty-panel-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV exported successfully', 'success');
}

async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        complete: async function(results) {
            const records = results.data.filter(row => row.UID); // Filter out empty rows

            if (confirm(`Import ${records.length} records?`)) {
                showLoading();

                try {
                    const response = await fetch('/.netlify/functions/airtable-bulk', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ records })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to import records');
                    }

                    await loadAllData();
                    updateAllStatistics();
                    showToast(`${records.length} records imported successfully`, 'success');
                } catch (error) {
                    console.error('Error importing records:', error);
                    showToast('Error importing records', 'error');
                } finally {
                    hideLoading();
                    e.target.value = ''; // Reset file input
                }
            }
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
            showToast('Error parsing CSV file', 'error');
        }
    });
}

function updateRecordCount() {
    document.getElementById('recordCount').textContent = `${filteredData.length} of ${allData.length} records`;
}

function updateSelectedCount() {
    const selected = table.getSelectedRows().length;
    document.getElementById('selectedCount').textContent = selected;
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function showToast(message, type = 'info') {
    const backgroundColor = {
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
        style: {
            background: backgroundColor[type] || backgroundColor.info,
            borderRadius: '8px',
            fontSize: '14px',
            padding: '12px 20px'
        }
    }).showToast();
}