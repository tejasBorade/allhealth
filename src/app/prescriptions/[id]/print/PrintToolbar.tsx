"use client";

import Button from "@mui/material/Button";
import PrintRoundedIcon from "@mui/icons-material/PrintRounded";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import styles from "./print.module.css";

export default function PrintToolbar() {
  return (
    <div className={`${styles.toolbar} ${styles.noPrint}`}>
      <Button startIcon={<ArrowBackRoundedIcon />} onClick={() => window.close()} size="small">
        Close
      </Button>
      <Button
        variant="contained"
        startIcon={<PrintRoundedIcon />}
        onClick={() => window.print()}
        size="small"
      >
        Print / Save as PDF
      </Button>
    </div>
  );
}
