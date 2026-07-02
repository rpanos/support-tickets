import type { ComponentProps } from "react";
import { Toaster as Sonner } from "sonner";

function Toaster(props: ComponentProps<typeof Sonner>) {
  return <Sonner theme="light" className="toaster group" richColors closeButton {...props} />;
}

export { Toaster };
