'use client';
import { useState, useRef, useEffect } from 'react';
import { Upload, X, ZoomIn, ZoomOut, Crop, Check, AlertCircle, Loader, Brain, ScanFace, RotateCw, RotateCcw } from 'lucide-react';
import toast from 'react-hot-toast';
import PassportReview from './PassportReview';
import { appAPI } from '../../lib/api';
import { detectFaceCoverage } from '../../services/FaceDetectionService';
import {
  extractPassportData,
  detectDataConflicts,
} from '../../services/PassportOCRService';

const DOCUMENT_TYPES = [
  { id: 'frontPassport', label: 'Front Passport Copy', required: true, icon: '📄', ocrSide: 'front' },
  { id: 'backPassport',  label: 'Back Passport Copy',  required: true, icon: '📄', ocrSide: 'back' },
  { id: 'digitalPhoto',  label: 'Digital Photo (face ~80% of frame)', required: true, icon: '📸', faceCheck: true },
  { id: 'optional1', label: 'Additional Document 1 (Optional)', required: false, icon: '📎' },
  { id: 'optional2', label: 'Additional Document 2 (Optional)', required: false, icon: '📎' },
  { id: 'optional3', label: 'Additional Document 3 (Optional)', required: false, icon: '📎' },
  { id: 'optional4', label: 'Additional Document 4 (Optional)', required: false, icon: '📎' },
];

/**
 * DocumentUpload
 *
 * Collects the 3 mandatory + up to 4 optional documents for a visa application.
 * When `applicationId` is provided, the "Upload" button submits directly to
 * POST /applications/:id/documents. When it's not (used inline in the apply
 * form before the application exists), it instead reports the selected files
 * to the parent via `onDocumentsChange` so the parent can upload them itself
 * right after creating the application.
 */
