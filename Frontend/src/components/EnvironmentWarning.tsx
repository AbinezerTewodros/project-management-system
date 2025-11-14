import React, { useState, useEffect } from "react";
import { AlertTriangle, X, CheckCircle, XCircle, Info } from "lucide-react";
import {
  EnvironmentDiagnostics,
  DiagnosticResult,
} from "../utils/environmentDiagnostics";

interface EnvironmentWarningProps {
  onClose?: () => void;
}

export const EnvironmentWarning: React.FC<EnvironmentWarningProps> = ({
  onClose,
}) => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const runDiagnostics = async () => {
      const results = await EnvironmentDiagnostics.runFullDiagnostics();
      setDiagnostics(results);

      // Show warning if there are any failures or warnings
      const hasFailures = results.some((r) => r.status === "fail");
      const hasWarnings = results.some((r) => r.status === "warning");

      if (hasFailures || hasWarnings) {
        setIsVisible(true);
      }
    };

    runDiagnostics();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    onClose?.();
  };

  if (!isVisible || diagnostics.length === 0) {
    return null;
  }

  const failures = diagnostics.filter((r) => r.status === "fail");
  const warnings = diagnostics.filter((r) => r.status === "warning");
  const passes = diagnostics.filter((r) => r.status === "pass");

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white dark:bg-gray-800 border border-yellow-300 dark:border-yellow-600 rounded-lg shadow-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Environment Issues Detected
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-2 text-sm">
          {failures.length > 0 && (
            <div>
              <h4 className="font-medium text-red-600 dark:text-red-400 mb-1 flex items-center">
                <XCircle className="h-4 w-4 mr-1" />
                Critical Issues ({failures.length})
              </h4>
              <ul className="space-y-1 ml-5">
                {failures.map((result, index) => (
                  <li key={index} className="text-red-600 dark:text-red-400">
                    • {result.message}
                    {result.recommendation && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        💡 {result.recommendation}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warnings.length > 0 && (
            <div>
              <h4 className="font-medium text-yellow-600 dark:text-yellow-400 mb-1 flex items-center">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Warnings ({warnings.length})
              </h4>
              <ul className="space-y-1 ml-5">
                {warnings.map((result, index) => (
                  <li
                    key={index}
                    className="text-yellow-600 dark:text-yellow-400"
                  >
                    • {result.message}
                    {result.recommendation && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                        💡 {result.recommendation}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {passes.length > 0 && (
            <div>
              <h4 className="font-medium text-green-600 dark:text-green-400 mb-1 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Working ({passes.length})
              </h4>
              <div className="text-xs text-gray-500 dark:text-gray-400 ml-5">
                {passes
                  .slice(0, 3)
                  .map((r) => r.message)
                  .join(", ")}
                {passes.length > 3 && ` and ${passes.length - 3} more...`}
              </div>
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
            <Info className="h-3 w-3 mr-1" />
            Check browser console (F12) for detailed diagnostics
          </div>
        </div>
      </div>
    </div>
  );
};

