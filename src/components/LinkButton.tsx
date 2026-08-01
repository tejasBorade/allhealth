"use client";

import Link from "next/link";
import Button, { type ButtonProps } from "@mui/material/Button";

// `component={Link}` composition has to happen inside a Client Component —
// a Server Component can render this as JSX, but can't pass the Link
// function reference itself as a prop across the server/client boundary.
export default function LinkButton({
  href,
  ...props
}: ButtonProps & { href: string }) {
  return <Button component={Link} href={href} {...props} />;
}
