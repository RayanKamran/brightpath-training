#!/bin/bash
# Import Logto database configuration from SQL dump with authentication fixes
# Usage: ./scripts/logto-import-db.sh <backup-file> [--yes]

set -e

AUTO_YES=false
BACKUP_FILE=""

for arg in "$@"; do
  case "$arg" in
    --yes|-y) AUTO_YES=true ;;
    *) BACKUP_FILE="$arg" ;;
  esac
done

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <backup-file> [--yes]"
  echo "Example: $0 ./logto/backup/logto_db_20250106_120000.sql"
  echo "Example: $0 ./logto/init_config/logto_db_init_config.sql"
  echo "  --yes  Skip confirmation prompt (for non-interactive/scripted use)"
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Backup file not found: ${BACKUP_FILE}"
  exit 1
fi

# make sure we are in the root directory of the project
cd "$(dirname "$0")/.."  # script file is in ${ROOT}/scripts/

if [ -f ".env" ]; then
  source .env
fi

if [ -f ".env.local" ]; then
  source .env.local
fi

if [ -f ".env.development" ]; then
  source .env.development
fi

echo "🔧 Importing Logto database from: ${BACKUP_FILE}"
echo "⚠️  This will overwrite the current Logto database!"

if [ "${AUTO_YES}" = "true" ]; then
  echo "(auto-confirmed)"
else
  read -p "Continue? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
fi

# Stop Logto service if running
echo "🛑 Stopping Logto service..."
docker compose stop logto_svc || true

# Drop and recreate database
echo "🗄️  Recreating database..."
docker exec postgres psql -U "${LOGTO_DB_USER}" -c "DROP DATABASE IF EXISTS ${LOGTO_DB_NAME};"
docker exec postgres psql -U "${LOGTO_DB_USER}" -c "CREATE DATABASE ${LOGTO_DB_NAME};"

# Restore from backup
echo "📥 Restoring data..."
cat "${BACKUP_FILE}" | docker exec -i postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}"

echo "🔐 Fixing database user authentication..."

