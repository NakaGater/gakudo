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

  it("shows multiple selection hint when multiple=true", () => {
    const { container } = render(<FileUploader files={[]} onChange={vi.fn()} />);
    expect(container.textContent).toContain("複数選択可");
  });

  it("hides multiple hint when multiple=false", () => {
    const { container } = render(<FileUploader files={[]} onChange={vi.fn()} multiple={false} />);
    expect(container.textContent).not.toContain("複数選択可");
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

  it("shows PDF icon for PDF files", () => {
    const files = [{ file: new File(["x"], "doc.pdf", { type: "application/pdf" }) }];
    const { container } = render(<FileUploader files={files} onChange={vi.fn()} />);
    expect(container.textContent).toContain("📄");
  });

  it("shows image icon for image files", () => {
    const files = [{ file: new File(["x"], "photo.jpg", { type: "image/jpeg" }) }];
    const { container } = render(<FileUploader files={files} onChange={vi.fn()} />);
    expect(container.textContent).toContain("🖼️");
  });

  it("formats file sizes (bytes, KB, MB)", () => {
    const files = [
      { file: new File(["x"], "tiny.pdf", { type: "application/pdf" }) }, // 1B
      { file: new File(["x".repeat(2048)], "medium.pdf", { type: "application/pdf" }) }, // 2KB
    ];
    const { container } = render(<FileUploader files={files} onChange={vi.fn()} />);
    expect(container.textContent).toContain("1B");
    expect(container.textContent).toContain("2KB");
  });

  it("calls onChange when remove button is clicked", () => {
    const onChange = vi.fn();
    const files = [
      { file: new File(["x"], "doc.pdf", { type: "application/pdf" }) },
    ];
    const { container } = render(<FileUploader files={files} onChange={onChange} />);

    const removeBtn = container.querySelector("li button") as HTMLButtonElement;
    expect(removeBtn).toBeTruthy();
    fireEvent.click(removeBtn);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("removes correct file from multi-file list", () => {
    const onChange = vi.fn();
    const files = [
      { file: new File(["a"], "a.pdf", { type: "application/pdf" }) },
      { file: new File(["b"], "b.pdf", { type: "application/pdf" }) },
      { file: new File(["c"], "c.pdf", { type: "application/pdf" }) },
    ];
    const { container } = render(<FileUploader files={files} onChange={onChange} />);

    // Remove the second file (index 1)
    const removeBtns = container.querySelectorAll("li button");
    fireEvent.click(removeBtns[1]);
    const result = onChange.mock.calls[0][0];
    expect(result.length).toBe(2);
    expect(result[0].file.name).toBe("a.pdf");
    expect(result[1].file.name).toBe("c.pdf");
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

  it("handles drag over/leave state", () => {
    const { container } = render(<FileUploader files={[]} onChange={vi.fn()} />);
    const dropZone = container.querySelector('[role="button"]') as HTMLElement;

    fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } });
    // After drag over, the element should have accent border class
    expect(dropZone.className).toContain("border-accent");

    fireEvent.dragLeave(dropZone, { dataTransfer: { files: [] } });
    // After drag leave, accent class should be removed
    expect(dropZone.className).not.toContain("border-accent bg-accent");
  });

  it("adds files on drop", () => {
    const onChange = vi.fn();
    const { container } = render(<FileUploader files={[]} onChange={onChange} />);
    const dropZone = container.querySelector('[role="button"]') as HTMLElement;

    const validFile = new File(["content"], "dropped.pdf", { type: "application/pdf" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [validFile] },
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0][0].file.name).toBe("dropped.pdf");
  });

  it("rejects oversized files on drop with error", () => {
    const onChange = vi.fn();
    const { container } = render(<FileUploader files={[]} onChange={onChange} />);
    const dropZone = container.querySelector('[role="button"]') as HTMLElement;

    const bigFile = new File(["x".repeat(11 * 1024 * 1024)], "huge.pdf", { type: "application/pdf" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [bigFile] },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/10MB以下/)).toBeTruthy();
  });

  it("rejects disallowed MIME types on drop", () => {
    const onChange = vi.fn();
    const { container } = render(<FileUploader files={[]} onChange={onChange} />);
    const dropZone = container.querySelector('[role="button"]') as HTMLElement;

    const exeFile = new File(["x"], "bad.exe", { type: "application/x-msdownload" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [exeFile] },
    });

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/PDF\/画像のみ/)).toBeTruthy();
  });

  it("does not add files on drop when disabled", () => {
    const onChange = vi.fn();
    const { container } = render(<FileUploader files={[]} onChange={onChange} disabled />);
    const dropZone = container.querySelector('[role="button"]') as HTMLElement;

    const validFile = new File(["content"], "dropped.pdf", { type: "application/pdf" });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [validFile] },
    });

    expect(onChange).not.toHaveBeenCalled();
  });

  it("applies disabled styling when disabled", () => {
    const { container } = render(<FileUploader files={[]} onChange={vi.fn()} disabled />);
    const dropZone = container.querySelector('[role="button"]') as HTMLElement;
    expect(dropZone.className).toContain("opacity-50");
    expect(dropZone.className).toContain("cursor-not-allowed");
  });
});
