"use client";

import { Button } from "./button";
import Spinner from "./spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import { cn, pluralize } from "../lib/utils";
import { Upload } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

const PREVIEW_ROW_LIMIT = 100;
const DEFAULT_MAX_BYTES = 10 * 1024 * 1024; // 10 MB

export type FileUploadProps = {
  onUploadFile: (file: File, parsed: string[]) => void | Promise<void>;
  isBusy?: boolean;
  previewNote?: string;
  // Comma-separated file types for the picker and validation, e.g.
  // ".csv,text/csv" or "image/*". Omit to accept any file.
  accept?: string;
  maxBytes?: number;
  // Parses the file into values for a preview step before upload. Omit to
  // upload directly without a preview.
  parseFile?: (file: File) => Promise<{ values: string[]; error?: string }>;
  // Drop-zone description; defaults to a generic prompt.
  hint?: React.ReactNode;
};

export function FileUpload({
  onUploadFile,
  isBusy = false,
  previewNote,
  accept,
  maxBytes = DEFAULT_MAX_BYTES,
  parseFile,
  hint,
}: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewValues, setPreviewValues] = useState<string[] | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extensions = (accept ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.startsWith("."));
  const maxMB = Math.round(maxBytes / (1024 * 1024));

  const resetFileState = () => {
    setFile(null);
    setPreviewValues(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const acceptFile = (candidate: File | undefined) => {
    if (!candidate) return;
    if (
      extensions.length > 0 &&
      !extensions.some((ext) => candidate.name.toLowerCase().endsWith(ext))
    ) {
      toast.error(`Only ${extensions.join(" / ")} files are supported.`);
      return;
    }
    if (candidate.size > maxBytes) {
      toast.error(`File exceeds the ${maxMB} MB limit.`);
      return;
    }
    setFile(candidate);
    setPreviewValues(null);
  };

  const handleNext = async () => {
    if (!file || !parseFile) return;
    const { values, error } = await parseFile(file);
    if (error) {
      toast.error(error);
      return;
    }
    setPreviewValues(values);
  };

  // Clear the input only once the caller's commit resolves
  const handleUpload = async () => {
    if (!file) return;
    try {
      await onUploadFile(file, previewValues ?? []);
      resetFileState();
    } catch {
      // Keep the selection so the upload can be retried.
    }
  };

  return (
    <div className="space-y-4">
      {previewValues === null && (
        <div className="space-y-3">
          <div
            className={cn(
              "rounded-md border-2 border-dashed p-8 text-center text-sm transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-border text-muted-foreground",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              acceptFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ")
                fileInputRef.current?.click();
            }}
          >
            <Upload className="mx-auto mb-2 size-6" />
            {file ? (
              <p className="text-foreground font-medium">{file.name}</p>
            ) : (
              <p>
                {hint ??
                  `Drag and drop a file here, or click to browse. Max ${maxMB} MB.`}
              </p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept={accept}
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />
          </div>
          <div className="flex gap-2">
            {parseFile ? (
              <Button
                size="sm"
                type="button"
                disabled={!file}
                onClick={() => void handleNext()}
              >
                Next
              </Button>
            ) : (
              <Button
                size="sm"
                type="button"
                disabled={!file || isBusy}
                onClick={() => void handleUpload()}
              >
                {isBusy && <Spinner className="size-3.5" />}
                Upload
              </Button>
            )}
            {file && (
              <Button
                size="sm"
                type="button"
                variant="outline"
                disabled={isBusy}
                onClick={resetFileState}
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      )}

      {previewValues !== null && (
        <div className="space-y-3">
          <p className="text-muted-foreground text-xs">
            Preview — {previewValues.length}{" "}
            {pluralize("value", previewValues.length)} parsed from{" "}
            <span className="text-foreground font-medium">{file?.name}</span>
            {previewValues.length > PREVIEW_ROW_LIMIT
              ? `, showing first ${PREVIEW_ROW_LIMIT}`
              : ""}
            .{previewNote ? ` ${previewNote}` : ""}
          </p>
          <div className="border-border max-h-80 overflow-y-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewValues.slice(0, PREVIEW_ROW_LIMIT).map((v, i) => (
                  <TableRow key={`${i}-${v}`}>
                    <TableCell className="text-muted-foreground">
                      {i + 1}
                    </TableCell>
                    <TableCell className="break-all">{v}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              type="button"
              disabled={isBusy}
              onClick={() => void handleUpload()}
            >
              {isBusy && <Spinner className="size-3.5" />}
              Upload {previewValues.length}{" "}
              {pluralize("value", previewValues.length)}
            </Button>
            <Button
              size="sm"
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => setPreviewValues(null)}
            >
              Back
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