# Get the expected passwords from the tenants table and set them for PostgreSQL users
TENANT_PASSWORDS=$(docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -t -c "
SELECT 'ALTER USER ' || db_user || ' PASSWORD ''' || db_user_password || ''';'
FROM tenants
WHERE db_user IS NOT NULL AND db_user_password IS NOT NULL;
")

if [ ! -z "$TENANT_PASSWORDS" ]; then
  echo "Setting correct passwords for Logto database users..."
  echo "$TENANT_PASSWORDS" | while read -r password_cmd; do
    if [ ! -z "$password_cmd" ]; then
      docker exec postgres psql -U "${LOGTO_DB_USER}" -c "$password_cmd"
    fi
  done
else
  echo "⚠️  No tenant passwords found in backup. Authentication may fail."
fi

echo "🔑 Ensuring OIDC configuration integrity..."

# Check if admin tenant has required OIDC keys
ADMIN_OIDC_COUNT=$(docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -t -c "
SELECT COUNT(*) FROM logto_configs
WHERE tenant_id = 'admin' AND key IN ('oidc.privateKeys', 'oidc.cookieKeys');
")

if [ "${ADMIN_OIDC_COUNT// /}" != "2" ]; then
  echo "Admin tenant missing OIDC keys. Checking if default tenant has them..."

  DEFAULT_OIDC_COUNT=$(docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -t -c "
  SELECT COUNT(*) FROM logto_configs
  WHERE tenant_id = 'default' AND key IN ('oidc.privateKeys', 'oidc.cookieKeys');
  ")

  if [ "${DEFAULT_OIDC_COUNT// /}" = "2" ]; then
    echo "Copying OIDC keys from default to admin tenant..."
    docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
    INSERT INTO logto_configs (tenant_id, key, value)
    SELECT 'admin', key, value
    FROM logto_configs
    WHERE tenant_id = 'default' AND key IN ('oidc.privateKeys', 'oidc.cookieKeys')
    ON CONFLICT (tenant_id, key) DO UPDATE SET value = EXCLUDED.value;
    "
  else
    echo "⚠️  No OIDC keys found in default tenant. You may need to reseed OIDC configuration."
  fi
else
  echo "Admin tenant OIDC configuration is complete."
fi

echo "🛡️  Ensuring admin tenant authorization setup..."

# Copy admin console configuration from default to admin tenant if missing
docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
INSERT INTO logto_configs (tenant_id, key, value)
SELECT 'admin', key, value
FROM logto_configs
WHERE tenant_id = 'default' AND key = 'adminConsole'
ON CONFLICT (tenant_id, key) DO NOTHING;
" > /dev/null

# Ensure admin role exists for admin tenant
docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
INSERT INTO roles (id, name, description, tenant_id)
VALUES ('admin-admin-role', 'admin:admin', 'User role for accessing admin tenant Management API', 'admin')
ON CONFLICT (id) DO NOTHING;
" > /dev/null

# Get the Management API scope ID for admin tenant
ADMIN_SCOPE_ID=$(docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -t -c "
SELECT s.id FROM scopes s
JOIN resources r ON s.resource_id = r.id
WHERE r.name = 'Logto Management API for tenant admin' AND s.name = 'all';
")

if [ ! -z "${ADMIN_SCOPE_ID// /}" ]; then
  # Assign Management API scope to admin role
  docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
  INSERT INTO roles_scopes (id, tenant_id, role_id, scope_id)
  VALUES ('admin-role-scope', 'admin', 'admin-admin-role', '${ADMIN_SCOPE_ID// /}')
  ON CONFLICT (tenant_id, role_id, scope_id) DO NOTHING;
  " > /dev/null

  # Find admin users and assign admin role
  ADMIN_USERS=$(docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -t -c "
  SELECT id FROM users WHERE username LIKE '%admin%';
  ")

  echo "$ADMIN_USERS" | while read -r user_id; do
    if [ ! -z "${user_id// /}" ]; then
      # Generate unique ID for the role assignment
      ROLE_ASSIGN_ID="admin-role-$(echo ${user_id// /} | cut -c1-8)"
      docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
      INSERT INTO users_roles (id, tenant_id, user_id, role_id)
      VALUES ('${ROLE_ASSIGN_ID}', 'admin', '${user_id// /}', 'admin-admin-role')
      ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING;
      " > /dev/null
    fi
  done

  # Assign Management API role to admin console application
  docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
  INSERT INTO applications_roles (id, tenant_id, application_id, role_id)
  VALUES ('admin-console-mapi', 'admin', 'admin-console', 'm-admin')
  ON CONFLICT (tenant_id, application_id, role_id) DO NOTHING;
  " > /dev/null

  echo "Admin tenant authorization setup completed."
else
  echo "⚠️  Could not find Management API scope for admin tenant."
fi

echo "🔑 Ensuring Logto admin console access for ids_logto_admin..."

# Ensure ids_logto_admin is a member of t-default org with admin role.
# This is required for the admin console login to work (Logto uses org-scoped tokens).
# These inserts are idempotent — safe to run even if the rows already exist from the init config.
docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -c "
INSERT INTO organization_user_relations (tenant_id, organization_id, user_id)
VALUES ('admin', 't-default', 'idslogtoadmi')
ON CONFLICT DO NOTHING;

INSERT INTO organization_role_user_relations (tenant_id, organization_id, organization_role_id, user_id)
VALUES ('admin', 't-default', 'admin', 'idslogtoadmi')
ON CONFLICT DO NOTHING;

UPDATE users
SET logto_config = jsonb_set(logto_config, '{adminConsole,organizationCreated}', 'true')
WHERE tenant_id = 'admin' AND id = 'idslogtoadmi';
" > /dev/null

echo "🚀 Starting Logto service..."
docker compose start logto_svc

# Wait a moment for startup
echo "⏳ Waiting for Logto to initialize..."
sleep 5

# Check if Logto is responding
echo "🔍 Verifying Logto is accessible..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/ | grep -q "302\|200"; then
  echo "✅ Logto is responding successfully!"
else
  echo "⚠️  Logto may not be fully ready yet. Check logs with: docker compose logs logto_svc"
fi

echo ""
echo "✅ Database import completed successfully!"
echo ""
echo "🎯 Next steps:"
echo "  1. Access admin console: http://localhost:3002/"
echo "  2. Check logs if needed: docker compose logs logto_svc"
echo "  3. If issues persist, run: docker compose restart logto_svc"
