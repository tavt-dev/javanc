import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable } from "./DataTable";
import { EmptyState } from "./EmptyState";
import { RetryState } from "./RetryState";

describe("shared state components", () => {
  it("renders an empty state action", () => {
    render(
      <EmptyState
        icon={FileText}
        title="No data"
        description="Create something first."
        action={<button type="button">Create</button>}
      />,
    );

    expect(screen.getByText("No data")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
  });

  it("calls retry action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<RetryState error={new Error("Failed")} onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: "Retry" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("requires explicit confirmation", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete profile?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it("closes confirmation dialog with Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    render(
      <ConfirmDialog
        open
        title="Delete profile?"
        description="This cannot be undone."
        confirmLabel="Delete"
        onConfirm={vi.fn()}
        onCancel={onCancel}
      />,
    );

    await user.keyboard("{Escape}");

    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("renders data table sorting controls and empty state", () => {
    type Row = { name: string };
    const columns: ColumnDef<Row>[] = [
      {
        accessorKey: "name",
        header: "Name",
        cell: ({ row }) => row.original.name,
      },
    ];

    const { rerender } = render(
      <DataTable<Row>
        data={[{ name: "A" }]}
        columns={columns}
        empty="No rows found."
      />,
    );

    expect(screen.getByRole("button", { name: "Sort by Name" })).toBeEnabled();

    rerender(
      <DataTable<Row> data={[]} columns={columns} empty="No rows found." />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No rows found.");
  });
});
