/**
 * POST /api/documents/generate
 *
 * Accepts structured data and returns generated document metadata.
 * Mirrors the Flask backend's document generation routes:
 *   - /documents/employment-agreement
 *   - /documents/option-grant-letter
 *   - /documents/vesting-schedule
 *   - /documents/exercise-agreement
 */

const COUNTRY_TEMPLATES = {
  MY: {
    name: "Malaysia",
    currency: "MYR",
    laborLaw: "Employment Act 1955",
    noticePeriod: "4 weeks",
    workHours: "45 hours/week",
    probation: "3-6 months",
    mandatoryClause:
      "This agreement is governed by the Employment Act 1955. Employer shall contribute to EPF and SOCSO.",
    governingLaw: "the laws of Malaysia"
  },
  UK: {
    name: "United Kingdom",
    currency: "GBP",
    laborLaw: "Employment Rights Act 1996",
    noticePeriod: "1 month statutory minimum",
    workHours: "48 hours/week maximum",
    probation: "3-6 months",
    mandatoryClause:
      "Employment is subject to the Employment Rights Act 1996.",
    governingLaw: "the laws of England and Wales"
  }
};

function buildVestingTable() {
  const rows = [];
  for (let y = 0; y <= 6; y++) {
    const cliff = y >= 3 ? 100 : 0;
    let graded = 0;
    if (y === 2) graded = 20;
    else if (y === 3) graded = 40;
    else if (y === 4) graded = 60;
    else if (y === 5) graded = 80;
    else if (y >= 6) graded = 100;
    rows.push({ year: y, cliff, graded });
  }
  return rows;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      type = "employment_contract",
      employee = {},
      offer = {},
      equity = {},
      country = "US"
    } = body;

    const template = COUNTRY_TEMPLATES[country] || COUNTRY_TEMPLATES["US"];
    const now = new Date().toISOString();

    let document = null;

    switch (type) {
      case "employment_contract": {
        document = {
          id: `DOC-${Date.now().toString(36).toUpperCase()}`,
          type: "Employment Contract",
          version: "1.0",
          generatedAt: now,
          country,
          countryName: template.name,
          data: {
            effectiveDate: now,
            employerName: body.employerName || "WorkNest Inc.",
            employerAddress:
              body.employerAddress || "Cyberjaya, Selangor, Malaysia",
            employeeName: employee.fullName || "Employee",
            employeeAddress: employee.address || "",
            roleTitle: employee.roleTitle || "",
            salaryMonthly: offer.salaryMonthly || 0,
            currency: template.currency,
            startDate: offer.startDate || "",
            employmentType: offer.employmentType || "FULL_TIME",
            probationMonths: offer.probationMonths || 3,
            locationCity: employee.locationCity || "",
            workHours: template.workHours,
            noticePeriod: template.noticePeriod,
            mandatoryClause: template.mandatoryClause,
            governingLaw: template.governingLaw,
            laborLaw: template.laborLaw
          }
        };
        break;
      }

      case "option_grant_letter": {
        document = {
          id: `DOC-${Date.now().toString(36).toUpperCase()}`,
          type: "Option Grant Letter",
          version: "1.0",
          generatedAt: now,
          country,
          countryName: template.name,
          data: {
            letterDate: now,
            employeeName: employee.fullName || "Employee",
            employeeAddress: employee.address || "",
            grantDate: equity.grantDate || now,
            totalOptions: equity.totalOptions || 0,
            strikePrice: equity.strikePrice || 0,
            currency: template.currency
          }
        };
        break;
      }

      case "vesting_schedule": {
        document = {
          id: `DOC-${Date.now().toString(36).toUpperCase()}`,
          type: "Vesting Schedule",
          version: "1.0",
          generatedAt: now,
          country,
          countryName: template.name,
          data: {
            employeeName: employee.fullName || "Employee",
            totalOptions: equity.totalOptions || 0,
            grantDate: equity.grantDate || now,
            rows: buildVestingTable()
          }
        };
        break;
      }

      case "exercise_agreement": {
        document = {
          id: `DOC-${Date.now().toString(36).toUpperCase()}`,
          type: "Exercise Agreement",
          version: "1.0",
          generatedAt: now,
          country,
          countryName: template.name,
          data: {
            companyName: body.employerName || "WorkNest Inc.",
            companyState: template.name,
            companyAddress:
              body.employerAddress || "Cyberjaya, Selangor, Malaysia",
            contractorName: employee.fullName || "Employee",
            contractorAddress: employee.address || "",
            startDate: offer.startDate || "",
            noticeDays: 30,
            profitPct: 20,
            noncompeteMonths: 6
          }
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: `Unknown document type: ${type}` }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        document,
        message: `${document.type} generated successfully for ${template.name}`
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[documents/generate] error:", error);
    return new Response(
      JSON.stringify({ error: "Document generation failed: " + error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
