#!/bin/bash
# Export Logto database configuration
# This creates a SQL dump of the Logto database for sharing with team

set -e

# if -h is passed, show help
if [ "$1" == "-h" ] || [ "$1" == "--help" ]; then
  echo "Usage: $0 [-U]"
  echo "  -U    Export initial configuration for team setup"
  echo ""
  echo "If no -U flag is provided, a timestamped backup file will be created."
  exit 0
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

# if the user passes in -IC
if [ "$1" == "-IC" ] && [ -z "$2" ]; then
  BACKUP_DIR="./logto/init_config"
  BACKUP_FILE="${BACKUP_DIR}/logto_db_init_config.sql"
else
  BACKUP_DIR="./logto/backup"
  TIMESTAMP=$(date +%Y%m%d_%H%M%S)
  BACKUP_FILE="${BACKUP_DIR}/logto_db_${TIMESTAMP}.sql"
fi

mkdir -p "${BACKUP_DIR}"

echo "📦 Exporting Logto database roles (server-level objects not captured by pg_dump)..."
docker exec postgres pg_dumpall -U "${LOGTO_DB_USER}" --roles-only \
  | grep -v "^--\|^SET\|^$" \
  > "${BACKUP_FILE}"

echo "" >> "${BACKUP_FILE}"

# Tables whose default-tenant data is owned by seed-logto.ts and must not
# be baked into the init config. Only the admin-tenant rows are bootstrap data.
SEED_TABLES=(
  organizations
  organization_roles
  organization_role_user_relations
  organization_user_relations
  users
  users_roles
)

if [ "$1" == "-IC" ]; then
  SEED_EXCLUDE_FLAGS=""
  for t in "${SEED_TABLES[@]}"; do
    SEED_EXCLUDE_FLAGS="${SEED_EXCLUDE_FLAGS} --exclude-table-data=public.${t}"
  done
  EXPORT_NOTE="   (Seed data excluded: default-tenant orgs, users, roles — restored via: npm run logto:seed:clean)"
else
  SEED_EXCLUDE_FLAGS=""
  EXPORT_NOTE=""
fi

echo "📦 Exporting Logto database (excluding runtime data)..."
docker exec postgres pg_dump -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" \
  --exclude-table-data=public.daily_active_users \
  --exclude-table-data=public.daily_token_usage \
  --exclude-table-data=public.idp_initiated_saml_sso_sessions \
  --exclude-table-data=public.logs \
  --exclude-table-data=public.oidc_model_instances \
  --exclude-table-data=public.oidc_session_extensions \
  --exclude-table-data=public.one_time_tokens \
  --exclude-table-data=public.passcodes \
  --exclude-table-data=public.personal_access_tokens \
  --exclude-table-data=public.saml_application_sessions \
  --exclude-table-data=public.sentinel_activities \
  --exclude-table-data=public.service_logs \
  --exclude-table-data=public.subject_tokens \
  --exclude-table-data=public.verification_records \
  --exclude-table-data=public.verification_statuses \
  ${SEED_EXCLUDE_FLAGS} \
  >> "${BACKUP_FILE}"

if [ "$1" == "-IC" ]; then
  echo "📦 Appending admin-tenant bootstrap rows for seed tables..."
  for t in "${SEED_TABLES[@]}"; do
    COLS=$(docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" -At \
      -c "SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='public' AND table_name='${t}'")
    echo "" >> "${BACKUP_FILE}"
    echo "COPY public.${t} (${COLS}) FROM stdin;" >> "${BACKUP_FILE}"
    docker exec postgres psql -U "${LOGTO_DB_USER}" "${LOGTO_DB_NAME}" \
      -c "COPY (SELECT * FROM public.${t} WHERE tenant_id = 'admin') TO STDOUT" >> "${BACKUP_FILE}"
    echo "\\." >> "${BACKUP_FILE}"
  done
fi

echo "✅ Database exported to: ${BACKUP_FILE}"
echo "   (Runtime data excluded: tokens, sessions, logs, analytics, verification codes)"
echo "${EXPORT_NOTE}"
echo ""
echo "To import on another machine:"
echo "  ./scripts/logto-import-db.sh ${BACKUP_FILE}"
 