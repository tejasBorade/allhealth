import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import AuthMessageCard from "@/components/layout/AuthMessageCard";
import LinkButton from "@/components/LinkButton";

export default function PendingApprovalPage() {
  return (
    <AuthMessageCard
      icon={HourglassTopRoundedIcon}
      color="warning"
      title="Awaiting admin approval"
      description="Doctor and staff accounts need to be approved by an admin before you can sign in. You'll be notified by email once that happens."
      action={
        <LinkButton href="/login" variant="outlined">
          Back to sign in
        </LinkButton>
      }
    />
  );
}
