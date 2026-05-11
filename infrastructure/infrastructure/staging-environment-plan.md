# Staging Environment Plan

## Goal
Prepare a new server dedicated to Unit Passport Portal development.

## Important
This is not for migrating the current WordPress website. The main website remains on Bluehost.

## Pending Confirmation
- Final provider: AWS or DigitalOcean
- Application stack
- Staging subdomain

## Proposed Staging Domain
- staging.holicindo.com
- portal-staging.holicindo.com

## Required Access
- AWS or DigitalOcean
- Cloudflare
- SSH key access
- GitHub repository access

## Initial Server Setup
- Ubuntu LTS
- SSH key login
- Non-root sudo user
- Firewall enabled
- Git installed
- Nginx installed
- Database installed
- SSL enabled
- Deployment folder prepared

## Open Questions
- Will the app use Laravel, Next.js, Node.js, Django, or another stack?
- Which provider should be used: AWS or DigitalOcean?
- What staging domain should be used?
- Who should have server access?
