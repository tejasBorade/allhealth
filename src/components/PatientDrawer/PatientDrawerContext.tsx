"use client";

import * as React from "react";
import PatientDrawer from "./PatientDrawer";

interface PatientDrawerContextValue {
  openPatient: (patientId: string, patientName?: string) => void;
}

const PatientDrawerContext = React.createContext<PatientDrawerContextValue>({
  openPatient: () => {},
});

/** Call from any Client Component inside the doctor section to open the patient quick-view drawer. */
export function usePatientDrawer(): PatientDrawerContextValue {
  return React.useContext(PatientDrawerContext);
}

export function PatientDrawerProvider({ children }: { children: React.ReactNode }) {
  const [openPatientId, setOpenPatientId] = React.useState<string | null>(null);
  const [openPatientName, setOpenPatientName] = React.useState<string | undefined>(undefined);

  const openPatient = React.useCallback((patientId: string, patientName?: string) => {
    setOpenPatientId(patientId);
    setOpenPatientName(patientName);
  }, []);

  const handleClose = React.useCallback(() => {
    setOpenPatientId(null);
  }, []);

  const value = React.useMemo(() => ({ openPatient }), [openPatient]);

  return (
    <PatientDrawerContext.Provider value={value}>
      {children}
      <PatientDrawer patientId={openPatientId} patientName={openPatientName} onClose={handleClose} />
    </PatientDrawerContext.Provider>
  );
}
