export const VISION_API_URL =
  process.env.NEXT_PUBLIC_VISION_API_URL || 'http://localhost:8800';

export const FACE_ENROLLMENT_ANGLES = [
  'front',
  'left',
  'right',
  'up',
  'down',
  'upLeft',
  'upRight',
] as const;

export type FaceEnrollmentAngle = (typeof FACE_ENROLLMENT_ANGLES)[number];
export type FaceCaptureMap = Record<FaceEnrollmentAngle, Blob | null>;

export interface PerImageEnrollmentResult {
  name: string;
  angle: string | null;
  ok: boolean;
  reason?: string | null;
}

export interface EnrollResponse {
  label: string;
  embeddings_added: number;
  per_image: PerImageEnrollmentResult[];
  total_embeddings: number;
}

export interface EnrolledUser {
  label: string;
  num_embeddings: number;
  updated_at: string;
}

export interface ActiveTrack {
  id: number;
  user: string;
  bbox: [number, number, number, number];
}

export interface ActivePersonTrack extends ActiveTrack {
  reid_ok: boolean;
  confidence: number;
}

export interface ActiveTrackingResponse {
  faces: ActiveTrack[];
  persons: ActivePersonTrack[];
  ts: number;
}

export const createEmptyFaceCaptures = (): FaceCaptureMap => ({
  front: null,
  left: null,
  right: null,
  up: null,
  down: null,
  upLeft: null,
  upRight: null,
});

export const nextFaceEnrollmentAngle = (
  faces: FaceCaptureMap,
): FaceEnrollmentAngle | 'done' => {
  return FACE_ENROLLMENT_ANGLES.find((angle) => !faces[angle]) || 'done';
};

export const isFaceEnrollmentComplete = (faces: FaceCaptureMap): boolean => {
  return FACE_ENROLLMENT_ANGLES.every((angle) => Boolean(faces[angle]));
};

export const getCurrentIdentityLabel = (): string | null => {
  const savedUsername = localStorage.getItem('username')?.trim();
  if (savedUsername) return savedUsername;

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payloadPart = token.split('.')[1];
    if (!payloadPart) return null;
    const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(normalized)) as { sub?: unknown };
    return typeof payload.sub === 'string' && payload.sub.trim() ? payload.sub.trim() : null;
  } catch {
    return null;
  }
};

export const normalizeIdentityLabel = (name: string): string => name.trim();

export const enrollFaceBatch = async (
  label: string,
  faces: FaceCaptureMap,
): Promise<EnrollResponse> => {
  const form = new FormData();
  form.append('label', normalizeIdentityLabel(label));

  for (const angle of FACE_ENROLLMENT_ANGLES) {
    const file = faces[angle];
    if (!file) {
      throw new Error(`Missing face angle: ${angle}`);
    }
    form.append(angle, file, `${angle}.jpg`);
  }

  const response = await fetch(`${VISION_API_URL}/enroll`, {
    method: 'POST',
    body: form,
  });

  if (!response.ok) {
    throw new Error(await readVisionError(response));
  }

  return (await response.json()) as EnrollResponse;
};


async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retries = 3,
  baseDelay = 400,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, baseDelay * (attempt + 1)));
    }
  }
}

export const fetchEnrolledUsers = async (): Promise<EnrolledUser[]> => {
  const response = await fetchWithRetry(`${VISION_API_URL}/enrolled`);
  const data = (await response.json()) as { users?: EnrolledUser[] };
  return data.users || [];
};

export const deleteEnrolledUser = async (label: string): Promise<void> => {
  const response = await fetch(`${VISION_API_URL}/enrolled/${encodeURIComponent(label)}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    throw new Error(await readVisionError(response));
  }
};

export const fetchActiveTracking = async (): Promise<ActiveTrackingResponse> => {
  const response = await fetch(`${VISION_API_URL}/tracking/active`);
  if (!response.ok) {
    throw new Error(await readVisionError(response));
  }
  return (await response.json()) as ActiveTrackingResponse;
};

const readVisionError = async (response: Response): Promise<string> => {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === 'string') return data.detail;
    if (data.detail && typeof data.detail === 'object') return summarizeDetail(data.detail);
  } catch {
    // Fall through to text response.
  }

  const text = await response.text().catch(() => '');
  return text || `Vision API request failed with HTTP ${response.status}`;
};

const summarizeDetail = (detail: object): string => {
  const maybeResult = detail as {
    per_image?: PerImageEnrollmentResult[];
    embeddings_added?: number;
  };
  const failed = maybeResult.per_image?.filter((item) => !item.ok) || [];
  if (failed.length > 0) {
    return failed
      .map((item) => `${item.angle || item.name}: ${item.reason || 'failed'}`)
      .join('; ');
  }
  if (typeof maybeResult.embeddings_added === 'number') {
    return `Enrollment produced ${maybeResult.embeddings_added} embeddings`;
  }
  return 'Vision API rejected the enrollment request';
};
