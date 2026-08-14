/**
 * PassportOCRService
 *
 * Abstraction layer for passport data extraction using OCR/MRZ.
 * Swap OCR_CONFIG.provider (and performOCRExtraction's implementation) to move
 * to a different provider later without touching callers of extractPassportData().
 *
 * Features:
 * - MRZ (Machine Readable Zone) extraction — prioritized over free-text OCR fields
 *   because MRZ is a fixed-format, checksum-friendly encoding and is more reliable
 *   than reading the visual passport page.
 * - OCR-based field extraction (fallback / supplement for fields MRZ doesn't carry,
 *   e.g. place of birth, place of issue)
 * - Image quality validation (resolution, brightness/contrast, blur)
 * - Data conflict detection between front and back
 * - Extraction is assistive only — every field stays editable and nothing is
 *   accepted into the application until the applicant clicks "Confirm Passport
 *   Details" in the review step (see components/visa/PassportReview.js).
 *
 * Privacy: extraction runs entirely client-side (Tesseract.js in the browser).
 * No passport image or extracted field is sent to any third-party OCR service —
 * only to this app's own backend, and only once, as part of the normal document
 * upload. Avoid console-logging full extracted objects (they may contain a
 * passport number) — log error messages only, never raw MRZ/OCR text.
 */

import Tesseract from 'tesseract.js';

/**
 * Configuration for OCR service
 * Can be easily changed to use different providers
 */
const OCR_CONFIG = {
  provider: 'tesseract', // Can be changed to 'google-vision', 'aws-textract', etc.
  language: 'eng',
  confidence_threshold: 0.6,
};

/**
 * Extract passport data from an image
 * @param {File | Blob} imageFile - The passport image
 * @param {string} side - 'front' or 'back'
 * @returns {Promise<Object>} Extracted passport data
 */
export async function extractPassportData(imageFile, side = 'front') {
  try {
    // Validate image quality first
    const qualityCheck = await validateImageQuality(imageFile);
    if (!qualityCheck.isValid) {
      return {
        success: false,
        error: qualityCheck.error,
        confidence: 0,
      };
    }

    // Convert file to image URL for processing
    const imageUrl = await fileToDataUrl(imageFile);

    // Perform OCR extraction
    const extractedData = await performOCRExtraction(imageUrl, side);

    // Validate extracted data
    const validationResult = validateExtractedData(extractedData, side);

    return {
      success: true,
      data: extractedData,
      confidence: validationResult.confidence,
      warnings: validationResult.warnings,
      qualityScore: qualityCheck.qualityScore,
    };
  } catch (error) {
    console.error('Passport OCR Error:', error);
    return {
      success: false,
      error: 'Failed to extract passport data. Please try again.',
      details: error.message,
    };
  }
}

/**
 * Validate image quality before OCR processing
 * @param {File | Blob} imageFile
 * @returns {Promise<Object>}
 */
export async function validateImageQuality(imageFile) {
  try {
    const img = new Image();
    const url = URL.createObjectURL(imageFile);

    return new Promise((resolve) => {
      img.onload = () => {
        const metrics = calculateImageQuality(img);

        if (!metrics.isValid) {
          resolve({
            isValid: false,
            qualityScore: metrics.qualityScore,
            error: 'Passport image quality is insufficient. Please upload a clearer image.',
            suggestions: metrics.suggestions,
          });
        } else {
          resolve({
            isValid: true,
            qualityScore: metrics.qualityScore,
            error: null,
          });
        }

        URL.revokeObjectURL(url);
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({
          isValid: false,
          qualityScore: 0,
          error: 'Invalid image file. Please upload a valid image.',
        });
      };

      img.src = url;
    });
  } catch (error) {
    console.error('Image quality validation error:', error);
    return {
      isValid: false,
      qualityScore: 0,
      error: 'Failed to validate image quality.',
    };
  }
}

/**
 * Calculate image quality (0-1) and diagnose the specific cause of low quality:
 * resolution, brightness (too dark / too bright), contrast, or blur (sharpness).
 * @param {HTMLImageElement} img
 * @returns {{ isValid: boolean, qualityScore: number, suggestions: string[] }}
 */
