/**
 * DTO for user registration
 */
export interface RegisterUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username?: string;
  phoneNumber?: string;
}

/**
 * Response after successful registration
 */
export interface RegisterUserResponse {
  userId: string;
  email: string;
  message: string;
}
