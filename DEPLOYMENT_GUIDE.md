# K-Beauty Management Panel Deployment Guide

## 📋 Prerequisites

- [ ] GitHub account with repository
- [ ] Netlify account (free tier works)
- [ ] Airtable account with API access
- [ ] Google Sheets with data (optional for sync)

## 🚀 Quick Start

### Step 1: Airtable Setup
1. Follow [AIRTABLE_SETUP_GUIDE.md](docs/AIRTABLE_SETUP_GUIDE.md) to create your base and table
2. Get your API credentials:
   - API Key/Token
   - Base ID
   - Table Name (ManagementPanel)

### Step 2: Deploy to Netlify

#### Option A: One-Click Deploy (Recommended)
[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/YOUR_REPO)

#### Option B: Manual Deploy
1. Fork/Clone this repository
2. Connect to Netlify:
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli

   # Login to Netlify
   netlify login

   # Initialize site
   netlify init

   # Deploy
   netlify deploy --prod
   ```

### Step 3: Configure Environment Variables
1. Go to Netlify Dashboard → Site Settings → Environment Variables
2. Add required variables:
   ```
   Airtable_API_Key = your_token_here
   Airtable_Base_ID = appXXXXXXXXXXXX
   Airtable_ManagementPanel_ID = ManagementPanel
   ```
3. Deploy changes

### Step 4: Test Deployment
1. Visit your site: `https://your-site.netlify.app/management.html`
2. Check data loading
3. Test sync functionality

## 📝 Detailed Setup

### 1. Repository Setup

#### Clone Repository
```bash
git clone https://github.com/YOUR_USERNAME/metrix-management.git
cd metrix-management
```

#### Project Structure
```
metrix-management/
├── admin.html           # Original admin panel
├── management.html      # New management panel
├── *.js                # JavaScript files
├── netlify/
│   └── functions/      # Serverless functions
├── scripts/            # Python sync scripts
├── docs/              # Documentation
└── netlify.toml       # Netlify configuration
```

### 2. Airtable Configuration

#### Create Base and Table
1. Log in to Airtable
2. Create new base: "K-Beauty Management System"
3. Create table: "ManagementPanel"
4. Configure fields as per [schema](docs/AIRTABLE_MANAGEMENT_SCHEMA.md)

#### Get Credentials
1. Create Personal Access Token:
   - Go to https://airtable.com/create/tokens
   - Create token with required scopes
   - Copy token (starts with `pat`)

2. Get Base ID:
   - Open your base
   - URL contains: `appXXXXXXXXXXXX`

### 3. Local Development

#### Install Dependencies
```bash
# For Python scripts (optional)
pip install pandas requests python-dotenv

# For local Netlify development
npm install -g netlify-cli
```

#### Configure Local Environment
Create `.env` file:
```bash
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=ManagementPanel
```

#### Run Locally
```bash
# Start Netlify dev server
netlify dev

# Open in browser
# http://localhost:8888/management.html
```

### 4. Google Sheets Integration (Optional)

#### Manual Sync
1. Download CSV from Google Sheets:
   - Open sheet
   - File → Download → CSV
   - Save to `source/` directory

2. Run sync script:
   ```bash
   cd scripts
   python google_sheets_sync.py --force
   python airtable_sync.py
   ```

#### Automated Sync
1. Configure in `scripts/google_sheets_config.json`:
   ```json
   {
     "spreadsheet_id": "YOUR_SHEET_ID",
     "cache_ttl_minutes": 15,
     "auto_sync_interval_minutes": 30
   }
   ```

2. Run auto-sync:
   ```bash
   ./sync_scheduler.sh auto
   ```

### 5. Netlify Deployment

#### Connect GitHub Repository
1. Log in to Netlify
2. Click "New site from Git"
3. Choose GitHub
4. Select repository
5. Configure build settings:
   - Build command: (leave empty)
   - Publish directory: `.`

#### Configure Site
1. **Site Settings**:
   - Site name: `your-project-name`
   - Custom domain (optional)

2. **Environment Variables**:
   ```
   Airtable_API_Key = [your-token]
   Airtable_Base_ID = [your-base-id]
   Airtable_ManagementPanel_ID = ManagementPanel
   ```

3. **Functions**:
   - Directory: `netlify/functions`
   - Automatically deployed

