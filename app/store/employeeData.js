"use client";

import { createContext, useContext, useState, useCallback } from "react";

/* ═══════════════════════════════════════════════
   INITIAL EMPLOYEE DATA SCHEMA
   ═══════════════════════════════════════════════ */

const INITIAL_EMPLOYEE = {
  employee_id: "SW01083541",
  full_name: "Aiman Miller",
  title: "Senior Designer",
  initials: "AM",
  department: "Product Team",
  manager: "Sarah Chen",
  role_title: "Senior Designer",
  // Address fields
  address: "No. 170, Taman Indah Baru 2, 71010, Port Dickson, Negeri Sembilan",
  address_line1: "No. 170, Taman Indah Baru 2",
  address_line2: "",
  city: "Port Dickson",
  state: "Negeri Sembilan",
  postal_code: "71010",
  country: "MY",
  location_city: "Cyberjaya"
};

const INITIAL_OFFER = {
  salary_monthly: 4500,
  start_date: "2026-02-10",
  employment_type: "FULL_TIME",
  probation_months: 3,
  offer_accepted: true
};

const INITIAL_EQUITY = {
  grant_date: "2026-02-10",
  total_options: 1000,
  strike_price: 1.5
};

const INITIAL_EMPLOYER = {
  name: "WorkNest Inc.",
  address: "Cyberjaya, Selangor, Malaysia",
  state: "Selangor"
};

/* ═══════════════════════════════════════════════
   CONTEXT
   ═══════════════════════════════════════════════ */

const EmployeeDataContext = createContext(null);

export function EmployeeDataProvider({ children }) {
  const [employee, setEmployee] = useState(INITIAL_EMPLOYEE);
  const [offer, setOffer] = useState(INITIAL_OFFER);
  const [equity, setEquity] = useState(INITIAL_EQUITY);
  const [employer, setEmployer] = useState(INITIAL_EMPLOYER);

  // Track address change history
  const [addressHistory, setAddressHistory] = useState([
    {
      id: 1,
      address: INITIAL_EMPLOYEE.address,
      changedAt: new Date("2026-01-15"),
      status: "approved",
      approvedBy: "System"
    }
  ]);

  // Update employee address - pure CRUD operation for database sync
  const updateAddress = useCallback((newAddressData) => {
    const fullAddress = [
      newAddressData.address_line1,
      newAddressData.address_line2,
      `${newAddressData.postal_code}, ${newAddressData.city}, ${newAddressData.state}`
    ].filter(Boolean).join(", ");

    setEmployee((prev) => ({
      ...prev,
      address: fullAddress,
      address_line1: newAddressData.address_line1,
      address_line2: newAddressData.address_line2 || "",
      city: newAddressData.city,
      state: newAddressData.state,
      postal_code: newAddressData.postal_code,
      country: newAddressData.country || prev.country
    }));

    return fullAddress;
  }, []);

  // Add entry to address history (separate from updateAddress for flexibility)
  const addAddressHistory = useCallback((address, status = "approved", approvedBy = "HR Manager") => {
    setAddressHistory((prev) => [
      ...prev,
      {
        id: Date.now(),
        address,
        changedAt: new Date(),
        status,
        approvedBy
      }
    ]);
  }, []);

  // Update other employee fields
  const updateEmployee = useCallback((updates) => {
    setEmployee((prev) => ({ ...prev, ...updates }));
  }, []);

  const value = {
    employee,
    offer,
    equity,
    employer,
    addressHistory,
    updateAddress,
    addAddressHistory,
    updateEmployee,
    setOffer,
    setEquity,
    setEmployer
  };

  return (
    <EmployeeDataContext.Provider value={value}>
      {children}
    </EmployeeDataContext.Provider>
  );
}

export function useEmployeeData() {
  const context = useContext(EmployeeDataContext);
  if (!context) {
    throw new Error("useEmployeeData must be used within EmployeeDataProvider");
  }
  return context;
}

/* ═══════════════════════════════════════════════
   COUNTRY LOCALIZATION DATA
   ═══════════════════════════════════════════════ */

export const COUNTRIES = {
  MY: {
    name: "Malaysia",
    flag: "\u{1F1F2}\u{1F1FE}",
    currency: "MYR",
    locale: "ms-MY",
    laborLaw: "Employment Act 1955",
    noticePeriod: "4 weeks (for less than 2 years of service)",
    workHours: "45 hours/week",
    probation: "3\u20136 months",
    benefits: ["EPF (Employees Provident Fund)", "SOCSO (Social Security Organisation)", "EIS (Employment Insurance System)"],
    mandatoryClause:
      "This agreement is governed by the Employment Act 1955. The Employer shall contribute to EPF and SOCSO as required by Malaysian law.",
    governingLaw: "the laws of Malaysia"
  },
  UK: {
    name: "United Kingdom",
    flag: "\u{1F1EC}\u{1F1E7}",
    currency: "GBP",
    locale: "en-GB",
    laborLaw: "Employment Rights Act 1996",
    noticePeriod: "1 month statutory minimum",
    workHours: "48 hours/week maximum (Working Time Regulations 1998)",
    probation: "3\u20136 months",
    benefits: ["Statutory Sick Pay (SSP)", "National Insurance", "Workplace Pension (auto-enrolment)"],
    mandatoryClause:
      "Employment is subject to the Employment Rights Act 1996 and the Working Time Regulations 1998.",
    governingLaw: "the laws of England and Wales"
  }
};
