import type { ComponentPropsWithRef } from "react";
import { useId, useRef, useState } from "react";
import { File05, Trash01, UploadCloud02 } from "@untitledui/icons";
import { Button } from "@/components/base/buttons/button";
import { ButtonUtility } from "@/components/base/buttons/button-utility";
import { ProgressBar } from "@/components/base/progress-indicators/progress-indicators";
import { FeaturedIcon } from "@/components/foundations/featured-icon/featured-icon";
import { StatusBadge } from "@/components/status/StatusBadge";
import type { STATUS_SETS } from "@/components/status/sets";
import { cx } from "@/utils/cx";

interface FileUploadDropZoneProps {
  /** The class name of the drop zone. */
  className?: string;
  /** A hint text explaining what files can be dropped. */
  hint: string;
  /** Accessible name for the file input when it belongs to a larger form. */
  inputLabel?: string;
  /** Shows the document picker as a primary action inside the drop zone. */
  chooseFiles?: boolean;
  /** Disables dropping or uploading files. */
  isDisabled?: boolean;
  /**
   * Specifies the types of files that the server accepts.
   * Examples: "image/*", ".pdf,image/*", "image/*,video/mpeg,application/pdf"
   */
  accept?: string;
  /** Allows multiple file uploads. */
  allowsMultiple?: boolean;
  /** Maximum file size in bytes. */
  maxSize?: number;
  /** Called with the accepted files when files are chosen or dropped. */
  onDropFiles?: (files: File[]) => void;
  /** Called with the files whose type is not accepted. */
  onDropUnacceptedFiles?: (files: File[]) => void;
  /** Called with the files that exceed the size limit. */
  onSizeLimitExceed?: (files: File[]) => void;
}

function isFileTypeAccepted(file: File, accept?: string) {
  if (!accept) return true;
  const types = accept.split(",").map((type) => type.trim());
  return types.some((type) => {
    if (type.startsWith(".")) {
      const extension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;
      return extension === type.toLowerCase();
    }
    if (type.endsWith("/*")) {
      const prefix = type.split("/")[0] ?? "";
      return file.type.startsWith(`${prefix}/`);
    }
    return file.type === type;
  });
}

function classifyFiles(
  files: File[],
  allowsMultiple: boolean,
  maxSize: number | undefined,
  accept: string | undefined,
) {
  const accepted: File[] = [];
  const unaccepted: File[] = [];
  const oversized: File[] = [];
  const selected = allowsMultiple ? files : files.slice(0, 1);
  for (const file of selected) {
    if (maxSize !== undefined && file.size > maxSize) {
      oversized.push(file);
    } else if (isFileTypeAccepted(file, accept)) {
      accepted.push(file);
    } else {
      unaccepted.push(file);
    }
  }
  return { accepted, unaccepted, oversized };
}

export const FileUploadDropZone = ({
  className,
  hint,
  inputLabel,
  chooseFiles = false,
  isDisabled,
  accept,
  allowsMultiple = true,
  maxSize,
  onDropFiles,
  onDropUnacceptedFiles,
  onSizeLimitExceed,
}: FileUploadDropZoneProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isInvalid, setIsInvalid] = useState(false);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // A disabled zone still cancels a drag or drop, or the browser opens the file and the form goes.
  const handleDragIn = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDisabled) return;

    setIsDraggingOver(true);
  };

  const handleDragOut = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (isDisabled) return;

    setIsDraggingOver(false);
  };

  const processFiles = (files: File[]): void => {
    // Reset the invalid state when processing files.
    setIsInvalid(false);

    const { accepted, unaccepted, oversized } = classifyFiles(
      files,
      allowsMultiple,
      maxSize,
      accept,
    );

    if (oversized.length > 0) {
      setIsInvalid(true);
      onSizeLimitExceed?.(oversized);
    }

    if (accepted.length > 0) {
      onDropFiles?.(accepted);
    }

    if (unaccepted.length > 0) {
      setIsInvalid(true);
      onDropUnacceptedFiles?.(unaccepted);
    }

    // Clear the input value to ensure the same file can be selected again
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    handleDragOut(event);
    if (isDisabled) return;

    processFiles(Array.from(event.dataTransfer.files));
  };

  const handleInputFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(Array.from(event.target.files ?? []));
  };

  return (
    <DropZonePresentation
      className={className}
      hint={hint}
      inputLabel={inputLabel}
      chooseFiles={chooseFiles}
      isDisabled={isDisabled}
      accept={accept}
      allowsMultiple={allowsMultiple}
      isInvalid={isInvalid}
      isDraggingOver={isDraggingOver}
      inputRef={inputRef}
      onDragIn={handleDragIn}
      onDragOut={handleDragOut}
      onDrop={handleDrop}
      onInputChange={handleInputFileChange}
    />
  );
};

