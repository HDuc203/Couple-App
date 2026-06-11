/**
 * Utility to upload a file (or base64 data URL) directly to Cloudinary using secure signed upload.
 *
 * @param fileOrBase64 The File object or base64 Data URL to upload.
 * @param folder The folder to organize uploads in Cloudinary (e.g. 'avatars', 'albums', 'journals').
 * @returns The secure URL of the uploaded image.
 */
export async function uploadToCloudinary(
  fileOrBase64: File | string,
  folder: string = "user_uploads"
): Promise<string> {
  // 1. Fetch secure signature and configuration from Next.js Backend
  const sigRes = await fetch(`/api/get-cloudinary-signature?folder=${encodeURIComponent(folder)}`);
  
  if (!sigRes.ok) {
    const errorData = await sigRes.json();
    throw new Error(errorData.error || "Failed to generate secure upload signature.");
  }

  const config = await sigRes.json();
  // config contains: signature, timestamp, cloud_name, api_key

  // 2. Prepare FormData payload for Cloudinary signed upload API
  const formData = new FormData();
  formData.append("file", fileOrBase64);
  formData.append("api_key", config.api_key);
  formData.append("timestamp", config.timestamp.toString());
  formData.append("signature", config.signature);
  formData.append("folder", folder);

  // 3. Post directly from client to Cloudinary Upload API
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloud_name}/image/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json();
    throw new Error(errorData.error?.message || "Failed to upload image to Cloudinary.");
  }

  const uploadResult = await uploadRes.json();
  
  // 4. Return secure online image URL
  if (!uploadResult.secure_url) {
    throw new Error("Cloudinary response did not return a secure URL.");
  }

  return uploadResult.secure_url;
}

/**
 * Utility to upload an audio file directly to Cloudinary using secure signed upload.
 *
 * @param file The File object (MP3, WAV, etc.) to upload.
 * @param folder The folder to organize uploads in Cloudinary (e.g. 'slideshow_songs').
 * @returns The secure URL of the uploaded audio.
 */
export async function uploadAudioToCloudinary(
  file: File,
  folder: string = "slideshow_songs"
): Promise<string> {
  // 1. Fetch secure signature and configuration from Next.js Backend
  const sigRes = await fetch(`/api/get-cloudinary-signature?folder=${encodeURIComponent(folder)}`);
  
  if (!sigRes.ok) {
    const errorData = await sigRes.json();
    throw new Error(errorData.error || "Failed to generate secure upload signature.");
  }

  const config = await sigRes.json();

  // 2. Prepare FormData payload for Cloudinary signed upload API
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", config.api_key);
  formData.append("timestamp", config.timestamp.toString());
  formData.append("signature", config.signature);
  formData.append("folder", folder);

  // 3. Post directly from client to Cloudinary Upload API (video endpoint covers audio)
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${config.cloud_name}/video/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json();
    throw new Error(errorData.error?.message || "Failed to upload audio to Cloudinary.");
  }

  const uploadResult = await uploadRes.json();
  
  if (!uploadResult.secure_url) {
    throw new Error("Cloudinary response did not return a secure URL.");
  }

  return uploadResult.secure_url;
}

