# Logto Database Backups

This directory contains database backups of the Logto authentication service configuration.

## Quick Reference

**Export backup:**
```bash
npm run logto:db:export-backup
```

**Import backup:**
```bash
npm run logto:db:import-init-config
# or
./scripts/logto-import-db.sh logto/backup/baseline.sql
```

**Seed fresh instance:**
```bash
npm run logto:seed
```

## Files

- `baseline.sql` - Committed baseline configuration for team onboarding
- `*.sql` - Local backups (gitignored, not committed)

## What's Included

Backups contain the complete Logto configuration:
- ✅ Applications (SPA, M2M) and credentials
- ✅ API resources and permissions
- ✅ Email/SMS/Social connectors
- ✅ Branding and sign-in experience
- ✅ Users, roles, and organizations
- ✅ All Logto settings

## Security Note

⚠️ **Database backups contain sensitive data:**
- Client secrets for applications
- SMTP/SMS credentials
- API keys for connectors
- User password hashes

**Only commit `baseline.sql`** - all other backups are gitignored.

For team collaboration, either:
1. Share backups through secure channels
2. Use the seed script (`npm run logto:seed`) instead

## Documentation

See [docs/LOGTO_SEEDING.md](../../docs/LOGTO_SEEDING.md) for complete guide.
- Connector configurations
- Admin users

## Security Note

**Do NOT commit sensitive credentials to git!**

- App secrets should be stored in `.env.local` (git-ignored)
- Database backups may contain admin accounts
- Share credentials securely with team members (password manager, secrets vault)

## Files

- `logto_db_initial_config.sql` - Initial setup with default configuration (to be created)
- `logto_db_YYYYMMDD_HHMMSS.sql` - Timestamped backups
