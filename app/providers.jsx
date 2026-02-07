"use client";

import { EmployeeDataProvider } from "./store/employeeData";

export default function ClientProviders({ children }) {
  return (
    <EmployeeDataProvider>
      {children}
    </EmployeeDataProvider>
  );
}
