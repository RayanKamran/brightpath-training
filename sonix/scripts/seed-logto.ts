#!/usr/bin/env -S node

/**
 * Seed Logto with initial configuration (TypeScript)
 * - Configures branding
 * - Creates roles, users, organizations
 * - Optional --clean flag removes existing data first
 */
import fs from 'node:fs';
import path from 'node:path';
import {stdin as input, stdout as output} from 'node:process';
import readline from 'node:readline';

import {
  BLUE,
  GREEN,
  NC,
  RED,
  YELLOW,
} from '../libs/shared/data-models/src/lib/constants/console-colors';

type OrgRoleSeed = {name: string; display: string; description: string};
type UserSeed = {email: string; password: string; name: string; username: string};
type OrgSeed = {id: string; name: string; description: string};
type TokenResponse = {access_token?: string};
type Role = {id: string; name?: string};
type User = {id: string; primaryEmail?: string};
type Organization = {id: string; name?: string; customId?: string};
type OrgRoleAssignment = {orgId: string; roleNames: string[]};
type UserAssignments = Record<string, OrgRoleAssignment[]>;

const logBox = (title: string) => {
  console.log(`${BLUE}╔════════════════════════════════════════════════════════════╗${NC}`);
  console.log(`${BLUE}║  ${title.padEnd(56)}  ║${NC}`);
  console.log(`${BLUE}╚════════════════════════════════════════════════════════════╝${NC}`);
};

const loadEnv = () => {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content
      .split(/\r?\n/)
      .filter((l) => l && !l.startsWith('#'))
      .forEach((line) => {
        const m = line.match(/^(\w+)=(.*)$/);
        if (m) {
          process.env[m[1]] = m[2];
        }
      });
  }
};

const args = process.argv.slice(2);
const CLEAN_MODE = args.includes('--clean');

loadEnv();

const LOGTO_ENDPOINT = process.env.LOGTO_ENDPOINT || 'http://localhost:3001';
const LOGTO_M2M_APP_ID = process.env.LOGTO_M2M_APP_ID || '';
const LOGTO_M2M_APP_SECRET = process.env.LOGTO_M2M_APP_SECRET || '';

const SEED_ORG_ROLES: OrgRoleSeed[] = [
  {name: 'AA', display: 'Acct Asst', description: 'Accounting Assistant'},
  {name: 'AD', display: 'Admin Asst', description: 'Administrative Assistant'},
  {name: 'AG', display: 'Asst Gen Mgr', description: 'Assistant General Manager'},
  {name: 'AP', display: 'Accts Pay', description: 'Accounts Payable Specialist'},
  {name: 'AR', display: 'Accts Rec', description: 'Accounts Receivable Specialist'},
  {name: 'AS', display: 'Acc Sales', description: 'Accessories Sales Specialist'},
  {name: 'BD', display: 'BDC Mgr', description: 'BDC Manager'},
  {name: 'BM', display: 'Bus Mgr', description: 'Business Manager Role'},
  {name: 'BR', display: 'BDC Rep', description: 'BDC Representative'},
  {name: 'BT', display: 'Body Tech', description: 'Body Shop Technician'},
  {name: 'CE', display: 'Owner/CEO', description: 'Owner / CEO'},
  {name: 'CF', display: 'CFO', description: 'Chief Financial Officer (CFO)'},
  {name: 'CO', display: 'COO', description: 'Chief Operating Officer (COO)'},
  {name: 'CP', display: 'Compl Off', description: 'Compliance Officer'},
  {name: 'CR', display: 'Cred Rpts', description: 'Credit Reports'},
  {name: 'CT', display: 'Controller', description: 'Controller (Corporate)'},
  {name: 'DE', display: 'Detailer', description: 'Detailer'},
  {name: 'DM', display: 'Distr Mgr', description: 'District Manager'},
  {name: 'EC', display: 'Event Coord', description: 'Event Coordinator'},
  {name: 'FD', display: 'Fin Dir', description: 'Finance Director'},
  {name: 'FI', display: 'F&I Mgr', description: 'F & I Manager'},
  {name: 'FM', display: 'Fac Mgr', description: 'Facilities Manager'},
  {name: 'GD', display: 'G2 Def', description: 'G2 Default'},
  {name: 'GM', display: 'GM', description: 'GM / Location Manager'},
  {name: 'HR', display: 'HR Mgr', description: 'Human Resources Manager'},
  {name: 'IN', display: 'Ins Agt', description: 'Insurance Agent'},
  {name: 'IS', display: "'Net Sales", description: 'Internet Sales Manager'},
  {name: 'IT', display: 'IT Supp', description: 'IT Support Specialist'},
  {name: 'IV', display: 'Inv Ctrl', description: 'Inventory Control Specialist'},
  {name: 'LA', display: 'Lot Attend', description: 'Lot Attendant'},
  {name: 'LT', display: 'Lead Tech', description: 'Lead Technician'},
  {name: 'MC', display: 'Mktg Coord', description: 'Marketing Coordinator'},
  {name: 'MD', display: 'Mktg Dir', description: 'Marketing Director'},
  {name: 'ME', display: 'Mechanic', description: 'Mechanic'},
  {name: 'MT', display: 'Mob Svc Tech', description: 'Mobile Service Technician'},
  {name: 'NS', display: 'New Unit Sales', description: 'New Unit Sales Specialist'},
  {name: 'PA', display: 'Pyrl Admin', description: 'Payroll Administrator'},
  {name: 'PC', display: 'Parts Coord', description: 'Parts Coordinator'},
  {name: 'PD', display: 'Parts Desk', description: 'Parts Desk'},
  {name: 'PM', display: 'Parts Mgr', description: 'Parts Manager'},
  {name: 'PP', display: 'Parts Purch', description: 'Parts Purchasing'},
  {name: 'PR', display: 'Prod Spec', description: 'Product Specialist'},
  {name: 'PS', display: 'Parts Spec', description: 'Parts Specialist'},
  {name: 'PT', display: 'PDI Tech', description: 'PDI Technician'},
  {name: 'RC', display: 'Rent Coord', description: 'Rental Coordinator'},
  {name: 'RE', display: 'Rent Mgr', description: 'Rental Manager'},
  {name: 'RO', display: 'Read Only', description: 'View-only access to system data'},
  {name: 'RM', display: 'Reg Mgr', description: 'Regional Manager'},
  {name: 'RP', display: 'Recept', description: 'Receptionist'},
  {name: 'SA', display: 'Svc Adv', description: 'Service Advisor'},
  {name: 'SD', display: 'SW Dev', description: 'Software Developer'},
  {name: 'SM', display: 'Sales Mgr', description: 'Sales Manager'},
  {name: 'SO', display: 'SocMed', description: 'Social Media Coordinator'},
  {name: 'SP', display: 'Sales', description: 'Salesperson'},
  {name: 'SS', display: 'Sales Supp', description: 'Sales Support Coordinator'},
  {name: 'ST', display: 'Staff Acct', description: 'Staff Accountant'},
  {name: 'SV', display: 'Svc Mgr', description: 'Service Manager'},
  {name: 'SW', display: 'Svc Wrtr', description: 'Service Writer'},
  {name: 'SY', display: 'Sys Admin', description: 'System Administration'},
  {name: 'TC', display: 'Title Clerk', description: 'Title Clerk'},
  {name: 'TR', display: 'Trade-In Appr', description: 'Trade-In Appraiser'},
  {name: 'US', display: 'Used Unit Sales', description: 'Used Unit Sales Specialist'},
  {name: 'WA', display: 'Wrnty Admin', description: 'Warranty Administrator'},
];

