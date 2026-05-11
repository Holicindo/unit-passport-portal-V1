# Cloudflare DNS Shielding Checklist

## Goal
Setup Cloudflare to protect the current Holicindo website without moving the hosting yet.

## Before Changing Anything
- Screenshot/export existing DNS records
- Check current A record
- Check current CNAME records
- Check MX records for Google Mail
- Check TXT SPF record
- Check DKIM record
- Check DMARC record
- Check existing subdomains

## Important
Email must not go down. All Google Mail MX records must be copied correctly.

## Cloudflare Setup
- Add domain to Cloudflare
- Import DNS records
- Verify all records
- Set SSL mode carefully
- Change nameservers at registrar
- Test website
- Test email sending
- Test email receiving