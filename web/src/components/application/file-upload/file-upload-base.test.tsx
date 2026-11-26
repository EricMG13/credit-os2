import { fireEvent, render, screen } from "@testing-library/react";
import { FileUpload } from "./file-upload-base";

const LONG_NAME =
  "Amended-and-Restated-Senior-Secured-Revolving-Credit-and-Term-Loan-Agreement-Execution-Version-final-v7.pdf";

type SubmitMethod = "input" | "drop";

function chooseFiles(container: HTMLElement, method: SubmitMethod, files: File[]) {
  if (method === "input") {
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) throw new Error("file input is missing");
    fireEvent.change(input, { target: { files } });
    return input;
  }
  const zone = container.querySelector<HTMLElement>("[data-dropzone]");
  if (zone === null) throw new Error("drop zone is missing");
  fireEvent.drop(zone, { dataTransfer: { files } });
  return null;
}

describe("FileListItemProgressBar file name (X1-015, D-32)", () => {
  it("wraps a long file name in full instead of cutting it with an ellipsis", () => {
    render(
      <ul>
        <FileUpload.ListItemProgressBar name={LONG_NAME} size="2.4 MB" state="Read in full" />
      </ul>,
    );
    const name = screen.getByText(LONG_NAME);
    expect(name).toHaveClass("wrap-anywhere");
    expect(name).not.toHaveClass("truncate");
    expect(name.textContent).toBe(LONG_NAME);
  });

  it("still names the file in the delete control", () => {
    render(
      <ul>
        <FileUpload.ListItemProgressBar
          name={LONG_NAME}
          size="2.4 MB"
          state="Read in full"
          onDelete={() => undefined}
        />
      </ul>,
    );
    expect(screen.getByRole("button", { name: `Delete ${LONG_NAME}` })).toBeInTheDocument();
  });
});

