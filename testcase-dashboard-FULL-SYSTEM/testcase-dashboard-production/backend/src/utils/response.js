// backend/src/utils/response.js

/**
 * Standard success response
 */
const success = (data, message = 'Success', meta = null) => {
  const response = {
    success: true,
    data,
    message,
  };
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
};

/**
 * Standard error response
 */
const error = (message, code = 500, details = null) => {
  const response = {
    success: false,
    error: {
      message,
      code,
    },
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return response;
};

/**
 * Paginated response
 */
const paginated = (data, total, limit, offset) => {
  return success(data, 'Success', {
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    },
  });
};

module.exports = {
  success,
  error,
  paginated,
};
