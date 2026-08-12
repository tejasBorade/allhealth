import Button from "@mui/material/Button";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { cancelAppointment } from "./actions";

export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  return (
    <form action={cancelAppointment.bind(null, appointmentId)}>
      <Button
        type="submit"
        size="small"
        color="error"
        variant="outlined"
        startIcon={<CancelRoundedIcon fontSize="small" />}
      >
        Cancel
      </Button>
    </form>
  );
}