function calculateImageQuality(img) {
  const canvas = document.createElement('canvas');
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;

  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const totalPixels = data.length / 4;

  // Minimum resolution check (at least 720x480 for decent OCR / MRZ reads)
  const minWidth = 720;
  const minHeight = 480;
  const resolutionScore = Math.min(img.naturalWidth / minWidth, img.naturalHeight / minHeight, 1);

  // Brightness + contrast
  let brightPixels = 0;
  let darkPixels = 0;
  let sumBrightness = 0;
  const luma = new Float32Array(totalPixels);
  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
    luma[p] = brightness;
    sumBrightness += brightness;
    if (brightness > 200) brightPixels++;
    if (brightness < 55) darkPixels++;
  }
  const avgBrightness = sumBrightness / totalPixels;
  const contrastScore = 1 - Math.abs((brightPixels - darkPixels) / totalPixels);

  // Blur / sharpness: average absolute luminance gradient between neighboring
  // pixels along each row — sharp images (crisp text/MRZ) have high local
  // contrast between adjacent pixels; blurry images are smoothed out.
  let gradientSum = 0;
  let gradientSamples = 0;
  const width = canvas.width;
  const step = Math.max(1, Math.floor(width / 400)); // sample, don't scan every pixel
  for (let y = 0; y < canvas.height; y += step) {
    const rowStart = y * width;
    for (let x = 0; x < width - step; x += step) {
      const a = luma[rowStart + x];
      const b = luma[rowStart + x + step];
      gradientSum += Math.abs(a - b);
      gradientSamples++;
    }
  }
  const avgGradient = gradientSamples > 0 ? gradientSum / gradientSamples : 0;
  // Empirically, crisp document photos average >8-10 per-step luminance delta;
  // heavily blurred ones fall well under 4.
  const sharpnessScore = Math.max(0, Math.min(1, avgGradient / 10));

  const qualityScore = Math.max(0, Math.min(1,
    resolutionScore * 0.3 + contrastScore * 0.3 + sharpnessScore * 0.4
  ));

  const suggestions = [];
  if (resolutionScore < 0.7) suggestions.push('Image resolution is too low — use a higher-resolution photo or scan');
  if (avgBrightness < 70) suggestions.push('Image is too dark — retake in better lighting');
  if (avgBrightness > 190) suggestions.push('Image is too bright / washed out — avoid direct glare or flash');
  if (sharpnessScore < 0.4) suggestions.push('Image appears blurry — hold the camera steady and refocus');
  if (contrastScore < 0.6 && avgBrightness >= 70 && avgBrightness <= 190) suggestions.push('Low contrast — avoid shadows and glare across the page');
  if (suggestions.length === 0) suggestions.push('Ensure the entire passport page, including the bottom MRZ lines, is visible and in frame');

  return {
    isValid: qualityScore >= 0.5,
    qualityScore,
    suggestions,
  };
}

/**
 * Perform OCR extraction using Tesseract
 * @param {string} imageUrl - Data URL of the image
 * @param {string} side - 'front' or 'back'
 * @returns {Promise<Object>}
 */
async function performOCRExtraction(imageUrl, side) {
  try {
    // Initialize Tesseract worker
    const { createWorker } = Tesseract;
    const worker = await createWorker(OCR_CONFIG.language);

    // Perform OCR
    const { data: { text } } = await worker.recognize(imageUrl);
    await worker.terminate();

    // Parse extracted text
    const parsedData = parsePassportText(text, side);

    return parsedData;
  } catch (error) {
    console.error('OCR Extraction Error:', error);
    throw error;
  }
}

/**
 * Parse extracted OCR text to structured passport data
 * @param {string} text - Raw OCR text
 * @param {string} side - 'front' or 'back'
 * @returns {Object} Structured data
 */
