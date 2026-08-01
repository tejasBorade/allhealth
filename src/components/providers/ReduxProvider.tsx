"use client";

import * as React from "react";
import { Provider } from "react-redux";
import { store } from "@/store";
import AuthListener from "./AuthListener";

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthListener />
      {children}
    </Provider>
  );
}
