\restrict J7ivWk2u2oCFzeLOYPqmfRh5dkhM9Lj7KtohUwOgTQtfmiuBMVjWuhbOiGIIvUG
CREATE ROLE logto_tenant_logto_db;
ALTER ROLE logto_tenant_logto_db WITH NOSUPERUSER NOINHERIT NOCREATEROLE NOCREATEDB NOLOGIN NOREPLICATION NOBYPASSRLS;
CREATE ROLE logto_tenant_logto_db_admin;
ALTER ROLE logto_tenant_logto_db_admin WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:DIDGXENkMuh8xpb/6PN6+A==$LhGpcOUTMRkaf2Hwo1bs1pZMuczmpe/NZIGEBxcxFlE=:inWiwzRvyz9B08xDEfkdzw0pMYj37CV/dB4Thurub8s=';
CREATE ROLE logto_tenant_logto_db_default;
ALTER ROLE logto_tenant_logto_db_default WITH NOSUPERUSER INHERIT NOCREATEROLE NOCREATEDB LOGIN NOREPLICATION NOBYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:0z8Cytk0cyJjYbVQfuqIVQ==$LZYOt43gh5/QU1Bn2KcktSbFQRspeUveA/Mdoaw8tok=:Urel3GoM0EGjq93MtTWRtQhjwbxnjfOA2QNAQpM9OPI=';
CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:n5S4ebk3vZzmTvnPb841AA==$hie4uYkl00tNYOOmDQKs/0/f3+zk+husncynOUeD0A8=:xab38mI8cnHPBZYBh+OPz3p2jALL/Gp0aFI9f3H6qMg=';
GRANT logto_tenant_logto_db TO logto_tenant_logto_db_admin WITH INHERIT TRUE GRANTED BY postgres;
GRANT logto_tenant_logto_db TO logto_tenant_logto_db_default WITH INHERIT TRUE GRANTED BY postgres;
\unrestrict J7ivWk2u2oCFzeLOYPqmfRh5dkhM9Lj7KtohUwOgTQtfmiuBMVjWuhbOiGIIvUG

--
-- PostgreSQL database dump
--

\restrict JvP3ctac8HnlDohd7kGvkRuLfOCyEQUREqnHlznlObNFjEgH2Yi8kmh9QCUvQu1

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: agree_to_terms_policy; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.agree_to_terms_policy AS ENUM (
    'Automatic',
    'ManualRegistrationOnly',
    'Manual'
);


ALTER TYPE public.agree_to_terms_policy OWNER TO postgres;

--
-- Name: application_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.application_type AS ENUM (
    'Native',
    'SPA',
    'Traditional',
    'MachineToMachine',
    'Protected',
    'SAML'
);


ALTER TYPE public.application_type OWNER TO postgres;

--
-- Name: organization_invitation_status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.organization_invitation_status AS ENUM (
    'Pending',
    'Accepted',
    'Expired',
    'Revoked'
);


ALTER TYPE public.organization_invitation_status OWNER TO postgres;

--
-- Name: role_type; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.role_type AS ENUM (
    'User',
    'MachineToMachine'
);


ALTER TYPE public.role_type OWNER TO postgres;

--
-- Name: sentinel_action_result; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sentinel_action_result AS ENUM (
    'Success',
    'Failed'
);


ALTER TYPE public.sentinel_action_result OWNER TO postgres;

--
-- Name: sentinel_decision; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sentinel_decision AS ENUM (
    'Undecided',
    'Allowed',
    'Blocked',
    'Challenge'
);


ALTER TYPE public.sentinel_decision OWNER TO postgres;

--
-- Name: sign_in_mode; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.sign_in_mode AS ENUM (
    'SignIn',
    'Register',
    'SignInAndRegister'
);


ALTER TYPE public.sign_in_mode OWNER TO postgres;

--
-- Name: users_password_encryption_method; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.users_password_encryption_method AS ENUM (
    'Argon2i',
    'Argon2id',
    'Argon2d',
    'SHA1',
    'SHA256',
    'MD5',
    'Bcrypt',
    'Legacy'
);


ALTER TYPE public.users_password_encryption_method OWNER TO postgres;

