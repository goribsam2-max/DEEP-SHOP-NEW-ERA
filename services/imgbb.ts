
const IMGBB_API_KEY = "0af2a5cbe01e0fdb3a12e6a8b7efcc8d";

export const uploadToImgbb = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const response = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: 'POST',
      body: formData,
    });
    const result = await response.json();
    if (result.success) {
      return result.data.url.replace(/^http:\/\//i, 'https://');
    } else {
      console.warn('Imgbb API failed, falling back to local base64 URI:', result.error?.message || 'Upload failed');
      return await fileToBase64(file);
    }
  } catch (error) {
    console.error('Error uploading to Imgbb, falling back to local base64:', error);
    return await fileToBase64(file);
  }
};

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

