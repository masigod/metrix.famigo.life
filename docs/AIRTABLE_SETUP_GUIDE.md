# Airtable Setup Guide for Management Panel

## 📋 Prerequisites

1. Airtable account (https://airtable.com)
2. API Key or Personal Access Token
3. Workspace with appropriate permissions

## 🗂 Step 1: Create Base

1. Log in to Airtable
2. Click "Add a base" → "Start from scratch"
3. Name it: **"K-Beauty Management System"**
4. Note the Base ID from URL: `https://airtable.com/appXXXXXXXXXXXX`

## 📊 Step 2: Create Table

Create a table named **"ManagementPanel"** with the following structure:

### Table Fields Configuration

| Field Name | Field Type | Configuration | Required |
|------------|------------|---------------|----------|
| **uid** | Single line text | Primary field | Yes |
| **name** | Single line text | | Yes |
| **email** | Email | | Yes |
| **phone** | Phone number | Format: (000) 000-0000 | Yes |
| **gender** | Single select | Options: Male, Female | No |
| **birth_date** | Date | Date format: Local, Include time: No | No |
| **nationality** | Single line text | | No |
| **residence_area** | Single line text | | No |
| **reservation_date** | Date | Date format: ISO (YYYY-MM-DD) | Yes |
| **reservation_time_slot** | Single select | Options: See below* | Yes |
| **actual_reservation_time** | Single line text | Format: HH:MM:SS | No |
| **reservation_location** | Single select | Options: Seoul, Suwon | Yes |
| **reservation_status** | Single select | Options: Confirmed, Pending, Cancelled | No |
| **participation_result** | Single select | Options: participated, not_participated, pending, cancelled | Yes |
| **participation_date** | Date | Date format: ISO | No |
| **participation_time** | Single line text | Format: HH:MM:SS | No |
| **confirmation_status** | Single select | Options: confirmed, not_confirmed, pending | No |
| **participation_notes** | Long text | Rich text formatting: No | No |
| **matching_key** | Single line text | | No |
| **matching_type** | Single select | Options: exact, email, phone, none | No |
| **matching_confidence** | Number | Format: Integer, Precision: 0 | No |
| **data_source** | Single select | Options: Seoul, Suwon, 서울, 수원 | Yes |
| **sync_timestamp** | Single line text | | No |
| **processing_status** | Single select | Options: imported, processed, verified, error | No |
| **sync_date** | Date | Include time: Yes | No |

### *Time Slot Options
```
09:00-10:00
10:00-11:00
11:00-12:00
12:00-13:00
13:00-14:00
14:00-15:00
15:00-16:00
16:00-17:00
17:00-18:00
18:00-19:00
19:00-20:00
20:00-21:00
```

## 👁 Step 3: Create Views

### 1. All Records (Grid view)
- **Name**: All Records
- **Type**: Grid
- **Sort**:
  1. reservation_date (A → Z)
  2. reservation_time_slot (A → Z)
- **Fields**: Show all

### 2. Seoul Management (Grid view)
- **Name**: Seoul Management
- **Type**: Grid
- **Filter**: Where `data_source` contains "Seoul" OR contains "서울"
- **Sort**: Same as All Records
- **Color**: Records where `participation_result` = "participated" → Green

### 3. Suwon Management (Grid view)
- **Name**: Suwon Management
- **Type**: Grid
- **Filter**: Where `data_source` contains "Suwon" OR contains "수원"
- **Sort**: Same as All Records
- **Color**: Records where `participation_result` = "participated" → Green

### 4. Today (Grid view)
- **Name**: Today
- **Type**: Grid
- **Filter**: Where `reservation_date` is today
- **Sort**: reservation_time_slot (A → Z)
- **Fields**: uid, name, phone, reservation_time_slot, participation_result

### 5. Pending Review (Grid view)
- **Name**: Pending Review
- **Type**: Grid
- **Filter**: Where `participation_result` = "pending"
- **Sort**: reservation_date (A → Z)
- **Color**: All records → Yellow

### 6. Participation Status (Kanban view)
- **Name**: Participation Status
- **Type**: Kanban
- **Stack by**: participation_result
- **Card preview**: name, phone, reservation_date, reservation_location

### 7. Analytics (Gallery view)
- **Name**: Analytics
- **Type**: Gallery
- **Card preview fields**: name, participation_result, reservation_location
- **Cover field**: None
- **Group by**: reservation_location

## 🔑 Step 4: Get API Credentials

### Option A: Personal Access Token (Recommended)
1. Go to https://airtable.com/create/tokens
2. Click "Create token"
3. Name: "K-Beauty Management"
4. Scopes:
   - `data.records:read`
   - `data.records:write`
   - `schema.bases:read`
5. Access: Select your base
6. Copy the token

### Option B: API Key (Legacy)
1. Go to https://airtable.com/account
2. Find "API" section
3. Copy your API key

## 📝 Step 5: Configure Environment Variables

### For Netlify Deployment:
1. Go to Netlify dashboard
2. Site settings → Environment variables
3. Add:
   ```
   Airtable_API_Key = your_token_here
   Airtable_Base_ID = appXXXXXXXXXXXX
   Airtable_ManagementPanel_ID = ManagementPanel
   ```

### For Local Development:
Create `.env` file:
```bash
AIRTABLE_API_KEY=your_token_here
AIRTABLE_BASE_ID=appXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=ManagementPanel
```

## 🚀 Step 6: Initial Data Import

### Using the Python Script:
```bash
cd /Users/lua/Metrix/scripts

# Configure Airtable
export AIRTABLE_API_KEY="your_token_here"
export AIRTABLE_BASE_ID="appXXXXXXXXXXXX"
export AIRTABLE_TABLE_NAME="ManagementPanel"

# Run initial sync
./run_full_sync.sh
```

### Manual Import via Airtable UI:
1. Prepare CSV file with matching column names
2. In Airtable: Tools → Import data → CSV file
3. Map fields carefully
4. Import

## ✅ Step 7: Verify Setup

1. Check that views are working correctly
2. Test sorting and filtering
3. Verify API access:
   ```bash
   curl "https://api.airtable.com/v0/YOUR_BASE_ID/ManagementPanel?maxRecords=3" \
     -H "Authorization: Bearer YOUR_API_KEY"
   ```

## 🔄 Step 8: Enable Automations (Optional)

### Daily Backup Automation:
1. Go to Automations tab
2. Create automation:
   - Trigger: At scheduled time (daily at 2 AM)
   - Action: Send email with CSV export

### Sync Notification:
1. Create automation:
   - Trigger: When record matches conditions (sync_date is today)
   - Action: Send webhook to monitoring service

## 📌 Important Notes

1. **Rate Limits**: 5 requests/second per base
2. **Record Limits**: 50,000 records per base (Free plan)
3. **API Limits**: 100 records per request
4. **Attachment Size**: Max 5GB per base
5. **Collaborators**: Varies by plan

## 🆘 Troubleshooting

### Common Issues:

1. **"Invalid permissions"**
   - Check token scopes
   - Verify base access

2. **"Table not found"**
   - Check table name (case-sensitive)
   - Verify Base ID

3. **"Rate limit exceeded"**
   - Implement delays between requests
   - Use batch operations

4. **"Invalid field type"**
   - Check field configuration matches schema
   - Verify data format

## 📚 Additional Resources

- [Airtable API Documentation](https://airtable.com/developers/web/api/introduction)
- [Field Types Reference](https://airtable.com/developers/web/api/field-model)
- [Rate Limits](https://airtable.com/developers/web/api/rate-limits)
- [Webhooks Guide](https://airtable.com/developers/web/guides/webhook-integrations)