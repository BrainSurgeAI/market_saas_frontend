import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import type { ActionDescriptor, ButtonActionDescriptor, DialogActionDescriptor } from "./types";

export function ActionToolbar({ actions }: { actions: ActionDescriptor[] }) {
  if (!actions.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {actions.map((action) =>
        action.type === "dialog" ? (
          <ActionDialogButton key={action.key} action={action} />
        ) : (
          <RegularActionButton key={action.key} action={action} />
        ),
      )}
    </div>
  );
}

function ActionDialogButton({ action }: { action: DialogActionDescriptor }) {
  const triggerDisabled = Boolean(action.disabled || action.loading);
  const triggerClasses = cn("h-8 px-3 text-xs", action.className);
  const confirmClasses = cn(
    action.dialog.confirmClassName ?? action.className,
    !(action.dialog.confirmClassName || action.className) && "bg-primary text-white hover:bg-primary/90",
  );
  const confirmLabel = action.dialog.confirmLabel ?? "确认";
  const cancelLabel = action.dialog.cancelLabel ?? "取消";

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={action.variant}
          size={action.size ?? "sm"}
          className={triggerClasses}
          disabled={triggerDisabled}
        >
          <ButtonContent action={action} />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-sm font-semibold">{action.dialog.title}</AlertDialogTitle>
          {action.dialog.description && (
            <AlertDialogDescription className="text-xs">{action.dialog.description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {action.dialog.body}
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={action.onConfirm} className={confirmClasses} disabled={triggerDisabled}>
            {action.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {action.loading ? "处理中..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RegularActionButton({ action }: { action: ButtonActionDescriptor }) {
  const disabled = Boolean(action.disabled || action.loading);
  return (
    <Button
      variant={action.variant}
      size={action.size ?? "sm"}
      className={cn("h-8 px-3 text-xs", action.className)}
      onClick={action.onClick}
      disabled={disabled}
    >
      <ButtonContent action={action} />
    </Button>
  );
}

function ButtonContent({ action }: { action: ActionDescriptor }) {
  return (
    <>
      {"loading" in action && action.loading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : action.icon ? (
        <span className="mr-2 flex items-center">{action.icon}</span>
      ) : null}
      <span>{action.label}</span>
    </>
  );
}

