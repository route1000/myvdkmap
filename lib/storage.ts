// Node preview stores validated data URLs in the local database. Hosted builds alias this module to R2.
export async function savePhoto(value: string) { return value; }
export async function deletePhoto(_value: string) { /* No detached file in the Node preview. */ }
export async function readStoredPhoto(_value: string): Promise<Response | null> { return null; }
