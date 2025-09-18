// Airtable Service Module
class AirtableService {
    constructor(config) {
        this.config = config;
        this.records = [];
    }

    // Airtable에서 모든 레코드 가져오기
    async fetchAllRecords(offset = null) {
        try {
            // 첫 호출 시 records 배열 초기화
            if (!offset) {
                this.records = [];
                console.log('Fetching all records from Airtable...');
            }

            let url = this.config.apiUrl;
            const params = new URLSearchParams();

            if (this.config.viewName) {
                params.append('view', this.config.viewName);
            }
            if (offset) {
                params.append('offset', offset);
            }
            params.append('pageSize', '100');

            if (params.toString()) {
                url += '?' + params.toString();
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            this.records = this.records.concat(data.records);

            console.log(`Fetched ${data.records.length} records, total so far: ${this.records.length}`);

            // 페이지네이션 처리 - offset이 있으면 계속 가져오기
            if (data.offset) {
                console.log(`More records available, fetching next page...`);
                await this.fetchAllRecords(data.offset);
            } else {
                console.log(`All records fetched. Total: ${this.records.length}`);
            }

            return this.records;
        } catch (error) {
            console.error('Error fetching records from Airtable:', error);
            throw error;
        }
    }

    // 레코드를 로컬 데이터 형식으로 변환
    transformRecordToLocal(airtableRecord) {
        const fields = airtableRecord.fields;
        const localData = {};

        // 기본 필드 설정
        localData.airtableId = airtableRecord.id;

        // 필드 매핑
        for (const [airtableField, localField] of Object.entries(FIELD_MAPPING)) {
            if (fields[airtableField] !== undefined) {
                localData[localField] = fields[airtableField];
            }
        }

        // 상태 변환
        if (fields['Status']) {
            localData['상태'] = REVERSE_STATUS_MAPPING[fields['Status']] || fields['Status'];
        }

        return localData;
    }

    // 로컬 데이터를 Airtable 형식으로 변환
    transformLocalToAirtable(localData) {
        const fields = {};

        // 역방향 필드 매핑
        for (const [airtableField, localField] of Object.entries(FIELD_MAPPING)) {
            if (localData[localField] !== undefined && localData[localField] !== null && localData[localField] !== '') {
                fields[airtableField] = localData[localField];
            }
        }

        // 상태 변환
        if (localData['상태']) {
            fields['Status'] = STATUS_MAPPING[localData['상태']] || localData['상태'];
        }

        return { fields };
    }

    // 단일 레코드 생성
    async createRecord(data) {
        try {
            const airtableData = this.transformLocalToAirtable(data);

            const response = await fetch(this.config.apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(airtableData)
            });

            if (!response.ok) {
                throw new Error(`Failed to create record: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error creating record:', error);
            throw error;
        }
    }

    // 단일 레코드 업데이트
    async updateRecord(recordId, data) {
        try {
            const airtableData = this.transformLocalToAirtable(data);
            const url = `${this.config.apiUrl}/${recordId}`;

            const response = await fetch(url, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(airtableData)
            });

            if (!response.ok) {
                throw new Error(`Failed to update record: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating record:', error);
            throw error;
        }
    }

    // 여러 레코드 일괄 업데이트 (최대 10개씩)
    async batchUpdate(updates) {
        try {
            const chunks = [];
            for (let i = 0; i < updates.length; i += 10) {
                chunks.push(updates.slice(i, i + 10));
            }

            const results = [];
            for (const chunk of chunks) {
                const records = chunk.map(update => ({
                    id: update.id,
                    fields: this.transformLocalToAirtable(update.data).fields
                }));

                const response = await fetch(this.config.apiUrl, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ records })
                });

                if (!response.ok) {
                    throw new Error(`Failed to batch update: ${response.status}`);
                }

                const result = await response.json();
                results.push(...result.records);
            }

            return results;
        } catch (error) {
            console.error('Error in batch update:', error);
            throw error;
        }
    }

    // 레코드 삭제
    async deleteRecord(recordId) {
        try {
            const url = `${this.config.apiUrl}/${recordId}`;

            const response = await fetch(url, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to delete record: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error deleting record:', error);
            throw error;
        }
    }

    // 필터링된 레코드 가져오기
    async fetchFilteredRecords(filterFormula) {
        try {
            const params = new URLSearchParams();
            params.append('filterByFormula', filterFormula);
            if (this.config.viewName) {
                params.append('view', this.config.viewName);
            }

            const url = `${this.config.apiUrl}?${params.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${this.config.apiKey}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch filtered records: ${response.status}`);
            }

            const data = await response.json();
            return data.records.map(record => this.transformRecordToLocal(record));
        } catch (error) {
            console.error('Error fetching filtered records:', error);
            throw error;
        }
    }

    // CSV 데이터를 Airtable로 가져오기
    async importFromCSV(csvData) {
        try {
            const records = [];
            const chunkSize = 10;

            // CSV 데이터를 Airtable 형식으로 변환
            for (const row of csvData) {
                const airtableData = this.transformLocalToAirtable(row);
                records.push(airtableData);
            }

            // 10개씩 나누어 업로드
            const results = [];
            for (let i = 0; i < records.length; i += chunkSize) {
                const chunk = records.slice(i, i + chunkSize);

                const response = await fetch(this.config.apiUrl, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.config.apiKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ records: chunk })
                });

                if (!response.ok) {
                    throw new Error(`Failed to import records: ${response.status}`);
                }

                const result = await response.json();
                results.push(...result.records);

                // Progress callback
                if (this.onProgress) {
                    this.onProgress(Math.min(100, Math.round((i + chunkSize) / records.length * 100)));
                }
            }

            return results;
        } catch (error) {
            console.error('Error importing CSV to Airtable:', error);
            throw error;
        }
    }

    // 실시간 동기화를 위한 웹소켓 연결 (Airtable은 직접 지원하지 않으므로 폴링 방식)
    startPolling(interval = 30000, callback) {
        this.pollingInterval = setInterval(async () => {
            try {
                const records = await this.fetchAllRecords();
                const transformedRecords = records.map(record => this.transformRecordToLocal(record));
                callback(transformedRecords);
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, interval);
    }

    // 폴링 중지
    stopPolling() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }
}