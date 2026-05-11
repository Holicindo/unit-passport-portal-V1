@'
# Access Checklist

## Already Available

- GDrive access
- GitHub account
- GitHub repository: unit-passport-portal

## Pending Access for Cloudflare & DNS Shielding

The following access is required before Cloudflare setup can be executed:

- Cloudflare account
- Domain registrar access / tempat domain holicindo.com dibeli
- Bluehost / cPanel access
- Existing DNS records
- Google Workspace / Google Mail DNS records

## Current Status

Cloudflare and DNS shielding setup cannot be executed yet because domain, hosting, and DNS access have not been provided.

Based on the Service Portal Brief, the Domain Access and Hosting/Cloud Account sections are still empty.

## Required DNS Records to Verify

Before connecting holicindo.com to Cloudflare, the following DNS records must be checked and backed up:

- A record for root domain
- CNAME record for www
- MX records for Google Mail
- TXT SPF record
- TXT DKIM record
- TXT DMARC record
- Existing subdomains
- Any mail-related records such as mail, smtp, imap, or webmail

## Risk

Cloudflare setup must not be started without complete DNS records, especially Google Mail MX records.

If MX records are missing or copied incorrectly, company email may stop receiving messages.

## Security Notes

- Do not store passwords or credentials in GitHub
- Do not commit `.env` files
- Do not upload screenshots containing credentials
- Do not upload raw database backups unless encrypted and approved
- Passwords shared during onboarding should be reset after access is confirmed
'@ | Set-Content -Path "docs\access-checklist.md" -Encoding UTF8