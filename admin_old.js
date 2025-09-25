// Airtable Configuration from environment variables
const AIRTABLE_CONFIG = {
    baseId: null,
    tableId: 'tbldYyFJUCL6O73eA',  // Fixed table ID as provided
    apiKey: null
};

// Global variables
let table = null;
let allData = [];
let filteredData = [];

// Field definitions for the form
const FIELD_DEFINITIONS = [
    { field: 'UID', title: 'UID', type: 'text', required: true, editable: true },
    { field: 'name', title: '이름', type: 'text', required: true, editable: true },
    { field: 'email', title: '이메일', type: 'email', required: true, editable: true },
    { field: 'phone', title: '전화번호', type: 'tel', required: true, editable: true },
    { field: 'gender', title: '성별', type: 'select', options: ['Female', 'Male'], editable: true },
    { field: 'birth_year', title: '생년월일', type: 'date', editable: true },
    { field: 'nationality', title: '국적', type: 'text', editable: true },
    { field: 'culture_region', title: '문화권', type: 'text', editable: true },
    { field: 'ethnicity', title: '인종', type: 'text', editable: true },
    { field: 'visa_type', title: '비자 유형', type: 'text', editable: true },
    { field: 'reservation_location', title: '예약 위치', type: 'select',
      options: ['서울(Seoul)', '수원(Suwon)', 'cancel', '취소'], editable: true },
    { field: 'reservation_date', title: '예약 날짜', type: 'date', editable: true },
    { field: 'reservation_time', title: '예약 시간', type: 'time', editable: true },
    { field: 'participation_result', title: '참여 결과', type: 'select',
      options: ['참여', '불참', '보류', '취소'], editable: true },
    { field: 'confirmation_status', title: '확정 여부', type: 'select',
      options: ['o', 'x', 'pending'], editable: true },
    { field: 'application_date', title: '신청일자', type: 'date', editable: true },
    { field: 'famigo_match_key', title: 'Famigo 매칭키', type: 'text', editable: false },
    { field: 'match_type', title: '매칭 타입', type: 'select',
      options: ['완전매칭', '이메일매칭', '전화번호매칭', '미매칭'], editable: true },
    { field: 'match_confidence', title: '매칭 신뢰도', type: 'number', editable: false },
    { field: 'notes', title: '비고', type: 'textarea', editable: true }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await initializeApp();
});

async function initializeApp() {
    try {
        showLoading();

        // Get environment variables from Netlify Functions
        await getEnvironmentConfig();

        // Initialize Tabulator table
        initializeTable();

        // Load data from Airtable
        await loadData();

        // Set up event listeners
        setupEventListeners();

        // Update stats
        updateStats();

        hideLoading();
    } catch (error) {
        console.error('Initialization error:', error);
        showToast('초기화 중 오류가 발생했습니다', 'error');
        hideLoading();
    }
}

async function getEnvironmentConfig() {
    try {
        const response = await fetch('/.netlify/functions/getConfig');
        const config = await response.json();

        AIRTABLE_CONFIG.baseId = config.baseId;
        AIRTABLE_CONFIG.apiKey = config.apiKey;
    } catch (error) {
        console.error('Failed to get config:', error);
        // Try to use localhost for development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Using development mode - manual config required');
        }
    }
}