function parsePassportText(text, side) {
  const data = {
    extractedAt: new Date().toISOString(),
    side,
    confidence: 0.5, // Default confidence
    fields: {},
    mrzFound: false,
  };

  if (side === 'front') {
    // OCR/regex extraction from the visible passport page — baseline, may be noisy
    data.fields = {
      passportNumber: extractField(text, /passport[\s\S]*?(\w{1,2}\d{6,9})/i),
      surname: extractField(text, /surname[\s\S]*?([A-Z][A-Z\s]+)/i),
      givenNames: extractField(text, /given names?[\s\S]*?([A-Z][A-Za-z\s]+)/i),
      nationality: extractField(text, /nationality[\s\S]*?([A-Z]{3,})/i),
      dateOfBirth: extractField(text, /date of birth[\s\S]*?(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i),
      gender: extractField(text, /sex[\s\S]*?([MF])/i),
      placeOfBirth: extractField(text, /place of birth[\s\S]*?([A-Z][A-Za-z\s]+)/i),
      placeOfIssue: extractField(text, /place of issue[\s\S]*?([A-Z][A-Za-z\s]+)/i),
      dateOfIssue: extractField(text, /date of issue[\s\S]*?(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i),
      dateOfExpiry: extractField(text, /date of expiry[\s\S]*?(\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4})/i),
    };
  } else if (side === 'back') {
    data.fields = {
      passportNumber: extractField(text, /(\w{1,2}\d{6,9})/),
      additionalInfo: extractField(text, /remarks[\s\S]*?(.+)/i),
    };
  }

  // MRZ is a fixed-format, checksum-friendly encoding — prefer it over the
  // regex-scraped fields above whenever it's present, on either side (some
  // issuing countries print the MRZ on the back of the biodata page).
  const mrzRaw = extractMRZ(text);
  if (mrzRaw) {
    const mrzFields = parseMRZTD3(mrzRaw);
    if (mrzFields) {
      data.mrzFound = true;
      Object.entries(mrzFields).forEach(([key, value]) => {
        if (value) data.fields[key] = value;
      });
    }
  }

  // Calculate confidence based on number of fields filled; MRZ presence is a
  // strong reliability signal so it lifts the floor.
  const filledFields = Object.values(data.fields).filter(v => v && String(v).length > 0).length;
  const fieldRatio = Math.min(1, filledFields / Math.max(1, Object.keys(data.fields).length));
  data.confidence = data.mrzFound ? Math.max(0.85, fieldRatio) : fieldRatio;

  return data;
}

/**
 * Decode a TD3-format passport MRZ (2 lines x 44 chars) into structured fields.
 * Reference layout:
 *   Line 1: P<CCCSURNAME<<GIVEN<NAMES<<<<<<<<<<<<<<<<<<<<
 *   Line 2: PASSPORTNO+CHK+NATIONALITY+YYMMDD(DOB)+CHK+SEX+YYMMDD(EXP)+CHK+PERSONALNO+CHK+CHK
 * @param {string} mrzRaw - two MRZ lines joined by '\n'
 * @returns {Object|null}
 */
function parseMRZTD3(mrzRaw) {
  const lines = mrzRaw.split('\n');
  if (lines.length !== 2 || lines[0].length !== 44 || lines[1].length !== 44) return null;
  const [line1, line2] = lines;

  try {
    const issuingCountry = line1.slice(2, 5).replace(/</g, '');
    const nameField = line1.slice(5).split('<<');
    const surname = (nameField[0] || '').replace(/</g, ' ').trim();
    const givenNames = (nameField[1] || '').replace(/</g, ' ').trim();

    const passportNumber = line2.slice(0, 9).replace(/</g, '').trim();
    const nationality = line2.slice(10, 13).replace(/</g, '');
    const dobRaw = line2.slice(13, 19);
    const sexChar = line2.slice(20, 21);
    const expRaw = line2.slice(21, 27);

    const sex = sexChar === 'M' ? 'Male' : sexChar === 'F' ? 'Female' : '';
    const dateOfBirth = mrzDateToISO(dobRaw, 'past');
    const dateOfExpiry = mrzDateToISO(expRaw, 'future');

    if (!passportNumber && !surname) return null;

    return {
      issuingCountry,
      surname,
      givenNames,
      passportNumber,
      nationality,
      dateOfBirth,
      gender: sex,
      dateOfExpiry,
    };
  } catch {
    return null;
  }
}

/**
 * Convert an MRZ YYMMDD field to an ISO YYYY-MM-DD date, inferring century.
 * @param {string} yymmdd
 * @param {'past'|'future'} bias - DOBs bias to the past century, expiry to the future
 */
function mrzDateToISO(yymmdd, bias) {
  if (!/^\d{6}$/.test(yymmdd)) return '';
  const yy = parseInt(yymmdd.slice(0, 2), 10);
  const mm = yymmdd.slice(2, 4);
  const dd = yymmdd.slice(4, 6);
  const currentYY = new Date().getFullYear() % 100;
  let century;
  if (bias === 'future') {
    century = 2000; // passports are issued/expire within a human lifetime of "now"
  } else {
    century = yy > currentYY ? 1900 : 2000;
  }
  return `${century + yy}-${mm}-${dd}`;
}

/**
 * Extract field value from text using regex
 * @param {string} text
 * @param {RegExp} pattern
 * @returns {string}
 */
function extractField(text, pattern) {
  const match = text.match(pattern);
  return match ? match[1].trim() : '';
}

/**
 * Extract Machine Readable Zone (MRZ) from text
 * MRZ is more reliable than regular OCR
 * @param {string} text
 * @returns {string}
 */
function extractMRZ(text) {
  // MRZ consists of two lines of exactly 44 characters each
  const lines = text.split('\n');
  let mrzLines = [];

  for (const line of lines) {
    const cleanLine = line.replace(/[^A-Z0-9<]/g, '');
    if (cleanLine.length === 44 && /^[A-Z0-9<]{44}$/.test(cleanLine)) {
      mrzLines.push(cleanLine);
    }
  }

  return mrzLines.length === 2 ? mrzLines.join('\n') : '';
}

/**
 * Validate extracted data quality
 * @param {Object} extractedData
 * @param {string} side
 * @returns {Object} Validation result
 */
function validateExtractedData(extractedData, side) {
  const warnings = [];
  let confidence = extractedData.confidence || 0.5;

  if (side === 'front') {
    // Check critical fields
    if (!extractedData.fields.passportNumber) {
      warnings.push('Passport number could not be detected');
      confidence *= 0.8;
    }
    if (!extractedData.fields.surname || !extractedData.fields.givenNames) {
      warnings.push('Name fields incomplete');
      confidence *= 0.85;
    }
    if (!extractedData.fields.dateOfExpiry) {
      warnings.push('Expiry date not found');
      confidence *= 0.9;
    }

    // Validate date formats (accepts ISO YYYY-MM-DD from MRZ or DD/MM/YYYY-style from OCR)
    if (extractedData.fields.dateOfBirth) {
      const dobValid = /^\d{4}-\d{2}-\d{2}$/.test(extractedData.fields.dateOfBirth)
        || /^\d{1,2}[\s\/\-]\d{1,2}[\s\/\-]\d{4}$/.test(extractedData.fields.dateOfBirth);
      if (!dobValid) {
        warnings.push('Date of birth format may be incorrect');
        confidence *= 0.9;
      }
    }
  }

  return { confidence: Math.max(0.3, confidence), warnings };
}

/**
 * Detect data conflicts between front and back
 * @param {Object} frontData - Extracted front data
 * @param {Object} backData - Extracted back data
 * @returns {Object} Conflict detection result
 */
export function detectDataConflicts(frontData, backData) {
  const conflicts = [];
  const f = frontData?.fields || {};
  const b = backData?.fields || {};

  const compare = (key, type, label, severity) => {
    if (f[key] && b[key] && String(f[key]).toLowerCase() !== String(b[key]).toLowerCase()) {
      conflicts.push({ type, severity, message: label, front: f[key], back: b[key] });
    }
  };

  compare('passportNumber', 'PASSPORT_NUMBER_MISMATCH', 'Passport number differs between front and back', 'high');
  compare('surname', 'NAME_MISMATCH', 'Surname differs between front and back', 'high');
  compare('dateOfBirth', 'DOB_MISMATCH', 'Date of birth differs between front and back', 'high');
  compare('nationality', 'NATIONALITY_MISMATCH', 'Nationality differs between front and back', 'medium');
  compare('dateOfExpiry', 'EXPIRY_DATE_MISMATCH', 'Expiry date differs between front and back', 'medium');

  // This is a warning surfaced to the applicant, never an automatic rejection —
  // the applicant/admin always reviews and confirms manually.
  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
    message: conflicts.length > 0 ? 'Passport details could not be verified. Please review the information.' : '',
  };
}

