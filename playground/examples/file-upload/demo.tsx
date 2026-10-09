import { FileUpload, toast } from "leastui";

export default function FileUploadDemo() {
  return (
    <div className="w-full max-w-md">
      <FileUpload
        accept="image/*"
        maxBytes={2 * 1024 * 1024}
        hint="PNG or JPG, up to 2 MB"
        onUploadFile={(file) => {
          toast.success(`Uploaded ${file.name}`);
        }}
      />
    </div>
  );
}
