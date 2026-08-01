import Button from "@mui/material/Button";
import { cancelAppointment } from "./actions";

export default function CancelAppointmentButton({ appointmentId }: { appointmentId: string }) {
  return (
    <form action={cancelAppointment.bind(null, appointmentId)}>
      <Button type="submit" size="small" color="error">
        Cancel
      </Button>
    </form>
  );
}
