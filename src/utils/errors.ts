/* ***** http errors ***** */
export const HTTP_400 = {
  code: 'BAD_REQUEST',
  message: 'Bad request',
};
export const HTTP_401 = {
  code: 'UNAUTHORIZED',
  message: 'Unauthorized',
};
export const HTTP_403 = {
  code: 'ALREADY_EXISTS',
  message: 'Already exists',
};
export const HTTP_404 = {
  code: 'NOT_FOUND',
  message: 'Not found',
};
export const HTTP_500 = {
  code: 'INTERNAL_SERVER_ERROR',
  message: 'Internal server error',
};
export const HTTP_503 = {
  code: 'SERVICE_UNAVAILABLE',
  message: 'Service unavailable',
};
/* ***** custom errors ***** */

export const MEDIA_UPLOAD_NOT_FILE_FOUND = {
  code: 'MEDIA_UPLOAD_NOT_FILE_FOUND',
  message: 'Media upload not file found',
};

export const MEDIA_UPLOAD_FAILED = {
  code: 'MEDIA_UPLOAD_FAILED',
  message: 'Media upload failed',
};

export const MEDIA_UPLOAD_PATH_NOT_FOUND = {
  code: 'MEDIA_UPLOAD_PATH_NOT_FOUND',
  message: 'Media upload path not found',
};

export const MEDIA_UPLOAD_SUCCESS = {
  code: 'MEDIA_UPLOAD_SUCCESS',
  message: 'Media upload success',
};

/* ***** errors ***** */
export const errors = [
  HTTP_400,
  HTTP_401,
  HTTP_403,
  HTTP_404,
  HTTP_500,
  HTTP_503,
];
