// K-Beauty Panel Admin - Filtered Data JavaScript

let table;
let allData = [];
let filteredData = [];
let charts = {};

// Field definitions for the filtered dataset - matching actual Airtable fields
const FIELD_DEFINITIONS = [
    { field: 'Name', title: '이름', type: 'text', editable: true },
    { field: 'Email', title: '이메일', type: 'email', editable: true },
    { field: 'Phone', title: '전화번호', type: 'tel', editable: true },
    { field: 'Gender', title: '성별', type: 'select',
      options: ['Female', 'Male'], editable: true },
    { field: 'Birth_Date', title: '생년월일', type: 'date', editable: true },
    { field: 'Age_Group', title: '연령대', type: 'text', editable: true },
    { field: 'Nationality', title: '국적', type: 'text', editable: true },
    { field: 'Culture', title: '문화권', type: 'text', editable: true },
    { field: 'Race', title: '인종', type: 'text', editable: true },
    { field: 'Reservation_Date', title: '예약날짜', type: 'date', editable: true },
    { field: 'Reservation_Time', title: '예약시간', type: 'text', editable: true },
    { field: 'Location', title: '장소', type: 'select',
      options: ['서울(Seoul)', '수원(Suwon)'], editable: true },
    { field: 'Status', title: '현재상태', type: 'text', editable: true },
    { field: 'Participation_Result', title: '참여결과', type: 'select',
      options: ['참여', '불참', '보류', '거부', '변경', '중복', '취소'], editable: true },
    { field: 'Group', title: '패널그룹', type: 'text', editable: true },
    { field: 'Data_Status_Auto', title: 'AI 데이터 상태', type: 'text', editable: false },
    { field: 'Summary_Insights', title: 'AI 요약 인사이트', type: 'textarea', editable: false }
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

        // Load data from Airtable - using MetrixTable2
        await loadAllData();

        // Initialize charts
        initializeCharts();

        // Set up event listeners
        setupEventListeners();

        // Update all statistics and charts
        updateAllStatistics();

        // Initialize record count display
        updateRecordCount();

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
                        <div class="flex gap-2">
                            <button onclick="editRecord(${JSON.stringify(cell.getRow().getData()).replace(/"/g, '&quot;')})"
                                    class="text-amber-600 hover:text-amber-800">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button onclick="deleteRecord(${JSON.stringify(cell.getRow().getData()).replace(/"/g, '&quot;')})"
                                    class="text-red-600 hover:text-red-800">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                },
                headerSort: false
            },
            { title: "Name", field: "Name", width: 150, headerFilter: "input" },
            { title: "Email", field: "Email", width: 200, headerFilter: "input" },
            { title: "Phone", field: "Phone", width: 120 },
            { title: "Gender", field: "Gender", width: 80,
              formatter: function(cell) {
                  const value = cell.getValue();
                  const color = value === 'Female' ? 'text-pink-600' : 'text-blue-600';
                  const icon = value === 'Female' ? 'fa-venus' : 'fa-mars';
                  return `<span class="${color}"><i class="fas ${icon}"></i> ${value}</span>`;
              }
            },
            { title: "Location", field: "Location", width: 100,
              formatter: function(cell) {
                  const value = cell.getValue();
                  const color = value?.includes('서울') ? 'text-blue-600' : 'text-indigo-600';
                  return `<span class="${color} font-semibold">${value || '-'}</span>`;
              }
            },
            { title: "Date", field: "Reservation_Date", width: 110 },
            { title: "Time", field: "Reservation_Time", width: 80 },
            { title: "Result", field: "Participation_Result", width: 100,
              formatter: function(cell) {
                  const value = cell.getValue();
                  let bgColor = 'bg-gray-100';
                  let textColor = 'text-gray-700';

                  if (value === '참여') {
                      bgColor = 'bg-green-100';
                      textColor = 'text-green-700';
                  } else if (value === '보류') {
                      bgColor = 'bg-yellow-100';
                      textColor = 'text-yellow-700';
                  } else if (value === '거부' || value === '불참') {
                      bgColor = 'bg-red-100';
                      textColor = 'text-red-700';
                  } else if (value === '변경') {
                      bgColor = 'bg-blue-100';
                      textColor = 'text-blue-700';
                  }

                  return value ? `<span class="px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}">${value}</span>` : '-';
              }
            },
            { title: "Status", field: "Status", width: 90 },
            { title: "Nationality", field: "Nationality", width: 120 },
            { title: "Age Group", field: "Age_Group", width: 100 },
            { title: "Group", field: "Group", width: 100 }
        ]
    });
}

