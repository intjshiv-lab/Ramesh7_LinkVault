// File validation configuration

// Allowed MIME types
export const ALLOWED_TYPES = [
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    // Documents
    'application/pdf',
    'text/plain',
    'text/csv',
    'text/html',
    'text/css',
    'text/javascript',
    'application/json',
    'application/xml',
    // Archives
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/gzip',
    // Media
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    // Office
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
];

// Max file size in bytes (50MB)
export const MAX_FILE_SIZE = 50 * 1024 * 1024;

// Blocked extensions (security)
export const BLOCKED_EXTENSIONS = [
    'exe', 'bat', 'cmd', 'sh', 'ps1', 'vbs', 'js',
    'msi', 'dll', 'scr', 'com', 'pif'
];

// Validate file
export function validateFile(file) {
    const errors = [];

    if (!file) {
        return { valid: true, errors: [] };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
        errors.push(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
    }

    // Check MIME type
    if (!ALLOWED_TYPES.includes(file.mimetype)) {
        errors.push(`File type '${file.mimetype}' is not allowed`);
    }

    // Check extension
    const ext = file.originalname.split('.').pop().toLowerCase();
    if (BLOCKED_EXTENSIONS.includes(ext)) {
        errors.push(`File extension '.${ext}' is not allowed for security reasons`);
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

export default { ALLOWED_TYPES, MAX_FILE_SIZE, BLOCKED_EXTENSIONS, validateFile };
