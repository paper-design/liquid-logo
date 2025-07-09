import { toast } from "sonner";

const MAX_FILE_SIZE = 4.5 * 1024 * 1024;

export const validateFile = (file: File): boolean => {
    if (file.size > MAX_FILE_SIZE) {
        toast.error('File size must be less than 4.5MB');
        return false;
    }

    const type = file.type;
    if (!type.startsWith('image/') || type === 'image/svg+xml') {
        toast.error('Only image or SVG files are allowed');
        return false;
    }
    return true;
}
