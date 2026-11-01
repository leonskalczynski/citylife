import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { IncidentAttachments } from "@/features/incidents/components/IncidentAttachments";

describe("IncidentAttachments", () => {
  it("shows the empty upload state and rejects unsupported files before sending", () => {
    const onUpload = vi.fn();
    render(
      <IncidentAttachments
        attachments={[]}
        token="token"
        isLoading={false}
        isError={false}
        canUpload
        onUpload={onUpload}
      />,
    );

    expect(screen.getByText("Todavía no hay imágenes en esta incidencia.")).toBeInTheDocument();
    const input = screen.getByLabelText("Seleccionar imagen");
    fireEvent.change(input, { target: { files: [new File(["hello"], "notes.txt", { type: "text/plain" })] } });

    expect(screen.getByRole("alert")).toHaveTextContent("Selecciona una imagen JPEG, PNG o WebP.");
    expect(onUpload).not.toHaveBeenCalled();
  });
});
