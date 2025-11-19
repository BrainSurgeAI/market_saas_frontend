import type { ReactNode } from "react";
import type { ButtonProps } from "@/components/ui/button";

export type ActionDialogConfig = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  confirmClassName?: string;
  body?: ReactNode;
};

export type BaseActionDescriptor = {
  key: string;
  label: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  className?: string;
};

export type DialogActionDescriptor = BaseActionDescriptor & {
  type: "dialog";
  onConfirm: () => void;
  dialog: ActionDialogConfig;
};

export type ButtonActionDescriptor = BaseActionDescriptor & {
  type: "button";
  onClick: () => void;
};

export type ActionDescriptor = DialogActionDescriptor | ButtonActionDescriptor;

export interface ProductStatusSummary {
  totalItems: number;
  hasExchange: boolean;
  allInspected: boolean;
  itemStatusMap: Record<number, string>;
}

