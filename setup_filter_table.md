# Quick Setup for Filtered Data Admin Interface

## Your Airtable Table ID
```
tbl06Kf7d2ST4ceVA
```

## Step 1: Add to Netlify Environment Variables

Go to Netlify Dashboard → Site Settings → Environment Variables and add:

```
Airtable_MetrixTable2_ID = tbl06Kf7d2ST4ceVA
```

## Step 2: Deploy the Changes

```bash
# Commit and push the new files
git add admin_filter.html admin_filter.js netlify/functions/airtable-filter.js
git commit -m "Add filtered data admin interface with Airtable table tbl06Kf7d2ST4ceVA"
git push origin main
```

## Step 3: Import Data to Airtable

1. Open your Airtable base
2. Go to table `tbl06Kf7d2ST4ceVA`
3. Import the CSV file: `K-Beauty_Panel_Updated.csv`
4. Map the fields according to the schema in `airtable_schema_filter.md`

## Step 4: Access the New Interface

After deployment completes:
```
https://metrix.famigo.life/admin_filter.html
```

## Verification Checklist
- [ ] Environment variable added in Netlify
- [ ] Files pushed to GitHub
- [ ] Netlify deployment successful
- [ ] CSV data imported to Airtable table
- [ ] Admin interface loads at /admin_filter.html
- [ ] Data displays correctly (999 records)
- [ ] Charts and statistics working
- [ ] CRUD operations functional

## Table Summary
- Table ID: `tbl06Kf7d2ST4ceVA`
- Expected Records: 999 (filtered dataset)
- Theme: Amber/Orange (distinct from original blue theme)