function initializeTable() {
    table = new Tabulator("#dataTable", {
        data: [],
        layout: "fitDataFill",
        height: "600px",
        virtualDom: true,
        movableColumns: true,
        resizableColumns: true,
        selectable: true,
        columns: [
            {
                formatter: "rowSelection",
                titleFormatter: "rowSelection",
                width: 40,
                headerSort: false,
                cellClick: function(e, cell) {
                    cell.getRow().toggleSelect();
                }
            },
            {
                title: "작업",
                width: 100,
                formatter: function(cell) {
                    return `
                        <button class="edit-btn bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs mr-1">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="delete-btn bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-xs">
                            <i class="fas fa-trash"></i>
                        </button>
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
            { title: "이름", field: "name", width: 150, headerFilter: "input" },
            { title: "이메일", field: "email", width: 200, headerFilter: "input" },
            { title: "전화번호", field: "phone", width: 130, headerFilter: "input" },
            { title: "성별", field: "gender", width: 80, headerFilter: "select",
              headerFilterParams: {values: {"": "전체", "Female": "Female", "Male": "Male"}} },
            { title: "생년월일", field: "birth_year", width: 120 },
            { title: "국적", field: "nationality", width: 100, headerFilter: "input" },
            { title: "예약 위치", field: "reservation_location", width: 120, headerFilter: "input" },
            { title: "예약 날짜", field: "reservation_date", width: 120, sorter: "date" },
            { title: "예약 시간", field: "reservation_time", width: 100 },
            { title: "참여 결과", field: "participation_result", width: 100,
              headerFilter: "select", headerFilterParams: {values: {"": "전체", "참여": "참여", "불참": "불참", "보류": "보류", "취소": "취소"}},
              formatter: function(cell) {
                  const value = cell.getValue();
                  let color = "gray";
                  if (value === "참여") color = "green";
                  else if (value === "불참") color = "red";
                  else if (value === "보류") color = "yellow";
                  else if (value === "취소") color = "orange";

                  return `<span class="px-2 py-1 rounded text-xs bg-${color}-600">${value || '-'}</span>`;
              }
            },
            { title: "확정", field: "confirmation_status", width: 80 },
            { title: "매칭 타입", field: "match_type", width: 120 },
            { title: "신뢰도", field: "match_confidence", width: 80 },
            { title: "비고", field: "notes", width: 200 }
        ]
    });
}

async function loadData() {
    try {
        const response = await fetch('/.netlify/functions/airtable', {
            method: 'GET'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data');
        }

        const data = await response.json();
        allData = data.records || [];
        filteredData = [...allData];

        table.setData(filteredData);
        updateRecordCount();
        updateStats();

        document.getElementById('lastSync').textContent = `마지막 동기화: ${new Date().toLocaleString('ko-KR')}`;
    } catch (error) {
        console.error('Error loading data:', error);
        showToast('데이터 로드 실패', 'error');
    }
}

function setupEventListeners() {
    // Search button
    document.getElementById('searchBtn').addEventListener('click', performSearch);

    // Clear button
    document.getElementById('clearBtn').addEventListener('click', clearSearch);

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        showLoading();
        await loadData();
        hideLoading();
        showToast('데이터를 새로고침했습니다', 'success');
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
    showToast(`${filteredData.length}개의 레코드를 찾았습니다`, 'info');
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
        label.className = 'block text-sm text-gray-400 mb-1';
        label.textContent = fieldDef.title;
        if (fieldDef.required) {
            label.innerHTML += ' <span class="text-red-500">*</span>';
        }

        let input;
        if (fieldDef.type === 'select') {
            input = document.createElement('select');
            const emptyOption = document.createElement('option');
            emptyOption.value = '';
            emptyOption.textContent = '선택...';
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
        input.className = 'w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none';

        if (fieldDef.required) {
            input.required = true;
        }

        if (!fieldDef.editable && record.id) {
            input.disabled = true;
            input.className += ' opacity-50 cursor-not-allowed';
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
    buttonDiv.className = 'mt-6 flex justify-end space-x-2';
    buttonDiv.innerHTML = `
        <button type="button" onclick="closeEditModal()"
                class="bg-gray-600 hover:bg-gray-700 px-4 py-2 rounded transition">
            취소
        </button>
        <button type="submit"
                class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded transition">
            ${record.id ? '수정' : '추가'}
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
        await loadData();
        showToast(record.id ? '레코드가 수정되었습니다' : '레코드가 추가되었습니다', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error saving record:', error);
        showToast('저장 중 오류가 발생했습니다', 'error');
        hideLoading();
    }
}

async function deleteRecord(record) {
    if (!confirm(`정말로 "${record.name}"님의 레코드를 삭제하시겠습니까?`)) {
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

        await loadData();
        showToast('레코드가 삭제되었습니다', 'success');
        hideLoading();
    } catch (error) {
        console.error('Error deleting record:', error);
        showToast('삭제 중 오류가 발생했습니다', 'error');
        hideLoading();
    }
}

function exportToCSV() {
    const csv = Papa.unparse(filteredData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `k-beauty-panel-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('CSV 파일이 다운로드되었습니다', 'success');
}

async function handleFileImport(e) {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
        header: true,
        complete: async function(results) {
            const records = results.data.filter(row => row.UID); // Filter out empty rows

            if (confirm(`${records.length}개의 레코드를 업로드하시겠습니까?`)) {
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

                    await loadData();
                    showToast(`${records.length}개의 레코드가 업로드되었습니다`, 'success');
                } catch (error) {
                    console.error('Error importing records:', error);
                    showToast('업로드 중 오류가 발생했습니다', 'error');
                } finally {
                    hideLoading();
                    e.target.value = ''; // Reset file input
                }
            }
        },
        error: function(error) {
            console.error('Error parsing CSV:', error);
            showToast('CSV 파일 읽기 실패', 'error');
        }
    });
}

function updateRecordCount() {
    document.getElementById('recordCount').textContent = `${filteredData.length} / ${allData.length} 레코드`;
}

function updateStats() {
    const stats = {
        total: allData.length,
        participated: allData.filter(r => r.participation_result === '참여').length,
        notParticipated: allData.filter(r => r.participation_result === '불참').length,
        other: allData.filter(r => r.participation_result && r.participation_result !== '참여' && r.participation_result !== '불참').length
    };

    document.getElementById('totalRecords').textContent = stats.total;
    document.getElementById('participatedCount').textContent = stats.participated;
    document.getElementById('notParticipatedCount').textContent = stats.notParticipated;
    document.getElementById('otherCount').textContent = stats.other;
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
        }
    }).showToast();
}