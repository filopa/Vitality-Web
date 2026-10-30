"use client";

import { createContext, useContext, useState } from "react";

const SignupFlowContext = createContext(null);

export function SignupFlowProvider({ children }) {
  const [pendingSignup, setPendingSignup] = useState(null);

  return (
    <SignupFlowContext.Provider value={{ pendingSignup, setPendingSignup }}>
      {children}
    </SignupFlowContext.Provider>
  );
}

export function useSignupFlow() {
  const context = useContext(SignupFlowContext);
  if (!context) {
    throw new Error("useSignupFlow must be used within SignupFlowProvider.");
  }
  return context;
}
