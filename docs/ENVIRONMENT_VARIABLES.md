# Environment Variables Configuration

## Required Environment Variables

### Airtable Configuration
| Variable Name | Description | Example | Required |
|--------------|-------------|---------|----------|
| `Airtable_API_Key` | Airtable Personal Access Token or API Key | `patXXXXXXXXXXXXXX` | Yes |
| `Airtable_Base_ID` | Airtable Base ID | `appXXXXXXXXXXXX` | Yes |
| `Airtable_MetrixTable_ID` | Original Metrix Table ID | `tbldYyFJUCL6O73eA` | No |
| `AIRTABLE_TABLE_NAME` | Management Panel Table Name | `ManagementPanel` | Yes |

### Google Sheets Configuration (Optional)
| Variable Name | Description | Example | Required |
|--------------|-------------|---------|----------|
| `GOOGLE_SHEETS_ID` | Google Sheets Document ID | `1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY` | No |
| `GOOGLE_SHEETS_SEOUL_GID` | Seoul Tab GID | `448929090` | No |
| `GOOGLE_SHEETS_SUWON_GID` | Suwon Tab GID | `123456789` | No |

## Setting Environment Variables

### 1. Netlify Dashboard (Production)

1. Navigate to your Netlify site dashboard
2. Go to **Site configuration** → **Environment variables**
3. Click **Add a variable**
4. For each variable:
   - Key: Enter the variable name exactly as shown
   - Values: Enter your actual values
   - Scopes: Select "Production" and "Deploy Previews"
5. Click **Save**

Example:
```
Key: Airtable_API_Key
Value: patABCDEF123456789
Scopes: ☑ Production ☑ Deploy Previews ☐ Local development
```

### 2. Local Development (.env file)

Create a `.env` file in the project root:

```bash
# Airtable Configuration
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=ManagementPanel

# Legacy naming (for backward compatibility)
Airtable_API_Key=patXXXXXXXXXXXXXX
Airtable_Base_ID=appXXXXXXXXXXXX
Airtable_MetrixTable_ID=tbldYyFJUCL6O73eA

# Google Sheets (Optional)
GOOGLE_SHEETS_ID=1qFgOUfID-6aB_yONfHNskNToMNn4xqU3lEQW8RaLhbY
GOOGLE_SHEETS_SEOUL_GID=448929090
GOOGLE_SHEETS_SUWON_GID=123456789
```

### 3. Command Line (Temporary)

For testing scripts:

```bash
# Linux/Mac
export AIRTABLE_API_KEY="patXXXXXXXXXXXXXX"
export AIRTABLE_BASE_ID="appXXXXXXXXXXXX"
export AIRTABLE_TABLE_NAME="ManagementPanel"

# Windows (Command Prompt)
set AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
set AIRTABLE_BASE_ID=appXXXXXXXXXXXX
set AIRTABLE_TABLE_NAME=ManagementPanel

# Windows (PowerShell)
$env:AIRTABLE_API_KEY="patXXXXXXXXXXXXXX"
$env:AIRTABLE_BASE_ID="appXXXXXXXXXXXX"
$env:AIRTABLE_TABLE_NAME="ManagementPanel"
```

## Getting Your API Credentials

### Airtable API Key

#### Option 1: Personal Access Token (Recommended)
1. Go to https://airtable.com/create/tokens
2. Click **"Create new token"**
3. Token name: `K-Beauty Management`
4. Scopes to add:
   - `data.records:read` - Read records
   - `data.records:write` - Write records
   - `schema.bases:read` - Read base schema
5. Access: Add your specific base
6. Click **"Create token"**
7. Copy the token (starts with `pat`)

#### Option 2: Legacy API Key
1. Go to https://airtable.com/account
2. Scroll to **"API"** section
3. Click **"Generate API key"** if not already generated
4. Copy the key

### Airtable Base ID
1. Go to https://airtable.com and open your base
2. Look at the URL: `https://airtable.com/appXXXXXXXXXXXX/tblYYYYYYYYY`
3. The Base ID is the part starting with `app` (e.g., `appABC123DEF456`)

### Airtable Table ID
1. In your base, click on the table
2. Look at the URL: `https://airtable.com/appXXXXXX/tblYYYYYYYYY/viwZZZZZZ`
3. The Table ID is the part starting with `tbl` (e.g., `tblDEF456GHI789`)

## Security Best Practices

### DO's ✅
- Use Personal Access Tokens instead of API Keys
- Limit token scopes to minimum required
- Rotate tokens regularly (every 90 days)
- Use different tokens for dev/staging/production
- Store tokens in environment variables, never in code
- Add `.env` to `.gitignore`

### DON'Ts ❌
- Never commit API keys to Git
- Don't share tokens in documentation or issues
- Don't use the same token across multiple projects
- Don't expose tokens in client-side code
- Don't log tokens in console output

## Verification

### Test Airtable Connection
```bash
curl "https://api.airtable.com/v0/YOUR_BASE_ID/ManagementPanel?maxRecords=1" \
  -H "Authorization: Bearer YOUR_API_KEY"
```

Expected response:
```json
{
  "records": [...],
  "offset": "..."
}
```

### Test Netlify Function Locally
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Run local development server
netlify dev

# Test the function
curl http://localhost:8888/.netlify/functions/management-api
```

## Troubleshooting

### Common Issues

#### "Invalid API Key"
- Check that the key is copied correctly (no extra spaces)
- Verify the key hasn't expired
- Ensure you're using the correct format (`Bearer` prefix for tokens)

#### "Base not found"
- Verify the Base ID is correct
- Check that the token has access to the base
- Ensure the base hasn't been deleted

#### "Table not found"
- Check table name spelling (case-sensitive)
- Verify the table exists in the base
- Use the table ID instead of name if issues persist

#### Environment variables not loading
- Restart Netlify dev server after changes
- Check `.env` file is in project root
- Verify no typos in variable names
- Check file encoding is UTF-8

## Environment Variable Naming Conventions

### Pattern
- Uppercase with underscores: `AIRTABLE_API_KEY`
- Service prefix: `AIRTABLE_`, `GOOGLE_`, etc.
- Descriptive suffix: `_API_KEY`, `_BASE_ID`, etc.

### Legacy Support
Some functions use older naming:
- `Airtable_API_Key` (Pascal_Snake_Case)
- Both formats should be set for compatibility

## Required for Each Component

### admin.html / admin.js
- `Airtable_API_Key`
- `Airtable_Base_ID`
- `Airtable_MetrixTable_ID`

### management.html / management.js
- Uses Netlify Functions (no direct env vars needed)

### Python Scripts
- `AIRTABLE_API_KEY`
- `AIRTABLE_BASE_ID`
- `AIRTABLE_TABLE_NAME`

### Netlify Functions
- `Airtable_API_Key`
- `Airtable_Base_ID`