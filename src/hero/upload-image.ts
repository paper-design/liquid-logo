import { toast } from 'sonner';

export async function uploadImage(pngBlob: Blob): Promise<string> {
  try {
    const response = await fetch('/api/user-logo', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
      },
      body: pngBlob,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const { imageId } = (await response.json()) as { imageId: string };

    window.history.pushState({}, '', `/${imageId}`);
    return imageId;
  } catch (error) {
    console.error('Error uploading image:', error);
    toast.error('Error uploading image, please try again.');
    throw error;
  }
}