describe("FileUpload.DropZone file classification", () => {
  it.each(["input", "drop"] as const)(
    "accepts wildcard MIME, exact MIME and case-insensitive extensions through %s",
    (method) => {
      const onDropFiles = vi.fn();
      const onDropUnacceptedFiles = vi.fn();
      const image = new File(["image"], "chart.PnG", { type: "image/png" });
      const pdf = new File(["pdf"], "report.bin", { type: "application/pdf" });
      const csv = new File(["csv"], "metrics.CSV", { type: "text/plain" });
      const archive = new File(["zip"], "report.zip", { type: "application/zip" });
      const { container } = render(
        <FileUpload.DropZone
          hint="Images, PDF or CSV"
          accept="image/*, application/pdf, .csv"
          onDropFiles={onDropFiles}
          onDropUnacceptedFiles={onDropUnacceptedFiles}
        />,
      );

      const input = chooseFiles(container, method, [image, pdf, csv, archive]);

      expect(onDropFiles).toHaveBeenCalledWith([image, pdf, csv]);
      expect(onDropUnacceptedFiles).toHaveBeenCalledWith([archive]);
      expect(screen.getByText("Images, PDF or CSV")).toHaveClass("text-error-primary");
      if (input !== null) {
        expect(input.accept).toBe("image/*, application/pdf, .csv");
      }
    },
  );

  it.each(["input", "drop"] as const)(
    "sends files over the size limit to the size callback before type acceptance through %s",
    (method) => {
      const onDropFiles = vi.fn();
      const onDropUnacceptedFiles = vi.fn();
      const onSizeLimitExceed = vi.fn();
      const atLimit = new File(["x"], "ok.pdf", { type: "application/pdf" });
      const tooLarge = new File(["xx"], "large.exe", { type: "application/octet-stream" });
      const wrongType = new File(["x"], "wrong.exe", { type: "application/octet-stream" });
      const { container } = render(
        <FileUpload.DropZone
          hint="PDF up to 1 byte"
          accept="application/pdf"
          maxSize={1}
          onDropFiles={onDropFiles}
          onDropUnacceptedFiles={onDropUnacceptedFiles}
          onSizeLimitExceed={onSizeLimitExceed}
        />,
      );

      chooseFiles(container, method, [atLimit, tooLarge, wrongType]);

      expect(onDropFiles).toHaveBeenCalledWith([atLimit]);
      expect(onSizeLimitExceed).toHaveBeenCalledWith([tooLarge]);
      expect(onDropUnacceptedFiles).toHaveBeenCalledWith([wrongType]);
      expect(screen.getByText("PDF up to 1 byte")).toHaveClass("text-error-primary");
    },
  );

  it.each(["input", "drop"] as const)(
    "processes only the first file when multiple selection is disabled through %s",
    (method) => {
      const onDropFiles = vi.fn();
      const onDropUnacceptedFiles = vi.fn();
      const first = new File(["one"], "first.pdf", { type: "application/pdf" });
      const ignored = new File(["two"], "second.png", { type: "image/png" });
      const { container } = render(
        <FileUpload.DropZone
          hint="PDF only"
          accept="application/pdf"
          allowsMultiple={false}
          onDropFiles={onDropFiles}
          onDropUnacceptedFiles={onDropUnacceptedFiles}
        />,
      );

      const input = chooseFiles(container, method, [first, ignored]);

      expect(onDropFiles).toHaveBeenCalledTimes(1);
      expect(onDropFiles).toHaveBeenCalledWith([first]);
      expect(onDropUnacceptedFiles).not.toHaveBeenCalled();
      if (input !== null) expect(input.multiple).toBe(false);
    },
  );

  it.each(["input", "drop"] as const)(
    "accepts any file type when accept is omitted through %s",
    (method) => {
      const onDropFiles = vi.fn();
      const onDropUnacceptedFiles = vi.fn();
      const file = new File(["data"], "data.bin", { type: "application/octet-stream" });
      const { container } = render(
        <FileUpload.DropZone
          hint="Any file"
          onDropFiles={onDropFiles}
          onDropUnacceptedFiles={onDropUnacceptedFiles}
        />,
      );

      chooseFiles(container, method, [file]);

      expect(onDropFiles).toHaveBeenCalledWith([file]);
      expect(onDropUnacceptedFiles).not.toHaveBeenCalled();
      expect(screen.getByText("Any file")).not.toHaveClass("text-error-primary");
    },
  );

  it("clears the input after processing so the same file can be selected again", () => {
    const onDropFiles = vi.fn();
    const onDropUnacceptedFiles = vi.fn();
    const retry = new File(["pdf"], "retry.pdf", { type: "application/pdf" });
    const rejected = new File(["text"], "notes.txt", { type: "text/plain" });
    const { container } = render(
      <FileUpload.DropZone
        hint="PDF only"
        accept="application/pdf"
        onDropFiles={onDropFiles}
        onDropUnacceptedFiles={onDropUnacceptedFiles}
      />,
    );
    const input = container.querySelector<HTMLInputElement>('input[type="file"]');
    if (input === null) throw new Error("file input is missing");

    fireEvent.change(input, { target: { files: [retry] } });
    expect(input.value).toBe("");
    fireEvent.change(input, { target: { files: [retry] } });

    expect(onDropFiles).toHaveBeenCalledTimes(2);
    expect(onDropFiles).toHaveBeenNthCalledWith(1, [retry]);
    expect(onDropFiles).toHaveBeenNthCalledWith(2, [retry]);

    fireEvent.change(input, { target: { files: [rejected] } });
    expect(input.value).toBe("");
    expect(onDropUnacceptedFiles).toHaveBeenCalledWith([rejected]);
    expect(screen.getByText("PDF only")).toHaveClass("text-error-primary");
    fireEvent.change(input, { target: { files: [retry] } });
    expect(screen.getByText("PDF only")).not.toHaveClass("text-error-primary");
  });

  it("S24-1-2 cancels a file dragged over or dropped on a disabled zone and takes none", () => {
    const onDropFiles = vi.fn();
    const { container } = render(
      <FileUpload.DropZone hint="Add files." isDisabled onDropFiles={onDropFiles} />,
    );
    const zone = container.querySelector<HTMLElement>("[data-dropzone]");
    if (zone === null) throw new Error("drop zone is missing");
    const file = new File(["x"], "report.pdf", { type: "application/pdf" });
    const dataTransfer = { types: ["Files"], files: [file] };
    expect(fireEvent.dragOver(zone, { dataTransfer })).toBe(false);
    expect(fireEvent.drop(zone, { dataTransfer })).toBe(false);
    expect(onDropFiles).not.toHaveBeenCalled();
  });
});
