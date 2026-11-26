/**
 * Base Entity Interface
 *
 * Defines common audit trail and soft-delete fields for all domain entities.
 * Mirrors the DmsBaseClass entity structure.
 */
export interface DmsBaseEntity {
  /** UUID primary key */
  id: string;

  /** Timestamp when the record was created */
  createdDate: Date;

  /** User ID who created the record */
  createdBy?: string | null;

  /** Timestamp when the record was last updated */
  updatedDate: Date;

  /** User ID who last updated the record */
  updatedBy?: string | null;

  /** Version number for optimistic locking */
  version: number;

  /** Soft delete flag */
  isDeleted: boolean;
}
