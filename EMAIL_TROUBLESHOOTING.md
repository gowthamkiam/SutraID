# 📧 Magic Link Email Troubleshooting

## Issue
Not receiving magic link emails after requesting login.

## Possible Causes & Solutions

### 1. Check Backend Console Logs

When you request a magic link, check your backend console (where `pnpm run dev` is running) for:

**If you see this**:
```
🔗 Magic link for user@example.com:
http://localhost:3001/auth/verify?token=...
```
→ **Problem**: Resend is not initialized. The magic link is being logged instead of emailed.

**If you see this**:
```
Failed to send magic link email: <some error>
```
→ **Problem**: Email sending failed. Check the error message.

**If you see nothing** after requesting magic link:
→ **Problem**: Backend might not be receiving the request, or email sent successfully.

### 2. Verify Resend API Key

Your `.env` has:
```bash
RESEND_API_KEY="re_iYcJjd7C_2UpXxvAyk1HwTs6Kn34Z7xm1"
```

**Test if this key is valid**:

1. Go to https://resend.com/api-keys
2. Check if this API key exists and is active
3. If expired or invalid, create a new one and update `.env`

### 3. Check Email FROM Address

Your `.env` has:
```bash
EMAIL_FROM="onboarding@resend.dev"
```

**Important**: `onboarding@resend.dev` is Resend's test domain. It should work for testing, but:
- Emails may go to spam
- Has lower delivery rates
- Limited to 100 emails/day

**Recommended**: Verify your own domain in Resend:
1. Go to https://resend.com/domains
2. Add your domain (e.g., `yourdomain.com`)
3. Add DNS records as instructed
4. Update `.env`: `EMAIL_FROM="noreply@yourdomain.com"`

### 4. Check Spam/Junk Folder

Emails from `onboarding@resend.dev` often go to spam. Check:
- Gmail: Spam/Junk folder
- Outlook: Junk Email folder
- Other providers: Check spam

### 5. Verify Resend Package Installation

```bash
cd apps/backend
npm list resend
```

Should show: `resend@3.0.0`

If missing:
```bash
npm install resend@3.0.0
```

### 6. Check Backend is Actually Running

Make sure backend started successfully:
```bash
cd apps/backend
pnpm run dev
```

Should see:
```
✓ Application successfully started
✓ Application is running on: http://localhost:3000
```

### 7. Test Magic Link Request

**Method 1: Via Frontend**
1. Go to http://localhost:3001/login
2. Enter your email
3. Click "Send Magic Link"
4. Watch backend console for logs

**Method 2: Via cURL (Direct API Test)**
```bash
curl -X POST http://localhost:3000/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@example.com"}'
```

Expected response:
```json
{
  "message": "Magic link sent! Check your email to continue."
}
```

Watch backend console for:
- Success: No errors
- Failure: Error messages
- Fallback: Magic link logged to console

### 8. Enable Debug Logging

If still not working, add debug logging to see what's happening:

**Edit**: `apps/backend/src/modules/auth/services/auth.service.ts`

Find line ~208 (in `sendMagicLinkEmail` method):
```typescript
if (!this.resend) {
  // In development without Resend configured, just log the link
  console.log(`\n🔗 Magic link for ${email}:\n${magicLink}\n`);
  return;
}
```

Add debug log before this:
```typescript
private async sendMagicLinkEmail(email: string, magicLink: string): Promise<void> {
  console.log('🔍 DEBUG: sendMagicLinkEmail called');
  console.log('🔍 DEBUG: Resend initialized?', !!this.resend);
  console.log('🔍 DEBUG: Email FROM:', this.config.get<string>('EMAIL_FROM'));

  if (!this.resend) {
    console.log(`\n🔗 Magic link for ${email}:\n${magicLink}\n`);
    return;
  }

  console.log('🔍 DEBUG: Attempting to send email via Resend...');

  try {
    const result = await this.resend.emails.send({
      // ... rest of code
    });
    console.log('✅ Email sent successfully!', result);
  } catch (error) {
    console.error('❌ Failed to send magic link email:', error);
    throw new Error('Failed to send magic link email');
  }
}
```

Then restart backend and try again.

## Quick Fix: Use Console Magic Link (Development)

If you just want to test the app quickly, you can use the magic link from console:

1. Request magic link at login page
2. Check backend console for:
   ```
   🔗 Magic link for user@example.com:
   http://localhost:3001/auth/verify?token=abc123...
   ```
3. Copy the URL and paste in browser
4. You'll be logged in!

This works even if Resend isn't configured.

## Resend Free Tier Limits

- ✅ 3,000 emails/month
- ✅ 100 emails/day
- ✅ Test domain: `onboarding@resend.dev`
- ⚠️ Custom domain requires DNS verification

## Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Resend API key not found` | No `RESEND_API_KEY` in `.env` | Add API key to `.env` |
| `Invalid API key` | Wrong or expired key | Get new key from Resend dashboard |
| `Domain not verified` | Using unverified custom domain | Use `onboarding@resend.dev` or verify domain |
| `Rate limit exceeded` | Sent too many emails | Wait or upgrade plan |

## Next Steps

1. **Check backend console logs** when requesting magic link
2. **Check spam folder** if no errors in console
3. **Verify Resend API key** is valid and active
4. **Use console magic link** as temporary workaround
5. **Add debug logging** if still not working

---

**Quick Test**:
```bash
# In one terminal
cd apps/backend && pnpm run dev

# In another terminal, test API directly
curl -X POST http://localhost:3000/api/v1/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Check first terminal for magic link or errors
```
