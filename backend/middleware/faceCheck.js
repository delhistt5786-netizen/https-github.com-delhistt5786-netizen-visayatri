const path = require('path');
const faceapi = require('face-api.js');
const { Canvas, Image, ImageData, loadImage } = require('canvas');

faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const MODEL_DIR = path.join(__dirname, '..', 'models-weights');

// Acceptable face-coverage band (face bounding box area / total image area)
const MIN_COVERAGE = 0.12; // face too small / too far away
const MAX_COVERAGE = 0.95; // face fills almost the entire frame (likely wrong crop)

let modelsLoadedPromise = null;
function ensureModelsLoaded() {
  if (!modelsLoadedPromise) {
    modelsLoadedPromise = faceapi.nets.tinyFaceDetector.loadFromDisk(MODEL_DIR);
  }
  return modelsLoadedPromise;
}

/**
 * Detects a single face in the given image file and estimates how much of the
 * frame it covers. Used as a server-side guard for the "digital photo" upload —
 * generous thresholds since this backs up (not duplicates) the stricter client-side
 * live check.
 * @param {string} filePath - absolute path to the uploaded image
 * @returns {Promise<{ ok: boolean, found: boolean, coveragePct: number, message: string }>}
 */
async function checkFaceCoverage(filePath) {
  try {
    await ensureModelsLoaded();
    const image = await loadImage(filePath);

    const detection = await faceapi.detectSingleFace(image, new faceapi.TinyFaceDetectorOptions());
    if (!detection) {
      return { ok: false, found: false, coveragePct: 0, message: 'No face detected in the photo. Please upload a clear photo of your face.' };
    }

    const { box } = detection;
    const frameArea = image.width * image.height;
    const faceArea  = box.width * box.height;
    const coveragePct = frameArea > 0 ? faceArea / frameArea : 0;

    if (coveragePct < MIN_COVERAGE) {
      return { ok: false, found: true, coveragePct, message: 'Your face is too small in the frame. Please move closer / crop the photo so your face fills more of the image.' };
    }
    if (coveragePct > MAX_COVERAGE) {
      return { ok: false, found: true, coveragePct, message: 'Your face fills almost the entire frame. Please upload a photo with a bit more space around your head.' };
    }

    return { ok: true, found: true, coveragePct, message: 'Face coverage looks good.' };
  } catch (err) {
    console.error('[faceCheck]', err.message);
    // Fail open — don't block a legitimate submission because of an image-decoding hiccup
    return { ok: true, found: false, coveragePct: 0, message: 'Face check skipped (could not process image).' };
  }
}

module.exports = { checkFaceCoverage };