/**
 * Convert File to Data URL for image processing
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Format extracted data for form pre-filling
 * @param {Object} extractedData - Data from extraction
 * @returns {Object} Formatted for form fields
 */
export function formatForFormPreFill(extractedData) {
  if (!extractedData?.fields) {
    return {};
  }

  const fields = extractedData.fields;

  return {
    passportNumber: fields.passportNumber || '',
    surname: fields.surname || '',
    givenNames: fields.givenNames || '',
    nationality: fields.nationality || '',
    dateOfBirth: formatDate(fields.dateOfBirth),
    gender: fields.gender || '',
    dateOfIssue: formatDate(fields.dateOfIssue),
    dateOfExpiry: formatDate(fields.dateOfExpiry),
    placeOfBirth: fields.placeOfBirth || '',
  };
}

/**
 * Format date strings to YYYY-MM-DD format
 * @param {string} dateStr
 * @returns {string}
 */
function formatDate(dateStr) {
  if (!dateStr) return '';

  // Try multiple date formats
  const formats = [
    /(\d{4})[\s\/\-](\d{1,2})[\s\/\-](\d{1,2})/, // YYYY-MM-DD
    /(\d{1,2})[\s\/\-](\d{1,2})[\s\/\-](\d{4})/, // DD-MM-YYYY
  ];

  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      let year, month, day;

      if (match[1].length === 4) {
        // YYYY-MM-DD format
        [, year, month, day] = match;
      } else {
        // DD-MM-YYYY format
        [, day, month, year] = match;
      }

      return `${year.padStart(4, '0')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  return dateStr;
}

export default {
  extractPassportData,
  validateImageQuality,
  detectDataConflicts,
  formatForFormPreFill,
};
