import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import AuthMessageCard from "@/components/layout/AuthMessageCard";
import LinkButton from "@/components/LinkButton";

export default function UnauthorizedPage() {
  return (
    <AuthMessageCard
      icon={BlockRoundedIcon}
      color="error"
      title="Not authorized"
      description="Your account doesn't have access to that page."
      action={
        <LinkButton href="/login" variant="contained">
          Back to sign in
        </LinkButton>
      }
    />
  );
}