#### Deploy
```bash
# Manual deploy
git push origin main

# Or use Netlify CLI
netlify deploy --prod
```

## 🔧 Configuration Files

### netlify.toml
```toml
[build]
  publish = "."

[functions]
  directory = "netlify/functions"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

### Package Files (Optional)
If using Node.js dependencies:

`package.json`:
```json
{
  "name": "k-beauty-management",
  "version": "1.0.0",
  "dependencies": {
    "node-fetch": "^2.6.7"
  }
}
```

## 📊 Data Flow

```
Google Sheets → CSV Export → Python Scripts → Airtable → Netlify Functions → Web UI
```

1. **Data Source**: Google Sheets (Seoul/Suwon tabs)
2. **Processing**: Python scripts normalize and deduplicate
3. **Storage**: Airtable database
4. **API**: Netlify Functions proxy
5. **Frontend**: management.html dashboard

## 🔒 Security Considerations

1. **API Keys**:
   - Never commit to Git
   - Use environment variables
   - Rotate regularly

2. **Access Control**:
   - Limit Airtable token scopes
   - Use read-only tokens where possible

3. **CORS**:
   - Configure appropriate origins
   - Use Netlify Functions as proxy

4. **Rate Limiting**:
   - Implement caching
   - Respect Airtable limits

## 🧪 Testing

### Test Checklist
- [ ] Airtable connection works
- [ ] Data loads in dashboard
- [ ] Filters work correctly
- [ ] Charts display properly
- [ ] Export CSV works
- [ ] Manual sync triggers
- [ ] Auto-sync runs (if configured)

### Test Commands
```bash
# Test Airtable connection
curl https://your-site.netlify.app/.netlify/functions/management-api

# Test local functions
netlify functions:serve

# Run Python tests
cd scripts
python -m pytest tests/
```

## 📈 Monitoring

### Netlify Analytics
- View in Netlify dashboard
- Monitor function execution
- Check error logs

### Airtable Monitoring
- Check API usage
- Monitor rate limits
- Review sync logs

### Custom Monitoring
```javascript
// Add to management.js
console.log('Data loaded:', records.length);
console.log('Last sync:', new Date().toISOString());
```

## 🐛 Troubleshooting

### Common Issues

#### "Failed to load data"
- Check Airtable credentials
- Verify environment variables
- Check browser console

#### "Sync not working"
- Verify Google Sheets ID
- Check Python dependencies
- Review sync logs

#### "Functions not deploying"
- Check netlify.toml
- Verify function syntax
- Check Netlify logs

### Debug Mode
Add to URL: `?debug=true`
```javascript
// management.js
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === 'true';
if (debugMode) console.log('Debug mode enabled');
```

## 📱 Performance Optimization

1. **Caching**:
   - 15-minute cache for data
   - Local storage for preferences

2. **Pagination**:
   - Virtual scrolling in tables
   - Lazy loading for charts

3. **Compression**:
   - Enable Gzip in Netlify
   - Minify JavaScript

## 🔄 Updates and Maintenance

### Regular Tasks
- [ ] Weekly: Check sync status
- [ ] Monthly: Review error logs
- [ ] Quarterly: Rotate API keys
- [ ] Yearly: Update dependencies

### Backup Strategy
1. **Airtable**: Automatic daily backups
2. **Code**: Git version control
3. **Data**: Export CSV weekly

## 📞 Support

### Resources
- [Netlify Docs](https://docs.netlify.com)
- [Airtable API Docs](https://airtable.com/developers)
- [Project Issues](https://github.com/YOUR_USERNAME/metrix-management/issues)

### Contact
- GitHub Issues for bugs
- Discussions for questions
- Email for urgent issues

## 🎉 Launch Checklist

- [ ] Airtable base created
- [ ] Environment variables set
- [ ] Site deployed to Netlify
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active
- [ ] Data syncing properly
- [ ] Team members have access
- [ ] Documentation updated
- [ ] Backups configured
- [ ] Monitoring enabled

## 📅 Post-Deployment

1. **Week 1**: Monitor for issues
2. **Week 2**: Gather user feedback
3. **Week 3**: Implement improvements
4. **Month 1**: Performance review

---

**Last Updated**: 2025-09-29
**Version**: 1.0.0
**Status**: Ready for deployment