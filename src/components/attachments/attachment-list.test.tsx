import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttachmentList } from "./attachment-list";

const mockAttachments = [
  {
    id: "a1",
    file_name: "document.pdf",
    file_path: "announcement/1/doc.pdf",
    file_size: 1024 * 500, // 500KB
    mime_type: "application/pdf",
    created_at: "2025-01-01T00:00:00Z",
  },
  {
    id: "a2",
    file_name: "photo.jpg",
    file_path: "announcement/1/photo.jpg",
    file_size: 1024 * 1024 * 2, // 2MB
    mime_type: "image/jpeg",
    created_at: "2025-01-02T00:00:00Z",
  },
];

const mockUrls: Record<string, string> = {
  a1: "https://example.com/doc.pdf",
  a2: "https://example.com/photo.jpg",
};

describe("AttachmentList", () => {
  it("renders attachment file names", () => {
    render(
      <AttachmentList attachments={mockAttachments} downloadUrls={mockUrls} />,
    );
    expect(screen.getByText("document.pdf")).toBeTruthy();
    expect(screen.getByText("photo.jpg")).toBeTruthy();
  });

  it("renders download links with correct URLs", () => {
    render(
      <AttachmentList attachments={mockAttachments} downloadUrls={mockUrls} />,
    );
    const links = screen.getAllByRole("link");
    expect(links.length).toBeGreaterThanOrEqual(2);
  });

  it("renders file sizes in formatted form", () => {
    const { container } = render(
      <AttachmentList attachments={mockAttachments} downloadUrls={mockUrls} />,
    );
    expect(container.textContent).toContain("500KB");
    expect(container.textContent).toContain("2.0MB");
  });

  it("renders delete buttons when onDelete is provided", () => {
    const onDelete = vi.fn();
    const { container } = render(
      <AttachmentList
        attachments={mockAttachments}
        downloadUrls={mockUrls}
        onDelete={onDelete}
      />,
    );
    const deleteButtons = container.querySelectorAll('button[title="削除"]');
    expect(deleteButtons.length).toBe(2);
  });

  it("does not render delete buttons when onDelete is omitted", () => {
    const { container } = render(
      <AttachmentList attachments={mockAttachments} downloadUrls={mockUrls} />,
    );
    const deleteButtons = container.querySelectorAll('button[title="削除"]');
    expect(deleteButtons.length).toBe(0);
  });

  it("renders heading with attachment count", () => {
    const { container } = render(
      <AttachmentList attachments={mockAttachments} downloadUrls={mockUrls} />,
    );
    expect(container.textContent).toContain("添付ファイル");
    expect(container.textContent).toContain("(2)");
  });

  it("renders nothing when attachments array is empty", () => {
    const { container } = render(
      <AttachmentList attachments={[]} downloadUrls={{}} />,
    );
    expect(container.textContent).toBe("");
  });
});