async function loadAllData() {
    try {
        const response = await fetch('/.netlify/functions/airtable-filter', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        allData = data.records || [];

        // Transform the data to match our field structure
        allData = allData.map(record => transformRecord(record));

        // Load ALL data without filtering
        filteredData = [...allData];
        table.setData(filteredData);

        console.log(`Loaded ${allData.length} filtered records`);

        updateRecordCount();
        document.getElementById('lastSync').textContent = `Last sync: ${new Date().toLocaleString('en-US')}`;

    } catch (error) {
        console.error('Error loading data:', error);
        showToast('Failed to load data from Airtable', 'error');
    }
}

function transformRecord(record) {
    // Direct mapping - Airtable fields already use the correct names
    return {
        id: record.id,
        Name: record.Name || record['이름'],
        Email: record.Email || record['이메일'],
        Phone: record.Phone || record['전화번호'],
        Gender: record.Gender || record['성별'],
        Birth_Date: record.Birth_Date || record['생년'],
        Age_Group: record.Age_Group || record['연령대'],
        Nationality: record.Nationality || record['국적'],
        Culture: record.Culture || record['문화권'],
        Race: record.Race || record['인종'],
        Reservation_Date: record.Reservation_Date || record['예약 날짜'],
        Reservation_Time: record.Reservation_Time || record['예약시간'],
        Location: record.Location || record['예약 지점'] || record['장소'],
        Status: record.Status || record['확정 여부'] || record['현재 상태'],
        Participation_Result: record.Participation_Result || record['참여여부결과'],
        Group: record.Group || record['패널 그룹'],
        Data_Status_Auto: record.Data_Status_Auto,
        Summary_Insights: record.Summary_Insights
    };
}

function updateAllStatistics(useFilteredData = false) {
    // Use filtered data for statistics when search is active
    const dataToUse = useFilteredData ? filteredData : allData;

    // Calculate comprehensive statistics
    const stats = {
        total: dataToUse.length,
        participated: 0,
        pending: 0,
        other: 0,
        confirmed: 0,
        seoul: 0,
        suwon: 0,
        female: 0,
        male: 0,
        locations: {}
    };

    dataToUse.forEach(record => {
        // Participation stats
        if (record.Participation_Result === '참여') stats.participated++;
        else if (record.Participation_Result === '보류') stats.pending++;
        else stats.other++;

        // Confirmation stats (using Status field now)
        const confirmStatus = record.Status;
        if (confirmStatus === 'Confirmed' || confirmStatus === '확정' || confirmStatus === 'o' || confirmStatus === 'O' || confirmStatus === 'ㅇ') {
            stats.confirmed++;
        }

        // Location stats
        if (record.Location?.includes('서울')) stats.seoul++;
        else if (record.Location?.includes('수원')) stats.suwon++;

        // Gender stats
        if (record.Gender === 'Female') stats.female++;
        else if (record.Gender === 'Male') stats.male++;

        // Location distribution for chart
        if (record.Location) {
            const location = record.Location.includes('서울') ? '서울' : '수원';
            stats.locations[location] = (stats.locations[location] || 0) + 1;
        }
    });

    // Update count displays
    document.getElementById('totalRecords').textContent = stats.total;
    document.getElementById('participatedCount').textContent = stats.participated;
    document.getElementById('pendingCount').textContent = stats.pending;
    document.getElementById('otherCount').textContent = stats.other;
    document.getElementById('confirmedCount').textContent = stats.confirmed;
    document.getElementById('seoulCount').textContent = stats.seoul;
    document.getElementById('suwonCount').textContent = stats.suwon;

    // Update gender ratio
    document.getElementById('genderRatio').textContent = `${stats.female}/${stats.male}`;

    // Update percentages
    if (stats.total > 0) {
        document.getElementById('participatedPercent').textContent = `${((stats.participated/stats.total)*100).toFixed(1)}%`;
        document.getElementById('pendingPercent').textContent = `${((stats.pending/stats.total)*100).toFixed(1)}%`;
        document.getElementById('otherPercent').textContent = `${((stats.other/stats.total)*100).toFixed(1)}%`;
        document.getElementById('confirmedPercent').textContent = `${((stats.confirmed/stats.total)*100).toFixed(1)}%`;
        document.getElementById('seoulPercent').textContent = `${((stats.seoul/stats.total)*100).toFixed(1)}%`;
        document.getElementById('suwonPercent').textContent = `${((stats.suwon/stats.total)*100).toFixed(1)}%`;
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
            labels: ['Participated', 'Pending', 'Other'],
            datasets: [{
                data: [0, 0, 0],
                backgroundColor: ['#10b981', '#f59e0b', '#6b7280'],
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
                backgroundColor: '#f59e0b',
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
    });
}

function updateCharts(stats) {
    // Update Participation Chart
    charts.participation.data.datasets[0].data = [
        stats.participated,
        stats.pending,
        stats.other
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
    // Search and filter buttons
    document.getElementById('searchBtn').addEventListener('click', performSearch);
    document.getElementById('clearBtn').addEventListener('click', clearSearch);
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        await loadAllData();
        updateAllStatistics();
    });

    // Action buttons
    document.getElementById('addBtn').addEventListener('click', () => editRecord({}));
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    document.getElementById('importFile').addEventListener('change', handleFileImport);

    // Edit form submit
    document.getElementById('editForm').addEventListener('submit', handleFormSubmit);

    // Real-time search on Enter key
    ['searchName', 'searchEmail', 'searchPhone'].forEach(id => {
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
        email: document.getElementById('searchEmail').value.toLowerCase(),
        phone: document.getElementById('searchPhone').value,
        location: document.getElementById('searchLocation').value,
        date: document.getElementById('searchDate').value,
        participation: document.getElementById('searchParticipation').value
    };

    // Build filter description
    const filterParts = [];
    if (searchCriteria.name) filterParts.push(`Name: ${searchCriteria.name}`);
    if (searchCriteria.email) filterParts.push(`Email: ${searchCriteria.email}`);
    if (searchCriteria.phone) filterParts.push(`Phone: ${searchCriteria.phone}`);
    if (searchCriteria.location) filterParts.push(`Location: ${searchCriteria.location}`);
    if (searchCriteria.date) filterParts.push(`Date: ${searchCriteria.date}`);
    if (searchCriteria.participation) filterParts.push(`Status: ${searchCriteria.participation}`);

    filteredData = allData.filter(record => {
        let match = true;

        if (searchCriteria.name && !record.Name?.toLowerCase().includes(searchCriteria.name)) {
            match = false;
        }
        if (searchCriteria.email && !record.Email?.toLowerCase().includes(searchCriteria.email)) {
            match = false;
        }
        if (searchCriteria.phone && !record.Phone?.includes(searchCriteria.phone)) {
            match = false;
        }
        if (searchCriteria.location && !record.Location?.includes(searchCriteria.location)) {
            match = false;
        }
        if (searchCriteria.date && record.Reservation_Date !== searchCriteria.date) {
            match = false;
        }
        if (searchCriteria.participation && record.Participation_Result !== searchCriteria.participation) {
            match = false;
        }

        return match;
    });

    table.setData(filteredData);
    updateRecordCount();
    updateAllStatistics(true); // Update statistics with filtered data

    // Show/hide filter indicator
    const filterIndicator = document.getElementById('filterIndicator');
    const filterDescription = document.getElementById('filterDescription');

    if (filterParts.length > 0) {
        filterIndicator.classList.remove('hidden');
        filterDescription.textContent = `(${filterParts.join(', ')})`;
    } else {
        filterIndicator.classList.add('hidden');
    }

    showToast(`Found ${filteredData.length} records`, 'info');
}

function clearSearch() {
    document.getElementById('searchName').value = '';
    document.getElementById('searchEmail').value = '';
    document.getElementById('searchPhone').value = '';
    document.getElementById('searchLocation').value = '';
    document.getElementById('searchDate').value = '';
    document.getElementById('searchParticipation').value = '';

    filteredData = [...allData];
    table.setData(filteredData);
    updateRecordCount();
    updateAllStatistics(false); // Reset to show all data statistics

    // Hide filter indicator
    document.getElementById('filterIndicator').classList.add('hidden');
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
        if (!fieldDef.editable) return;

        const fieldDiv = document.createElement('div');
        fieldDiv.className = 'mb-4';

        const label = document.createElement('label');
        label.className = 'block text-sm font-medium text-gray-700 mb-1';
        label.textContent = fieldDef.title;

        let input;

        if (fieldDef.type === 'select' && fieldDef.options) {
            input = document.createElement('select');
            input.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500';

            // Add empty option
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = 'Select...';
            input.appendChild(emptyOption);

            fieldDef.options.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                option.selected = record[fieldDef.field] === opt;
                input.appendChild(option);
            });
        } else if (fieldDef.type === 'textarea') {
            input = document.createElement('textarea');
            input.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500';
            input.rows = 3;
            input.value = record[fieldDef.field] || '';
        } else {
            input = document.createElement('input');
            input.className = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500';
            input.type = fieldDef.type === 'datetime' ? 'datetime-local' : fieldDef.type;
            input.value = record[fieldDef.field] || '';
        }

        input.name = fieldDef.field;
        input.id = fieldDef.field;

        fieldDiv.appendChild(label);
        fieldDiv.appendChild(input);
        gridDiv.appendChild(fieldDiv);
    });

    form.appendChild(gridDiv);

    // Add hidden ID field
    const idInput = document.createElement('input');
    idInput.type = 'hidden';
    idInput.name = 'id';
    idInput.value = record.id || '';
    form.appendChild(idInput);

    // Add submit buttons
    const buttonDiv = document.createElement('div');
    buttonDiv.className = 'mt-6 flex justify-end space-x-3';
    buttonDiv.innerHTML = `
        <button type="button" onclick="closeEditModal()"
                class="px-5 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition">
            Cancel
        </button>
        <button type="submit"
                class="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition">
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
        // Handle empty date fields - don't send empty strings for date fields
        if ((key.includes('Date') || key === 'Birth_Date' || key === 'Reservation_Date') && value === '') {
            continue; // Skip empty date fields
        }
        // Don't send empty values for non-required fields
        if (value === '') {
            continue;
        }
        record[key] = value;
    }

    try {
        showLoading();

        const method = record.id ? 'PUT' : 'POST';
        const response = await fetch('/.netlify/functions/airtable-filter', {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(record)
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Airtable API error:', errorData);
            if (errorData.details) {
                console.error('Error details:', errorData.details);
            }
            throw new Error(errorData.error || errorData.message || 'Failed to save record');
        }

        closeEditModal();
        await loadAllData();
        updateAllStatistics();
        updateRecordCount();
        showToast(record.id ? 'Record updated successfully' : 'Record created successfully', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error saving record:', error);
        showToast(`Error: ${error.message}`, 'error');
        hideLoading();
    }
}

async function deleteRecord(record) {
    if (!confirm(`Delete record for "${record.Name}"?`)) {
        return;
    }

    try {
        showLoading();

        const response = await fetch('/.netlify/functions/airtable-filter', {
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
        updateRecordCount();
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
    link.setAttribute('download', `k-beauty-panel-filtered-${new Date().toISOString().split('T')[0]}.csv`);
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
            const records = results.data.filter(row => row.email || row['이메일']); // Filter out empty rows

            if (confirm(`Import ${records.length} records?`)) {
                showLoading();

                try {
                    // Transform records to match our field structure
                    const transformedRecords = records.map(row => transformRecord(row));

                    // Note: You'll need to implement a bulk import endpoint
                    const response = await fetch('/.netlify/functions/airtable-filter-bulk', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ records: transformedRecords })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to import records');
                    }

                    await loadAllData();
                    updateAllStatistics();
                    updateRecordCount();
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
    document.getElementById('filteredCount').textContent = filteredData.length;
    document.getElementById('totalDataCount').textContent = allData.length;
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
        info: 'linear-gradient(to right, #f59e0b, #d97706)',
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