function DropZonePresentation({
  className,
  hint,
  inputLabel,
  chooseFiles,
  isDisabled,
  accept,
  allowsMultiple,
  isInvalid,
  isDraggingOver,
  inputRef,
  onDragIn,
  onDragOut,
  onDrop,
  onInputChange,
}: {
  className?: string;
  hint: string;
  inputLabel?: string;
  chooseFiles: boolean;
  isDisabled?: boolean;
  accept?: string;
  allowsMultiple: boolean;
  isInvalid: boolean;
  isDraggingOver: boolean;
  inputRef: { current: HTMLInputElement | null };
  onDragIn: (event: React.DragEvent<HTMLDivElement>) => void;
  onDragOut: (event: React.DragEvent<HTMLDivElement>) => void;
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = useId();
  return (
    <div
      data-dropzone
      onDragOver={onDragIn}
      onDragEnter={onDragIn}
      onDragLeave={onDragOut}
      onDragEnd={onDragOut}
      onDrop={onDrop}
      className={dropZoneClassName({
        className,
        chooseFiles,
        isDisabled,
        isDraggingOver,
      })}
    >
      <FeaturedIcon
        icon={UploadCloud02}
        color="gray"
        size="md"
        className={cx(isDisabled && "opacity-50")}
      />

      <div className="flex flex-col gap-1 text-center">
        <DropZonePrompt
          id={id}
          inputLabel={inputLabel}
          chooseFiles={chooseFiles}
          isDisabled={isDisabled}
          accept={accept}
          allowsMultiple={allowsMultiple}
          inputRef={inputRef}
          onInputChange={onInputChange}
        />
        <p
          className={cx(
            "text-xs transition duration-100 ease-linear",
            isInvalid && "text-error-primary",
          )}
        >
          {hint}
        </p>
      </div>
    </div>
  );
}

function dropZoneClassName({
  className,
  chooseFiles,
  isDisabled,
  isDraggingOver,
}: {
  className?: string;
  chooseFiles: boolean;
  isDisabled?: boolean;
  isDraggingOver: boolean;
}) {
  return cx(
    "relative flex flex-col items-center gap-3 rounded-xl px-6 text-tertiary transition duration-100 ease-linear",
    chooseFiles
      ? "border border-dashed border-border-container bg-surface-subtle py-6"
      : "bg-primary py-4 ring-1 ring-secondary ring-inset",
    isDraggingOver && (chooseFiles ? "border-action" : "ring-2 ring-brand"),
    isDisabled && "cursor-not-allowed bg-secondary",
    className,
  );
}

function DropZonePrompt({
  id,
  inputLabel,
  chooseFiles,
  isDisabled,
  accept,
  allowsMultiple,
  inputRef,
  onInputChange,
}: {
  id: string;
  inputLabel?: string;
  chooseFiles: boolean;
  isDisabled?: boolean;
  accept?: string;
  allowsMultiple: boolean;
  inputRef: { current: HTMLInputElement | null };
  onInputChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div
      className={cx(
        "flex justify-center gap-1 text-center",
        chooseFiles && "flex-col items-center gap-3",
      )}
    >
      <input
        ref={inputRef}
        id={id}
        type="file"
        aria-label={inputLabel ?? "Files"}
        className="peer sr-only"
        tabIndex={-1}
        disabled={isDisabled}
        accept={accept}
        multiple={allowsMultiple}
        onChange={onInputChange}
      />
      {chooseFiles && (
        <span className="text-sm font-semibold text-text-primary">Drop files here</span>
      )}
      <Button
        color={chooseFiles ? "primary" : "link-color"}
        size="md"
        isDisabled={isDisabled}
        onPress={() => inputRef.current?.click()}
      >
        {chooseFiles ? "Choose files" : "Click to upload"}
      </Button>
      {!chooseFiles && <span className="text-sm max-md:hidden">or drag and drop</span>}
    </div>
  );
}

export interface FileListItemProps {
  /** The name of the file. */
  name: string;
  /** The size of the file as display text, from the caller. */
  size: string;
  /** The row's state, from the File state set. */
  state: keyof (typeof STATUS_SETS)["File state"];
  /** The bar's value from 0 to 100 and the text beside it, both from the caller. Absent: no bar is drawn. */
  progress?: { value: number; label: string };
  /** The class name of the file list item. */
  className?: string;
  /** The function to call when the file is deleted. */
  onDelete?: () => void;
  /** The function to call when the file upload is retried; the retry button shows for an unreadable file only. */
  onRetry?: () => void;
}

export const FileListItemProgressBar = ({
  name,
  size,
  state,
  progress,
  onDelete,
  onRetry,
  className,
}: FileListItemProps) => {
  const failed = state === "Unreadable";

  return (
    <li
      className={cx(
        "relative flex gap-3 rounded-xl bg-primary p-4 ring-1 ring-secondary transition-shadow duration-100 ease-linear ring-inset",
        failed && "ring-2 ring-error",
        className,
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-container text-fg-quaternary">
        <File05 aria-hidden="true" className="size-5" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start">
        <div className="flex w-full max-w-full min-w-0 flex-1">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium wrap-anywhere text-secondary">{name}</p>

            <div className="mt-0.5 flex items-center gap-2">
              <p className="truncate text-sm whitespace-nowrap text-tertiary">{size}</p>

              <hr className="h-3 w-px rounded-t-full rounded-b-full border-none bg-border-primary" />

              <StatusBadge set="File state" state={state} />
            </div>
          </div>

          {onDelete && (
            <ButtonUtility
              tooltip={`Delete ${name}`}
              icon={Trash01}
              className="-mt-2 -mr-2 self-start"
              onPress={onDelete}
            />
          )}
        </div>

        {!failed && progress && (
          <div className="mt-1 w-full">
            <ProgressBar value={progress.value} max={100} label={progress.label} />
          </div>
        )}

        {failed && onRetry && (
          <Button color="link-destructive" size="sm" onPress={onRetry} className="mt-1.5">
            Try again
          </Button>
        )}
      </div>
    </li>
  );
};

const FileUploadRoot = (props: ComponentPropsWithRef<"div">) => (
  <div {...props} className={cx("flex flex-col gap-4", props.className)}>
    {props.children}
  </div>
);

const FileUploadList = (props: ComponentPropsWithRef<"ul">) => (
  <ul {...props} className={cx("flex flex-col gap-3", props.className)}>
    {props.children}
  </ul>
);

export const FileUpload = {
  Root: FileUploadRoot,
  List: FileUploadList,
  DropZone: FileUploadDropZone,
  ListItemProgressBar: FileListItemProgressBar,
};