const SEED_USERS: UserSeed[] = [
  {email: 'admin@acme-rv.com', password: 'Admin123!', name: 'Admin User', username: 'admin'},
  {email: 'alice@acme-rv.com', password: 'xyab12dE', name: 'Alice Accounting', username: 'alice'},
  {email: 'mike@acme-rv.com', password: 'xyab12dE', name: 'Mike Mechanic', username: 'mike'},
  {email: 'sarah@acme-rv.com', password: 'xyab12dE', name: 'Sarah Sales', username: 'sarah'},
  {email: 'tim@acme-rv.com', password: 'xyab12dE', name: 'Tim Techsupport', username: 'tim'},
];

const SEED_ORGANIZATIONS: OrgSeed[] = [
  // Original locations
  {id: 'LOC_HQ', name: 'LOC_HQ', description: 'ACME RV Headquarters'},
  {id: 'LOC_AAA', name: 'LOC_AAA', description: 'ACME RV West Coast'},
  {id: 'LOC_BBB', name: 'LOC_BBB', description: 'ACME RV Mountain Region'},
  {id: 'LOC_CCC', name: 'LOC_CCC', description: 'ACME RV Texas'},
  {id: 'LOC_CLOSED', name: 'LOC_CLOSED', description: 'ACME RV Northwest (CLOSED)'},
  {id: 'LOC_DELETED', name: 'LOC_DELETED', description: 'ACME RV Mistake (DELETED)'},
  // Southeast
  {id: 'LOC_ATL', name: 'LOC_ATL', description: 'ACME RV Atlanta'},
  {id: 'LOC_MIA', name: 'LOC_MIA', description: 'ACME RV Miami'},
  {id: 'LOC_ORL', name: 'LOC_ORL', description: 'ACME RV Orlando'},
  {id: 'LOC_TAM', name: 'LOC_TAM', description: 'ACME RV Tampa'},
  {id: 'LOC_JAX', name: 'LOC_JAX', description: 'ACME RV Jacksonville'},
  {id: 'LOC_NSH', name: 'LOC_NSH', description: 'ACME RV Nashville'},
  {id: 'LOC_MEM', name: 'LOC_MEM', description: 'ACME RV Memphis'},
  {id: 'LOC_CLT', name: 'LOC_CLT', description: 'ACME RV Charlotte'},
  {id: 'LOC_RAL', name: 'LOC_RAL', description: 'ACME RV Raleigh'},
  // Mid-Atlantic
  {id: 'LOC_RIC', name: 'LOC_RIC', description: 'ACME RV Richmond'},
  {id: 'LOC_NOR', name: 'LOC_NOR', description: 'ACME RV Norfolk'},
  {id: 'LOC_BAL', name: 'LOC_BAL', description: 'ACME RV Baltimore'},
  {id: 'LOC_PHI', name: 'LOC_PHI', description: 'ACME RV Philadelphia'},
  {id: 'LOC_PIT', name: 'LOC_PIT', description: 'ACME RV Pittsburgh'},
  // Northeast
  {id: 'LOC_BUF', name: 'LOC_BUF', description: 'ACME RV Buffalo'},
  {id: 'LOC_ALB', name: 'LOC_ALB', description: 'ACME RV Albany'},
  {id: 'LOC_BOS', name: 'LOC_BOS', description: 'ACME RV Boston'},
  {id: 'LOC_HAR', name: 'LOC_HAR', description: 'ACME RV Hartford'},
  // Midwest
  {id: 'LOC_CHI', name: 'LOC_CHI', description: 'ACME RV Chicago'},
  {id: 'LOC_IND', name: 'LOC_IND', description: 'ACME RV Indianapolis'},
  {id: 'LOC_CLE', name: 'LOC_CLE', description: 'ACME RV Cleveland'},
  {id: 'LOC_COL', name: 'LOC_COL', description: 'ACME RV Columbus'},
  {id: 'LOC_CIN', name: 'LOC_CIN', description: 'ACME RV Cincinnati'},
  {id: 'LOC_DET', name: 'LOC_DET', description: 'ACME RV Detroit'},
  {id: 'LOC_GRR', name: 'LOC_GRR', description: 'ACME RV Grand Rapids'},
  {id: 'LOC_MIL', name: 'LOC_MIL', description: 'ACME RV Milwaukee'},
  {id: 'LOC_MIN', name: 'LOC_MIN', description: 'ACME RV Minneapolis'},
  {id: 'LOC_STL', name: 'LOC_STL', description: 'ACME RV St. Louis'},
  {id: 'LOC_KCY', name: 'LOC_KCY', description: 'ACME RV Kansas City'},
  {id: 'LOC_OMA', name: 'LOC_OMA', description: 'ACME RV Omaha'},
  {id: 'LOC_DES', name: 'LOC_DES', description: 'ACME RV Des Moines'},
  // Southwest
  {id: 'LOC_AUS', name: 'LOC_AUS', description: 'ACME RV Austin'},
  {id: 'LOC_HOU', name: 'LOC_HOU', description: 'ACME RV Houston'},
  {id: 'LOC_ABQ', name: 'LOC_ABQ', description: 'ACME RV Albuquerque'},
  {id: 'LOC_TUC', name: 'LOC_TUC', description: 'ACME RV Tucson'},
  // Mountain West
  {id: 'LOC_LAS', name: 'LOC_LAS', description: 'ACME RV Las Vegas'},
  {id: 'LOC_RNO', name: 'LOC_RNO', description: 'ACME RV Reno'},
  {id: 'LOC_SLC', name: 'LOC_SLC', description: 'ACME RV Salt Lake City'},
  {id: 'LOC_BIL', name: 'LOC_BIL', description: 'ACME RV Billings'},
  {id: 'LOC_BOI', name: 'LOC_BOI', description: 'ACME RV Boise'},
  // Pacific Northwest & West Coast
  {id: 'LOC_PDX', name: 'LOC_PDX', description: 'ACME RV Portland'},
  {id: 'LOC_SAC', name: 'LOC_SAC', description: 'ACME RV Sacramento'},
  {id: 'LOC_SFO', name: 'LOC_SFO', description: 'ACME RV San Francisco'},
  {id: 'LOC_LAX', name: 'LOC_LAX', description: 'ACME RV Los Angeles'},
  {id: 'LOC_FRE', name: 'LOC_FRE', description: 'ACME RV Fresno'},
];

