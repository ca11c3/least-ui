import { FileUpload, toast } from "leastui";

// Reads one value per line, skipping the header row.
async function parseCsv(file: File) {
  const lines = (await file.text()).split(/\r?\n/).map((line) => line.split(",")[0].trim());
  const values = lines.slice(1).filter(Boolean);
  return values.length ? { values } : { values, error: "The file has no rows." };
}

export default function FileUploadCsvPreview() {
  return (
    <div className="w-full max-w-md">
      <FileUpload
        accept=".csv,text/csv"
        parseFile={parseCsv}
        previewNote="Check the emails below before inviting."
        hint="A CSV with one email per row"
        onUploadFile={(_file, emails) => {
          toast.success(`Invited ${emails.length} people`);
        }}
      />
    </div>
  );
}
