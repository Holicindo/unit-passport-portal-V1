@'
# Cloudflare DNS Audit

## Goal

Connect holicindo.com to Cloudflare for DNS shielding, DDoS protection, and SSL optimization without migrating the current Bluehost hosting.

## Important

The main website remains on Bluehost during this phase.

This task is not a website migration. The goal is to protect the existing domain and prepare DNS management through Cloudflare.

## Current Status

Cloudflare setup is currently blocked because the following access has not been provided:

- Cloudflare account
- Domain registrar access
- Bluehost / cPanel access
- Existing DNS records
- Google Workspace / Google Mail DNS records

## Required Access

- Cloudflare account
- Domain registrar account
- Bluehost / cPanel
- Google Workspace DNS records
- Current DNS zone records

## DNS Records to Backup Before Any Change

Before changing nameservers or connecting Cloudflare, backup and verify:

- A record for holicindo.com
- CNAME record for www
- MX records for Google Mail
- TXT SPF record
- TXT DKIM record
- TXT DMARC record
- Existing subdomains
- Any third-party verification records
- Any mail-related records

## Email Safety Notes

All Google Mail MX records must be copied correctly to Cloudflare.

Email-related records must remain DNS only and must not be proxied through Cloudflare.

Important email records to verify:

- MX
- SPF
- DKIM
- DMARC

## Cloudflare Setup Plan

1. Backup existing DNS records from current DNS provider.
2. Add holicindo.com to Cloudflare.
3. Let Cloudflare scan existing records.
4. Compare Cloudflare scanned records with the existing DNS records.
5. Manually add any missing records.
6. Verify Google Mail MX records.
7. Verify SPF, DKIM, and DMARC records.
8. Set appropriate SSL/TLS mode.
9. Change nameservers at the domain registrar.
10. Test website access.
11. Test HTTPS.
12. Test email sending and receiving.

## Testing Checklist

- holicindo.com loads correctly
- www.holicindo.com loads correctly
- HTTPS works
- No redirect loop
- Google Mail can receive email
- Google Mail can send email
- Existing subdomains still work
- No critical DNS records are missing

## Risks

- Missing MX records can break company email
- Wrong SSL/TLS mode can cause redirect loop
- Missing subdomain records can break existing services
- Proxying mail-related records incorrectly can break email access
'@ | Set-Content -Path "infrastructure\cloudflare-dns-audit.md" -Encoding UTF8