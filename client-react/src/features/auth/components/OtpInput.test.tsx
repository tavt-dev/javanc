import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { OtpInput } from "@/features/auth/components/OtpInput";

describe("OtpInput", () => {
  it("accepts pasted 6-digit codes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);

    await user.click(screen.getByLabelText("Digit 1"));
    await user.paste("123456");

    expect(onChange).toHaveBeenLastCalledWith("123456");
  });

  it("strips non-digit input", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<OtpInput value="" onChange={onChange} />);

    await user.type(screen.getByLabelText("Digit 1"), "a1");

    expect(onChange).toHaveBeenLastCalledWith("1");
  });
});
