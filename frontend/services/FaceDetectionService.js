/**
 * FaceDetectionService
 *
 * In-browser face-coverage check for the mandatory "digital photo" upload box,
 * using face-api.js (tiny_face_detector, weights in /public/models). Mirrors the
 * same acceptable-coverage band as the server-side guard in
 * backend/middleware/faceCheck.js so client and server agree.
 */
import * as faceapi from 'face-api.js';

const MODEL_URL = '/models';
const MIN_COVERAGE = 0.12;
const MAX_COVERAGE = 0.95;

let modelsLoadedPromise = null;
function ensureModelsLoaded() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
  }
  return modelsLoadedPromise;
}

/**
 * Detect a single face in an <img>/<canvas>/<video> element and estimate what
 * percentage of the frame it covers.
 * @param {HTMLImageElement | HTMLCanvasElement | HTMLVideoElement} el
 * @returns {Promise<{ found: boolean, coveragePct: number, inRange: boolean, box: object|null, message: string }>}
 */
export async function detectFaceCoverage(el) {
  try {
    await ensureModelsLoaded();

    const detection = await faceapi.detectSingleFace(el, new faceapi.TinyFaceDetectorOptions());
    const width  = el.naturalWidth  || el.videoWidth  || el.width;
    const height = el.naturalHeight || el.videoHeight || el.height;

    if (!detection) {
      return { found: false, coveragePct: 0, inRange: false, box: null, message: 'No face detected. Make sure your face is clearly visible.' };
    }

    const { box } = detection;
    const frameArea = width * height;
    const faceArea  = box.width * box.height;
    const coveragePct = frameArea > 0 ? faceArea / frameArea : 0;

    if (coveragePct < MIN_COVERAGE) {
      return { found: true, coveragePct, inRange: false, box, message: 'Your face is too small in the frame — move closer or crop tighter.' };
    }
    if (coveragePct > MAX_COVERAGE) {
      return { found: true, coveragePct, inRange: false, box, message: 'Your face fills almost the whole frame — leave a bit more space around your head.' };
    }
    return { found: true, coveragePct, inRange: true, box, message: 'Good — face coverage looks right.' };
  } catch (error) {
    console.error('FaceDetectionService error:', error);
    // Fail open on the client too — the server-side guard is the real backstop
    return { found: false, coveragePct: 0, inRange: true, box: null, message: 'Face check unavailable, will be verified on upload.' };
  }
}

export default { detectFaceCoverage };
