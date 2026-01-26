#!/bin/bash
# Check if schema.version was incremented when creating Supabase migration

# Check if any SQL migration file is staged
if git diff --cached --name-only | grep -qE "supabase/migrations/.*\.sql"; then

  # Check if schema.ts was modified AND version changed
  if ! git diff --cached src/services/database/local/schema.ts | grep -qE "^\+.*version:"; then
    echo ""
    echo "❌ Migration SQL detected but schema.version not incremented"
    echo ""
    echo "📋 Action required:"
    echo "   1. Open: src/services/database/local/schema.ts"
    echo "   2. Increment version: version: X → version: X+1"
    echo ""
    echo "📚 Documentation: docs/CONTRIBUTING.md § Database Schema Changes (step 5)"
    echo ""
    echo "⚠️  Bypass (if migration doesn't change schema): git commit --no-verify"
    echo ""
    exit 1
  fi

  echo "✅ Migration SQL + schema.version updated"
fi
