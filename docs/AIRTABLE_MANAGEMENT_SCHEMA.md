# Airtable Management Panel Schema

## Table: ManagementPanel

### Table Configuration
- **Base Name**: K-Beauty Management System
- **Table ID**: ManagementPanel
- **Primary Field**: uid
- **Description**: Integrated management table for Seoul and Suwon participant data

## Field Definitions

### Primary Fields

| Field Name | Field Type | Required | Description | Validation |
|------------|------------|----------|-------------|------------|
| uid | Single line text | Yes | Unique identifier (Primary Key) | Unique, Not empty |
| name | Single line text | Yes | Participant name | Not empty |
| email | Email | Yes | Email address | Valid email format |
| phone | Phone number | Yes | Contact number | Format: 010-XXXX-XXXX |

### Personal Information

| Field Name | Field Type | Required | Description | Options/Format |
|------------|------------|----------|-------------|----------------|
| gender | Single select | No | Gender | Male, Female |
| birth_date | Date | No | Date of birth | YYYY-MM-DD |
| nationality | Single line text | No | Nationality | Free text |
| residence_area | Single line text | No | Residence area | Free text |

### Reservation Details

| Field Name | Field Type | Required | Description | Options/Format |
|------------|------------|----------|-------------|----------------|
| reservation_date | Date | Yes | Reservation date (Sort Key 1) | YYYY-MM-DD |
| reservation_time_slot | Single select | Yes | Time slot (Sort Key 2) | 09:00-10:00, 10:00-11:00, etc. |
| actual_reservation_time | Time | No | Actual reservation time | HH:MM:SS |
| reservation_location | Single select | Yes | Location | Seoul, Suwon |
| reservation_status | Single select | No | Reservation status | Confirmed, Pending, Cancelled |

### Participation Management

| Field Name | Field Type | Required | Description | Options |
|------------|------------|----------|-------------|---------|
| participation_result | Single select | Yes | Participation result (Key Output) | participated, not_participated, pending, cancelled |
| participation_date | Date | No | Actual participation date | YYYY-MM-DD |
| participation_time | Time | No | Actual participation time | HH:MM:SS |
| confirmation_status | Single select | No | Confirmation status | confirmed, not_confirmed, pending |
| participation_notes | Long text | No | Notes about participation | Free text |

### Matching Information

| Field Name | Field Type | Required | Description | Format/Range |
|------------|------------|----------|-------------|--------------|
| matching_key | Single line text | No | MetrixTable2 matching key | Auto-generated |
| matching_type | Single select | No | Type of matching | exact, email, phone, none |
| matching_confidence | Number | No | Matching confidence score | 0-100 |
| matching_date | Date | No | Date of matching | YYYY-MM-DD |

### System Fields

| Field Name | Field Type | Required | Description | Auto-managed |
|------------|------------|----------|-------------|--------------|
| data_source | Single select | Yes | Data source | Seoul, Suwon |
| created_at | Created time | Auto | Record creation time | Yes |
| updated_at | Last modified time | Auto | Last modification time | Yes |
| processing_status | Single select | No | Processing status | imported, processed, verified, error |
| sync_date | Date & time | No | Last sync timestamp | YYYY-MM-DD HH:MM:SS |
| record_id | Autonumber | Auto | Sequential record ID | Yes |

## Views Configuration

### 1. All Records (Default)
- **Name**: `All Records`
- **Type**: Grid view
- **Sort**:
  1. reservation_date (ASC)
  2. reservation_time_slot (ASC)
  3. uid (ASC)
- **Fields**: All fields visible

### 2. Seoul Management
- **Name**: `Seoul Management`
- **Type**: Grid view
- **Filter**: `data_source = "Seoul"`
- **Sort**: Same as default
- **Highlight**: Participation result status colors

### 3. Suwon Management
- **Name**: `Suwon Management`
- **Type**: Grid view
- **Filter**: `data_source = "Suwon"`
- **Sort**: Same as default
- **Highlight**: Participation result status colors

### 4. Today's Reservations
- **Name**: `Today`
- **Type**: Grid view
- **Filter**: `reservation_date = TODAY()`
- **Sort**: reservation_time_slot (ASC)
- **Fields**: Essential fields only

### 5. Participation Status
- **Name**: `Participation Status`
- **Type**: Kanban
- **Group by**: `participation_result`
- **Sort**: reservation_date (DESC)
- **Cards**: Show name, phone, location, date

### 6. Pending Review
- **Name**: `Pending Review`
- **Type**: Grid view
- **Filter**: `participation_result = "pending"`
- **Sort**: reservation_date (ASC)
- **Color**: Yellow highlight

### 7. Analytics View
- **Name**: `Analytics`
- **Type**: Gallery view
- **Group by**: `reservation_location`
- **Summary fields**: Count by participation_result

## Formulas

### 1. Days Until Reservation
```
IF(
  reservation_date,
  DATETIME_DIFF(reservation_date, TODAY(), 'days'),
  BLANK()
)
```

### 2. Full Name Display
```
CONCATENATE(
  name,
  " (",
  IF(gender = "Male", "M", "F"),
  ")"
)
```

### 3. Participation Rate
```
IF(
  participation_result = "participated",
  "✅",
  IF(
    participation_result = "not_participated",
    "❌",
    "⏳"
  )
)
```

## Automation Rules

### 1. Auto-update sync_date
- **Trigger**: When record is updated
- **Action**: Update sync_date to NOW()

### 2. Send notification for pending
- **Trigger**: When participation_result = "pending" for > 24 hours
- **Action**: Create notification record

### 3. Archive old records
- **Trigger**: When reservation_date < TODAY() - 90
- **Action**: Move to Archive table

## API Integration

### Endpoints
- **Base URL**: `https://api.airtable.com/v0/{BASE_ID}/ManagementPanel`
- **Authentication**: Bearer token

### Rate Limits
- 5 requests per second
- 100 records per request (pagination)

### Required Permissions
- `data.records:read`
- `data.records:write`
- `schema.bases:read`

## Data Validation Rules

### 1. UID Uniqueness
- No duplicate UIDs allowed
- Format: Email-based or system-generated

### 2. Date Consistency
- participation_date >= reservation_date
- reservation_date >= TODAY() for new records

### 3. Phone Number Format
- Must match: 010-XXXX-XXXX
- Auto-format on input

### 4. Email Validation
- Valid email format required
- Lowercase conversion on save

## Integration with MetrixTable2

### Matching Process
1. Match by UID (exact match)
2. Match by email (case-insensitive)
3. Match by phone (normalized format)
4. Calculate confidence score

### Data Sync
- Bidirectional sync every 15 minutes
- Conflict resolution: Latest updated_at wins
- Log all sync operations

## Performance Optimization

### Indexing
- Primary index: uid
- Secondary indices:
  - reservation_date
  - email
  - phone
  - participation_result

### Caching Strategy
- Cache frequently accessed views
- Refresh cache on data modification
- TTL: 5 minutes for list views

## Security & Access Control

### Roles
1. **Admin**: Full access
2. **Manager**: Read/Write (no delete)
3. **Viewer**: Read-only

### Field-level Permissions
- System fields: Read-only for all roles
- Personal info: Restricted to Admin/Manager
- Public fields: Accessible to all

## Backup & Recovery

### Backup Schedule
- Daily automated backups at 02:00 KST
- Weekly full export to CSV
- Monthly archive to cold storage

### Recovery Process
1. Identify corruption/loss
2. Restore from latest backup
3. Apply transaction log
4. Verify data integrity