import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { FileText } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import i18n from "@/i18n";
import { ConfirmDialog } from "./ConfirmDialog";
import { DataTable } from "./DataTable";
import { DataToolbar } from "./DataToolbar";
import { EmptyState } from "./EmptyState";
import { ManagementDialog } from "./ManagementDialog";
import { PageHeader } from "./PageHeader";
import { RetryState } from "./RetryState";
import { StatusBadge } from "./StatusBadge";
import { BrandPanel } from "./BrandPanel";

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

  it("renders brand empty state and brand page header search content", () => {
    render(
      <>
        <EmptyState
          variant="brand"
          icon={FileText}
          title="No branded data"
          description="Brand state copy."
        />
        <PageHeader
          variant="brand"
          eyebrow="Marketplace"
          title="Talent search"
          description="Find candidates quickly."
          search={<input aria-label="Brand search" />}
        />
      </>,
    );

    expect(screen.getByText("No branded data")).toBeInTheDocument();
    expect(screen.getByText("Marketplace")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Brand search" })).toBeInTheDocument();
  });

  it("renders emerald status tones and brand panel", () => {
    render(
      <BrandPanel>
        <StatusBadge tone="emerald">Emerald</StatusBadge>
        <StatusBadge tone="mint">Mint</StatusBadge>
      </BrandPanel>,
    );

    expect(screen.getByText("Emerald")).toBeInTheDocument();
    expect(screen.getByText("Mint")).toBeInTheDocument();
  });

  it("calls retry action", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<RetryState error={new Error("Failed")} onRetry={onRetry} />);

    await user.click(screen.getByRole("button", { name: i18n.t("common.retry") }));

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

    expect(
      screen.getByRole("button", {
        name: i18n.t("common.sortBy", { field: "Name" }),
      }),
    ).toBeEnabled();

    rerender(
      <DataTable<Row> data={[]} columns={columns} empty="No rows found." />,
    );

    expect(screen.getByRole("status")).toHaveTextContent("No rows found.");
  });

  it("calls DataToolbar search and clear actions", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onClear = vi.fn();
    render(
      <DataToolbar
        search=""
        searchPlaceholder="Search records"
        onSearchChange={onSearchChange}
        onClear={onClear}
        variant="prominent"
        activeFilterCount={2}
      />,
    );

    await user.type(screen.getByLabelText("Search records"), "abc");
    await user.click(screen.getByRole("button", { name: i18n.t("common.clear") }));

    expect(onSearchChange).toHaveBeenCalled();
    expect(onClear).toHaveBeenCalledTimes(1);
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("closes management dialog with Escape", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(
      <ManagementDialog
        open
        title="Edit record"
        description="Update values."
        onClose={onClose}
      >
        <button type="button">Inside</button>
      </ManagementDialog>,
    );

    await user.keyboard("{Escape}");

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
