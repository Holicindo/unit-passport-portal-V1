@'
# Staging Environment Plan

## Goal

Prepare a new server dedicated to Unit Passport Portal development.

This staging environment will be used to develop, test, and preview the Unit Passport Portal before production launch.

## Important

This is not for migrating the current WordPress website.

The main website remains on Bluehost during this phase.

## Pending Confirmation

- Final provider: AWS or DigitalOcean
- Application stack
- Staging subdomain
- Server access permission
- Deployment method

## Proposed Staging Domain

Possible staging domain options:

- staging.holicindo.com
- portal-staging.holicindo.com

## Required Access

- AWS or DigitalOcean account
- Permission to create server / instance
- SSH key access
- Cloudflare access for DNS setup
- GitHub repository access

## Initial Server Requirements

- Ubuntu LTS
- SSH key login
- Non-root sudo user
- Firewall enabled
- Git installed
- Nginx installed
- Database installed
- SSL enabled
- Deployment folder prepared

## Initial Security Checklist

- Use SSH key authentication
- Avoid password login if possible
- Create non-root user for deployment
- Enable firewall
- Allow only required ports:
  - 22 for SSH
  - 80 for HTTP
  - 443 for HTTPS
- Do not store credentials in GitHub
- Use environment variables for secrets

## Open Questions

- Should the staging server use AWS or DigitalOcean?
- What application stack should be used?
- What staging subdomain should be used?
- Who should have SSH access?
- Should deployment be manual or connected to GitHub Actions?
- Which database should be used for the portal?

## Notes

The staging server is specifically for the Unit Passport Portal.

The existing WordPress website should remain on Bluehost until migration is approved.
'@ | Set-Content -Path "infrastructure\staging-environment-plan.md" -Encoding UTF8