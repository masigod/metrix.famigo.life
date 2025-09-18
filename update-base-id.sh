#!/bin/bash

# Base ID 업데이트 스크립트
echo "🔧 Airtable Base ID 업데이트"
echo "================================"
echo ""
echo "Base ID를 입력하세요 (app로 시작):"
read BASE_ID

if [[ ! "$BASE_ID" =~ ^app ]]; then
    echo "❌ Base ID는 'app'으로 시작해야 합니다."
    exit 1
fi

# 설정 파일 업데이트
sed -i '' "s/baseId: 'YOUR_BASE_ID_HERE'/baseId: '$BASE_ID'/g" /Users/owlers_dylan/Metrix/airtable-config-local.js

echo "✅ Base ID 업데이트 완료: $BASE_ID"
echo ""
echo "설정 파일 확인:"
grep "baseId:" /Users/owlers_dylan/Metrix/airtable-config-local.js