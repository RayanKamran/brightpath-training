#!/bin/bash
# Convert SVG file to base64 data URI for use in Logto branding
# This avoids CSP issues when using external URLs

if [ -z "$1" ]; then
  echo "Usage: $0 <svg-file>"
  echo "Example: $0 apps/client-web/public/dms-logo-2025.svg"
  exit 1
fi

SVG_FILE="$1"

if [ ! -f "$SVG_FILE" ]; then
  echo "❌ File not found: $SVG_FILE"
  exit 1
fi

echo "🔄 Converting SVG to base64 data URI..."
echo ""
echo "Copy and paste this into Logto's Logo URL field:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "data:image/svg+xml;base64,$(base64 -i "$SVG_FILE" 2>/dev/null || base64 "$SVG_FILE")"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Data URI generated successfully!"
echo ""
echo "Note: For large images, it's better to upload the file directly in Logto console."
