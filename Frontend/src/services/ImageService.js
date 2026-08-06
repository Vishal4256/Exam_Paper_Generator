import api from '../utils/axiosConfig';

/**
 * Service to handle image uploads for the Rich Question Editor.
 * This abstracts the upload logic so it can easily be swapped 
 * from local backend storage to Cloudinary in production.
 */
export const ImageService = {
    /**
     * Upload an image file.
     * @param {File} file - The image file to upload.
     * @returns {Promise<string>} - The URL of the uploaded image.
     */
    uploadImage: async (file) => {
        // Prepare FormData
        const formData = new FormData();
        formData.append('image', file);

        try {
            // We use the existing question upload logic or a dedicated endpoint.
            // Assuming there's a POST /api/upload endpoint on the backend.
            // If it doesn't exist yet, we will create it.
            const response = await api.post('/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            // Return the absolute or relative URL provided by the backend
            return response.data.url;
        } catch (error) {
            console.error("ImageService upload failed:", error);
            throw new Error("Failed to upload image. Please try again.");
        }
    }
};