// Alice: AP & AR in LOC_AAA and LOC_BBB, GM in LOC_CCC
// Mike: CE (Customer Experience) in LOC_HQ
const SEED_ASSIGNMENTS: UserAssignments = {
  'alice@acme-rv.com': [
    {orgId: 'LOC_AAA', roleNames: ['AP', 'AR']},
    {orgId: 'LOC_BBB', roleNames: ['AP', 'AR']},
    {orgId: 'LOC_CCC', roleNames: ['GM']},
  ],
  'mike@acme-rv.com': [{orgId: 'LOC_HQ', roleNames: ['CE']}],
};

const getAccessToken = async (): Promise<string> => {
  console.log(`${BLUE}[1/6]${NC} Getting Logto Management API access token...`);
  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    resource: 'https://default.logto.app/api',
    scope: 'all',
    client_id: LOGTO_M2M_APP_ID.replace(/"/g, ''),
    client_secret: LOGTO_M2M_APP_SECRET.replace(/"/g, ''),
  });
  const res = await fetch(`${LOGTO_ENDPOINT}/oidc/token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body,
  });
  let json: TokenResponse;
  try {
    json = (await res.json()) as unknown as TokenResponse;
  } catch {
    json = {} as TokenResponse;
  }
  const token = json.access_token;
  if (!token) {
    console.error(`${RED}ERROR: Failed to get access token${NC}`);
    console.error('Response:', json);
    process.exit(1);
  }
  console.log(`${GREEN}✓ Access token obtained${NC}\n`);
  return token;
};

const cleanDatabase = async (accessToken: string) => {
  console.log(`${BLUE}[0/6]${NC} Cleaning existing Logto data...`);

  // Remove users (with primaryEmail)
  console.log(`${YELLOW}  Removing users...${NC}`);
  let userCount = 0;
  let userPage = 1;
  let hasMoreUsers = true;
  while (hasMoreUsers) {
    const usersRes = await fetch(`${LOGTO_ENDPOINT}/api/users?page=${userPage}&page_size=100`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    const users = (await usersRes.json()) as User[];
    if (users.length === 0) {
      hasMoreUsers = false;
      break;
    }
    for (const u of users) {
      const detailsRes = await fetch(`${LOGTO_ENDPOINT}/api/users/${u.id}`, {
        headers: {Authorization: `Bearer ${accessToken}`},
      });
      let details: User | Record<string, never>;
      try {
        details = (await detailsRes.json()) as unknown as User | Record<string, never>;
      } catch {
        details = {};
      }
      if (details && 'primaryEmail' in details) {
        try {
          await fetch(`${LOGTO_ENDPOINT}/api/users/${u.id}`, {
            method: 'DELETE',
            headers: {Authorization: `Bearer ${accessToken}`},
          });
          userCount += 1;
        } catch {
          // ignore
        }
      }
    }
    userPage += 1;
  }
  console.log(`${GREEN}  ✓ Removed ${userCount} users${NC}`);

  // Remove roles
  console.log(`${YELLOW}  Removing roles...${NC}`);
  let roleCount = 0;
  let rolePage = 1;
  let hasMoreRoles = true;
  while (hasMoreRoles) {
    const rolesRes = await fetch(`${LOGTO_ENDPOINT}/api/roles?page=${rolePage}&page_size=100`, {
      headers: {Authorization: `Bearer ${accessToken}`},
    });
    const roles = (await rolesRes.json()) as Role[];
    if (roles.length === 0) {
      hasMoreRoles = false;
      break;
    }
    for (const r of roles) {
      try {
        await fetch(`${LOGTO_ENDPOINT}/api/roles/${r.id}`, {
          method: 'DELETE',
          headers: {Authorization: `Bearer ${accessToken}`},
        });
        roleCount += 1;
      } catch {
        // ignore
      }
    }
    rolePage += 1;
  }
  console.log(`${GREEN}  ✓ Removed ${roleCount} roles${NC}`);

  // Remove organizations
  console.log(`${YELLOW}  Removing organizations...${NC}`);
  let orgCount = 0;
  let orgPage = 1;
  let hasMoreOrgs = true;
  while (hasMoreOrgs) {
    const orgsRes = await fetch(
      `${LOGTO_ENDPOINT}/api/organizations?page=${orgPage}&page_size=100`,
      {
        headers: {Authorization: `Bearer ${accessToken}`},
      },
    );
    const orgs = (await orgsRes.json()) as Array<{id: string}>;
    if (orgs.length === 0) {
      hasMoreOrgs = false;
      break;
    }
    for (const o of orgs) {
      try {
        await fetch(`${LOGTO_ENDPOINT}/api/organizations/${o.id}`, {
          method: 'DELETE',
          headers: {Authorization: `Bearer ${accessToken}`},
        });
        orgCount += 1;
      } catch {
        // ignore
      }
    }
    orgPage += 1;
  }
  console.log(`${GREEN}  ✓ Removed ${orgCount} organizations${NC}`);

  // Remove organization roles
  console.log(`${YELLOW}  Removing organization roles...${NC}`);
  let orgRoleCount = 0;
  let orgRolePage = 1;
  let hasMoreOrgRoles = true;
  while (hasMoreOrgRoles) {
    const orgRolesRes = await fetch(
      `${LOGTO_ENDPOINT}/api/organization-roles?page=${orgRolePage}&page_size=100`,
      {
        headers: {Authorization: `Bearer ${accessToken}`},
      },
    );
    const orgRoles = (await orgRolesRes.json()) as Role[];
    if (orgRoles.length === 0) {
      hasMoreOrgRoles = false;
      break;
    }
    for (const r of orgRoles) {
      try {
        await fetch(`${LOGTO_ENDPOINT}/api/organization-roles/${r.id}`, {
          method: 'DELETE',
          headers: {Authorization: `Bearer ${accessToken}`},
        });
        orgRoleCount += 1;
      } catch {
        // ignore
      }
    }
    orgRolePage += 1;
  }
  console.log(`${GREEN}  ✓ Removed ${orgRoleCount} organization roles${NC}`);

  console.log(`${GREEN}✓ Database cleaned${NC}\n`);
};

const configureBranding = async (accessToken: string) => {
  console.log(`${BLUE}[2/6]${NC} Configuring branding...`);
  const brandingPayload = {
    branding: {
      logoUrl:
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODUuMSA2OS4wNyI+PGRlZnM+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJNMCAwaDE4NS4xdjY5LjA3SDB6IiBzdHlsZT0iZmlsbDpub25lIi8+PC9jbGlwUGF0aD48c3R5bGU+LmN7ZmlsbDojZGY0MTQ1fS5ke2ZpbGw6IzNjMzkzOH08L3N0eWxlPjwvZGVmcz48ZyBzdHlsZT0iY2xpcC1wYXRoOnVybCgjYSkiPjxwYXRoIGQ9Im01Ni44OCAzOC45LTEzLjM1LTcuNzEtMTQuNTktOC40MmEzLjc0IDMuNzQgMCAwIDEtMS44OC0zLjI1VjguNjhhOC40IDguNCAwIDAgMSAxLTQuMTQgMTAgMTAgMCAwIDEgMS42My0yLjJBNS40NSA1LjQ1IDAgMCAxIDM0LjUuOTJhMTAuNyAxMC43IDAgMCAxIDMuNSAxLjNsMTcuMjUgMTBBMTAuMTcgMTAuMTcgMCAwIDEgNjAuMzkgMjF2MTcuMjlhMS41MiAxLjUyIDAgMCAxLTIuMjggMS4zMlpNMjIuMjggNi40N2wuMDcgMTUuNDEuMDggMTYuNzRhMy45NCAzLjk0IDAgMCAxLTIgMy40M2wtOS4xOCA1LjM2YTkgOSAwIDAgMS00LjYgMS4yNEExMCAxMCAwIDAgMSA1IDQ4LjQ4YTUuODUgNS44NSAwIDAgMS00LjQ2LTQuMjIgMTEgMTEgMCAwIDEtLjQ1LTNMMCAyMS40MmExMC4zOSAxMC4zOSAwIDAgMSA1LjE1LTlsMTMuNjUtOCAuODgtLjUxYTEuNzMgMS43MyAwIDAgMSAyLjYgMS40OFpNMTEuNjQgNTIuNzUgMjQuOTMgNDVsMTQuMzktOC41YTQgNCAwIDAgMSA0IDBsOS4zOCA1LjMzYTguMzYgOC4zNiAwIDAgMSAzLjMgMy4yOGwuMjMuNDRhNiA2IDAgMCAxLS43NiA2LjgxIDExLjIgMTEuMiAwIDAgMS0yLjYgMi4xM2wtMTcuMDUgMTBhMTAuNDcgMTAuNDcgMCAwIDEtMTAuNDcuMDdsLTEzLjctNy43OC0uNzYtLjQzYTEuODEgMS44MSAwIDAgMSAwLTMuMTNaIiBjbGFzcz0iYyIvPjxwYXRoIGQ9Ik03NS41NC42NUg4OS4xdjUwLjIySDc1LjU0ek05NCAuNjVoMjAuNjZjMTUuNSAwIDIzLjc1IDkgMjMuNzUgMjUuMTFzLTguMjUgMjUuMTEtMjMuNzUgMjUuMTFIOTRabTMwLjQ5IDI1LjExYzAtOS42OS0yLjQ0LTEzLjM1LTExLjI2LTEzLjM1aC01LjY3VjM5LjFoNS42N2M4LjgyIDAgMTEuMjYtMy43MyAxMS4yNi0xMy4zNE0xNDAuNjggMzMuMzZoMTQuMTRjLjIxIDMuODEgMi4xNSA3IDcuODkgNyA0LjE2IDAgNy0xLjU3IDctNC43MyAwLTIuMjMtMS40NC0zLjM3LTUuMzEtNC4xNmwtNy4yNS0xLjQ0Yy03LjQ2LTEuNDMtMTUuMTMtNC42Ni0xNS4xMy0xNC42M0MxNDIuMDUgNC44OCAxNTAuOCAwIDE2Mi41NyAwYzEyLjA1IDAgMjAuMzcgNS4xNyAyMC4zNyAxNi42NWgtMTQuMTNjLjI4LTQuMzEtMy4yMy01LjQ2LTYuNi01LjQ2LTQuNTIgMC01Ljg5IDIuMy01Ljg5IDQuMjQgMCAxLjI5LjcyIDMuMDggNCAzLjhsNi40NiAxLjI5YzEzLjQxIDIuNjUgMTcuMzYgNy43NSAxNy4zNiAxNS4wNyAwIDExLjY5LTEwLjEyIDE2LTIxLjUyIDE2LTEzLjIgMC0yMi02LTIyLTE4LjIzTTc1Ljc3IDU5Ljk5aDEuMDR2N2gtMS4wNHpNODAgNjIuNTRBMS4zMSAxLjMxIDAgMCAwIDc4LjU4IDY0djNoLTF2LTUuMmgxdjFhMS42OSAxLjY5IDAgMCAxIDEuNzUtMS4xNGMxIDAgMS44NC41OSAxLjg0IDIuMDZWNjdoLTF2LTNjMC0uOTMtLjQtMS40NC0xLjIyLTEuNDR9IiBjbGFzcz0iZCIvPjwvZz48L3N2Zz4=',
      darkLogoUrl:
        'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODUuMSA2OS4wNyIgdmVyc2lvbj0iMS4xIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+PGRlZnM+PGNsaXBQYXRoIGlkPSJhIj48cGF0aCBkPSJNMCAwaDE4NS4xdjY5LjA3SDB6IiBzdHlsZT0iZmlsbDpub25lIj48L3BhdGg+PC9jbGlwUGF0aD48c3R5bGU+LmN7ZmlsbDojZGY0MTQ1fS5ke2ZpbGw6I0YwRjBGMH08L3N0eWxlPjwvZGVmcz48ZyBzdHlsZT0iY2xpcC1wYXRoOnVybCgjYSkiPjxwYXRoIGQ9Im01Ni44OCAzOC45LTEzLjM1LTcuNzEtMTQuNTktOC40MmEzLjc0IDMuNzQgMCAwIDEtMS44OC0zLjI1VjguNjhhOC40IDguNCAwIDAgMSAxLTQuMTQgMTAgMTAgMCAwIDEgMS42My0yLjJBNS40NSA1LjQ1IDAgMCAxIDM0LjUuOTJhMTAuNyAxMC43IDAgMCAxIDMuNSAxLjNsMTcuMjUgMTBBMTAuMTcgMTAuMTcgMCAwIDEgNjAuMzkgMjF2MTcuMjlhMS41MiAxLjUyIDAgMCAxLTIuMjggMS4zMlpNMjIuMjggNi40N2wuMDcgMTUuNDEuMDggMTYuNzRhMy45NCAzLjk0IDAgMCAxLTIgMy40M2wtOS4xOCA1LjM2YTkgOSAwIDAgMS00LjYgMS4yNEExMCAxMCAwIDAgMSA1IDQ4LjQ4YTUuODUgNS44NSAwIDAgMS00LjQ2LTQuMjIgMTEgMTEgMCAwIDEtLjQ1LTNMMCAyMS40MmExMC4zOSAxMC4zOSAwIDAgMSA1LjE1LTlsMTMuNjUtOCAuODgtLjUxYTEuNzMgMS43MyAwIDAgMSAyLjYgMS40OFpNMTEuNjQgNTIuNzUgMjQuOTMgNDVsMTQuMzktOC41YTQgNCAwIDAgMSA0IDBsOS4zOCA1LjMzYTguMzYgOC4zNiAwIDAgMSAzLjMgMy4yOGwuMjMuNDRhNiA2IDAgMCAxLS43NiA2LjgxIDExLjIgMTEuMiAwIDAgMS0yLjYgMi4xM2wtMTcuMDUgMTBhMTAuNDcgMTAuNDcgMCAwIDEtMTAuNDcuMDdsLTEzLjctNy43OC0uNzYtLjQzYTEuODEgMS44MSAwIDAgMSAwLTMuMTNaIiBjbGFzcz0iZCIvPjwvZz48L3N2Zz4=',
      favicon: 'http://localhost:3004/favicon.ico',
    },
    color: {
      primaryColor: '#df4145',
      isDarkModeEnabled: true,
      darkPrimaryColor: '#e66b6f',
    },
    termsOfUseUrl: '',
    privacyPolicyUrl: '',
    signInMode: 'SignIn',
  };
  const res = await fetch(`${LOGTO_ENDPOINT}/api/sign-in-exp`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(brandingPayload),
  });
  if (res.ok) {
    console.log(`${GREEN}✓ Branding configured${NC}\n`);
  } else {
    console.log(`${YELLOW}⚠ Branding update returned status ${res.status}${NC}\n`);
  }
};

const createOrgRoles = async (accessToken: string) => {
  console.log(`${BLUE}[3/6]${NC} Creating organization roles...`);
  for (const role of SEED_ORG_ROLES) {
    let existing: Role[];
    try {
      const res = await fetch(
        `${LOGTO_ENDPOINT}/api/organization-roles?search=${encodeURIComponent(role.name)}`,
        {
          headers: {Authorization: `Bearer ${accessToken}`},
        },
      );
      existing = (await res.json()) as unknown as Role[];
    } catch {
      existing = [] as Role[];
    }
    if (Array.isArray(existing) && existing.some((r) => r.name === role.name)) {
      console.log(`${YELLOW}  ⊳ Organization role '${role.name}' already exists, skipping${NC}`);
      continue;
    }
    const payload = {name: role.name, description: role.description};
    const res = await fetch(`${LOGTO_ENDPOINT}/api/organization-roles`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`${GREEN}  ✓ Created role: ${role.name}${NC}`);
    } else if (res.status === 403) {
      console.log(
        `${RED}  ✗ Failed to create organization role: ${role.name} (HTTP 403 - Permission Denied)${NC}`,
      );
      console.log(`${YELLOW}     Your M2M application lacks Management API permissions.${NC}`);
      console.log(`${YELLOW}     See: docs/LOGTO_M2M_SETUP.md for instructions${NC}`);
    } else {
      console.log(
        `${RED}  ✗ Failed to create organization role: ${role.name} (HTTP ${res.status})${NC}`,
      );
      console.log(await res.text());
    }
  }
  console.log('');
};

const createUsers = async (accessToken: string) => {
  console.log(`${BLUE}[4/6]${NC} Creating test users...`);
  for (const user of SEED_USERS) {
    let existing: User[];
    try {
      const res = await fetch(
        `${LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(user.email)}`,
        {
          headers: {Authorization: `Bearer ${accessToken}`},
        },
      );
      existing = (await res.json()) as unknown as User[];
    } catch {
      existing = [] as User[];
    }
    if (Array.isArray(existing) && existing.some((u) => u.primaryEmail === user.email)) {
      console.log(`${YELLOW}  ⊳ User '${user.email}' already exists, skipping${NC}`);
      continue;
    }
    const payload = {
      primaryEmail: user.email,
      username: user.username,
      name: user.name,
      password: user.password,
    };
    const res = await fetch(`${LOGTO_ENDPOINT}/api/users`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      console.log(`${GREEN}  ✓ Created user: ${user.email}${NC}`);
    } else {
      const body = await res.text();
      if (body.includes('email_already_in_use')) {
        console.log(`${YELLOW}  ⊳ User '${user.email}' already exists${NC}`);
      } else {
        console.log(`${RED}  ✗ Failed to create user: ${user.email} (HTTP ${res.status})${NC}`);
      }
    }
  }
  console.log('');
};

const createOrganizations = async (accessToken: string): Promise<Record<string, string>> => {
  console.log(`${BLUE}[5/6]${NC} Creating organizations...`);
  const orgIdMap: Record<string, string> = {};

  for (const org of SEED_ORGANIZATIONS) {
    let existing: Organization[];
    try {
      const res = await fetch(
        `${LOGTO_ENDPOINT}/api/organizations?search=${encodeURIComponent(org.name)}`,
        {
          headers: {Authorization: `Bearer ${accessToken}`},
        },
      );
      existing = (await res.json()) as unknown as Organization[];
    } catch {
      existing = [] as Organization[];
    }

    const found = existing.find((o) => o.name === org.name);
    if (found) {
      console.log(`${YELLOW}  ⊳ Organization '${org.name}' already exists${NC}`);
      orgIdMap[org.id] = found.id;
      continue;
    }

    const payload = {
      name: org.name,
      description: org.description,
      customId: org.id, // Set customId to LOC_AAA, LOC_BBB, etc. for database filtering
    };
    const res = await fetch(`${LOGTO_ENDPOINT}/api/organizations`, {
      method: 'POST',
      headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const created = (await res.json()) as Organization;
      orgIdMap[org.id] = created.id;
      console.log(`${GREEN}  ✓ Created organization: ${org.name} (${created.id})${NC}`);
      console.log(`    customId returned: ${created.customId || 'NOT SET'}`);
    } else {
      console.log(`${RED}  ✗ Failed to create organization: ${org.name} (HTTP ${res.status})${NC}`);
    }
  }
  console.log('');
  return orgIdMap;
};

const getRoleIdMap = async (accessToken: string): Promise<Record<string, string>> => {
  const res = await fetch(`${LOGTO_ENDPOINT}/api/organization-roles?page=1&page_size=100`, {
    headers: {Authorization: `Bearer ${accessToken}`},
  });
  const json = await res.json();

  if (!res.ok || !Array.isArray(json)) {
    console.error(`${RED}ERROR: Failed to fetch organization roles for ID mapping${NC}`);
    console.error('Response:', json);
    return {};
  }

  const roles = json as Role[];
  const map: Record<string, string> = {};
  for (const r of roles) {
    if (r?.id && r?.name) {
      map[r.name] = r.id;
    }
  }
  return map;
};

const getUserIdByEmail = async (accessToken: string, email: string): Promise<string | null> => {
  const res = await fetch(`${LOGTO_ENDPOINT}/api/users?search=${encodeURIComponent(email)}`, {
    headers: {Authorization: `Bearer ${accessToken}`},
  });
  const users = (await res.json()) as User[];
  const found = users.find((u) => u.primaryEmail === email);
  return found?.id ?? null;
};

const ensureOrgMembership = async (accessToken: string, orgId: string, userId: string) => {
  const res = await fetch(`${LOGTO_ENDPOINT}/api/organizations/${orgId}/users`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({userIds: [userId]}),
  });
  if (res.ok || res.status === 409 || res.status === 422) {
    return;
  }
  let errorBody = '';
  try {
    errorBody = await res.text();
  } catch {
    console.warn(``);
    // ignore
  }
  console.log(
    `${YELLOW}  ⊳ Could not ensure membership for user ${userId} in ${orgId} (HTTP ${res.status})${NC}`,
  );
  if (errorBody) {
    console.log(`${YELLOW}     ${errorBody}${NC}`);
  }
};

const assignRolesToOrgMember = async (
  accessToken: string,
  orgId: string,
  userId: string,
  roleIds: string[],
) => {
  if (!roleIds.length) {
    return;
  }
  const res = await fetch(`${LOGTO_ENDPOINT}/api/organizations/${orgId}/users/${userId}/roles`, {
    method: 'POST',
    headers: {Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json'},
    body: JSON.stringify({organizationRoleIds: roleIds}),
  });
  if (res.ok) {
    console.log(
      `${GREEN}  ✓ Assigned roles [${roleIds.join(', ')}] to user ${userId} in ${orgId}${NC}`,
    );
  } else if (res.status === 403) {
    console.log(`${RED}  ✗ Failed to assign roles (HTTP 403).${NC}`);
    console.log(
      `${YELLOW}     Ensure M2M app has Management API permissions in the same tenant as the org.${NC}`,
    );
  } else {
    let errorBody = '';
    try {
      errorBody = await res.text();
    } catch (err) {
      console.warn(`${RED}  ✗ Failed to read res.text() ${NC}`, err);
      // ignore
    }
    console.log(`${RED}  ✗ Failed to assign roles (HTTP ${res.status})${NC}`);
    if (errorBody) {
      console.log(`${RED}     ${errorBody}${NC}`);
    }
  }
};

const applyAssignments = async (accessToken: string, orgIdMap: Record<string, string>) => {
  console.log(`${BLUE}[6/6]${NC} Applying user role assignments in organizations...`);
  const roleIdMap = await getRoleIdMap(accessToken);

  for (const [email, assignments] of Object.entries(SEED_ASSIGNMENTS)) {
    const userId = await getUserIdByEmail(accessToken, email);
    if (!userId) {
      console.log(`${YELLOW}  ⊳ User ${email} not found; skipping assignments${NC}`);
      continue;
    }

    for (const {orgId, roleNames} of assignments) {
      const realOrgId = orgIdMap[orgId];
      if (!realOrgId) {
        console.log(`${YELLOW}  ⊳ Organization ${orgId} not found in map; skipping${NC}`);
        continue;
      }

      await ensureOrgMembership(accessToken, realOrgId, userId);
      const roleIds = roleNames.map((name) => roleIdMap[name]).filter((id): id is string => !!id);
      if (roleIds.length !== roleNames.length) {
        const missing = roleNames.filter((n) => !roleIdMap[n]);
        console.log(
          `${YELLOW}  ⊳ Missing role IDs for [${missing.join(', ')}] in ${orgId}; ensure roles exist before assignment${NC}`,
        );
      }
      await assignRolesToOrgMember(accessToken, realOrgId, userId, roleIds);
    }
  }
  console.log('');
};

const showSummary = () => {
  console.log(`${BLUE}[6/6]${NC} Summary`);
  console.log(`${GREEN}✓ Logto seeding complete!${NC}\n`);
  if (CLEAN_MODE) {
    console.log(`${YELLOW}⚠️  IMPORTANT: Database was cleaned/reset${NC}`);
    console.log(`${YELLOW}Your .env file may have outdated M2M credentials.${NC}\n`);
    console.log(`${BLUE}Current M2M Credentials in database:${NC}`);
    console.log(`  App ID: ${LOGTO_M2M_APP_ID}`);
    console.log(`  Secret: ${LOGTO_M2M_APP_SECRET.substring(0, 25)}...\n`);
    console.log(`${GREEN}To auto-update your .env file, run:${NC}`);
    console.log(`  ${BLUE}npm run logto:update-credentials${NC}\n`);
  }
  console.log(`${YELLOW}Test Users Created:${NC}`);
  for (const u of SEED_USERS) {
    console.log(`  • ${u.email} / ${u.password}`);
  }
  console.log('');
  console.log(`${YELLOW}Roles Created:${NC}`);
  for (const r of SEED_ORG_ROLES) {
    console.log(`  • ${r.name} - ${r.display}`);
  }
  console.log('');
  console.log(`${YELLOW}Organizations Created:${NC}`);
  for (const o of SEED_ORGANIZATIONS) {
    console.log(`  • ${o.id} - ${o.name}`);
  }
  console.log('');
  console.log(`${YELLOW}Assignments Applied:${NC}`);
  for (const [email, assignments] of Object.entries(SEED_ASSIGNMENTS)) {
    const details = assignments.map((a) => `${a.orgId}: ${a.roleNames.join(', ')}`).join(' | ');
    console.log(`  • ${email} → ${details}`);
  }
  console.log('');
  console.log(`${BLUE}Next Steps:${NC}`);
  console.log('  1. Visit http://localhost:3001/console to view configuration');
  console.log('  2. Assign roles to users in the Logto console');
  console.log('  3. Add users to organizations as needed');
  console.log('');
  console.log(
    `${YELLOW}Note:${NC} Role and organization assignments must be done through the console`,
  );
  console.log('      or by extending this script with additional API calls.');
  console.log('');
};

const main = async () => {
  logBox('Logto Seed Script - Configuration Setup');

  if (!LOGTO_M2M_APP_ID || !LOGTO_M2M_APP_SECRET) {
    console.error(`${RED}ERROR: M2M credentials not found${NC}`);
    console.error('Please set LOGTO_M2M_APP_ID and LOGTO_M2M_APP_SECRET in your .env file');
    console.error('\nSee: apps/sonix-apis/docs/LOGTO_SETUP.md for instructions');
    process.exit(1);
  }

  if (CLEAN_MODE) {
    console.log(`${YELLOW}⚠️  CLEAN MODE ENABLED${NC}`);
    console.log(`${YELLOW}This will DELETE all users, roles, and organizations from Logto!${NC}`);
    console.log(`${YELLOW}Applications and connectors will be preserved.${NC}\n`);
    const rl = readline.createInterface({input, output});
    const confirmed: boolean = await new Promise((resolve) => {
      rl.question('Are you sure? [y/n]: ', (ans) => {
        rl.close();
        resolve(ans.trim() === 'y');
      });
    });
    if (!confirmed) {
      console.log(`${RED}Aborted.${NC}`);
      process.exit(0);
    }
    console.log('');
  }

  console.log(`${YELLOW}Configuration:${NC}`);
  console.log(`  Endpoint: ${LOGTO_ENDPOINT}`);
  console.log(`  App ID: ${LOGTO_M2M_APP_ID.substring(0, 10)}...`);
  console.log('');

  const accessToken = await getAccessToken();

  console.log(`  Access Token: ${accessToken}\n`);

  if (CLEAN_MODE) {
    await cleanDatabase(accessToken);
  }

  await configureBranding(accessToken);
  await createOrgRoles(accessToken);
  await createUsers(accessToken);
  const orgIdMap = await createOrganizations(accessToken);
  await applyAssignments(accessToken, orgIdMap);

  showSummary();
};

try {
  await main();
} catch (err) {
  console.error(`${RED}Unexpected error:${NC}`, err);
  process.exit(1);
}