export default function DocumentUpload({ applicationId, onUploadComplete, onPassportExtracted, onDocumentsChange }) {
  const [documents, setDocuments] = useState({});
  const [uploading, setUploading] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [imageData, setImageData] = useState({});
  const [zoom, setZoom] = useState(100);
  const [rotations, setRotations] = useState({});
  const canvasRef = useRef(null);
  const fileInputRefs = useRef({});
  // Decoded <img> elements cached by docId+src, so zoom/pan/rotate only
  // redraws the canvas instead of re-decoding the (often multi-MB) data URI
  // on every tick — that redecode was the visible flash/blink on each click.
  const loadedImagesRef = useRef({});

  // OCR states
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [passportReviewOpen, setPassportReviewOpen] = useState(false);
  const [extractedPassportData, setExtractedPassportData] = useState(null);
  const [passportConflicts, setPassportConflicts] = useState(null);
  const [extractionSide, setExtractionSide] = useState(null);
  const [frontExtractedData, setFrontExtractedData] = useState(null);
  const [backExtractedData, setBackExtractedData] = useState(null);

  // Face-coverage check state, keyed by docId
  const [faceChecks, setFaceChecks] = useState({});
  const [faceChecking, setFaceChecking] = useState(false);

  useEffect(() => {
    drawImage();
  }, [editingDoc, zoom, imageData, rotations]);

  // Report file changes up to the parent (used in "collect only" mode)
  useEffect(() => {
    if (!onDocumentsChange) return;
    const filesOnly = {};
    Object.entries(documents).forEach(([id, doc]) => { filesOnly[id] = doc.file; });
    onDocumentsChange(filesOnly);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documents]);

  const handleFileSelect = (docId, file) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB');
      return;
    }
    if (!validTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, and PDF files allowed');
      return;
    }

    if (file.type === 'application/pdf') {
      setDocuments(prev => ({ ...prev, [docId]: { file, preview: '📄 PDF Document' } }));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setDocuments(prev => ({ ...prev, [docId]: { file, preview: e.target.result } }));
        setImageData(prev => ({
          ...prev,
          [docId]: { src: e.target.result, x: 0, y: 0, width: img.width, height: img.height },
        }));
        setRotations(prev => ({ ...prev, [docId]: 0 }));
        // Open the crop/zoom/rotate editor right at upload time, for every box —
        // applicant can adjust framing before it's accepted.
        setEditingDoc(docId);

        const docType = DOCUMENT_TYPES.find(d => d.id === docId);
        if (docType?.ocrSide) handlePassportOCR(file, docId, docType.ocrSide);
        if (docType?.faceCheck) handleFaceCheck(img, docId);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFaceCheck = async (imgEl, docId) => {
    setFaceChecking(true);
    try {
      const result = await detectFaceCoverage(imgEl);
      setFaceChecks(prev => ({ ...prev, [docId]: result }));
      if (result.found && !result.inRange) {
        toast(result.message, { icon: '⚠️' });
      } else if (result.inRange) {
        toast.success('✓ Face coverage looks good');
      }
    } finally {
      setFaceChecking(false);
    }
  };

  const handlePassportOCR = async (file, docId, side) => {
    setOcrProcessing(true);
    try {
      const result = await extractPassportData(file, side);
      if (!result.success) {
        toast.error(result.error || 'Could not extract passport data');
        // Nudge the applicant toward the edit tools (crop/zoom/rotate/replace)
        // to fix a low-quality image, and surface the specific cause.
        if (result.suggestions?.length) {
          setTimeout(() => toast(result.suggestions[0], { icon: '💡' }), 400);
        }
        setEditingDoc(docId);
        return;
      }

      const extractedData = result.data;
      setExtractionSide(side);
      setExtractedPassportData(extractedData);

      if (side === 'front') {
        setFrontExtractedData(extractedData);
      } else {
        setBackExtractedData(extractedData);
        if (frontExtractedData) {
          setPassportConflicts(detectDataConflicts(frontExtractedData, extractedData));
        }
      }

      // Hand off from the crop/zoom editor to the OCR review modal — avoid stacking
      // both, but only close the editor if it's still showing this same document.
      setEditingDoc(prev => (prev === docId ? null : prev));
      setPassportReviewOpen(true);

      const confidence = Math.round((result.confidence || 0) * 100);
      if (confidence >= 80) toast.success('Passport details extracted successfully.');
      else if (confidence >= 50) toast('Passport details extracted — please verify before continuing.', { icon: '⚠️' });
      else toast.error('Low extraction confidence — please verify every field carefully.');
    } catch (error) {
      console.error('OCR Error:', error);
      toast.error('Failed to extract passport data');
    } finally {
      setOcrProcessing(false);
    }
  };

  const handlePassportReviewConfirm = (editedData) => {
    setPassportReviewOpen(false);
    const formData = { ...editedData, extractedAt: new Date().toISOString(), extractedFrom: extractionSide };
    onPassportExtracted?.(formData);
    toast.success('Passport details will be used to pre-fill your application form');
  };

  const renderCanvas = (img) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const data = imageData[editingDoc];
    const rotation = rotations[editingDoc] || 0;
    const scaledWidth  = (img.width * zoom) / 100;
    const scaledHeight = (img.height * zoom) / 100;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.translate(-canvas.width / 2, -canvas.height / 2);
    ctx.drawImage(img, data.x, data.y, scaledWidth, scaledHeight);
    ctx.restore();

    ctx.strokeStyle = '#FF7A00';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.setLineDash([]);
  };

  const drawImage = () => {
    if (!canvasRef.current || !editingDoc || !imageData[editingDoc]) return;
    const data = imageData[editingDoc];

    // Already-decoded image for this exact source — redraw synchronously,
    // no flash. Only decode fresh when the doc or its source actually changes.
    const cached = loadedImagesRef.current[editingDoc];
    if (cached && cached.src === data.src && cached.img.complete) {
      renderCanvas(cached.img);
      return;
    }

    const img = new Image();
    img.onload = () => {
      loadedImagesRef.current[editingDoc] = { src: data.src, img };
      renderCanvas(img);
    };
    img.src = data.src;
  };

  const handleZoom = (direction) => {
    setZoom(prev => (direction === 'in' ? Math.min(prev + 10, 200) : Math.max(prev - 10, 50)));
  };

  const handlePan = (dx, dy) => {
    if (!editingDoc) return;
    setImageData(prev => ({
      ...prev,
      [editingDoc]: { ...prev[editingDoc], x: prev[editingDoc].x + dx, y: prev[editingDoc].y + dy },
    }));
  };

  const handleRotate = (direction) => {
    if (!editingDoc) return;
    setRotations(prev => {
      const current = prev[editingDoc] || 0;
      const next = direction === 'cw' ? (current + 90) % 360 : (current - 90 + 360) % 360;
      return { ...prev, [editingDoc]: next };
    });
  };

  const handleCrop = () => {
    if (!canvasRef.current || !editingDoc) return;
    const canvas = canvasRef.current;
    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = canvas.width - 100;
    cropCanvas.height = canvas.height - 100;

    const ctx = cropCanvas.getContext('2d');
    ctx.drawImage(canvas, 50, 50, cropCanvas.width, cropCanvas.height, 0, 0, cropCanvas.width, cropCanvas.height);

    cropCanvas.toBlob(blob => {
      const file = new File([blob], `${editingDoc}_cropped.jpg`, { type: 'image/jpeg' });
      setDocuments(prev => ({ ...prev, [editingDoc]: { file, preview: cropCanvas.toDataURL() } }));

      const docType = DOCUMENT_TYPES.find(d => d.id === editingDoc);
      if (docType?.faceCheck) {
        const img = new Image();
        img.onload = () => handleFaceCheck(img, editingDoc);
        img.src = cropCanvas.toDataURL();
      }

      setEditingDoc(null);
      toast.success('Image cropped successfully');
    });
  };

  // Direct upload — only used when this component already has an applicationId
  const handleUpload = async () => {
    const missingDocs = DOCUMENT_TYPES.filter(d => d.required).filter(d => !documents[d.id]).map(d => d.label);
    if (missingDocs.length > 0) {
      toast.error(`Please upload: ${missingDocs.join(', ')}`);
      return;
    }
    if (!applicationId) return; // collect-only mode, nothing to upload yet

    setUploading(true);
    try {
      const formData = new FormData();
      const docTypes = [];
      Object.entries(documents).forEach(([docId, { file }]) => {
        formData.append('documents', file);
        docTypes.push(docId);
      });
      formData.append('docTypes', JSON.stringify(docTypes));

      await appAPI.uploadDocs(applicationId, formData);
      toast.success('Documents uploaded successfully!');
      onUploadComplete?.();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload documents');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PassportReview
        isOpen={passportReviewOpen}
        extractedData={extractedPassportData}
        conflicts={passportConflicts}
        onConfirm={handlePassportReviewConfirm}
        onClose={() => setPassportReviewOpen(false)}
        side={extractionSide}
        loading={ocrProcessing}
      />

      <div>
        <h3 className="text-2xl font-bold text-[#0B3C5D] mb-2">📋 Upload Required Documents</h3>
        <p className="text-gray-600">All documents must be clear and legible. Front/back passport pages are auto-scanned; your photo is checked for face coverage.</p>

        <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Brain size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-semibold">🤖 Intelligent Passport Recognition</p>
              <p className="mt-1">When you upload your passport (front and back), we'll automatically extract your information. Your digital photo is checked to confirm your face fills a good portion of the frame.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const faceCheck = faceChecks[docType.id];
          return (
            <div key={docType.id} className="soft-card p-4 text-center relative">
              {(docType.ocrSide) && documents[docType.id] && (
                <div className="absolute top-2 right-2 z-10">
                  {ocrProcessing ? (
                    <div className="animate-spin text-blue-600" title="Processing with OCR"><Loader size={16} /></div>
                  ) : (docType.ocrSide === 'front' && frontExtractedData) || (docType.ocrSide === 'back' && backExtractedData) ? (
                    <div className="text-green-600 font-bold" title="OCR Extraction Complete"><Brain size={16} /></div>
                  ) : null}
                </div>
              )}
              {docType.faceCheck && documents[docType.id] && (
                <div className="absolute top-2 right-2 z-10">
                  {faceChecking ? (
                    <div className="animate-spin text-blue-600" title="Checking face coverage"><Loader size={16} /></div>
                  ) : faceCheck ? (
                    <div className={faceCheck.inRange ? 'text-green-600' : 'text-amber-500'} title={faceCheck.message}>
                      <ScanFace size={16} />
                    </div>
                  ) : null}
                </div>
              )}

              {documents[docType.id] ? (
                <div className="space-y-3">
                  {typeof documents[docType.id].preview === 'string' && !documents[docType.id].preview.includes('PDF') ? (
                    <img src={documents[docType.id].preview} alt={docType.label} className="w-full h-32 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg flex items-center justify-center">
                      <span className="text-4xl">{docType.icon}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-xs font-semibold text-gray-700 mb-1">{docType.label}</p>
                    <span className="inline-block bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-xs font-bold">✓ Uploaded</span>

                    {docType.faceCheck && faceCheck && (
                      <div className={`mt-2 px-2 py-1 rounded text-xs font-semibold ${faceCheck.inRange ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                        {faceCheck.inRange ? '✓ Good face coverage' : faceCheck.message}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => setEditingDoc(docType.id)}
                      title="Crop, zoom, or rotate this image"
                      className="flex-1 text-xs bg-orange-100 text-orange-700 py-1 rounded hover:bg-orange-200 transition font-semibold">
                      Edit
                    </button>
                    <button type="button" onClick={() => fileInputRefs.current[docType.id]?.click()}
                      className="flex-1 text-xs bg-blue-100 text-blue-700 py-1 rounded hover:bg-blue-200 transition">
                      Change
                    </button>
                    <button type="button" onClick={() => {
                        setDocuments(prev => { const n = { ...prev }; delete n[docType.id]; return n; });
                        setFaceChecks(prev => { const n = { ...prev }; delete n[docType.id]; return n; });
                        if (docType.id === 'frontPassport') setFrontExtractedData(null);
                        if (docType.id === 'backPassport')  setBackExtractedData(null);
                      }}
                      className="flex-1 text-xs bg-red-100 text-red-700 py-1 rounded hover:bg-red-200 transition">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRefs.current[docType.id]?.click()} disabled={ocrProcessing}
                  className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF7A00] transition flex flex-col items-center justify-center gap-2 cursor-pointer group disabled:opacity-50">
                  <span className="text-2xl">{docType.icon}</span>
                  <p className="text-xs font-semibold text-gray-700 group-hover:text-[#FF7A00]">Upload</p>
                  <p className="text-xs text-gray-500">{docType.label}</p>
                  {docType.required && <span className="text-red-500 text-xs font-bold">Required</span>}
                </button>
              )}

              <input
                ref={el => fileInputRefs.current[docType.id] = el}
                type="file" accept=".jpg,.jpeg,.png,.pdf" className="hidden"
                onChange={(e) => handleFileSelect(docType.id, e.target.files?.[0])}
              />
            </div>
          );
        })}
      </div>

      {editingDoc && imageData[editingDoc] && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#0B3C5D]">✂️ Edit {DOCUMENT_TYPES.find(d => d.id === editingDoc)?.label}</h3>
                <button type="button" onClick={() => setEditingDoc(null)} className="p-2 hover:bg-gray-100 rounded-lg transition"><X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="border-2 border-gray-200 rounded-lg overflow-auto bg-gray-50">
                <canvas ref={canvasRef} width={500} height={400} className="mx-auto" style={{ maxWidth: '100%', height: 'auto' }} />
              </div>
              <div className="flex items-center gap-3 justify-center flex-wrap">
                <button type="button" onClick={() => handleZoom('out')} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"><ZoomOut className="w-5 h-5" /></button>
                <span className="font-semibold text-gray-700 min-w-12 text-center">{zoom}%</span>
                <button type="button" onClick={() => handleZoom('in')} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition"><ZoomIn className="w-5 h-5" /></button>
                <span className="w-px h-6 bg-gray-300 mx-1" />
                <button type="button" onClick={() => handleRotate('ccw')} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition" title="Rotate left"><RotateCcw className="w-5 h-5" /></button>
                <button type="button" onClick={() => handleRotate('cw')} className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition" title="Rotate right"><RotateCw className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button type="button" onClick={() => handlePan(0, 10)} className="py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition">↑</button>
                <div></div>
                <button type="button" onClick={() => handlePan(0, -10)} className="py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition">↓</button>
                <button type="button" onClick={() => handlePan(10, 0)} className="py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition">←</button>
                <button type="button" onClick={() => setImageData(prev => ({ ...prev, [editingDoc]: { ...prev[editingDoc], x: 0, y: 0 } }))}
                  className="py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition text-xs">Reset</button>
                <button type="button" onClick={() => handlePan(-10, 0)} className="py-2 bg-blue-100 text-blue-700 rounded-lg font-semibold hover:bg-blue-200 transition">→</button>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="flex gap-2 items-start">
                  <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <span>Use zoom, pan, and rotate to frame your document properly, then Save &amp; Crop. The orange border shows the crop area — or hit Cancel to keep the original upload as-is.</span>
                </p>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setEditingDoc(null)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition">Cancel</button>
                <button type="button" onClick={handleCrop} className="flex-1 py-3 bg-gradient-to-r from-[#FF7A00] to-orange-500 text-white rounded-lg font-semibold hover:from-orange-600 flex items-center justify-center gap-2">
                  <Crop className="w-4 h-4" /> Save & Crop
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {applicationId && Object.keys(documents).length > 0 && (
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 -m-4">
          <button type="button" onClick={handleUpload} disabled={uploading}
            className="w-full py-4 bg-gradient-to-r from-[#0B3C5D] to-[#0d3b66] text-white rounded-lg font-bold hover:from-[#0d3b66] hover:to-[#061f3b] transition disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? (<><div className="animate-spin">⌛</div>Uploading...</>) : (<><Check className="w-5 h-5" />Upload {Object.keys(documents).length} Document{Object.keys(documents).length !== 1 ? 's' : ''}</>)}
          </button>
        </div>
      )}
    </div>
  );
}
