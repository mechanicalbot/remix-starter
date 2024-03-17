import { nanoid } from "nanoid";
import { Toaster as Sonner, toast as sonnerToast } from "sonner";
import { z } from "zod";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      closeButton
      {...props}
    />
  );
};

const ToastSchema = z.object({
  id: z.string().default(() => nanoid()),
  title: z.string(),
  description: z.string().optional(),
  type: z
    .enum(["message", "success", "error", "warning", "info", "loading"])
    .default("message"),
});

type Toast = z.infer<typeof ToastSchema>;

type ToastInput = z.input<typeof ToastSchema>;

const showToast = (toast: ToastInput) => {
  sonnerToast[toast.type || "message"](toast.title, {
    id: toast.id,
    description: toast.description,
  });
};

export { Toaster, showToast, ToastSchema, type Toast, type ToastInput };
