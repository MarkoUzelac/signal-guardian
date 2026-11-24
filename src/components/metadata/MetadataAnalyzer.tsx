import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, AlertTriangle, MapPin, Trash2, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetadataResult } from '@/types/signal';
import exifr from 'exifr';
import { cn } from '@/lib/utils';

export const MetadataAnalyzer = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<MetadataResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      void processFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      void processFile(selectedFile);
    }
    e.target.value = '';
  };

  const processFile = async (selectedFile: File) => {
    const supportedImage = selectedFile.type.startsWith('image/') ||
      /\\.(jpe?g|tiff?|heic|avif|png)$/i.test(selectedFile.name);

    if (!supportedImage) {
      setAnalysisError('Unsupported format. Select a JPEG, PNG, TIFF, HEIC or AVIF image.');
      setFile(null);
      setResult(null);
      return;
    }

    if (selectedFile.size > 64 * 1024 * 1024) {
      setAnalysisError('File exceeds the 64 MB client-side processing limit.');
      setFile(null);
      setResult(null);
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);
    setAnalysisError(null);
    setResult(null);

    try {
      const parsed = await exifr.parse(selectedFile, true) as Record<string, unknown> | undefined;
      const gps = await exifr.gps(selectedFile);

      const tagLabels: Record<string, string> = {
        Make: 'Camera Make',
        Model: 'Camera Model',
        Software: 'Software',
        DateTimeOriginal: 'Capture Time',
        CreateDate: 'Creation Time',
        ModifyDate: 'Modification Time',
        ExposureTime: 'Exposure Time',
        FNumber: 'F-Number',
        ISO: 'ISO',
        FocalLength: 'Focal Length',
        LensModel: 'Lens Model',
        Orientation: 'Orientation',
        ImageWidth: 'Image Width',
        ImageHeight: 'Image Height',
        SerialNumber: 'Device Serial Number',
        Artist: 'Artist',
        Copyright: 'Copyright',
        GPSAltitude: 'GPS Altitude',
      };

      const formatValue = (value: unknown): string | number | boolean | undefined => {
        if (value instanceof Date) return value.toISOString();
        if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
          return value;
        }
        if (Array.isArray(value) && value.every(item => ['string', 'number', 'boolean'].includes(typeof item))) {
          return value.map(String).join(', ');
        }
        return undefined;
      };

      const metadata: Record<string, string | number | boolean> = {};
      if (parsed) {
        for (const [tag, label] of Object.entries(tagLabels)) {
          const value = formatValue(parsed[tag]);
          if (value !== undefined) metadata[label] = value;
        }
      }

      const gpsLocation = gps &&
        Number.isFinite(gps.latitude) &&
        Number.isFinite(gps.longitude)
        ? { lat: gps.latitude, lng: gps.longitude }
        : undefined;

      if (gpsLocation) {
        metadata['GPS Latitude'] = gpsLocation.lat;
        metadata['GPS Longitude'] = gpsLocation.lng;
      }

      const privacyRisks: string[] = [];
      if (gpsLocation) privacyRisks.push('GPS coordinates are embedded in the image and may reveal where it was captured.');
      if (parsed?.SerialNumber) privacyRisks.push('A device serial number is embedded in the image metadata.');
      if (parsed?.DateTimeOriginal || parsed?.CreateDate) privacyRisks.push('A capture or creation timestamp is embedded in the image metadata.');
      if (parsed?.Make || parsed?.Model) privacyRisks.push('Camera manufacturer or model information is embedded in the image metadata.');

      setResult({
        filename: selectedFile.name,
        fileType: selectedFile.type || 'unknown image type',
        fileSize: selectedFile.size,
        extractedAt: new Date(),
        metadata,
        gpsLocation,
        privacyRisks,
      });
    } catch (error) {
      setAnalysisError(error instanceof Error
        ? `Metadata extraction failed: ${error.message}`
        : 'Metadata extraction failed for this image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const clearFile = () => {
    setFile(null);
    setResult(null);
    setAnalysisError(null);
  };

  const handleExport = () => {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `metadata-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upload Area */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg">Upload File for Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center transition-all',
              isDragging
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-muted-foreground/50',
              file && 'border-success bg-success/5'
            )}
          >
            {file ? (
              <div className="space-y-4">
                <FileImage className="w-12 h-12 mx-auto text-success" />
                <div>
                  <p className="font-medium text-foreground">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(file.size)}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={clearFile}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className={cn(
                  'w-12 h-12 mx-auto transition-colors',
                  isDragging ? 'text-primary' : 'text-muted-foreground'
                )} />
                <div>
                  <p className="font-medium text-foreground">
                    Drag & drop a file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse
                  </p>
                </div>
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/jpeg,image/png,image/tiff,image/heic,image/avif,.jpg,.jpeg,.png,.tif,.tiff,.heic,.avif"
                />
                <Button asChild variant="outline">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    Browse Files
                  </label>
                </Button>
              </div>
            )}
          </div>

          <div className="mt-4 text-xs text-muted-foreground">
            <p>Supported image formats: JPEG, PNG, TIFF, HEIC and AVIF.</p>
            <p className="mt-1">
              Images are inspected locally in this browser. File contents are not uploaded to a server.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Results Area */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg flex items-center justify-between">
            Analysis Results
            {result && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <AnimatePresence mode="wait">
            {analysisError ? (
              <motion.div key="error" className="py-10 text-center text-destructive">
                <AlertTriangle className="w-8 h-8 mx-auto mb-3" />
                <p className="text-sm">{analysisError}</p>
              </motion.div>
            ) : isAnalyzing ? (
              <motion.div
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                <p className="mt-4 text-muted-foreground">Analyzing file...</p>
              </motion.div>
            ) : result ? (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                {/* Privacy Risks */}
                {result.privacyRisks.length > 0 && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                      <span className="font-semibold text-destructive">
                        Privacy Risks Detected
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {result.privacyRisks.map((risk, i) => (
                        <li key={i} className="text-sm text-destructive/80 flex items-start gap-2">
                          <span>•</span>
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* GPS Location */}
                {result.gpsLocation && (
                  <div className="p-4 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-5 h-5 text-warning" />
                      <span className="font-semibold text-warning">GPS Location Found</span>
                    </div>
                    <p className="font-mono text-sm text-foreground">
                      {result.gpsLocation.lat.toFixed(6)}, {result.gpsLocation.lng.toFixed(6)}
                    </p>
                  </div>
                )}

                {/* Extracted fields only; no placeholder values are added. */}
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground">Extracted Metadata</h4>
                  {Object.keys(result.metadata).length > 0 ? (
                    <div className="rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <tbody>
                          {Object.entries(result.metadata).map(([key, value], i) => (
                            <tr
                              key={key}
                              className={cn(
                                'border-b border-border/50 last:border-0',
                                i % 2 === 0 && 'bg-muted/20'
                              )}
                            >
                              <td className="px-3 py-2 text-muted-foreground font-medium">{key}</td>
                              <td className="px-3 py-2 font-mono text-foreground break-all">{String(value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                      No supported EXIF fields were found in this image. This does not prove that every metadata block is absent.
                    </p>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12 text-muted-foreground"
              >
                <FileImage className="w-12 h-12 mb-4 opacity-50" />
                <p>Upload a file to see extracted metadata</p>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};
