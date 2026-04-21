import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { FileUploader } from "./file-uploader";

describe("FileUploader", () => {
  it("renders drop zone with instruction text", () => {
    render(<FileUploader files={[]} onChange={vi.fn()} />);
    expect(screen.getByText(/ファイルをドラッグ/)).toBeTruthy();
  });

  it("shows file type and size info", () => {
    const { container } = render(<FileUploader files={[]} onChange={vi.fn()} />);
    expect(container.textContent).toContain("PDF・画像");
    expect(container.textContent).toContain("最大10MB");
  });

  it("displays selected file names in the list", () => {
    const files = [
      { file: new File(["x"], "doc.pdf", { type: "application/pdf" }) },
      { file: new File(["y"], "photo.jpg", { type: "image/jpeg" }) },
    ];
    const { container } = render(<FileUploader files={files} onChange={vi.fn()} />);
    expect(container.textContent).toContain("doc.pdf");
    expect(container.textContent).toContain("photo.jpg");
  });

  it("calls onChange when remove button is clicked", () => {
    const onChange = vi.fn();
    const files = [
      { file: new File(["x"], "doc.pdf", { type: "application/pdf" }) },
    ];
    const { container } = render(<FileUploader files={files} onChange={onChange} />);

    // Find the ✕ button inside the file list (not the drop zone div)
    const removeBtn = container.querySelector("li button") as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("hides remove buttons when disabled", () => {
    const files = [
      { file: new File(["x"], "doc.pdf", { type: "application/pdf" }) },
    ];
    const { container } = render(<FileUploader files={files} onChange={vi.fn()} disabled />);
    expect(container.querySelector("li button")).toBeNull();
  });

  it("has hidden file input with correct accept attribute", () => {
    render(<FileUploader files={[]} onChange={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe(".pdf,image/*");
  });
});
