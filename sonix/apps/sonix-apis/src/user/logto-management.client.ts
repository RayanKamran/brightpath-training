import {DEFAULT_PAGE} from '@dms/data-models';
import {Injectable, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';

const DEFAULT_PAGE_SIZE = 100;
interface CreateUserParams {
  primaryEmail: string;
  password: string;
  name: string;
  username?: string;
}

interface LogtoUser {
  id: string;
  username: string | null;
  primaryEmail: string | null;
  primaryPhone: string | null;
  name: string | null;
  avatar: string | null;
  createdAt: number;
  lastSignInAt: number | null;
}

interface LogtoOrganization {
  id: string;
  name: string;
  description?: string;
  customId?: string;
  customData?: Record<string, unknown>;
}

interface LogtoOrganizationRole {
  id: string;
  name: string;
  description?: string;
  customData?: Record<string, unknown>;
}

@Injectable()
export class LogtoManagementClient {
  private readonly _logger = new Logger(LogtoManagementClient.name);
  readonly endpoint: string; // Made public for LocationsCacheService
  private readonly _appId: string;
  private readonly _appSecret: string;
  private _accessToken: string | null = null;
  private _tokenExpiry: number = 0;

  constructor(private readonly _configService: ConfigService) {
    this.endpoint = this._configService.get<string>('LOGTO_ENDPOINT') || 'http://localhost:3001';
    this._appId = this._configService.get<string>('LOGTO_M2M_APP_ID') || '';
    this._appSecret = this._configService.get<string>('LOGTO_M2M_APP_SECRET') || '';

    this._logger.log(`Logto Configuration:
      Endpoint: ${this.endpoint}
      App ID: ${this._appId ? '***configured***' : 'MISSING'}
      App Secret: ${this._appSecret ? '***configured***' : 'MISSING'}`);

    if (!this._appId || !this._appSecret) {
      this._logger.warn('Logto M2M credentials not configured. User registration will not work.');
    }
  }

  /**
   * Get access token for Logto Management API
   * Made public for use by LocationsCacheService
   */
  public async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this._accessToken && Date.now() < this._tokenExpiry) {
      return this._accessToken;
    }

    const tokenUrl: string = `${this.endpoint}/oidc/token`;

    this._logger.debug(`Requesting access token from: ${tokenUrl}`);
    this._logger.debug(`Client ID configured: ${!!this._appId}`);
    this._logger.debug(`Client Secret configured: ${!!this._appSecret}`);

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        resource: 'https://default.logto.app/api',
        scope: 'all',
        client_id: this._appId,
        client_secret: this._appSecret,
      }),
    });

    if (!response.ok) {
      const error: string = await response.text();
      this._logger.error(`Failed to get Logto access token (Status: ${response.status}): ${error}`);
      throw new Error('Failed to authenticate with Logto Management API');
    }

    const data = (await response.json()) as {access_token: string; expires_in: number};
    this._accessToken = data.access_token;
    // Set expiry to 5 minutes before actual expiry to be safe
    this._tokenExpiry = Date.now() + (data.expires_in - 300) * 1000;

    return this._accessToken;
  }

  /**
   * Create a new user in Logto
   */
  public async createUser(params: CreateUserParams): Promise<LogtoUser> {
    const token: string = await this.getAccessToken();

    // Build request body, only including username if it's provided and not empty
    const requestBody: {
      primaryEmail: string;
      password: string;
      name: string;
      username?: string;
    } = {
      primaryEmail: params.primaryEmail,
      password: params.password,
      name: params.name,
    };

    // Only include username if it's a non-empty string
    if (params.username && params.username.trim().length > 0) {
      requestBody.username = params.username.trim();
    }

    const response = await fetch(`${this.endpoint}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = (await response.json()) as {code?: string; message?: string};
      this._logger.error(`Failed to create user in Logto: ${JSON.stringify(error)}`);

      // Check for duplicate email
      if (response.status === 422 || error.code === 'user.email_already_in_use') {
        throw new Error('A user with this email already exists');
      }

      throw new Error(error.message || 'Failed to create user in Logto');
    }

    const user: LogtoUser = (await response.json()) as LogtoUser;
    return user;
  }

  /**
   * Get user details from Logto by user ID
   */
  public async getUser(userId: string): Promise<LogtoUser> {
    const token: string = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}/api/users/${userId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error: {code?: string; message?: string} = (await response.json()) as {
        code?: string;
        message?: string;
      };
      this._logger.error(`Failed to get user from Logto: ${JSON.stringify(error)}`);
      throw new Error(error.message || 'Failed to get user from Logto');
    }

    const user: LogtoUser = (await response.json()) as LogtoUser;
    return user;
  }

  /**
   * Get all organizations that a user belongs to
   */
  public async getUserOrganizations(userId: string): Promise<LogtoOrganization[]> {
    const token: string = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}/api/users/${userId}/organizations`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as {code?: string; message?: string};
      this._logger.error(`Failed to get user organizations from Logto: ${JSON.stringify(error)}`);
      throw new Error(error.message || 'Failed to get user organizations from Logto');
    }

    const organizations = (await response.json()) as LogtoOrganization[];
    this._logger.log(
      `Got ${organizations.length} orgs from Logto. First org structure: ${JSON.stringify(organizations[0], null, 2)}`,
    );
    return organizations;
  }

  /**
   * Get a specific organization by ID
   */
  public async getOrganization(organizationId: string): Promise<LogtoOrganization> {
    const token: string = await this.getAccessToken();

    const response = await fetch(`${this.endpoint}/api/organizations/${organizationId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error: {code?: string; message?: string} = (await response.json()) as {
        code?: string;
        message?: string;
      };
      this._logger.error(`Failed to get organization from Logto: ${JSON.stringify(error)}`);
      throw new Error(error.message || 'Failed to get organization from Logto');
    }

    const organization: LogtoOrganization = (await response.json()) as LogtoOrganization;
    return organization;
  }

  /**
   * Get user's roles within a specific organization
   */
  public async getUserOrganizationRoles(
    userId: string,
    organizationId: string,
  ): Promise<LogtoOrganizationRole[]> {
    const token: string = await this.getAccessToken();

    const response = await fetch(
      `${this.endpoint}/api/organizations/${organizationId}/users/${userId}/roles`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.ok) {
      const error = (await response.json()) as {code?: string; message?: string};
      this._logger.error(
        `Failed to get user organization roles from Logto: ${JSON.stringify(error)}`,
      );
      throw new Error(error.message || 'Failed to get user organization roles from Logto');
    }

    const roles = (await response.json()) as LogtoOrganizationRole[];
    return roles;
  }

  /**
   * Get all users from Logto
   */
  public async getAllUsers(): Promise<LogtoUser[]> {
    const token: string = await this.getAccessToken();
    const all: LogtoUser[] = [];
    const pageSize = DEFAULT_PAGE_SIZE;
    let page: number = DEFAULT_PAGE;

    while (true) {
      const url = `${this.endpoint}/api/users?page=${page}&page_size=${pageSize}`;
      this._logger.debug(`Fetching users page ${page}: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error: {code?: string; message?: string} = (await response.json()) as {
          code?: string;
          message?: string;
        };
        this._logger.error(`Failed to get users page ${page}: ${JSON.stringify(error)}`);
        throw new Error(error.message || 'Failed to get all users from Logto');
      }

      const users: LogtoUser[] = (await response.json()) as LogtoUser[];
      this._logger.debug(`Page ${page} returned ${users.length} users`);

      if (users.length === 0) {
        break;
      }
      all.push(...users);
      if (users.length < pageSize) {
        break;
      }
      page += 1;
    }

    this._logger.log(`getAllUsers: fetched ${all.length} total users`);
    return all;
  }

  /**
   * Get all organizations from Logto
   * Used by LocationsCacheService to populate the cache
   */
  public async getAllOrganizations(): Promise<LogtoOrganization[]> {
    const token: string = await this.getAccessToken();
    const all: LogtoOrganization[] = [];
    const pageSize: number = DEFAULT_PAGE_SIZE;
    let page: number = DEFAULT_PAGE;

    while (true) {
      const url = `${this.endpoint}/api/organizations?page=${page}&page_size=${pageSize}`;
      this._logger.debug(`Fetching organizations page ${page}: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const error = (await response.json()) as {code?: string; message?: string};
        this._logger.error(`Failed to get all organizations from Logto: ${JSON.stringify(error)}`);
        throw new Error(error.message || 'Failed to get all organizations from Logto');
      }

      const organizations = (await response.json()) as LogtoOrganization[];
      this._logger.debug(`Page ${page} returned ${organizations.length} organizations`);

      if (organizations.length === 0) {
        break;
      }
      all.push(...organizations);
      if (organizations.length < pageSize) {
        break;
      }
      page += 1;
    }

    this._logger.log(`getAllOrganizations: fetched ${all.length} total organizations`);
    return all;
  }
}
