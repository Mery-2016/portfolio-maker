export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AI_INSUFFICIENT_INPUT: 'AI_INSUFFICIENT_INPUT',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  PAYLOAD_TOO_LARGE: 'PAYLOAD_TOO_LARGE',
  UNSUPPORTED_MEDIA: 'UNSUPPORTED_MEDIA',
  AI_LIMIT_REACHED: 'AI_LIMIT_REACHED',
  RATE_LIMITED: 'RATE_LIMITED',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  AI_INVALID_OUTPUT: 'AI_INVALID_OUTPUT',
  EXPORT_FAILED: 'EXPORT_FAILED',
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface AppError {
  code: ErrorCode;
  message: string;
  details?: Array<{ path?: string; code?: string; message?: string }>;
}
