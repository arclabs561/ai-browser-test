#!/bin/bash
# Publish script with MFA support

echo "📦 Publishing ai-browser-test@0.3.1"
echo ""
echo "You'll need a one-time password (OTP) from 1Password."
echo "1. Open 1Password app"
echo "2. Find your npm account"
echo "3. Copy the 6-digit OTP code"
echo ""
read -p "Enter OTP code: " OTP

if [ -z "$OTP" ]; then
  echo "❌ No OTP provided. Exiting."
  exit 1
fi

echo ""
echo "🚀 Publishing with OTP..."
npm publish --access public --otp="$OTP"