--
-- Name: check_application_type(character varying, public.application_type[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_application_type(application_id character varying, VARIADIC target_type public.application_type[]) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$ begin return (select type from applications where id = application_id) = any(target_type); end; $$;


ALTER FUNCTION public.check_application_type(application_id character varying, VARIADIC target_type public.application_type[]) OWNER TO postgres;

--
-- Name: check_organization_role_type(character varying, public.role_type); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_organization_role_type(role_id character varying, target_type public.role_type) RETURNS boolean
    LANGUAGE plpgsql
    SET search_path TO 'public'
    AS $$ begin return (select type from organization_roles where id = role_id) = target_type; end; $$;


ALTER FUNCTION public.check_organization_role_type(role_id character varying, target_type public.role_type) OWNER TO postgres;

--
-- Name: check_role_type(character varying, public.role_type); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_role_type(role_id character varying, target_type public.role_type) RETURNS boolean
    LANGUAGE plpgsql
    AS $$ begin return (select type from public.roles where id = role_id) = target_type; end; $$;


ALTER FUNCTION public.check_role_type(role_id character varying, target_type public.role_type) OWNER TO postgres;

--
-- Name: custom_profile_fields__increment_sie_order(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.custom_profile_fields__increment_sie_order() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ begin new.sie_order = ( select coalesce(max(sie_order), 0) from custom_profile_fields where tenant_id = ( select id from tenants where db_user = current_user ) ) + 1; return new; end; $$;


ALTER FUNCTION public.custom_profile_fields__increment_sie_order() OWNER TO postgres;

--
-- Name: delete_secret_on_sso_identity_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_secret_on_sso_identity_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ begin delete from secrets where id in ( select secret_id from secret_enterprise_sso_connector_relations where tenant_id = old.tenant_id and issuer = old.issuer and identity_id = old.identity_id ) and user_id = old.user_id; return old; end; $$;


ALTER FUNCTION public.delete_secret_on_sso_identity_delete() OWNER TO postgres;

--
-- Name: delete_secrets_on_social_connector_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_secrets_on_social_connector_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ begin delete from secrets where id in ( select secret_id from secret_social_connector_relations where tenant_id = old.tenant_id and connector_id = old.id ); return old; end; $$;


ALTER FUNCTION public.delete_secrets_on_social_connector_delete() OWNER TO postgres;

--
-- Name: delete_secrets_on_social_identity_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_secrets_on_social_identity_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ declare identity_target text; old_identity jsonb; new_identity jsonb; begin for identity_target in select jsonb_object_keys(old.identities) loop old_identity := old.identities -> identity_target; new_identity := new.identities -> identity_target; if new_identity is null or (new_identity->>'userId') is distinct from (old_identity->>'userId') then delete from secrets using secret_social_connector_relations where secrets.id = secret_social_connector_relations.secret_id and secret_social_connector_relations.target = identity_target and secret_social_connector_relations.identity_id = old_identity->>'userId' and secrets.user_id = old.id; end if; end loop; return new; end; $$;


ALTER FUNCTION public.delete_secrets_on_social_identity_delete() OWNER TO postgres;

--
-- Name: delete_secrets_on_sso_connector_delete(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.delete_secrets_on_sso_connector_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ begin delete from secrets where id in ( select secret_id from secret_enterprise_sso_connector_relations where tenant_id = old.tenant_id and sso_connector_id = old.id ); return old; end; $$;


ALTER FUNCTION public.delete_secrets_on_sso_connector_delete() OWNER TO postgres;

--
-- Name: set_tenant_id(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_tenant_id() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ begin if new.tenant_id is not null then return new; end if; select tenants.id into new.tenant_id from tenants where tenants.db_user = current_user; return new; end; $$;


ALTER FUNCTION public.set_tenant_id() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$ begin new.updated_at = now(); return new; end; $$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: account_centers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.account_centers (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    fields jsonb DEFAULT '{}'::jsonb NOT NULL,
    webauthn_related_origins jsonb DEFAULT '[]'::jsonb NOT NULL
);


ALTER TABLE public.account_centers OWNER TO postgres;

--
-- Name: aggregated_daily_active_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.aggregated_daily_active_users (
    tenant_id character varying(21) NOT NULL,
    activity_date date NOT NULL,
    user_id character varying(21) NOT NULL,
    activity_count integer NOT NULL
);


ALTER TABLE public.aggregated_daily_active_users OWNER TO postgres;

--
-- Name: application_secrets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_secrets (
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    name character varying(256) NOT NULL,
    value character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    CONSTRAINT application_type CHECK (public.check_application_type(application_id, VARIADIC ARRAY['MachineToMachine'::public.application_type, 'Traditional'::public.application_type, 'Protected'::public.application_type]))
);


ALTER TABLE public.application_secrets OWNER TO postgres;

--
-- Name: application_sign_in_experiences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_sign_in_experiences (
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    color jsonb DEFAULT '{}'::jsonb NOT NULL,
    branding jsonb DEFAULT '{}'::jsonb NOT NULL,
    custom_css text,
    terms_of_use_url character varying(2048),
    privacy_policy_url character varying(2048),
    display_name character varying(256)
);


ALTER TABLE public.application_sign_in_experiences OWNER TO postgres;

--
-- Name: application_user_consent_organization_resource_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_user_consent_organization_resource_scopes (
    tenant_id character varying(21) CONSTRAINT application_user_consent_organization_resour_tenant_id_not_null NOT NULL,
    application_id character varying(21) CONSTRAINT application_user_consent_organization_r_application_id_not_null NOT NULL,
    scope_id character varying(21) CONSTRAINT application_user_consent_organization_resourc_scope_id_not_null NOT NULL
);


ALTER TABLE public.application_user_consent_organization_resource_scopes OWNER TO postgres;

--
-- Name: application_user_consent_organization_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_user_consent_organization_scopes (
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) CONSTRAINT application_user_consent_organization_s_application_id_not_null NOT NULL,
    organization_scope_id character varying(21) CONSTRAINT application_user_consent_organiz_organization_scope_id_not_null NOT NULL
);


ALTER TABLE public.application_user_consent_organization_scopes OWNER TO postgres;

--
-- Name: application_user_consent_organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_user_consent_organizations (
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL
);


ALTER TABLE public.application_user_consent_organizations OWNER TO postgres;

--
-- Name: application_user_consent_resource_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_user_consent_resource_scopes (
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) CONSTRAINT application_user_consent_resource_scope_application_id_not_null NOT NULL,
    scope_id character varying(21) NOT NULL
);


ALTER TABLE public.application_user_consent_resource_scopes OWNER TO postgres;

--
-- Name: application_user_consent_user_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.application_user_consent_user_scopes (
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    user_scope character varying(64) NOT NULL
);


ALTER TABLE public.application_user_consent_user_scopes OWNER TO postgres;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(256) NOT NULL,
    secret character varying(64) NOT NULL,
    description text,
    type public.application_type NOT NULL,
    oidc_client_metadata jsonb NOT NULL,
    custom_client_metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    protected_app_metadata jsonb,
    custom_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_third_party boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: applications_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications_roles (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    role_id character varying(21) NOT NULL,
    CONSTRAINT applications_roles__role_type CHECK (public.check_role_type(role_id, 'MachineToMachine'::public.role_type))
);


ALTER TABLE public.applications_roles OWNER TO postgres;

--
-- Name: captcha_providers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.captcha_providers (
    tenant_id character varying(21) NOT NULL,
    id character varying(128) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.captcha_providers OWNER TO postgres;

--
-- Name: connectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.connectors (
    tenant_id character varying(21) NOT NULL,
    id character varying(128) NOT NULL,
    sync_profile boolean DEFAULT false NOT NULL,
    enable_token_storage boolean DEFAULT false NOT NULL,
    connector_id character varying(128) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.connectors OWNER TO postgres;

--
-- Name: custom_phrases; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_phrases (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    language_tag character varying(16) NOT NULL,
    translation jsonb NOT NULL
);


ALTER TABLE public.custom_phrases OWNER TO postgres;

--
-- Name: custom_profile_fields; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.custom_profile_fields (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(128) NOT NULL,
    type character varying(128) NOT NULL,
    label character varying(128) DEFAULT ''::character varying NOT NULL,
    description character varying(256),
    required boolean DEFAULT false NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    sie_order smallint DEFAULT 0 NOT NULL
);


ALTER TABLE public.custom_profile_fields OWNER TO postgres;

--
-- Name: daily_active_users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_active_users (
    id character varying(21) NOT NULL,
    tenant_id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL,
    date timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.daily_active_users OWNER TO postgres;

--
-- Name: daily_token_usage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.daily_token_usage (
    id character varying(21) NOT NULL,
    tenant_id character varying(21) NOT NULL,
    usage bigint DEFAULT 0 NOT NULL,
    date timestamp with time zone NOT NULL,
    user_token_usage bigint DEFAULT 0 NOT NULL,
    m2m_token_usage bigint DEFAULT 0 NOT NULL
);


ALTER TABLE public.daily_token_usage OWNER TO postgres;

--
-- Name: domains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.domains (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    domain character varying(256) NOT NULL,
    status character varying(32) DEFAULT 'PendingVerification'::character varying NOT NULL,
    error_message character varying(1024),
    dns_records jsonb DEFAULT '[]'::jsonb NOT NULL,
    cloudflare_data jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.domains OWNER TO postgres;

--
-- Name: email_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.email_templates (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    language_tag character varying(16) NOT NULL,
    template_type character varying(64) NOT NULL,
    details jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.email_templates OWNER TO postgres;

--
-- Name: hooks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.hooks (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(256) DEFAULT ''::character varying NOT NULL,
    event character varying(128),
    events jsonb DEFAULT '[]'::jsonb NOT NULL,
    config jsonb NOT NULL,
    signing_key character varying(64) DEFAULT ''::character varying NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.hooks OWNER TO postgres;

--
-- Name: idp_initiated_saml_sso_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.idp_initiated_saml_sso_sessions (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    connector_id character varying(128) NOT NULL,
    assertion_content jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.idp_initiated_saml_sso_sessions OWNER TO postgres;

--
-- Name: logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logs (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    key character varying(128) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.logs OWNER TO postgres;

--
-- Name: logto_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.logto_configs (
    tenant_id character varying(21) NOT NULL,
    key character varying(256) NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.logto_configs OWNER TO postgres;

--
-- Name: oidc_model_instances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oidc_model_instances (
    tenant_id character varying(21) NOT NULL,
    model_name character varying(64) NOT NULL,
    id character varying(128) NOT NULL,
    payload jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone
);


ALTER TABLE public.oidc_model_instances OWNER TO postgres;

--
-- Name: oidc_session_extensions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.oidc_session_extensions (
    tenant_id character varying(21) NOT NULL,
    session_uid character varying(128) NOT NULL,
    account_id character varying(12) NOT NULL,
    last_submission jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.oidc_session_extensions OWNER TO postgres;

--
-- Name: one_time_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.one_time_tokens (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    email character varying(128) NOT NULL,
    token character varying(256) NOT NULL,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    status character varying(64) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.one_time_tokens OWNER TO postgres;

--
-- Name: organization_application_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_application_relations (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    CONSTRAINT application_type CHECK (public.check_application_type(application_id, VARIADIC ARRAY['MachineToMachine'::public.application_type]))
);


ALTER TABLE public.organization_application_relations OWNER TO postgres;

--
-- Name: organization_invitation_role_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_invitation_role_relations (
    tenant_id character varying(21) NOT NULL,
    organization_invitation_id character varying(21) CONSTRAINT organization_invitation_rol_organization_invitation_id_not_null NOT NULL,
    organization_role_id character varying(21) CONSTRAINT organization_invitation_role_rela_organization_role_id_not_null NOT NULL
);


ALTER TABLE public.organization_invitation_role_relations OWNER TO postgres;

--
-- Name: organization_invitations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_invitations (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    inviter_id character varying(21),
    invitee character varying(256) NOT NULL,
    accepted_user_id character varying(21),
    organization_id character varying(21) NOT NULL,
    status public.organization_invitation_status NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.organization_invitations OWNER TO postgres;

--
-- Name: organization_jit_email_domains; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_jit_email_domains (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    email_domain character varying(128) NOT NULL
);


ALTER TABLE public.organization_jit_email_domains OWNER TO postgres;

--
-- Name: organization_jit_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_jit_roles (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    organization_role_id character varying(21) NOT NULL
);


ALTER TABLE public.organization_jit_roles OWNER TO postgres;

--
-- Name: organization_jit_sso_connectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_jit_sso_connectors (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    sso_connector_id character varying(128) NOT NULL
);


ALTER TABLE public.organization_jit_sso_connectors OWNER TO postgres;

--
-- Name: organization_role_application_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_role_application_relations (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) CONSTRAINT organization_role_application_relation_organization_id_not_null NOT NULL,
    organization_role_id character varying(21) CONSTRAINT organization_role_application_rel_organization_role_id_not_null NOT NULL,
    application_id character varying(21) NOT NULL,
    CONSTRAINT organization_role_application_relations__role_type CHECK (public.check_organization_role_type(organization_role_id, 'MachineToMachine'::public.role_type))
);


ALTER TABLE public.organization_role_application_relations OWNER TO postgres;

--
-- Name: organization_role_resource_scope_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_role_resource_scope_relations (
    tenant_id character varying(21) NOT NULL,
    organization_role_id character varying(21) CONSTRAINT organization_role_resource_scope__organization_role_id_not_null NOT NULL,
    scope_id character varying(21) NOT NULL
);


ALTER TABLE public.organization_role_resource_scope_relations OWNER TO postgres;

--
-- Name: organization_role_scope_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_role_scope_relations (
    tenant_id character varying(21) NOT NULL,
    organization_role_id character varying(21) NOT NULL,
    organization_scope_id character varying(21) CONSTRAINT organization_role_scope_relation_organization_scope_id_not_null NOT NULL
);


ALTER TABLE public.organization_role_scope_relations OWNER TO postgres;

--
-- Name: organization_role_user_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_role_user_relations (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    organization_role_id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL,
    CONSTRAINT organization_role_user_relations__role_type CHECK (public.check_organization_role_type(organization_role_id, 'User'::public.role_type))
);


ALTER TABLE public.organization_role_user_relations OWNER TO postgres;

--
-- Name: organization_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_roles (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(256),
    type public.role_type DEFAULT 'User'::public.role_type NOT NULL
);


ALTER TABLE public.organization_roles OWNER TO postgres;

--
-- Name: organization_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_scopes (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(256)
);


ALTER TABLE public.organization_scopes OWNER TO postgres;

--
-- Name: organization_user_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organization_user_relations (
    tenant_id character varying(21) NOT NULL,
    organization_id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL
);


ALTER TABLE public.organization_user_relations OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(256),
    custom_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    is_mfa_required boolean DEFAULT false NOT NULL,
    color jsonb DEFAULT '{}'::jsonb NOT NULL,
    branding jsonb DEFAULT '{}'::jsonb NOT NULL,
    custom_css text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: passcodes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.passcodes (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    interaction_jti character varying(128),
    phone character varying(32),
    email character varying(128),
    type character varying(32) NOT NULL,
    code character varying(6) NOT NULL,
    consumed boolean DEFAULT false NOT NULL,
    try_count smallint DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.passcodes OWNER TO postgres;

--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    tenant_id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL,
    name character varying(256) NOT NULL,
    value character varying(64) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- Name: resources; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resources (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name text NOT NULL,
    indicator text NOT NULL,
    is_default boolean DEFAULT false NOT NULL,
    access_token_ttl bigint DEFAULT 3600 NOT NULL
);


ALTER TABLE public.resources OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    name character varying(128) NOT NULL,
    description character varying(128) NOT NULL,
    type public.role_type DEFAULT 'User'::public.role_type NOT NULL,
    is_default boolean DEFAULT false NOT NULL
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: roles_scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles_scopes (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    role_id character varying(21) NOT NULL,
    scope_id character varying(21) NOT NULL
);


ALTER TABLE public.roles_scopes OWNER TO postgres;

--
-- Name: saml_application_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saml_application_configs (
    application_id character varying(21) NOT NULL,
    tenant_id character varying(21) NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    entity_id character varying(128),
    acs_url jsonb,
    encryption jsonb,
    name_id_format character varying(128) NOT NULL,
    CONSTRAINT saml_application_configs__application_type CHECK (public.check_application_type(application_id, VARIADIC ARRAY['SAML'::public.application_type]))
);


ALTER TABLE public.saml_application_configs OWNER TO postgres;

--
-- Name: saml_application_secrets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saml_application_secrets (
    id character varying(21) NOT NULL,
    tenant_id character varying(21) NOT NULL,
    application_id character varying(21) NOT NULL,
    private_key text NOT NULL,
    certificate text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    active boolean NOT NULL,
    CONSTRAINT saml_application_secrets__application_type CHECK (public.check_application_type(application_id, VARIADIC ARRAY['SAML'::public.application_type]))
);


ALTER TABLE public.saml_application_secrets OWNER TO postgres;

--
-- Name: saml_application_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saml_application_sessions (
    tenant_id character varying(21) NOT NULL,
    id character varying(32) NOT NULL,
    application_id character varying(21) NOT NULL,
    saml_request_id character varying(128) NOT NULL,
    oidc_state character varying(32),
    relay_state character varying(512),
    raw_auth_request text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT saml_application_sessions__application_type CHECK (public.check_application_type(application_id, VARIADIC ARRAY['SAML'::public.application_type]))
);


ALTER TABLE public.saml_application_sessions OWNER TO postgres;

--
-- Name: scopes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.scopes (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    resource_id character varying(21) NOT NULL,
    name character varying(256) NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.scopes OWNER TO postgres;

--
-- Name: secret_enterprise_sso_connector_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.secret_enterprise_sso_connector_relations (
    tenant_id character varying(21) NOT NULL,
    secret_id character varying(21) NOT NULL,
    sso_connector_id character varying(128) CONSTRAINT secret_enterprise_sso_connector_relat_sso_connector_id_not_null NOT NULL,
    issuer character varying(256) NOT NULL,
    identity_id character varying(128) NOT NULL
);


ALTER TABLE public.secret_enterprise_sso_connector_relations OWNER TO postgres;

--
-- Name: secret_social_connector_relations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.secret_social_connector_relations (
    tenant_id character varying(21) NOT NULL,
    secret_id character varying(21) NOT NULL,
    connector_id character varying(128) NOT NULL,
    target character varying(256) NOT NULL,
    identity_id character varying(128) NOT NULL
);


ALTER TABLE public.secret_social_connector_relations OWNER TO postgres;

--
-- Name: secrets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.secrets (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL,
    type character varying(256) NOT NULL,
    encrypted_dek bytea NOT NULL,
    iv bytea NOT NULL,
    auth_tag bytea NOT NULL,
    ciphertext bytea NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.secrets OWNER TO postgres;

--
-- Name: sentinel_activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sentinel_activities (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    target_type character varying(32) NOT NULL,
    target_hash character varying(64) NOT NULL,
    action character varying(64) NOT NULL,
    action_result public.sentinel_action_result NOT NULL,
    payload jsonb NOT NULL,
    decision public.sentinel_decision NOT NULL,
    decision_expires_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sentinel_activities OWNER TO postgres;

--
-- Name: service_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.service_logs (
    id character varying(21) NOT NULL,
    tenant_id character varying(21) NOT NULL,
    type character varying(64) NOT NULL,
    payload jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.service_logs OWNER TO postgres;

--
-- Name: sign_in_experiences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sign_in_experiences (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    color jsonb NOT NULL,
    branding jsonb NOT NULL,
    hide_logto_branding boolean DEFAULT false NOT NULL,
    language_info jsonb NOT NULL,
    terms_of_use_url character varying(2048),
    privacy_policy_url character varying(2048),
    agree_to_terms_policy public.agree_to_terms_policy DEFAULT 'Automatic'::public.agree_to_terms_policy NOT NULL,
    sign_in jsonb NOT NULL,
    sign_up jsonb NOT NULL,
    social_sign_in jsonb DEFAULT '{}'::jsonb NOT NULL,
    social_sign_in_connector_targets jsonb DEFAULT '[]'::jsonb NOT NULL,
    sign_in_mode public.sign_in_mode DEFAULT 'SignInAndRegister'::public.sign_in_mode NOT NULL,
    custom_css text,
    custom_content jsonb DEFAULT '{}'::jsonb NOT NULL,
    custom_ui_assets jsonb,
    password_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    mfa jsonb DEFAULT '{}'::jsonb NOT NULL,
    single_sign_on_enabled boolean DEFAULT false NOT NULL,
    support_email text,
    support_website_url text,
    unknown_session_redirect_url text,
    captcha_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    sentinel_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    email_blocklist_policy jsonb DEFAULT '{}'::jsonb NOT NULL,
    forgot_password_methods jsonb DEFAULT '[]'::jsonb,
    passkey_sign_in jsonb DEFAULT '{}'::jsonb NOT NULL,
    adaptive_mfa jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.sign_in_experiences OWNER TO postgres;

--
-- Name: sso_connector_idp_initiated_auth_configs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sso_connector_idp_initiated_auth_configs (
    tenant_id character varying(21) NOT NULL,
    connector_id character varying(128) NOT NULL,
    default_application_id character varying(21) CONSTRAINT sso_connector_idp_initiated_aut_default_application_id_not_null NOT NULL,
    redirect_uri text,
    auth_parameters jsonb DEFAULT '{}'::jsonb CONSTRAINT sso_connector_idp_initiated_auth_confi_auth_parameters_not_null NOT NULL,
    auto_send_authorization_request boolean DEFAULT false CONSTRAINT sso_connector_idp_initiated_auto_send_authorization_re_not_null NOT NULL,
    client_idp_initiated_auth_callback_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT application_type CHECK (public.check_application_type(default_application_id, VARIADIC ARRAY['Traditional'::public.application_type, 'SPA'::public.application_type, 'SAML'::public.application_type]))
);


ALTER TABLE public.sso_connector_idp_initiated_auth_configs OWNER TO postgres;

--
-- Name: sso_connectors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sso_connectors (
    tenant_id character varying(21) NOT NULL,
    id character varying(128) NOT NULL,
    provider_name character varying(128) NOT NULL,
    connector_name character varying(128) NOT NULL,
    config jsonb DEFAULT '{}'::jsonb NOT NULL,
    domains jsonb DEFAULT '[]'::jsonb NOT NULL,
    branding jsonb DEFAULT '{}'::jsonb NOT NULL,
    sync_profile boolean DEFAULT false NOT NULL,
    enable_token_storage boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.sso_connectors OWNER TO postgres;

--
-- Name: subject_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subject_tokens (
    tenant_id character varying(21) NOT NULL,
    id character varying(25) NOT NULL,
    context jsonb DEFAULT '{}'::jsonb NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    consumed_at timestamp with time zone,
    user_id character varying(21) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    creator_id character varying(32) NOT NULL
);


ALTER TABLE public.subject_tokens OWNER TO postgres;

--
-- Name: systems; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.systems (
    key character varying(256) NOT NULL,
    value jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.systems OWNER TO postgres;

--
-- Name: tenants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tenants (
    id character varying(21) NOT NULL,
    db_user character varying(128),
    db_user_password character varying(128),
    name character varying(128) DEFAULT 'My Project'::character varying NOT NULL,
    tag character varying(64) DEFAULT 'development'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    is_suspended boolean DEFAULT false NOT NULL
);


ALTER TABLE public.tenants OWNER TO postgres;

--
-- Name: user_geo_locations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_geo_locations (
    tenant_id character varying(21) NOT NULL,
    user_id character varying(12) NOT NULL,
    latitude numeric(9,6),
    longitude numeric(9,6),
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT user_geo_locations_check CHECK (((latitude IS NULL) = (longitude IS NULL)))
);


ALTER TABLE public.user_geo_locations OWNER TO postgres;

--
-- Name: user_sign_in_countries; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sign_in_countries (
    tenant_id character varying(21) NOT NULL,
    user_id character varying(12) NOT NULL,
    country character varying(16) NOT NULL,
    last_sign_in_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.user_sign_in_countries OWNER TO postgres;

--
-- Name: user_sso_identities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sso_identities (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    user_id character varying(12) NOT NULL,
    issuer character varying(256) NOT NULL,
    identity_id character varying(128) NOT NULL,
    detail jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    sso_connector_id character varying(128) NOT NULL
);


ALTER TABLE public.user_sso_identities OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    tenant_id character varying(21) NOT NULL,
    id character varying(12) NOT NULL,
    username character varying(128),
    primary_email character varying(128),
    primary_phone character varying(128),
    password_encrypted character varying(256),
    password_encryption_method public.users_password_encryption_method,
    name character varying(128),
    avatar character varying(2048),
    profile jsonb DEFAULT '{}'::jsonb NOT NULL,
    application_id character varying(21),
    identities jsonb DEFAULT '{}'::jsonb NOT NULL,
    custom_data jsonb DEFAULT '{}'::jsonb NOT NULL,
    logto_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    mfa_verifications jsonb DEFAULT '[]'::jsonb NOT NULL,
    is_suspended boolean DEFAULT false NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_roles (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL,
    role_id character varying(21) NOT NULL,
    CONSTRAINT users_roles__role_type CHECK (public.check_role_type(role_id, 'User'::public.role_type))
);


ALTER TABLE public.users_roles OWNER TO postgres;

--
-- Name: verification_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_records (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    user_id character varying(21),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL
);


ALTER TABLE public.verification_records OWNER TO postgres;

--
-- Name: verification_statuses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_statuses (
    tenant_id character varying(21) NOT NULL,
    id character varying(21) NOT NULL,
    user_id character varying(21) NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    verified_identifier character varying(255)
);


ALTER TABLE public.verification_statuses OWNER TO postgres;

--
-- Data for Name: account_centers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.account_centers (tenant_id, id, enabled, fields, webauthn_related_origins) FROM stdin;
default	default	f	{}	[]
admin	default	t	{"mfa": "Edit", "name": "Edit", "email": "Edit", "phone": "Edit", "avatar": "Edit", "social": "Edit", "profile": "Edit", "password": "Edit", "username": "Edit", "customData": "Edit"}	[]
\.


--
-- Data for Name: aggregated_daily_active_users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.aggregated_daily_active_users (tenant_id, activity_date, user_id, activity_count) FROM stdin;
\.


--
-- Data for Name: application_secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_secrets (tenant_id, application_id, name, value, created_at, expires_at) FROM stdin;
default	izvpq3u28ztgpc9h80nt3	Default secret	TRC3fqn2SWDzNiIlgzolabgKpYwR78KE	2025-11-09 07:14:00.220548+00	\N
\.


--
-- Data for Name: application_sign_in_experiences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_sign_in_experiences (tenant_id, application_id, color, branding, custom_css, terms_of_use_url, privacy_policy_url, display_name) FROM stdin;
\.


--
-- Data for Name: application_user_consent_organization_resource_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_user_consent_organization_resource_scopes (tenant_id, application_id, scope_id) FROM stdin;
\.


--
-- Data for Name: application_user_consent_organization_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_user_consent_organization_scopes (tenant_id, application_id, organization_scope_id) FROM stdin;
\.


--
-- Data for Name: application_user_consent_organizations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_user_consent_organizations (tenant_id, application_id, organization_id, user_id) FROM stdin;
\.


--
-- Data for Name: application_user_consent_resource_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_user_consent_resource_scopes (tenant_id, application_id, scope_id) FROM stdin;
\.


--
-- Data for Name: application_user_consent_user_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.application_user_consent_user_scopes (tenant_id, application_id, user_scope) FROM stdin;
\.


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (tenant_id, id, name, secret, description, type, oidc_client_metadata, custom_client_metadata, protected_app_metadata, custom_data, is_third_party, created_at) FROM stdin;
admin	oh5c3repil5kztekn8ku9	Cloud Service	vWdfFk0469qekFPYKEGmbVdk0LRIgVLd	Machine to machine application for tenant default	MachineToMachine	{"redirectUris": [], "postLogoutRedirectUris": []}	{"tenantId": "default"}	\N	{}	f	2025-11-09 07:07:58.621675+00
admin	admin-console	Admin Console	s7Mlgh0uZLB98Pio5fUjiG7WHMaDkscQ	Logto Admin Console.	SPA	{"redirectUris": [], "postLogoutRedirectUris": []}	{}	\N	{}	f	2025-11-09 07:07:58.621675+00
admin	m-default	Management API access for default	s7PU4sgNcrqPFYuHOzCy8glLTvJdHqWM	Machine-to-machine app for accessing Management API of tenant 'default'.	MachineToMachine	{"redirectUris": [], "postLogoutRedirectUris": []}	{}	\N	{}	f	2025-11-09 07:07:58.621675+00
admin	m-admin	Management API access for admin	mXRxpaEb7zrCn9Ah0oFstdrwhbvFy5G7	Machine-to-machine app for accessing Management API of tenant 'admin'.	MachineToMachine	{"redirectUris": [], "postLogoutRedirectUris": []}	{}	\N	{}	f	2025-11-09 07:07:58.621675+00
default	izvpq3u28ztgpc9h80nt3	m2m-for-sonix-apis	#internal:QcFz5zv4NyDCmlecyViB9Mw2QEtmHhXo	Machine to machine integration app for the sonix-apis project	MachineToMachine	{"redirectUris": [], "postLogoutRedirectUris": []}	{}	\N	{}	f	2025-11-09 07:14:00.210966+00
default	ba88xzy7rap9hwk9m2di7	dms-client-web	#internal:uz6JHxAXWQqQq01X2kGYxzIyV6IRmnqO	The web UI client app for DMS Sonix	SPA	{"redirectUris": ["http://localhost:3004/callback"], "postLogoutRedirectUris": ["http://localhost:3004/"], "backchannelLogoutSessionRequired": false}	{"idTokenTtl": 3600, "allowTokenExchange": true, "corsAllowedOrigins": [], "rotateRefreshToken": true, "refreshTokenTtlInDays": 14, "alwaysIssueRefreshToken": true}	\N	{}	f	2025-11-09 07:11:09.520137+00
\.


--
-- Data for Name: applications_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications_roles (tenant_id, id, application_id, role_id) FROM stdin;
admin	jh35y512nv3w1gv3g85us	oh5c3repil5kztekn8ku9	39fp9mlzjwnmys0ekcqwk
admin	87ar62ow6jnioob9d35dt	m-default	m-default
admin	d2t5k2pl0fgd7cqk2hhxw	m-admin	m-admin
default	4fd6ba8c4b041845e661a	izvpq3u28ztgpc9h80nt3	admin-role
admin	admin-console-mapi	admin-console	m-admin
\.


--
-- Data for Name: captcha_providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.captcha_providers (tenant_id, id, config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: connectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.connectors (tenant_id, id, sync_profile, enable_token_storage, connector_id, config, metadata, created_at) FROM stdin;
default	ok412xwb1qtx	f	f	simple-mail-transfer-protocol	{"auth": {"pass": "<password>", "type": "login", "user": "<username>"}, "host": "mailpit", "port": 1025, "debug": false, "logger": false, "secure": false, "replyTo": "noreply@dms-sonix.com", "fromEmail": "noreply@dms-sonix.com", "templates": [{"content": "Your Logto sign-in verification code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto Sign In with SMTP", "usageType": "SignIn", "contentType": "text/plain"}, {"content": "Your Logto sign-up verification code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto register with SMTP", "usageType": "Register", "contentType": "text/plain"}, {"content": "Your Logto password change verification code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto Forgot Password with SMTP", "usageType": "ForgotPassword", "contentType": "text/plain"}, {"content": "Your Logto organization invitation code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto OrganizationInvitation with SMTP", "usageType": "OrganizationInvitation", "contentType": "text/plain"}, {"content": "Your Logto verification code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto Generic with SMTP", "usageType": "Generic", "contentType": "text/plain"}, {"content": "Your Logto permission validation code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto UserPermissionValidation with SMTP", "usageType": "UserPermissionValidation", "contentType": "text/plain"}, {"content": "Your Logto new identifier binding code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto BindNewIdentifier with SMTP", "usageType": "BindNewIdentifier", "contentType": "text/plain"}, {"content": "Your Logto MFA verification code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto MfaVerification with SMTP", "usageType": "MfaVerification", "contentType": "text/plain"}, {"content": "Your Logto 2-step verification setup code is {{code}}. The code will remain active for 10 minutes.", "subject": "Logto BindMfa with SMTP", "usageType": "BindMfa", "contentType": "text/plain"}], "disableUrlAccess": false, "disableFileAccess": false}	{}	2025-11-09 07:26:43.864968+00
\.


--
-- Data for Name: custom_phrases; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_phrases (tenant_id, id, language_tag, translation) FROM stdin;
\.


--
-- Data for Name: custom_profile_fields; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.custom_profile_fields (tenant_id, id, name, type, label, description, required, config, created_at, sie_order) FROM stdin;
\.


--
-- Data for Name: domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.domains (tenant_id, id, domain, status, error_message, dns_records, cloudflare_data, updated_at, created_at) FROM stdin;
\.


--
-- Data for Name: email_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.email_templates (tenant_id, id, language_tag, template_type, details, created_at) FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.hooks (tenant_id, id, name, event, events, config, signing_key, enabled, created_at) FROM stdin;
\.


--
-- Data for Name: logto_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.logto_configs (tenant_id, key, value) FROM stdin;
default	oidc.privateKeys	[{"id": "lyexu5rvlfmt23rvp7pxl", "value": "-----BEGIN PRIVATE KEY-----\\nMIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDDJ8KhQE4m24Hb2aeaL\\nbp7chzody689r8fJ1BUdw9deV19+esp6RY1oUkvLRgnvueyhZANiAASPEuj1Fv3P\\np3SeavKowEjAH61E+hiQXZQqP7BAVYcsa4ijkv4gpvU9GDI/s8u9+rlFQXgLX3qV\\n0BK4sVwwLjunVQCNqu7M90xY3QSoo86MAOj+Bjxnwj1VGdUMntFHLi4=\\n-----END PRIVATE KEY-----\\n", "createdAt": 1762672079}]
default	oidc.cookieKeys	[{"id": "pgyytoniefuguwavl3fp5", "value": "kOEv3pJnWxHEGDdMvLED6ddQ9eKP5y0Q", "createdAt": 1762672079}]
admin	oidc.privateKeys	[{"id": "a1tftpxa6n71sjpr3ibm9", "value": "-----BEGIN PRIVATE KEY-----\\nMIG2AgEAMBAGByqGSM49AgEGBSuBBAAiBIGeMIGbAgEBBDCR7nH7Dw5wZij+25Pi\\nrahKMl0wLDHhr/cpYd3b9VhnMA1x3LltKbhUrLndY7LCdvihZANiAATNzHqzEMx0\\neQbZ+TVH1TNoYFfBE19yS2z/ZbWEGZSizlCJ8MSwH/It9CcGlHZyVnTGskGbOmbt\\nO+mG+PfQmvjAfeD4uv+sv1XvAlIPs/HLbMLFxf1esrcqdhuBA6MWRfg=\\n-----END PRIVATE KEY-----\\n", "createdAt": 1762672079}]
admin	oidc.cookieKeys	[{"id": "gszvp80upm7wzyt0v55yd", "value": "q6yDh5B8NMzc1nUGc2Mm4QLIhusAzpKC", "createdAt": 1762672079}]
default	cloudConnection	{"appId": "oh5c3repil5kztekn8ku9", "resource": "https://cloud.logto.io/api", "appSecret": "vWdfFk0469qekFPYKEGmbVdk0LRIgVLd"}
default	adminConsole	{"organizationCreated": false, "signInExperienceCustomized": true}
admin	adminConsole	{"organizationCreated": true, "signInExperienceCustomized": true}
\.


--
-- Data for Name: organization_application_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_application_relations (tenant_id, organization_id, application_id) FROM stdin;
\.


--
-- Data for Name: organization_invitation_role_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_invitation_role_relations (tenant_id, organization_invitation_id, organization_role_id) FROM stdin;
\.


--
-- Data for Name: organization_invitations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_invitations (tenant_id, id, inviter_id, invitee, accepted_user_id, organization_id, status, created_at, updated_at, expires_at) FROM stdin;
\.


--
-- Data for Name: organization_jit_email_domains; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_jit_email_domains (tenant_id, organization_id, email_domain) FROM stdin;
\.


--
-- Data for Name: organization_jit_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_jit_roles (tenant_id, organization_id, organization_role_id) FROM stdin;
\.


--
-- Data for Name: organization_jit_sso_connectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_jit_sso_connectors (tenant_id, organization_id, sso_connector_id) FROM stdin;
\.


--
-- Data for Name: organization_role_application_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_role_application_relations (tenant_id, organization_id, organization_role_id, application_id) FROM stdin;
\.


--
-- Data for Name: organization_role_resource_scope_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_role_resource_scope_relations (tenant_id, organization_role_id, scope_id) FROM stdin;
\.


--
-- Data for Name: organization_role_scope_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_role_scope_relations (tenant_id, organization_role_id, organization_scope_id) FROM stdin;
admin	admin	read-data
admin	admin	write-data
admin	admin	delete-data
admin	admin	read-member
admin	admin	invite-member
admin	admin	remove-member
admin	admin	update-member-role
admin	admin	manage-tenant
admin	collaborator	read-data
admin	collaborator	write-data
admin	collaborator	delete-data
admin	collaborator	read-member
\.


--
-- Data for Name: organization_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.organization_scopes (tenant_id, id, name, description) FROM stdin;
admin	read-data	read:data	Read the tenant data.
admin	write-data	write:data	Write the tenant data, including creating and updating the tenant.
admin	delete-data	delete:data	Delete data of the tenant.
admin	read-member	read:member	Read members of the tenant.
admin	invite-member	invite:member	Invite members to the tenant.
admin	remove-member	remove:member	Remove members from the tenant.
admin	update-member-role	update:member:role	Update the role of a member in the tenant.
admin	manage-tenant	manage:tenant	Manage the tenant settings, including name, billing, etc.
\.


--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resources (tenant_id, id, name, indicator, is_default, access_token_ttl) FROM stdin;
default	management-api	Logto Management API	https://default.logto.app/api	f	3600
admin	1wq3ec1jpdauwos3gwgv2	Logto Management API for tenant default	https://default.logto.app/api	f	3600
admin	bpcooejgw17kyj1z12tq7	Logto Management API for tenant admin	https://admin.logto.app/api	f	3600
admin	l8eg4b18ok6of4rl0n97r	Logto Me API	https://admin.logto.app/me	f	3600
admin	fcxfd6qbuv1ymeo2cc3wz	Logto Cloud API	https://cloud.logto.io/api	f	3600
default	bj50qup9jzqxr62356wvy	dms-client-web	http://localhost:3000/api	f	3600
admin	dms-api-resource	DMS API Resource	http://localhost:3000/api	f	3600
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles (tenant_id, id, name, description, type, is_default) FROM stdin;
default	admin-role	#internal:admin	Internal admin role for Logto tenant default.	MachineToMachine	f
admin	m-default	machine:mapi:default	Machine-to-machine role for accessing Management API of tenant 'default'.	MachineToMachine	f
admin	m-admin	machine:mapi:admin	Machine-to-machine role for accessing Management API of tenant 'admin'.	MachineToMachine	f
admin	txo4upecr0fj8ugjamlot	user	Default role for admin tenant.	User	f
admin	39fp9mlzjwnmys0ekcqwk	tenantApplication	The role for M2M applications that represent a user tenant and send requests to Logto Cloud.	MachineToMachine	f
admin	2jq718eku68lyqblt5n0g	default:admin	Legacy user role for accessing default Management API. Used in OSS only.	User	f
admin	admin-admin-role	admin:admin	User role for accessing admin tenant Management API	User	f
\.


--
-- Data for Name: roles_scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.roles_scopes (tenant_id, id, role_id, scope_id) FROM stdin;
default	fsfhni11uwpxmz7r3uwut	admin-role	management-api-all
admin	l9ucae3yzba0wl36zalmf	m-default	whzek150yp3wwezr7na41
admin	i2bwz5keef1h11607fb2y	m-admin	37j4qlghr6m18eidkbyt4
admin	s35unzmyti0pcbrwwi3pu	txo4upecr0fj8ugjamlot	o0qkbe9icfrfcf9kka6au
admin	cl2ii7fuf8rp37di38ioq	txo4upecr0fj8ugjamlot	7j69jxpugg9sieqqvax5m
admin	lyc8a8ie9w8n4vwcps2kp	txo4upecr0fj8ugjamlot	c08sslrb0prn1kry8o0px
admin	k0baxh2y44qxcz0thul5r	39fp9mlzjwnmys0ekcqwk	tjx7ydjhzn42rhac6ktcd
admin	h9pqfxghvghxeoq477lfi	39fp9mlzjwnmys0ekcqwk	2s91x2ovrrlzi4jvi6vak
admin	uq2mg3dtc77hrk71ipxfm	39fp9mlzjwnmys0ekcqwk	8flzdaqh21b6drxvqm2vo
admin	sxduo2731mc1a27l3qpo3	39fp9mlzjwnmys0ekcqwk	tmm6zuvgq4qovjhkgb93i
admin	3jga8131dp5d2cqbt9buw	2jq718eku68lyqblt5n0g	whzek150yp3wwezr7na41
admin	admin-role-scope	admin-admin-role	37j4qlghr6m18eidkbyt4
\.


--
-- Data for Name: saml_application_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saml_application_configs (application_id, tenant_id, attribute_mapping, entity_id, acs_url, encryption, name_id_format) FROM stdin;
\.


--
-- Data for Name: saml_application_secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saml_application_secrets (id, tenant_id, application_id, private_key, certificate, created_at, expires_at, active) FROM stdin;
\.


--
-- Data for Name: scopes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.scopes (tenant_id, id, resource_id, name, description, created_at) FROM stdin;
default	management-api-all	management-api	all	Default scope for Management API, allows all permissions.	2025-11-09 07:07:58.621675+00
admin	whzek150yp3wwezr7na41	1wq3ec1jpdauwos3gwgv2	all	Default scope for Management API, allows all permissions.	2025-11-09 07:07:58.621675+00
admin	37j4qlghr6m18eidkbyt4	bpcooejgw17kyj1z12tq7	all	Default scope for Management API, allows all permissions.	2025-11-09 07:07:58.621675+00
admin	o0qkbe9icfrfcf9kka6au	l8eg4b18ok6of4rl0n97r	all	Default scope for Me API, allows all permissions.	2025-11-09 07:07:58.621675+00
admin	7j69jxpugg9sieqqvax5m	fcxfd6qbuv1ymeo2cc3wz	create:tenant	Allow creating new tenants.	2025-11-09 07:07:58.621675+00
admin	c08sslrb0prn1kry8o0px	fcxfd6qbuv1ymeo2cc3wz	manage:tenant:self	Allow managing tenant itself, including update and delete.	2025-11-09 07:07:58.621675+00
admin	tjx7ydjhzn42rhac6ktcd	fcxfd6qbuv1ymeo2cc3wz	send:email	Allow sending emails. This scope is only available to M2M application.	2025-11-09 07:07:58.621675+00
admin	2s91x2ovrrlzi4jvi6vak	fcxfd6qbuv1ymeo2cc3wz	send:sms	Allow sending SMS. This scope is only available to M2M application.	2025-11-09 07:07:58.621675+00
admin	8flzdaqh21b6drxvqm2vo	fcxfd6qbuv1ymeo2cc3wz	fetch:custom:jwt	Allow accessing external resource to execute JWT payload customizer script and fetch the parsed token payload.	2025-11-09 07:07:58.621675+00
admin	tmm6zuvgq4qovjhkgb93i	fcxfd6qbuv1ymeo2cc3wz	report:subscription:updates	Allow reporting changes on Stripe subscription to Logto Cloud.	2025-11-09 07:07:58.621675+00
admin	wi1yiz5qo1uydsde23bfb	fcxfd6qbuv1ymeo2cc3wz	create:affiliate	Allow creating new affiliates and logs.	2025-11-09 07:07:58.621675+00
admin	4tbidwkyi83vf2qsjgbdo	fcxfd6qbuv1ymeo2cc3wz	manage:affiliate	Allow managing affiliates, including create, update, and delete.	2025-11-09 07:07:58.621675+00
\.


--
-- Data for Name: secret_enterprise_sso_connector_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.secret_enterprise_sso_connector_relations (tenant_id, secret_id, sso_connector_id, issuer, identity_id) FROM stdin;
\.


--
-- Data for Name: secret_social_connector_relations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.secret_social_connector_relations (tenant_id, secret_id, connector_id, target, identity_id) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.secrets (tenant_id, id, user_id, type, encrypted_dek, iv, auth_tag, ciphertext, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sign_in_experiences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sign_in_experiences (tenant_id, id, color, branding, hide_logto_branding, language_info, terms_of_use_url, privacy_policy_url, agree_to_terms_policy, sign_in, sign_up, social_sign_in, social_sign_in_connector_targets, sign_in_mode, custom_css, custom_content, custom_ui_assets, password_policy, mfa, single_sign_on_enabled, support_email, support_website_url, unknown_session_redirect_url, captcha_policy, sentinel_policy, email_blocklist_policy, forgot_password_methods, passkey_sign_in, adaptive_mfa) FROM stdin;
admin	default	{"primaryColor": "#6139F6", "darkPrimaryColor": "#8768F8", "isDarkModeEnabled": true}	{"logoUrl": "https://logto.io/logo.svg", "darkLogoUrl": "https://logto.io/logo-dark.svg"}	f	{"autoDetect": true, "fallbackLanguage": "en"}	\N	\N	Automatic	{"methods": [{"password": true, "identifier": "username", "verificationCode": false, "isPasswordPrimary": true}]}	{"verify": false, "password": true, "identifiers": ["username"]}	{}	[]	SignIn	\N	{}	\N	{}	{"policy": "NoPrompt", "factors": ["Totp", "WebAuthn", "BackupCode"], "organizationRequiredMfaPolicy": "Mandatory"}	f	\N	\N	\N	{}	{}	{}	[]	{}	{}
default	default	{"primaryColor": "#df4145", "darkPrimaryColor": "#e66b6f", "isDarkModeEnabled": true}	{"favicon": "http://localhost:3004/favicon.ico", "logoUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODUuMSA2OS4wNyI+PGRlZnM+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJNMCAwaDE4NS4xdjY5LjA3SDB6IiBzdHlsZT0iZmlsbDpub25lIi8+PC9jbGlwUGF0aD48c3R5bGU+LmN7ZmlsbDojZGY0MTQ1fS5ke2ZpbGw6IzNjMzkzOH08L3N0eWxlPjwvZGVmcz48ZyBzdHlsZT0iY2xpcC1wYXRoOnVybCgjYSkiPjxwYXRoIGQ9Im01Ni44OCAzOC45LTEzLjM1LTcuNzEtMTQuNTktOC40MmEzLjc0IDMuNzQgMCAwIDEtMS44OC0zLjI1VjguNjhhOC40IDguNCAwIDAgMSAxLTQuMTQgMTAgMTAgMCAwIDEgMS42My0yLjJBNS40NSA1LjQ1IDAgMCAxIDM0LjUuOTJhMTAuNyAxMC43IDAgMCAxIDMuNSAxLjNsMTcuMjUgMTBBMTAuMTcgMTAuMTcgMCAwIDEgNjAuMzkgMjF2MTcuMjlhMS41MiAxLjUyIDAgMCAxLTIuMjggMS4zMlpNMjIuMjggNi40N2wuMDcgMTUuNDEuMDggMTYuNzRhMy45NCAzLjk0IDAgMCAxLTIgMy40M2wtOS4xOCA1LjM2YTkgOSAwIDAgMS00LjYgMS4yNEExMCAxMCAwIDAgMSA1IDQ4LjQ4YTUuODUgNS44NSAwIDAgMS00LjQ2LTQuMjIgMTEgMTEgMCAwIDEtLjQ1LTNMMCAyMS40MmExMC4zOSAxMC4zOSAwIDAgMSA1LjE1LTlsMTMuNjUtOCAuODgtLjUxYTEuNzMgMS43MyAwIDAgMSAyLjYgMS40OFpNMTEuNjQgNTIuNzUgMjQuOTMgNDVsMTQuMzktOC41YTQgNCAwIDAgMSA0IDBsOS4zOCA1LjMzYTguMzYgOC4zNiAwIDAgMSAzLjMgMy4yOGwuMjMuNDRhNiA2IDAgMCAxLS43NiA2LjgxIDExLjIgMTEuMiAwIDAgMS0yLjYgMi4xM2wtMTcuMDUgMTBhMTAuNDcgMTAuNDcgMCAwIDEtMTAuNDcuMDdsLTEzLjctNy43OC0uNzYtLjQzYTEuODEgMS44MSAwIDAgMSAwLTMuMTNaIiBjbGFzcz0iYyIvPjxwYXRoIGQ9Ik03NS41NC42NUg4OS4xdjUwLjIySDc1LjU0ek05NCAuNjVoMjAuNjZjMTUuNSAwIDIzLjc1IDkgMjMuNzUgMjUuMTFzLTguMjUgMjUuMTEtMjMuNzUgMjUuMTFIOTRabTMwLjQ5IDI1LjExYzAtOS42OS0yLjQ0LTEzLjM1LTExLjI2LTEzLjM1aC01LjY3VjM5LjFoNS42N2M4LjgyIDAgMTEuMjYtMy43MyAxMS4yNi0xMy4zNE0xNDAuNjggMzMuMzZoMTQuMTRjLjIxIDMuODEgMi4xNSA3IDcuODkgNyA0LjE2IDAgNy0xLjU3IDctNC43MyAwLTIuMjMtMS40NC0zLjM3LTUuMzEtNC4xNmwtNy4yNS0xLjQ0Yy03LjQ2LTEuNDMtMTUuMTMtNC42Ni0xNS4xMy0xNC42M0MxNDIuMDUgNC44OCAxNTAuOCAwIDE2Mi41NyAwYzEyLjA1IDAgMjAuMzcgNS4xNyAyMC4zNyAxNi42NWgtMTQuMTNjLjI4LTQuMzEtMy4yMy01LjQ2LTYuNi01LjQ2LTQuNTIgMC01Ljg5IDIuMy01Ljg5IDQuMjQgMCAxLjI5LjcyIDMuMDggNCAzLjhsNi40NiAxLjI5YzEzLjQxIDIuNjUgMTcuMzYgNy43NSAxNy4zNiAxNS4wNyAwIDExLjY5LTEwLjEyIDE2LTIxLjUyIDE2LTEzLjIgMC0yMi02LTIyLTE4LjIzTTc1Ljc3IDU5Ljk5aDEuMDR2N2gtMS4wNHpNODAgNjIuNTRBMS4zMSAxLjMxIDAgMCAwIDc4LjU4IDY0djNoLTF2LTUuMmgxdjFhMS42OSAxLjY5IDAgMCAxIDEuNzUtMS4xNGMxIDAgMS44NC41OSAxLjg0IDIuMDZWNjdoLTF2LTNjMC0uOTMtLjQtMS40NC0xLjIyLTEuNDR9IiBjbGFzcz0iZCIvPjwvZz48L3N2Zz4=", "darkLogoUrl": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODUuMSA2OS4wNyIgdmVyc2lvbj0iMS4xIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGRlZnM+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJNMCAwaDE4NS4xdjY5LjA3SDB6IiBzdHlsZT0iZmlsbDpub25lIj48L3BhdGg+PC9jbGlwUGF0aD48c3R5bGU+LmN7ZmlsbDojZGY0MTQ1fS5ke2ZpbGw6I0YwRjBGMH08L3N0eWxlPjwvZGVmcz48ZyBzdHlsZT0iY2xpcC1wYXRoOnVybCgjYSkiPjxwYXRoIGQ9Im01Ni44OCAzOC45LTEzLjM1LTcuNzEtMTQuNTktOC40MmEzLjc0IDMuNzQgMCAwIDEtMS44OC0zLjI1VjguNjhhOC40IDguNCAwIDAgMSAxLTQuMTQgMTAgMTAgMCAwIDEgMS42My0yLjJBNS40NSA1LjQ1IDAgMCAxIDM0LjUuOTJhMTAuNyAxMC43IDAgMCAxIDMuNSAxLjNsMTcuMjUgMTBBMTAuMTcgMTAuMTcgMCAwIDEgNjAuMzkgMjF2MTcuMjlhMS41MiAxLjUyIDAgMCAxLTIuMjggMS4zMlpNMjIuMjggNi40N2wuMDcgMTUuNDEuMDggMTYuNzRhMy45NCAzLjk0IDAgMCAxLTIgMy40M2wtOS4xOCA1LjM2YTkgOSAwIDAgMS00LjYgMS4yNEExMCAxMCAwIDAgMSA1IDQ4LjQ4YTUuODUgNS44NSAwIDAgMS00LjQ2LTQuMjIgMTEgMTEgMCAwIDEtLjQ1LTNMMCAyMS40MmExMC4zOSAxMC4zOSAwIDAgMSA1LjE1LTlsMTMuNjUtOCAuODgtLjUxYTEuNzMgMS43MyAwIDAgMSAyLjYgMS40OFpNMTEuNjQgNTIuNzUgMjQuOTMgNDVsMTQuMzktOC41YTQgNCAwIDAgMSA0IDBsOS4zOCA1LjMzYTguMzYgOC4zNiAwIDAgMSAzLjMgMy4yOGwuMjMuNDRhNiA2IDAgMCAxLS43NiA2LjgxIDExLjIgMTEuMiAwIDAgMS0yLjYgMi4xM2wtMTcuMDUgMTBhMTAuNDcgMTAuNDcgMCAwIDEtMTAuNDcuMDdsLTEzLjctNy43OC0uNzYtLjQzYTEuODEgMS44MSAwIDAgMSAwLTMuMTNaIiBjbGFzcz0iZCIvPjwvZz48L3N2Zz4="}	f	{"autoDetect": true, "fallbackLanguage": "en"}	\N	\N	Automatic	{"methods": [{"password": true, "identifier": "email", "verificationCode": false, "isPasswordPrimary": true}]}	{"verify": true, "password": true, "identifiers": ["email"], "secondaryIdentifiers": []}	{}	[]	SignIn	\N	{}	\N	{}	{"policy": "UserControlled", "factors": []}	f	\N	\N	\N	{}	{}	{}	["EmailVerificationCode"]	{}	{}
\.


--
-- Data for Name: sso_connector_idp_initiated_auth_configs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sso_connector_idp_initiated_auth_configs (tenant_id, connector_id, default_application_id, redirect_uri, auth_parameters, auto_send_authorization_request, client_idp_initiated_auth_callback_uri, created_at) FROM stdin;
\.


--
-- Data for Name: sso_connectors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sso_connectors (tenant_id, id, provider_name, connector_name, config, domains, branding, sync_profile, enable_token_storage, created_at) FROM stdin;
\.


--
-- Data for Name: systems; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.systems (key, value) FROM stdin;
alterationState	{"timestamp": 1769172677, "updatedAt": "2026-03-14T23:49:58.812Z"}
\.


--
-- Data for Name: tenants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tenants (id, db_user, db_user_password, name, tag, created_at, is_suspended) FROM stdin;
default	logto_tenant_logto_db_default	9of2s4si8u6gg7i9r9zz2ww4e8zh9xs8	My Project	development	2025-11-09 07:07:58.621675+00	f
admin	logto_tenant_logto_db_admin	4v0c7du2f3wkk94ujn1gp3rq5emwn48n	My Project	development	2025-11-09 07:07:58.621675+00	f
\.


--
-- Data for Name: user_geo_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_geo_locations (tenant_id, user_id, latitude, longitude, updated_at) FROM stdin;
\.


--
-- Data for Name: user_sign_in_countries; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sign_in_countries (tenant_id, user_id, country, last_sign_in_at) FROM stdin;
\.


--
-- Data for Name: user_sso_identities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.user_sso_identities (tenant_id, id, user_id, issuer, identity_id, detail, created_at, updated_at, sso_connector_id) FROM stdin;
\.


--
-- Name: account_centers account_centers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_centers
    ADD CONSTRAINT account_centers_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: aggregated_daily_active_users aggregated_daily_active_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.aggregated_daily_active_users
    ADD CONSTRAINT aggregated_daily_active_users_pkey PRIMARY KEY (tenant_id, activity_date, user_id);


--
-- Name: application_secrets application_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_secrets
    ADD CONSTRAINT application_secrets_pkey PRIMARY KEY (tenant_id, application_id, name);


--
-- Name: application_sign_in_experiences application_sign_in_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_sign_in_experiences
    ADD CONSTRAINT application_sign_in_experiences_pkey PRIMARY KEY (tenant_id, application_id);


--
-- Name: application_user_consent_organization_resource_scopes application_user_consent_organization_resource_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_resource_scopes
    ADD CONSTRAINT application_user_consent_organization_resource_scopes_pkey PRIMARY KEY (application_id, scope_id);


--
-- Name: application_user_consent_organization_scopes application_user_consent_organization_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_scopes
    ADD CONSTRAINT application_user_consent_organization_scopes_pkey PRIMARY KEY (application_id, organization_scope_id);


--
-- Name: application_user_consent_organizations application_user_consent_organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organizations
    ADD CONSTRAINT application_user_consent_organizations_pkey PRIMARY KEY (tenant_id, application_id, organization_id, user_id);


--
-- Name: application_user_consent_resource_scopes application_user_consent_resource_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_resource_scopes
    ADD CONSTRAINT application_user_consent_resource_scopes_pkey PRIMARY KEY (application_id, scope_id);


--
-- Name: application_user_consent_user_scopes application_user_consent_user_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_user_scopes
    ADD CONSTRAINT application_user_consent_user_scopes_pkey PRIMARY KEY (application_id, user_scope);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: applications_roles applications_roles__application_id_role_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications_roles
    ADD CONSTRAINT applications_roles__application_id_role_id UNIQUE (tenant_id, application_id, role_id);


--
-- Name: applications_roles applications_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications_roles
    ADD CONSTRAINT applications_roles_pkey PRIMARY KEY (id);


--
-- Name: captcha_providers captcha_providers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.captcha_providers
    ADD CONSTRAINT captcha_providers_pkey PRIMARY KEY (id);


--
-- Name: captcha_providers captcha_providers_tenant_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.captcha_providers
    ADD CONSTRAINT captcha_providers_tenant_id_key UNIQUE (tenant_id);


--
-- Name: connectors connectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connectors
    ADD CONSTRAINT connectors_pkey PRIMARY KEY (id);


--
-- Name: custom_phrases custom_phrases__language_tag; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_phrases
    ADD CONSTRAINT custom_phrases__language_tag UNIQUE (tenant_id, language_tag);


--
-- Name: custom_phrases custom_phrases_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_phrases
    ADD CONSTRAINT custom_phrases_pkey PRIMARY KEY (id);


--
-- Name: custom_profile_fields custom_profile_fields__name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_profile_fields
    ADD CONSTRAINT custom_profile_fields__name UNIQUE (tenant_id, name);


--
-- Name: custom_profile_fields custom_profile_fields_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_profile_fields
    ADD CONSTRAINT custom_profile_fields_pkey PRIMARY KEY (id);


--
-- Name: daily_active_users daily_active_users__user_id_date; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_active_users
    ADD CONSTRAINT daily_active_users__user_id_date UNIQUE (user_id, date);


--
-- Name: daily_active_users daily_active_users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_active_users
    ADD CONSTRAINT daily_active_users_pkey PRIMARY KEY (id);


--
-- Name: daily_token_usage daily_token_usage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.daily_token_usage
    ADD CONSTRAINT daily_token_usage_pkey PRIMARY KEY (id);


--
-- Name: domains domains__domain; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains__domain UNIQUE (tenant_id, domain);


--
-- Name: domains domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_pkey PRIMARY KEY (id);


--
-- Name: email_templates email_templates__tenant_id__language_tag__template_type; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates__tenant_id__language_tag__template_type UNIQUE (tenant_id, language_tag, template_type);


--
-- Name: email_templates email_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: hooks hooks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hooks
    ADD CONSTRAINT hooks_pkey PRIMARY KEY (id);


--
-- Name: idp_initiated_saml_sso_sessions idp_initiated_saml_sso_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idp_initiated_saml_sso_sessions
    ADD CONSTRAINT idp_initiated_saml_sso_sessions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: logs logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_pkey PRIMARY KEY (id);


--
-- Name: logto_configs logto_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logto_configs
    ADD CONSTRAINT logto_configs_pkey PRIMARY KEY (tenant_id, key);


--
-- Name: oidc_model_instances oidc_model_instances__model_name_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oidc_model_instances
    ADD CONSTRAINT oidc_model_instances__model_name_id UNIQUE (tenant_id, model_name, id);


--
-- Name: oidc_model_instances oidc_model_instances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oidc_model_instances
    ADD CONSTRAINT oidc_model_instances_pkey PRIMARY KEY (id);


--
-- Name: oidc_session_extensions oidc_session_extensions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oidc_session_extensions
    ADD CONSTRAINT oidc_session_extensions_pkey PRIMARY KEY (tenant_id, session_uid);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: organization_application_relations organization_application_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_application_relations
    ADD CONSTRAINT organization_application_relations_pkey PRIMARY KEY (tenant_id, organization_id, application_id);


--
-- Name: organization_invitation_role_relations organization_invitation_role_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitation_role_relations
    ADD CONSTRAINT organization_invitation_role_relations_pkey PRIMARY KEY (tenant_id, organization_invitation_id, organization_role_id);


--
-- Name: organization_invitations organization_invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_pkey PRIMARY KEY (id);


--
-- Name: organization_jit_email_domains organization_jit_email_domains_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_email_domains
    ADD CONSTRAINT organization_jit_email_domains_pkey PRIMARY KEY (tenant_id, organization_id, email_domain);


--
-- Name: organization_jit_roles organization_jit_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_roles
    ADD CONSTRAINT organization_jit_roles_pkey PRIMARY KEY (tenant_id, organization_id, organization_role_id);


--
-- Name: organization_jit_sso_connectors organization_jit_sso_connectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_sso_connectors
    ADD CONSTRAINT organization_jit_sso_connectors_pkey PRIMARY KEY (tenant_id, organization_id, sso_connector_id);


--
-- Name: organization_role_application_relations organization_role_application_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_application_relations
    ADD CONSTRAINT organization_role_application_relations_pkey PRIMARY KEY (tenant_id, organization_id, organization_role_id, application_id);


--
-- Name: organization_role_resource_scope_relations organization_role_resource_scope_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_resource_scope_relations
    ADD CONSTRAINT organization_role_resource_scope_relations_pkey PRIMARY KEY (tenant_id, organization_role_id, scope_id);


--
-- Name: organization_role_scope_relations organization_role_scope_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_scope_relations
    ADD CONSTRAINT organization_role_scope_relations_pkey PRIMARY KEY (tenant_id, organization_role_id, organization_scope_id);


--
-- Name: organization_role_user_relations organization_role_user_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_user_relations
    ADD CONSTRAINT organization_role_user_relations_pkey PRIMARY KEY (tenant_id, organization_id, organization_role_id, user_id);


--
-- Name: organization_roles organization_roles__name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_roles
    ADD CONSTRAINT organization_roles__name UNIQUE (tenant_id, name);


--
-- Name: organization_roles organization_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_roles
    ADD CONSTRAINT organization_roles_pkey PRIMARY KEY (id);


--
-- Name: organization_scopes organization_scopes__name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_scopes
    ADD CONSTRAINT organization_scopes__name UNIQUE (tenant_id, name);


--
-- Name: organization_scopes organization_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_scopes
    ADD CONSTRAINT organization_scopes_pkey PRIMARY KEY (id);


--
-- Name: organization_user_relations organization_user_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_user_relations
    ADD CONSTRAINT organization_user_relations_pkey PRIMARY KEY (tenant_id, organization_id, user_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: passcodes passcodes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passcodes
    ADD CONSTRAINT passcodes_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (tenant_id, user_id, name);


--
-- Name: resources resources__indicator; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources__indicator UNIQUE (tenant_id, indicator);


--
-- Name: resources resources_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_pkey PRIMARY KEY (id);


--
-- Name: roles roles__name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles__name UNIQUE (tenant_id, name);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: roles_scopes roles_scopes__role_id_scope_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_scopes
    ADD CONSTRAINT roles_scopes__role_id_scope_id UNIQUE (tenant_id, role_id, scope_id);


--
-- Name: roles_scopes roles_scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_scopes
    ADD CONSTRAINT roles_scopes_pkey PRIMARY KEY (id);


--
-- Name: saml_application_configs saml_application_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_configs
    ADD CONSTRAINT saml_application_configs_pkey PRIMARY KEY (tenant_id, application_id);


--
-- Name: saml_application_secrets saml_application_secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_secrets
    ADD CONSTRAINT saml_application_secrets_pkey PRIMARY KEY (tenant_id, application_id, id);


--
-- Name: saml_application_sessions saml_application_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_sessions
    ADD CONSTRAINT saml_application_sessions_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: scopes scopes__resource_id_name; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scopes
    ADD CONSTRAINT scopes__resource_id_name UNIQUE (tenant_id, resource_id, name);


--
-- Name: scopes scopes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scopes
    ADD CONSTRAINT scopes_pkey PRIMARY KEY (id);


--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connector_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_enterprise_sso_connector_relations
    ADD CONSTRAINT secret_enterprise_sso_connector_relations_pkey PRIMARY KEY (tenant_id, secret_id);


--
-- Name: secret_social_connector_relations secret_social_connector_relations__target__identity_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_social_connector_relations
    ADD CONSTRAINT secret_social_connector_relations__target__identity_id UNIQUE (tenant_id, target, identity_id);


--
-- Name: secret_social_connector_relations secret_social_connector_relations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_social_connector_relations
    ADD CONSTRAINT secret_social_connector_relations_pkey PRIMARY KEY (tenant_id, secret_id);


--
-- Name: secrets secrets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secrets
    ADD CONSTRAINT secrets_pkey PRIMARY KEY (id);


--
-- Name: sentinel_activities sentinel_activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sentinel_activities
    ADD CONSTRAINT sentinel_activities_pkey PRIMARY KEY (id);


--
-- Name: service_logs service_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.service_logs
    ADD CONSTRAINT service_logs_pkey PRIMARY KEY (id);


--
-- Name: sign_in_experiences sign_in_experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_in_experiences
    ADD CONSTRAINT sign_in_experiences_pkey PRIMARY KEY (tenant_id, id);


--
-- Name: sso_connector_idp_initiated_auth_configs sso_connector_idp_initiated_auth_configs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connector_idp_initiated_auth_configs
    ADD CONSTRAINT sso_connector_idp_initiated_auth_configs_pkey PRIMARY KEY (tenant_id, connector_id);


--
-- Name: sso_connectors sso_connectors__connector_name__unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connectors
    ADD CONSTRAINT sso_connectors__connector_name__unique UNIQUE (tenant_id, connector_name);


--
-- Name: sso_connectors sso_connectors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connectors
    ADD CONSTRAINT sso_connectors_pkey PRIMARY KEY (id);


--
-- Name: subject_tokens subject_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_tokens
    ADD CONSTRAINT subject_tokens_pkey PRIMARY KEY (id);


--
-- Name: systems systems_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.systems
    ADD CONSTRAINT systems_pkey PRIMARY KEY (key);


--
-- Name: tenants tenants__db_user; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants__db_user UNIQUE (db_user);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: user_geo_locations user_geo_locations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_geo_locations
    ADD CONSTRAINT user_geo_locations_pkey PRIMARY KEY (tenant_id, user_id);


--
-- Name: user_sign_in_countries user_sign_in_countries_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sign_in_countries
    ADD CONSTRAINT user_sign_in_countries_pkey PRIMARY KEY (tenant_id, user_id, country);


--
-- Name: user_sso_identities user_sso_identities__issuer__identity_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sso_identities
    ADD CONSTRAINT user_sso_identities__issuer__identity_id UNIQUE (tenant_id, issuer, identity_id);


--
-- Name: user_sso_identities user_sso_identities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sso_identities
    ADD CONSTRAINT user_sso_identities_pkey PRIMARY KEY (id);


--
-- Name: users users__primary_email; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users__primary_email UNIQUE (tenant_id, primary_email);


--
-- Name: users users__primary_phone; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users__primary_phone UNIQUE (tenant_id, primary_phone);


--
-- Name: users users__username; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users__username UNIQUE (tenant_id, username);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users_roles users_roles__user_id_role_id; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles__user_id_role_id UNIQUE (tenant_id, user_id, role_id);


--
-- Name: users_roles users_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_pkey PRIMARY KEY (id);


--
-- Name: verification_records verification_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_records
    ADD CONSTRAINT verification_records_pkey PRIMARY KEY (id);


--
-- Name: verification_statuses verification_statuses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_statuses
    ADD CONSTRAINT verification_statuses_pkey PRIMARY KEY (id);


--
-- Name: aggregated_daily_active_users__tenant_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX aggregated_daily_active_users__tenant_date ON public.aggregated_daily_active_users USING btree (tenant_id, activity_date);


--
-- Name: aggregated_daily_active_users__tenant_user_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX aggregated_daily_active_users__tenant_user_date ON public.aggregated_daily_active_users USING btree (tenant_id, user_id, activity_date DESC);


--
-- Name: applications__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications__id ON public.applications USING btree (tenant_id, id);


--
-- Name: applications__is_third_party; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications__is_third_party ON public.applications USING btree (tenant_id, is_third_party);


--
-- Name: applications__protected_app_metadata_custom_domain; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX applications__protected_app_metadata_custom_domain ON public.applications USING btree (((((protected_app_metadata -> 'customDomains'::text) -> 0) ->> 'domain'::text)));


--
-- Name: applications__protected_app_metadata_host; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX applications__protected_app_metadata_host ON public.applications USING btree (((protected_app_metadata ->> 'host'::text)));


--
-- Name: applications__type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications__type ON public.applications USING btree (tenant_id, type);


--
-- Name: applications_roles__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications_roles__id ON public.applications_roles USING btree (tenant_id, id);


--
-- Name: captcha_providers__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX captcha_providers__id ON public.captcha_providers USING btree (tenant_id, id);


--
-- Name: connectors__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX connectors__id ON public.connectors USING btree (tenant_id, id);


--
-- Name: custom_phrases__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX custom_phrases__id ON public.custom_phrases USING btree (tenant_id, id);


--
-- Name: daily_active_users__date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX daily_active_users__date ON public.daily_active_users USING btree (tenant_id, date);


--
-- Name: daily_active_users__date_brin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX daily_active_users__date_brin ON public.daily_active_users USING brin (date);


--
-- Name: daily_active_users__tenant_date_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX daily_active_users__tenant_date_user ON public.daily_active_users USING btree (tenant_id, date, user_id);


--
-- Name: daily_token_usage__date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX daily_token_usage__date ON public.daily_token_usage USING btree (tenant_id, date);


--
-- Name: domains__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX domains__id ON public.domains USING btree (tenant_id, id);


--
-- Name: email_templates__tenant_id__language_tag; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_templates__tenant_id__language_tag ON public.email_templates USING btree (tenant_id, language_tag);


--
-- Name: email_templates__tenant_id__template_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX email_templates__tenant_id__template_type ON public.email_templates USING btree (tenant_id, template_type);


--
-- Name: hooks__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX hooks__id ON public.hooks USING btree (tenant_id, id);


--
-- Name: logs__application_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX logs__application_id ON public.logs USING btree (tenant_id, ((payload ->> 'applicationId'::text)));


--
-- Name: logs__created_at_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX logs__created_at_id ON public.logs USING btree (tenant_id, created_at, id);


--
-- Name: logs__hook_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX logs__hook_id ON public.logs USING btree (tenant_id, ((payload ->> 'hookId'::text)));


--
-- Name: logs__key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX logs__key ON public.logs USING btree (tenant_id, key);


--
-- Name: logs__user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX logs__user_id ON public.logs USING btree (tenant_id, ((payload ->> 'userId'::text)));


--
-- Name: oidc_model_instances__model_name_payload_grant_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX oidc_model_instances__model_name_payload_grant_id ON public.oidc_model_instances USING btree (tenant_id, model_name, ((payload ->> 'grantId'::text)));


--
-- Name: oidc_model_instances__model_name_payload_uid; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX oidc_model_instances__model_name_payload_uid ON public.oidc_model_instances USING btree (tenant_id, model_name, ((payload ->> 'uid'::text)));


--
-- Name: oidc_model_instances__model_name_payload_user_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX oidc_model_instances__model_name_payload_user_code ON public.oidc_model_instances USING btree (tenant_id, model_name, ((payload ->> 'userCode'::text)));


--
-- Name: one_time_token__email_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX one_time_token__email_status ON public.one_time_tokens USING btree (tenant_id, email, status);


--
-- Name: one_time_token__token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX one_time_token__token ON public.one_time_tokens USING btree (tenant_id, token);


--
-- Name: organization_invitations__invitee_organization_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX organization_invitations__invitee_organization_id ON public.organization_invitations USING btree (tenant_id, invitee, organization_id) WHERE (status = 'Pending'::public.organization_invitation_status);


--
-- Name: organization_roles__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organization_roles__id ON public.organization_roles USING btree (tenant_id, id);


--
-- Name: organization_roles__type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organization_roles__type ON public.organization_roles USING btree (tenant_id, type);


--
-- Name: organization_scopes__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organization_scopes__id ON public.organization_scopes USING btree (tenant_id, id);


--
-- Name: organizations__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organizations__id ON public.organizations USING btree (tenant_id, id);


--
-- Name: passcodes__email_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX passcodes__email_type ON public.passcodes USING btree (tenant_id, email, type);


--
-- Name: passcodes__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX passcodes__id ON public.passcodes USING btree (tenant_id, id);


--
-- Name: passcodes__interaction_jti_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX passcodes__interaction_jti_type ON public.passcodes USING btree (tenant_id, interaction_jti, type);


--
-- Name: passcodes__phone_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX passcodes__phone_type ON public.passcodes USING btree (tenant_id, phone, type);


--
-- Name: personal_access_token__value; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_token__value ON public.personal_access_tokens USING btree (tenant_id, value);


--
-- Name: resources__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resources__id ON public.resources USING btree (tenant_id, id);


--
-- Name: resources__is_default_true; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX resources__is_default_true ON public.resources USING btree (tenant_id) WHERE (is_default = true);


--
-- Name: roles__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles__id ON public.roles USING btree (tenant_id, id);


--
-- Name: roles__type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles__type ON public.roles USING btree (tenant_id, type);


--
-- Name: roles_scopes__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles_scopes__id ON public.roles_scopes USING btree (tenant_id, id);


--
-- Name: saml_application_secrets__unique_active_secret; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX saml_application_secrets__unique_active_secret ON public.saml_application_secrets USING btree (tenant_id, application_id, active) WHERE active;


--
-- Name: scopes__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX scopes__id ON public.scopes USING btree (tenant_id, id);


--
-- Name: sentinel_activities__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sentinel_activities__id ON public.sentinel_activities USING btree (tenant_id, id);


--
-- Name: sentinel_activities__target_type_target_hash; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sentinel_activities__target_type_target_hash ON public.sentinel_activities USING btree (tenant_id, target_type, target_hash);


--
-- Name: sentinel_activities__target_type_target_hash_action_action_resu; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sentinel_activities__target_type_target_hash_action_action_resu ON public.sentinel_activities USING btree (tenant_id, target_type, target_hash, action, action_result, decision);


--
-- Name: service_logs__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_logs__id ON public.service_logs USING btree (id);


--
-- Name: service_logs__tenant_id__type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX service_logs__tenant_id__type ON public.service_logs USING btree (tenant_id, type);


--
-- Name: sso_connectors__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sso_connectors__id ON public.sso_connectors USING btree (tenant_id, id);


--
-- Name: sso_connectors__id__provider_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sso_connectors__id__provider_name ON public.sso_connectors USING btree (tenant_id, id, provider_name);


--
-- Name: subject_token__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX subject_token__id ON public.subject_tokens USING btree (tenant_id, id);


--
-- Name: user_sign_in_countries__tenant_user_last_sign_in_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_sign_in_countries__tenant_user_last_sign_in_at ON public.user_sign_in_countries USING btree (tenant_id, user_id, last_sign_in_at DESC);


--
-- Name: users__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users__id ON public.users USING btree (tenant_id, id);


--
-- Name: users__name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users__name ON public.users USING btree (tenant_id, name);


--
-- Name: users_mfa_verifications_gin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_mfa_verifications_gin ON public.users USING gin (mfa_verifications jsonb_path_ops);


--
-- Name: users_roles__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_roles__id ON public.users_roles USING btree (tenant_id, id);


--
-- Name: verification_records__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_records__id ON public.verification_records USING btree (tenant_id, id);


--
-- Name: verification_statuses__id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_statuses__id ON public.verification_statuses USING btree (tenant_id, id);


--
-- Name: verification_statuses__user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_statuses__user_id ON public.verification_statuses USING btree (tenant_id, user_id);


--
-- Name: custom_profile_fields custom_profile_fields__increment_sie_order; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER custom_profile_fields__increment_sie_order BEFORE INSERT ON public.custom_profile_fields FOR EACH ROW EXECUTE FUNCTION public.custom_profile_fields__increment_sie_order();


--
-- Name: user_sso_identities delete_secret_before_sso_identity_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_secret_before_sso_identity_delete BEFORE DELETE ON public.user_sso_identities FOR EACH ROW EXECUTE FUNCTION public.delete_secret_on_sso_identity_delete();


--
-- Name: connectors delete_secrets_before_social_connector_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_secrets_before_social_connector_delete BEFORE DELETE ON public.connectors FOR EACH ROW EXECUTE FUNCTION public.delete_secrets_on_social_connector_delete();


--
-- Name: users delete_secrets_before_social_identity_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_secrets_before_social_identity_delete BEFORE UPDATE OF identities ON public.users FOR EACH ROW EXECUTE FUNCTION public.delete_secrets_on_social_identity_delete();


--
-- Name: sso_connectors delete_secrets_before_sso_connector_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER delete_secrets_before_sso_connector_delete BEFORE DELETE ON public.sso_connectors FOR EACH ROW EXECUTE FUNCTION public.delete_secrets_on_sso_connector_delete();


--
-- Name: account_centers set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.account_centers FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: aggregated_daily_active_users set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.aggregated_daily_active_users FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_secrets set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_secrets FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_sign_in_experiences set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_sign_in_experiences FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_user_consent_organization_resource_scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_user_consent_organization_resource_scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_user_consent_organization_scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_user_consent_organization_scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_user_consent_organizations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_user_consent_organizations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_user_consent_resource_scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_user_consent_resource_scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: application_user_consent_user_scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.application_user_consent_user_scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: applications set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.applications FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: applications_roles set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.applications_roles FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: captcha_providers set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.captcha_providers FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: connectors set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.connectors FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: custom_phrases set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.custom_phrases FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: custom_profile_fields set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.custom_profile_fields FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: daily_active_users set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.daily_active_users FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: daily_token_usage set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.daily_token_usage FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: domains set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.domains FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: email_templates set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: hooks set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.hooks FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: idp_initiated_saml_sso_sessions set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.idp_initiated_saml_sso_sessions FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: logs set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.logs FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: logto_configs set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.logto_configs FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: oidc_model_instances set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.oidc_model_instances FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: oidc_session_extensions set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.oidc_session_extensions FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: one_time_tokens set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.one_time_tokens FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_application_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_application_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_invitation_role_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_invitation_role_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_invitations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_invitations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_jit_email_domains set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_jit_email_domains FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_jit_roles set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_jit_roles FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_jit_sso_connectors set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_jit_sso_connectors FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_role_application_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_role_application_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_role_resource_scope_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_role_resource_scope_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_role_scope_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_role_scope_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_role_user_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_role_user_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_roles set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_roles FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organization_user_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organization_user_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: organizations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: passcodes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.passcodes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: personal_access_tokens set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.personal_access_tokens FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: resources set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.resources FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: roles set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: roles_scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.roles_scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: saml_application_configs set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.saml_application_configs FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: saml_application_secrets set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.saml_application_secrets FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: saml_application_sessions set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.saml_application_sessions FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: scopes set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.scopes FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: secret_enterprise_sso_connector_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.secret_enterprise_sso_connector_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: secret_social_connector_relations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.secret_social_connector_relations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: secrets set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.secrets FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: sentinel_activities set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.sentinel_activities FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: sign_in_experiences set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.sign_in_experiences FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: sso_connector_idp_initiated_auth_configs set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.sso_connector_idp_initiated_auth_configs FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: sso_connectors set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.sso_connectors FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: subject_tokens set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.subject_tokens FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: user_geo_locations set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.user_geo_locations FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: user_sign_in_countries set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.user_sign_in_countries FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: user_sso_identities set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.user_sso_identities FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: users set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: users_roles set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.users_roles FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: verification_records set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.verification_records FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: verification_statuses set_tenant_id; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_tenant_id BEFORE INSERT ON public.verification_statuses FOR EACH ROW EXECUTE FUNCTION public.set_tenant_id();


--
-- Name: oidc_session_extensions set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.oidc_session_extensions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: secrets set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.secrets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: user_sso_identities set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_sso_identities FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: users set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


--
-- Name: account_centers account_centers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.account_centers
    ADD CONSTRAINT account_centers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_secrets application_secrets_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_secrets
    ADD CONSTRAINT application_secrets_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_secrets application_secrets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_secrets
    ADD CONSTRAINT application_secrets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_sign_in_experiences application_sign_in_experiences_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_sign_in_experiences
    ADD CONSTRAINT application_sign_in_experiences_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_sign_in_experiences application_sign_in_experiences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_sign_in_experiences
    ADD CONSTRAINT application_sign_in_experiences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organizations application_user_consent_orga_tenant_id_organization_id_us_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organizations
    ADD CONSTRAINT application_user_consent_orga_tenant_id_organization_id_us_fkey FOREIGN KEY (tenant_id, organization_id, user_id) REFERENCES public.organization_user_relations(tenant_id, organization_id, user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organization_scopes application_user_consent_organizatio_organization_scope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_scopes
    ADD CONSTRAINT application_user_consent_organizatio_organization_scope_id_fkey FOREIGN KEY (organization_scope_id) REFERENCES public.organization_scopes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organization_resource_scopes application_user_consent_organization_resou_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_resource_scopes
    ADD CONSTRAINT application_user_consent_organization_resou_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organization_resource_scopes application_user_consent_organization_resource_s_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_resource_scopes
    ADD CONSTRAINT application_user_consent_organization_resource_s_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organization_resource_scopes application_user_consent_organization_resource_sc_scope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_resource_scopes
    ADD CONSTRAINT application_user_consent_organization_resource_sc_scope_id_fkey FOREIGN KEY (scope_id) REFERENCES public.scopes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organization_scopes application_user_consent_organization_scope_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_scopes
    ADD CONSTRAINT application_user_consent_organization_scope_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organization_scopes application_user_consent_organization_scopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organization_scopes
    ADD CONSTRAINT application_user_consent_organization_scopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organizations application_user_consent_organizations_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organizations
    ADD CONSTRAINT application_user_consent_organizations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_organizations application_user_consent_organizations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_organizations
    ADD CONSTRAINT application_user_consent_organizations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_resource_scopes application_user_consent_resource_scopes_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_resource_scopes
    ADD CONSTRAINT application_user_consent_resource_scopes_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_resource_scopes application_user_consent_resource_scopes_scope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_resource_scopes
    ADD CONSTRAINT application_user_consent_resource_scopes_scope_id_fkey FOREIGN KEY (scope_id) REFERENCES public.scopes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_resource_scopes application_user_consent_resource_scopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_resource_scopes
    ADD CONSTRAINT application_user_consent_resource_scopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_user_scopes application_user_consent_user_scopes_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_user_scopes
    ADD CONSTRAINT application_user_consent_user_scopes_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: application_user_consent_user_scopes application_user_consent_user_scopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.application_user_consent_user_scopes
    ADD CONSTRAINT application_user_consent_user_scopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications_roles applications_roles_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications_roles
    ADD CONSTRAINT applications_roles_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications_roles applications_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications_roles
    ADD CONSTRAINT applications_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications_roles applications_roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications_roles
    ADD CONSTRAINT applications_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: applications applications_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: captcha_providers captcha_providers_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.captcha_providers
    ADD CONSTRAINT captcha_providers_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: connectors connectors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.connectors
    ADD CONSTRAINT connectors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: custom_phrases custom_phrases_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_phrases
    ADD CONSTRAINT custom_phrases_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: custom_profile_fields custom_profile_fields_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.custom_profile_fields
    ADD CONSTRAINT custom_profile_fields_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: domains domains_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.domains
    ADD CONSTRAINT domains_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: email_templates email_templates_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.email_templates
    ADD CONSTRAINT email_templates_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: hooks hooks_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.hooks
    ADD CONSTRAINT hooks_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: idp_initiated_saml_sso_sessions idp_initiated_saml_sso_sessions_connector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idp_initiated_saml_sso_sessions
    ADD CONSTRAINT idp_initiated_saml_sso_sessions_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES public.sso_connectors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: idp_initiated_saml_sso_sessions idp_initiated_saml_sso_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.idp_initiated_saml_sso_sessions
    ADD CONSTRAINT idp_initiated_saml_sso_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: logs logs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logs
    ADD CONSTRAINT logs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: logto_configs logto_configs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.logto_configs
    ADD CONSTRAINT logto_configs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: oidc_model_instances oidc_model_instances_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oidc_model_instances
    ADD CONSTRAINT oidc_model_instances_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: oidc_session_extensions oidc_session_extensions_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oidc_session_extensions
    ADD CONSTRAINT oidc_session_extensions_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: oidc_session_extensions oidc_session_extensions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.oidc_session_extensions
    ADD CONSTRAINT oidc_session_extensions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.one_time_tokens
    ADD CONSTRAINT one_time_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_application_relations organization_application_relations_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_application_relations
    ADD CONSTRAINT organization_application_relations_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_application_relations organization_application_relations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_application_relations
    ADD CONSTRAINT organization_application_relations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_application_relations organization_application_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_application_relations
    ADD CONSTRAINT organization_application_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitation_role_relations organization_invitation_role_re_organization_invitation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitation_role_relations
    ADD CONSTRAINT organization_invitation_role_re_organization_invitation_id_fkey FOREIGN KEY (organization_invitation_id) REFERENCES public.organization_invitations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitation_role_relations organization_invitation_role_relation_organization_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitation_role_relations
    ADD CONSTRAINT organization_invitation_role_relation_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.organization_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitation_role_relations organization_invitation_role_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitation_role_relations
    ADD CONSTRAINT organization_invitation_role_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_accepted_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_accepted_user_id_fkey FOREIGN KEY (accepted_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_inviter_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_inviter_id_fkey FOREIGN KEY (inviter_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_invitations organization_invitations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_invitations
    ADD CONSTRAINT organization_invitations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_email_domains organization_jit_email_domains_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_email_domains
    ADD CONSTRAINT organization_jit_email_domains_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_email_domains organization_jit_email_domains_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_email_domains
    ADD CONSTRAINT organization_jit_email_domains_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_roles organization_jit_roles_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_roles
    ADD CONSTRAINT organization_jit_roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_roles organization_jit_roles_organization_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_roles
    ADD CONSTRAINT organization_jit_roles_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.organization_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_roles organization_jit_roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_roles
    ADD CONSTRAINT organization_jit_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_sso_connectors organization_jit_sso_connectors_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_sso_connectors
    ADD CONSTRAINT organization_jit_sso_connectors_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_sso_connectors organization_jit_sso_connectors_sso_connector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_sso_connectors
    ADD CONSTRAINT organization_jit_sso_connectors_sso_connector_id_fkey FOREIGN KEY (sso_connector_id) REFERENCES public.sso_connectors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_jit_sso_connectors organization_jit_sso_connectors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_jit_sso_connectors
    ADD CONSTRAINT organization_jit_sso_connectors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_application_relations organization_role_application_relatio_organization_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_application_relations
    ADD CONSTRAINT organization_role_application_relatio_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.organization_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_application_relations organization_role_application_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_application_relations
    ADD CONSTRAINT organization_role_application_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_application_relations organization_role_application_tenant_id_organization_id_ap_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_application_relations
    ADD CONSTRAINT organization_role_application_tenant_id_organization_id_ap_fkey FOREIGN KEY (tenant_id, organization_id, application_id) REFERENCES public.organization_application_relations(tenant_id, organization_id, application_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_resource_scope_relations organization_role_resource_scope_rela_organization_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_resource_scope_relations
    ADD CONSTRAINT organization_role_resource_scope_rela_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.organization_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_resource_scope_relations organization_role_resource_scope_relations_scope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_resource_scope_relations
    ADD CONSTRAINT organization_role_resource_scope_relations_scope_id_fkey FOREIGN KEY (scope_id) REFERENCES public.scopes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_resource_scope_relations organization_role_resource_scope_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_resource_scope_relations
    ADD CONSTRAINT organization_role_resource_scope_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_scope_relations organization_role_scope_relations_organization_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_scope_relations
    ADD CONSTRAINT organization_role_scope_relations_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.organization_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_scope_relations organization_role_scope_relations_organization_scope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_scope_relations
    ADD CONSTRAINT organization_role_scope_relations_organization_scope_id_fkey FOREIGN KEY (organization_scope_id) REFERENCES public.organization_scopes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_scope_relations organization_role_scope_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_scope_relations
    ADD CONSTRAINT organization_role_scope_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_user_relations organization_role_user_relati_tenant_id_organization_id_us_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_user_relations
    ADD CONSTRAINT organization_role_user_relati_tenant_id_organization_id_us_fkey FOREIGN KEY (tenant_id, organization_id, user_id) REFERENCES public.organization_user_relations(tenant_id, organization_id, user_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_user_relations organization_role_user_relations_organization_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_user_relations
    ADD CONSTRAINT organization_role_user_relations_organization_role_id_fkey FOREIGN KEY (organization_role_id) REFERENCES public.organization_roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_role_user_relations organization_role_user_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_role_user_relations
    ADD CONSTRAINT organization_role_user_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_roles organization_roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_roles
    ADD CONSTRAINT organization_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_scopes organization_scopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_scopes
    ADD CONSTRAINT organization_scopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_user_relations organization_user_relations__user_id__fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_user_relations
    ADD CONSTRAINT organization_user_relations__user_id__fk FOREIGN KEY (tenant_id, user_id) REFERENCES public.users(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_user_relations organization_user_relations_organization_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_user_relations
    ADD CONSTRAINT organization_user_relations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_user_relations organization_user_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_user_relations
    ADD CONSTRAINT organization_user_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organization_user_relations organization_user_relations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organization_user_relations
    ADD CONSTRAINT organization_user_relations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: organizations organizations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: passcodes passcodes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.passcodes
    ADD CONSTRAINT passcodes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: personal_access_tokens personal_access_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: personal_access_tokens personal_access_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: resources resources_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resources
    ADD CONSTRAINT resources_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles_scopes roles_scopes_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_scopes
    ADD CONSTRAINT roles_scopes_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles_scopes roles_scopes_scope_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_scopes
    ADD CONSTRAINT roles_scopes_scope_id_fkey FOREIGN KEY (scope_id) REFERENCES public.scopes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles_scopes roles_scopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles_scopes
    ADD CONSTRAINT roles_scopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: roles roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saml_application_configs saml_application_configs_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_configs
    ADD CONSTRAINT saml_application_configs_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saml_application_configs saml_application_configs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_configs
    ADD CONSTRAINT saml_application_configs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saml_application_secrets saml_application_secrets_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_secrets
    ADD CONSTRAINT saml_application_secrets_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saml_application_secrets saml_application_secrets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_secrets
    ADD CONSTRAINT saml_application_secrets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saml_application_sessions saml_application_sessions_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_sessions
    ADD CONSTRAINT saml_application_sessions_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: saml_application_sessions saml_application_sessions_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saml_application_sessions
    ADD CONSTRAINT saml_application_sessions_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scopes scopes_resource_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scopes
    ADD CONSTRAINT scopes_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: scopes scopes_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.scopes
    ADD CONSTRAINT scopes_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connect_tenant_id_issuer_identity_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_enterprise_sso_connector_relations
    ADD CONSTRAINT secret_enterprise_sso_connect_tenant_id_issuer_identity_id_fkey FOREIGN KEY (tenant_id, issuer, identity_id) REFERENCES public.user_sso_identities(tenant_id, issuer, identity_id) ON UPDATE CASCADE;


--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connector_relations_secret_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_enterprise_sso_connector_relations
    ADD CONSTRAINT secret_enterprise_sso_connector_relations_secret_id_fkey FOREIGN KEY (secret_id) REFERENCES public.secrets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connector_relations_sso_connector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_enterprise_sso_connector_relations
    ADD CONSTRAINT secret_enterprise_sso_connector_relations_sso_connector_id_fkey FOREIGN KEY (sso_connector_id) REFERENCES public.sso_connectors(id) ON UPDATE CASCADE;


--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connector_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_enterprise_sso_connector_relations
    ADD CONSTRAINT secret_enterprise_sso_connector_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secret_social_connector_relations secret_social_connector_relations_connector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_social_connector_relations
    ADD CONSTRAINT secret_social_connector_relations_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES public.connectors(id) ON UPDATE CASCADE;


--
-- Name: secret_social_connector_relations secret_social_connector_relations_secret_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_social_connector_relations
    ADD CONSTRAINT secret_social_connector_relations_secret_id_fkey FOREIGN KEY (secret_id) REFERENCES public.secrets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secret_social_connector_relations secret_social_connector_relations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secret_social_connector_relations
    ADD CONSTRAINT secret_social_connector_relations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secrets secrets_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secrets
    ADD CONSTRAINT secrets_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: secrets secrets_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.secrets
    ADD CONSTRAINT secrets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sentinel_activities sentinel_activities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sentinel_activities
    ADD CONSTRAINT sentinel_activities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sign_in_experiences sign_in_experiences_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sign_in_experiences
    ADD CONSTRAINT sign_in_experiences_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sso_connector_idp_initiated_auth_configs sso_connector_idp_initiated_auth_co_default_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connector_idp_initiated_auth_configs
    ADD CONSTRAINT sso_connector_idp_initiated_auth_co_default_application_id_fkey FOREIGN KEY (default_application_id) REFERENCES public.applications(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sso_connector_idp_initiated_auth_configs sso_connector_idp_initiated_auth_configs_connector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connector_idp_initiated_auth_configs
    ADD CONSTRAINT sso_connector_idp_initiated_auth_configs_connector_id_fkey FOREIGN KEY (connector_id) REFERENCES public.sso_connectors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sso_connector_idp_initiated_auth_configs sso_connector_idp_initiated_auth_configs_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connector_idp_initiated_auth_configs
    ADD CONSTRAINT sso_connector_idp_initiated_auth_configs_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sso_connectors sso_connectors_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sso_connectors
    ADD CONSTRAINT sso_connectors_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subject_tokens subject_tokens_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_tokens
    ADD CONSTRAINT subject_tokens_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: subject_tokens subject_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subject_tokens
    ADD CONSTRAINT subject_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_geo_locations user_geo_locations_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_geo_locations
    ADD CONSTRAINT user_geo_locations_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_geo_locations user_geo_locations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_geo_locations
    ADD CONSTRAINT user_geo_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sign_in_countries user_sign_in_countries_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sign_in_countries
    ADD CONSTRAINT user_sign_in_countries_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sign_in_countries user_sign_in_countries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sign_in_countries
    ADD CONSTRAINT user_sign_in_countries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sso_identities user_sso_identities_sso_connector_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sso_identities
    ADD CONSTRAINT user_sso_identities_sso_connector_id_fkey FOREIGN KEY (sso_connector_id) REFERENCES public.sso_connectors(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sso_identities user_sso_identities_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sso_identities
    ADD CONSTRAINT user_sso_identities_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_sso_identities user_sso_identities_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sso_identities
    ADD CONSTRAINT user_sso_identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_roles users_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_roles users_roles_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users_roles users_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users_roles
    ADD CONSTRAINT users_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: users users_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verification_records verification_records_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_records
    ADD CONSTRAINT verification_records_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verification_records verification_records_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_records
    ADD CONSTRAINT verification_records_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verification_statuses verification_statuses_tenant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_statuses
    ADD CONSTRAINT verification_statuses_tenant_id_fkey FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: verification_statuses verification_statuses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_statuses
    ADD CONSTRAINT verification_statuses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: account_centers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.account_centers ENABLE ROW LEVEL SECURITY;

--
-- Name: account_centers account_centers_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY account_centers_modification ON public.account_centers USING (true);


--
-- Name: account_centers account_centers_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY account_centers_tenant_id ON public.account_centers AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: aggregated_daily_active_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.aggregated_daily_active_users ENABLE ROW LEVEL SECURITY;

--
-- Name: aggregated_daily_active_users aggregated_daily_active_users_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY aggregated_daily_active_users_modification ON public.aggregated_daily_active_users USING (true);


--
-- Name: aggregated_daily_active_users aggregated_daily_active_users_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY aggregated_daily_active_users_tenant_id ON public.aggregated_daily_active_users AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_secrets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: application_secrets application_secrets_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_secrets_modification ON public.application_secrets USING (true);


--
-- Name: application_secrets application_secrets_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_secrets_tenant_id ON public.application_secrets AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_sign_in_experiences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_sign_in_experiences ENABLE ROW LEVEL SECURITY;

--
-- Name: application_sign_in_experiences application_sign_in_experiences_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_sign_in_experiences_modification ON public.application_sign_in_experiences USING (true);


--
-- Name: application_sign_in_experiences application_sign_in_experiences_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_sign_in_experiences_tenant_id ON public.application_sign_in_experiences AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_user_consent_organization_resource_scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_user_consent_organization_resource_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: application_user_consent_organization_resource_scopes application_user_consent_organization_resource_scopes_modificat; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_organization_resource_scopes_modificat ON public.application_user_consent_organization_resource_scopes USING (true);


--
-- Name: application_user_consent_organization_resource_scopes application_user_consent_organization_resource_scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_organization_resource_scopes_tenant_id ON public.application_user_consent_organization_resource_scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_user_consent_organization_scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_user_consent_organization_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: application_user_consent_organization_scopes application_user_consent_organization_scopes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_organization_scopes_modification ON public.application_user_consent_organization_scopes USING (true);


--
-- Name: application_user_consent_organization_scopes application_user_consent_organization_scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_organization_scopes_tenant_id ON public.application_user_consent_organization_scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_user_consent_organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_user_consent_organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: application_user_consent_organizations application_user_consent_organizations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_organizations_modification ON public.application_user_consent_organizations USING (true);


--
-- Name: application_user_consent_organizations application_user_consent_organizations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_organizations_tenant_id ON public.application_user_consent_organizations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_user_consent_resource_scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_user_consent_resource_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: application_user_consent_resource_scopes application_user_consent_resource_scopes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_resource_scopes_modification ON public.application_user_consent_resource_scopes USING (true);


--
-- Name: application_user_consent_resource_scopes application_user_consent_resource_scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_resource_scopes_tenant_id ON public.application_user_consent_resource_scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: application_user_consent_user_scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.application_user_consent_user_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: application_user_consent_user_scopes application_user_consent_user_scopes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_user_scopes_modification ON public.application_user_consent_user_scopes USING (true);


--
-- Name: application_user_consent_user_scopes application_user_consent_user_scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY application_user_consent_user_scopes_tenant_id ON public.application_user_consent_user_scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: applications; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

--
-- Name: applications applications_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY applications_modification ON public.applications USING (true);


--
-- Name: applications_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.applications_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: applications_roles applications_roles_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY applications_roles_modification ON public.applications_roles USING (true);


--
-- Name: applications_roles applications_roles_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY applications_roles_tenant_id ON public.applications_roles AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: applications applications_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY applications_tenant_id ON public.applications AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: captcha_providers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.captcha_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: captcha_providers captcha_providers_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY captcha_providers_modification ON public.captcha_providers USING (true);


--
-- Name: captcha_providers captcha_providers_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY captcha_providers_tenant_id ON public.captcha_providers AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: connectors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.connectors ENABLE ROW LEVEL SECURITY;

--
-- Name: connectors connectors_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY connectors_modification ON public.connectors USING (true);


--
-- Name: connectors connectors_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY connectors_tenant_id ON public.connectors AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: custom_phrases; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.custom_phrases ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_phrases custom_phrases_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY custom_phrases_modification ON public.custom_phrases USING (true);


--
-- Name: custom_phrases custom_phrases_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY custom_phrases_tenant_id ON public.custom_phrases AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: custom_profile_fields; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.custom_profile_fields ENABLE ROW LEVEL SECURITY;

--
-- Name: custom_profile_fields custom_profile_fields_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY custom_profile_fields_modification ON public.custom_profile_fields USING (true);


--
-- Name: custom_profile_fields custom_profile_fields_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY custom_profile_fields_tenant_id ON public.custom_profile_fields AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: daily_active_users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_active_users ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_active_users daily_active_users_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY daily_active_users_modification ON public.daily_active_users USING (true);


--
-- Name: daily_active_users daily_active_users_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY daily_active_users_tenant_id ON public.daily_active_users AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: daily_token_usage; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.daily_token_usage ENABLE ROW LEVEL SECURITY;

--
-- Name: daily_token_usage daily_token_usage_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY daily_token_usage_modification ON public.daily_token_usage USING (true);


--
-- Name: daily_token_usage daily_token_usage_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY daily_token_usage_tenant_id ON public.daily_token_usage AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: domains; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;

--
-- Name: domains domains_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY domains_modification ON public.domains USING (true);


--
-- Name: domains domains_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY domains_tenant_id ON public.domains AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: email_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: email_templates email_templates_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY email_templates_modification ON public.email_templates USING (true);


--
-- Name: email_templates email_templates_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY email_templates_tenant_id ON public.email_templates AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: hooks; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.hooks ENABLE ROW LEVEL SECURITY;

--
-- Name: hooks hooks_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY hooks_modification ON public.hooks USING (true);


--
-- Name: hooks hooks_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY hooks_tenant_id ON public.hooks AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: idp_initiated_saml_sso_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.idp_initiated_saml_sso_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: idp_initiated_saml_sso_sessions idp_initiated_saml_sso_sessions_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY idp_initiated_saml_sso_sessions_modification ON public.idp_initiated_saml_sso_sessions USING (true);


--
-- Name: idp_initiated_saml_sso_sessions idp_initiated_saml_sso_sessions_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY idp_initiated_saml_sso_sessions_tenant_id ON public.idp_initiated_saml_sso_sessions AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.logs ENABLE ROW LEVEL SECURITY;

--
-- Name: logs logs_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY logs_modification ON public.logs USING (true);


--
-- Name: logs logs_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY logs_tenant_id ON public.logs AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: logto_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.logto_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: logto_configs logto_configs_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY logto_configs_modification ON public.logto_configs USING (true);


--
-- Name: logto_configs logto_configs_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY logto_configs_tenant_id ON public.logto_configs AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: oidc_model_instances; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.oidc_model_instances ENABLE ROW LEVEL SECURITY;

--
-- Name: oidc_model_instances oidc_model_instances_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY oidc_model_instances_modification ON public.oidc_model_instances USING (true);


--
-- Name: oidc_model_instances oidc_model_instances_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY oidc_model_instances_tenant_id ON public.oidc_model_instances AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: oidc_session_extensions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.oidc_session_extensions ENABLE ROW LEVEL SECURITY;

--
-- Name: oidc_session_extensions oidc_session_extensions_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY oidc_session_extensions_modification ON public.oidc_session_extensions USING (true);


--
-- Name: oidc_session_extensions oidc_session_extensions_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY oidc_session_extensions_tenant_id ON public.oidc_session_extensions AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens one_time_tokens_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY one_time_tokens_modification ON public.one_time_tokens USING (true);


--
-- Name: one_time_tokens one_time_tokens_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY one_time_tokens_tenant_id ON public.one_time_tokens AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_application_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_application_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_application_relations organization_application_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_application_relations_modification ON public.organization_application_relations USING (true);


--
-- Name: organization_application_relations organization_application_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_application_relations_tenant_id ON public.organization_application_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_invitation_role_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_invitation_role_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_invitation_role_relations organization_invitation_role_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_invitation_role_relations_modification ON public.organization_invitation_role_relations USING (true);


--
-- Name: organization_invitation_role_relations organization_invitation_role_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_invitation_role_relations_tenant_id ON public.organization_invitation_role_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_invitations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_invitations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_invitations organization_invitations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_invitations_modification ON public.organization_invitations USING (true);


--
-- Name: organization_invitations organization_invitations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_invitations_tenant_id ON public.organization_invitations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_jit_email_domains; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_jit_email_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_jit_email_domains organization_jit_email_domains_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_jit_email_domains_modification ON public.organization_jit_email_domains USING (true);


--
-- Name: organization_jit_email_domains organization_jit_email_domains_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_jit_email_domains_tenant_id ON public.organization_jit_email_domains AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_jit_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_jit_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_jit_roles organization_jit_roles_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_jit_roles_modification ON public.organization_jit_roles USING (true);


--
-- Name: organization_jit_roles organization_jit_roles_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_jit_roles_tenant_id ON public.organization_jit_roles AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_jit_sso_connectors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_jit_sso_connectors ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_jit_sso_connectors organization_jit_sso_connectors_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_jit_sso_connectors_modification ON public.organization_jit_sso_connectors USING (true);


--
-- Name: organization_jit_sso_connectors organization_jit_sso_connectors_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_jit_sso_connectors_tenant_id ON public.organization_jit_sso_connectors AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_role_application_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_role_application_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_role_application_relations organization_role_application_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_application_relations_modification ON public.organization_role_application_relations USING (true);


--
-- Name: organization_role_application_relations organization_role_application_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_application_relations_tenant_id ON public.organization_role_application_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_role_resource_scope_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_role_resource_scope_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_role_resource_scope_relations organization_role_resource_scope_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_resource_scope_relations_modification ON public.organization_role_resource_scope_relations USING (true);


--
-- Name: organization_role_resource_scope_relations organization_role_resource_scope_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_resource_scope_relations_tenant_id ON public.organization_role_resource_scope_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_role_scope_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_role_scope_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_role_scope_relations organization_role_scope_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_scope_relations_modification ON public.organization_role_scope_relations USING (true);


--
-- Name: organization_role_scope_relations organization_role_scope_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_scope_relations_tenant_id ON public.organization_role_scope_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_role_user_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_role_user_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_role_user_relations organization_role_user_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_user_relations_modification ON public.organization_role_user_relations USING (true);


--
-- Name: organization_role_user_relations organization_role_user_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_role_user_relations_tenant_id ON public.organization_role_user_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_roles organization_roles_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_roles_modification ON public.organization_roles USING (true);


--
-- Name: organization_roles organization_roles_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_roles_tenant_id ON public.organization_roles AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_scopes organization_scopes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_scopes_modification ON public.organization_scopes USING (true);


--
-- Name: organization_scopes organization_scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_scopes_tenant_id ON public.organization_scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organization_user_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organization_user_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: organization_user_relations organization_user_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_user_relations_modification ON public.organization_user_relations USING (true);


--
-- Name: organization_user_relations organization_user_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organization_user_relations_tenant_id ON public.organization_user_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: organizations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

--
-- Name: organizations organizations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_modification ON public.organizations USING (true);


--
-- Name: organizations organizations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY organizations_tenant_id ON public.organizations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: passcodes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.passcodes ENABLE ROW LEVEL SECURITY;

--
-- Name: passcodes passcodes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY passcodes_modification ON public.passcodes USING (true);


--
-- Name: passcodes passcodes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY passcodes_tenant_id ON public.passcodes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: personal_access_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.personal_access_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: personal_access_tokens personal_access_tokens_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY personal_access_tokens_modification ON public.personal_access_tokens USING (true);


--
-- Name: personal_access_tokens personal_access_tokens_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY personal_access_tokens_tenant_id ON public.personal_access_tokens AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: resources; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

--
-- Name: resources resources_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resources_modification ON public.resources USING (true);


--
-- Name: resources resources_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY resources_tenant_id ON public.resources AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

--
-- Name: roles roles_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY roles_modification ON public.roles USING (true);


--
-- Name: roles_scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.roles_scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: roles_scopes roles_scopes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY roles_scopes_modification ON public.roles_scopes USING (true);


--
-- Name: roles_scopes roles_scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY roles_scopes_tenant_id ON public.roles_scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: roles roles_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY roles_tenant_id ON public.roles AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: saml_application_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.saml_application_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_application_configs saml_application_configs_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY saml_application_configs_modification ON public.saml_application_configs USING (true);


--
-- Name: saml_application_configs saml_application_configs_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY saml_application_configs_tenant_id ON public.saml_application_configs AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: saml_application_secrets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.saml_application_secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_application_secrets saml_application_secrets_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY saml_application_secrets_modification ON public.saml_application_secrets USING (true);


--
-- Name: saml_application_secrets saml_application_secrets_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY saml_application_secrets_tenant_id ON public.saml_application_secrets AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: saml_application_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.saml_application_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_application_sessions saml_application_sessions_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY saml_application_sessions_modification ON public.saml_application_sessions USING (true);


--
-- Name: saml_application_sessions saml_application_sessions_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY saml_application_sessions_tenant_id ON public.saml_application_sessions AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: scopes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.scopes ENABLE ROW LEVEL SECURITY;

--
-- Name: scopes scopes_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY scopes_modification ON public.scopes USING (true);


--
-- Name: scopes scopes_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY scopes_tenant_id ON public.scopes AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: secret_enterprise_sso_connector_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.secret_enterprise_sso_connector_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connector_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY secret_enterprise_sso_connector_relations_modification ON public.secret_enterprise_sso_connector_relations USING (true);


--
-- Name: secret_enterprise_sso_connector_relations secret_enterprise_sso_connector_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY secret_enterprise_sso_connector_relations_tenant_id ON public.secret_enterprise_sso_connector_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: secret_social_connector_relations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.secret_social_connector_relations ENABLE ROW LEVEL SECURITY;

--
-- Name: secret_social_connector_relations secret_social_connector_relations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY secret_social_connector_relations_modification ON public.secret_social_connector_relations USING (true);


--
-- Name: secret_social_connector_relations secret_social_connector_relations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY secret_social_connector_relations_tenant_id ON public.secret_social_connector_relations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: secrets; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.secrets ENABLE ROW LEVEL SECURITY;

--
-- Name: secrets secrets_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY secrets_modification ON public.secrets USING (true);


--
-- Name: secrets secrets_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY secrets_tenant_id ON public.secrets AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: sentinel_activities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sentinel_activities ENABLE ROW LEVEL SECURITY;

--
-- Name: sentinel_activities sentinel_activities_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sentinel_activities_modification ON public.sentinel_activities USING (true);


--
-- Name: sentinel_activities sentinel_activities_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sentinel_activities_tenant_id ON public.sentinel_activities AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: sign_in_experiences; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sign_in_experiences ENABLE ROW LEVEL SECURITY;

--
-- Name: sign_in_experiences sign_in_experiences_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sign_in_experiences_modification ON public.sign_in_experiences USING (true);


--
-- Name: sign_in_experiences sign_in_experiences_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sign_in_experiences_tenant_id ON public.sign_in_experiences AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: sso_connector_idp_initiated_auth_configs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sso_connector_idp_initiated_auth_configs ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_connector_idp_initiated_auth_configs sso_connector_idp_initiated_auth_configs_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sso_connector_idp_initiated_auth_configs_modification ON public.sso_connector_idp_initiated_auth_configs USING (true);


--
-- Name: sso_connector_idp_initiated_auth_configs sso_connector_idp_initiated_auth_configs_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sso_connector_idp_initiated_auth_configs_tenant_id ON public.sso_connector_idp_initiated_auth_configs AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: sso_connectors; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.sso_connectors ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_connectors sso_connectors_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sso_connectors_modification ON public.sso_connectors USING (true);


--
-- Name: sso_connectors sso_connectors_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY sso_connectors_tenant_id ON public.sso_connectors AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: subject_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.subject_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: subject_tokens subject_tokens_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY subject_tokens_modification ON public.subject_tokens USING (true);


--
-- Name: subject_tokens subject_tokens_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY subject_tokens_tenant_id ON public.subject_tokens AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: tenants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

--
-- Name: tenants tenants_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY tenants_tenant_id ON public.tenants USING (((db_user)::text = CURRENT_USER));


--
-- Name: user_geo_locations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_geo_locations ENABLE ROW LEVEL SECURITY;

--
-- Name: user_geo_locations user_geo_locations_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_geo_locations_modification ON public.user_geo_locations USING (true);


--
-- Name: user_geo_locations user_geo_locations_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_geo_locations_tenant_id ON public.user_geo_locations AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: user_sign_in_countries; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_sign_in_countries ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sign_in_countries user_sign_in_countries_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_sign_in_countries_modification ON public.user_sign_in_countries USING (true);


--
-- Name: user_sign_in_countries user_sign_in_countries_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_sign_in_countries_tenant_id ON public.user_sign_in_countries AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: user_sso_identities; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.user_sso_identities ENABLE ROW LEVEL SECURITY;

--
-- Name: user_sso_identities user_sso_identities_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_sso_identities_modification ON public.user_sso_identities USING (true);


--
-- Name: user_sso_identities user_sso_identities_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY user_sso_identities_tenant_id ON public.user_sso_identities AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: users users_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_modification ON public.users USING (true);


--
-- Name: users_roles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users_roles ENABLE ROW LEVEL SECURITY;

--
-- Name: users_roles users_roles_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_roles_modification ON public.users_roles USING (true);


--
-- Name: users_roles users_roles_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_roles_tenant_id ON public.users_roles AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: users users_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY users_tenant_id ON public.users AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: verification_records; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_records verification_records_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY verification_records_modification ON public.verification_records USING (true);


--
-- Name: verification_records verification_records_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY verification_records_tenant_id ON public.verification_records AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: verification_statuses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.verification_statuses ENABLE ROW LEVEL SECURITY;

--
-- Name: verification_statuses verification_statuses_modification; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY verification_statuses_modification ON public.verification_statuses USING (true);


--
-- Name: verification_statuses verification_statuses_tenant_id; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY verification_statuses_tenant_id ON public.verification_statuses AS RESTRICTIVE USING (((tenant_id)::text = (( SELECT tenants.id
   FROM public.tenants
  WHERE ((tenants.db_user)::text = CURRENT_USER)))::text));


--
-- Name: TABLE account_centers; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.account_centers TO logto_tenant_logto_db;


--
-- Name: TABLE aggregated_daily_active_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.aggregated_daily_active_users TO logto_tenant_logto_db;


--
-- Name: TABLE application_secrets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_secrets TO logto_tenant_logto_db;


--
-- Name: TABLE application_sign_in_experiences; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_sign_in_experiences TO logto_tenant_logto_db;


--
-- Name: TABLE application_user_consent_organization_resource_scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_user_consent_organization_resource_scopes TO logto_tenant_logto_db;


--
-- Name: TABLE application_user_consent_organization_scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_user_consent_organization_scopes TO logto_tenant_logto_db;


--
-- Name: TABLE application_user_consent_organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_user_consent_organizations TO logto_tenant_logto_db;


--
-- Name: TABLE application_user_consent_resource_scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_user_consent_resource_scopes TO logto_tenant_logto_db;


--
-- Name: TABLE application_user_consent_user_scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.application_user_consent_user_scopes TO logto_tenant_logto_db;


--
-- Name: TABLE applications; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.applications TO logto_tenant_logto_db;


--
-- Name: TABLE applications_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.applications_roles TO logto_tenant_logto_db;


--
-- Name: TABLE captcha_providers; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.captcha_providers TO logto_tenant_logto_db;


--
-- Name: TABLE connectors; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.connectors TO logto_tenant_logto_db;


--
-- Name: TABLE custom_phrases; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.custom_phrases TO logto_tenant_logto_db;


--
-- Name: TABLE custom_profile_fields; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.custom_profile_fields TO logto_tenant_logto_db;


--
-- Name: TABLE daily_active_users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.daily_active_users TO logto_tenant_logto_db;


--
-- Name: TABLE daily_token_usage; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.daily_token_usage TO logto_tenant_logto_db;


--
-- Name: TABLE domains; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.domains TO logto_tenant_logto_db;


--
-- Name: TABLE email_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.email_templates TO logto_tenant_logto_db;


--
-- Name: TABLE hooks; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.hooks TO logto_tenant_logto_db;


--
-- Name: TABLE idp_initiated_saml_sso_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.idp_initiated_saml_sso_sessions TO logto_tenant_logto_db;


--
-- Name: TABLE logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.logs TO logto_tenant_logto_db;


--
-- Name: TABLE logto_configs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.logto_configs TO logto_tenant_logto_db;


--
-- Name: TABLE oidc_model_instances; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.oidc_model_instances TO logto_tenant_logto_db;


--
-- Name: TABLE oidc_session_extensions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.oidc_session_extensions TO logto_tenant_logto_db;


--
-- Name: TABLE one_time_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.one_time_tokens TO logto_tenant_logto_db;


--
-- Name: TABLE organization_application_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_application_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_invitation_role_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_invitation_role_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_invitations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_invitations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_jit_email_domains; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_jit_email_domains TO logto_tenant_logto_db;


--
-- Name: TABLE organization_jit_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_jit_roles TO logto_tenant_logto_db;


--
-- Name: TABLE organization_jit_sso_connectors; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_jit_sso_connectors TO logto_tenant_logto_db;


--
-- Name: TABLE organization_role_application_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_role_application_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_role_resource_scope_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_role_resource_scope_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_role_scope_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_role_scope_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_role_user_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_role_user_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organization_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_roles TO logto_tenant_logto_db;


--
-- Name: TABLE organization_scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_scopes TO logto_tenant_logto_db;


--
-- Name: TABLE organization_user_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organization_user_relations TO logto_tenant_logto_db;


--
-- Name: TABLE organizations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.organizations TO logto_tenant_logto_db;


--
-- Name: TABLE passcodes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.passcodes TO logto_tenant_logto_db;


--
-- Name: TABLE personal_access_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.personal_access_tokens TO logto_tenant_logto_db;


--
-- Name: TABLE resources; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.resources TO logto_tenant_logto_db;


--
-- Name: TABLE roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles TO logto_tenant_logto_db;


--
-- Name: TABLE roles_scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.roles_scopes TO logto_tenant_logto_db;


--
-- Name: TABLE saml_application_configs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.saml_application_configs TO logto_tenant_logto_db;


--
-- Name: TABLE saml_application_secrets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.saml_application_secrets TO logto_tenant_logto_db;


--
-- Name: TABLE saml_application_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.saml_application_sessions TO logto_tenant_logto_db;


--
-- Name: TABLE scopes; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.scopes TO logto_tenant_logto_db;


--
-- Name: TABLE secret_enterprise_sso_connector_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.secret_enterprise_sso_connector_relations TO logto_tenant_logto_db;


--
-- Name: TABLE secret_social_connector_relations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.secret_social_connector_relations TO logto_tenant_logto_db;


--
-- Name: TABLE secrets; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.secrets TO logto_tenant_logto_db;


--
-- Name: TABLE sentinel_activities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sentinel_activities TO logto_tenant_logto_db;


--
-- Name: TABLE sign_in_experiences; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sign_in_experiences TO logto_tenant_logto_db;


--
-- Name: TABLE sso_connector_idp_initiated_auth_configs; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sso_connector_idp_initiated_auth_configs TO logto_tenant_logto_db;


--
-- Name: TABLE sso_connectors; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.sso_connectors TO logto_tenant_logto_db;


--
-- Name: TABLE subject_tokens; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.subject_tokens TO logto_tenant_logto_db;


--
-- Name: COLUMN tenants.id; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(id) ON TABLE public.tenants TO logto_tenant_logto_db;


--
-- Name: COLUMN tenants.db_user; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(db_user) ON TABLE public.tenants TO logto_tenant_logto_db;


--
-- Name: COLUMN tenants.tag; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(tag) ON TABLE public.tenants TO logto_tenant_logto_db;


--
-- Name: COLUMN tenants.is_suspended; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT(is_suspended) ON TABLE public.tenants TO logto_tenant_logto_db;


--
-- Name: TABLE user_geo_locations; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_geo_locations TO logto_tenant_logto_db;


--
-- Name: TABLE user_sign_in_countries; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_sign_in_countries TO logto_tenant_logto_db;


--
-- Name: TABLE user_sso_identities; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.user_sso_identities TO logto_tenant_logto_db;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users TO logto_tenant_logto_db;


--
-- Name: TABLE users_roles; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.users_roles TO logto_tenant_logto_db;


--
-- Name: TABLE verification_records; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.verification_records TO logto_tenant_logto_db;


--
-- Name: TABLE verification_statuses; Type: ACL; Schema: public; Owner: postgres
--

GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE public.verification_statuses TO logto_tenant_logto_db;


--
-- PostgreSQL database dump complete
--

\unrestrict JvP3ctac8HnlDohd7kGvkRuLfOCyEQUREqnHlznlObNFjEgH2Yi8kmh9QCUvQu1


COPY public.organizations (tenant_id, id, name, description, custom_data, is_mfa_required, color, branding, custom_css, created_at) FROM stdin;
admin	t-default	Tenant default	\N	{}	f	{}	{}	\N	2025-11-09 07:07:58.621675+00
admin	t-admin	Tenant admin	\N	{}	f	{}	{}	\N	2025-11-09 07:07:58.621675+00
\.

COPY public.organization_roles (tenant_id, id, name, description, type) FROM stdin;
admin	admin	admin	Admin of the tenant, who has all permissions.	User
admin	collaborator	collaborator	Collaborator of the tenant, who has permissions to operate the tenant data, but not the tenant settings.	User
\.

COPY public.organization_role_user_relations (tenant_id, organization_id, organization_role_id, user_id) FROM stdin;
admin	t-default	admin	idslogtoadmi
\.

COPY public.organization_user_relations (tenant_id, organization_id, user_id) FROM stdin;
admin	t-default	idslogtoadmi
\.

COPY public.users (tenant_id, id, username, primary_email, primary_phone, password_encrypted, password_encryption_method, name, avatar, profile, application_id, identities, custom_data, logto_config, mfa_verifications, is_suspended, last_sign_in_at, created_at, updated_at) FROM stdin;
admin	idslogtoadmi	ids_logto_admin	\N	\N	$argon2i$v=19$m=8192,t=8,p=1$/ssid3mvTDJcUDzpFnHbYQ$N3QPGQM24dHYwj2CGWJSXUp9/A1VnO4FJGJJglDNxWU	Argon2i	\N	\N	{}	admin-console	{}	{"adminConsolePreferences": {"language": "en", "appearanceMode": "system", "roleWithManagementApiAccessNotificationAcknowledged": true}}	{}	[]	f	2026-03-24 21:49:23.597+00	2025-11-09 07:09:58.088062+00	2026-03-24 21:49:23.597254+00
\.

COPY public.users_roles (tenant_id, id, user_id, role_id) FROM stdin;
admin	3rw6d4ta0uupiqzirujxj	idslogtoadmi	txo4upecr0fj8ugjamlot
admin	369t9rigwg8f4gootepe5	idslogtoadmi	2jq718eku68lyqblt5n0g
admin	admin-role-idslogto	idslogtoadmi	admin-admin-role
\.
