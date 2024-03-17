import { type Meta, type StoryObj } from "@storybook/react";

import { Button } from "./button";
import { Toaster, toast } from "./sonner";

const meta = {
  title: "Sonner",
  parameters: {
    layout: "centered",
  },
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => {
    return (
      <div className="space-x-5">
        {(
          ["message", "success", "error", "warning", "info", "loading"] as const
        ).map((type) => (
          <Button
            key={type}
            variant="outline"
            onClick={() => toast[type](type, { description: type })}
          >
            {type}
          </Button>
        ))}
        <Toaster />
      </div>
    );
  },
};
