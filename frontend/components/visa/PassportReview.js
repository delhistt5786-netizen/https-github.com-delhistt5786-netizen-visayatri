'use client';

import React, { useState } from 'react';
import { X, AlertCircle, CheckCircle, Edit2, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * PassportReview Component
 * 
 * Displays extracted passport data in an editable modal
 * Allows user to:
 * - Review extracted information
 * - Edit any fields
 * - Confirm before auto-filling application form
 * - See extraction confidence and warnings
 */
export default function PassportReview({
  isOpen,
  extractedData,
  conflicts,
  onConfirm,
  onClose,
  side = 'front',
  loading = false,
}) {
  const [editedData, setEditedData] = useState(
    extractedData?.fields || {}
  );
  const [isEditing, setIsEditing] = useState(false);

  if (!isOpen) return null;

  const { fields = {}, confidence = 0, warnings = [] } = extractedData || {};

  // Determine UI state based on confidence
  const getConfidenceLevel = () => {
    if (confidence >= 0.8) return { level: 'high', color: 'bg-green-500', text: 'High' };
    if (confidence >= 0.5) return { level: 'medium', color: 'bg-yellow-500', text: 'Medium' };
    return { level: 'low', color: 'bg-red-500', text: 'Low' };
  };

  const confidenceLevel = getConfidenceLevel();

  const handleFieldChange = (field, value) => {
    setEditedData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirm = () => {
    // Validate at least one field is filled
    const hasData = Object.values(editedData).some(v => v && v.length > 0);

    if (!hasData) {
      toast.error('Please fill at least one field');
      return;
    }

    // Show confirmation
    toast.success(`Passport details extracted successfully from ${side === 'front' ? 'Passport Front' : 'Passport Back'}`);
    onConfirm(editedData);
  };

  const handleReset = () => {
    setEditedData(fields);
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Passport Details Extracted</h2>
            <p className="text-blue-100 text-sm mt-1">
              From: {side === 'front' ? 'Passport Front' : 'Passport Back'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-blue-800 p-2 rounded-full transition"
            disabled={loading}
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Confidence & Quality Indicators */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle size={20} className="text-blue-600" />
                <span className="font-semibold text-blue-900">Extraction Confidence</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className={`${confidenceLevel.color} h-2 rounded-full transition-all duration-300`}
                    style={{ width: `${confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-gray-700">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <AlertCircle size={20} className="text-orange-600" />
                <span className="font-semibold text-orange-900">Status</span>
              </div>
              <p className="text-sm text-orange-700">
                {isEditing ? '✏️ Editing Mode' : '✅ Ready to Review'}
              </p>
            </div>
          </div>

          {/* Warnings Section */}
          {warnings.length > 0 && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle size={20} className="text-yellow-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-yellow-900">Extraction Notes</h3>
                  <ul className="mt-2 space-y-1 text-sm text-yellow-800">
                    {warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-yellow-600 mt-1">•</span>
                        <span>{warning}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Data Conflicts Warning */}
          {conflicts && conflicts.hasConflicts && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-900">Data Inconsistencies Detected</h3>
                  <p className="mt-1 text-sm text-red-800">
                    Passport details could not be verified. Please review the information.
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-red-700">
                    {conflicts.conflicts.map((conflict, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <span className="text-red-600 mt-1">⚠️</span>
                        <span>{conflict.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Extracted Fields (Editable) */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">Extracted Information</h3>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium transition"
              >
                <Edit2 size={16} />
                <span>{isEditing ? 'Done Editing' : 'Edit Fields'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(editedData).map(([field, value]) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={value || ''}
                      onChange={(e) => handleFieldChange(field, e.target.value)}
                      placeholder={`Enter ${field}`}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-700">
                      {value || (
                        <span className="text-gray-400 italic">Not extracted</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* No data extracted message */}
            {Object.values(editedData).every(v => !v) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <AlertCircle className="mx-auto mb-2 text-yellow-600" size={24} />
                <p className="text-sm text-yellow-800">
                  No data could be automatically extracted. Please enter the information manually.
                </p>
              </div>
            )}
          </div>

          {/* Verification Warning */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              ℹ️ <strong>Please verify your passport details before continuing.</strong> OCR extraction may contain errors. Review all fields carefully and make corrections if needed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-6 flex justify-end space-x-3">
          {isEditing && (
            <button
              onClick={handleReset}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
              disabled={loading}
            >
              Reset
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium transition disabled:opacity-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading || Object.values(editedData).every(v => !v)}
            className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Confirm Passport Details'}
          </button>
        </div>
      </div>
    </div>
  );
}
