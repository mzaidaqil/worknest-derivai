/**
 * POST /api/ocr
 *
 * Receives a base64-encoded passport image, calls Google Cloud Vision
 * TEXT_DETECTION, and returns structured passport fields.
 */

export async function POST(request) {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
        return Response.json(
            { error: "GOOGLE_VISION_API_KEY is not configured" },
            { status: 500 }
        );
    }

    try {
        const body = await request.json();
        const { image } = body; // base64-encoded image (without data:... prefix)

        if (!image) {
            return Response.json(
                { error: "No image provided" },
                { status: 400 }
            );
        }

        // ── Call Google Cloud Vision API ──
        const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;

        const visionPayload = {
            requests: [
                {
                    image: { content: image },
                    features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
                },
            ],
        };

        const visionRes = await fetch(visionUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(visionPayload),
        });

        if (!visionRes.ok) {
            const errText = await visionRes.text();
            console.error("[ocr] Vision API error:", visionRes.status, errText);
            return Response.json(
                { error: `Vision API returned ${visionRes.status}`, details: errText },
                { status: 502 }
            );
        }

        const visionData = await visionRes.json();
        const annotations = visionData.responses?.[0]?.textAnnotations;

        if (!annotations || annotations.length === 0) {
            return Response.json(
                { error: "No text detected in the image" },
                { status: 422 }
            );
        }

        const fullText = annotations[0].description;
        console.log("[ocr] Raw text extracted:", fullText.slice(0, 500));

        // ── Parse passport fields from extracted text ──
        const parsed = parsePassportText(fullText);

        return Response.json({
            success: true,
            raw_text: fullText,
            parsed,
        });
    } catch (error) {
        console.error("[ocr] Error:", error);
        return Response.json(
            { error: "OCR processing failed: " + error.message },
            { status: 500 }
        );
    }
}

/* ════════════════════════════════════════════════
   PASSPORT TEXT PARSER
   ════════════════════════════════════════════════ */

function parsePassportText(fullText) {
    const lines = fullText.split("\n").map((l) => l.trim()).filter(Boolean);
    const text = fullText.toUpperCase();

    const result = {
        full_name: "",
        passport_number: "",
        nationality: "",
        date_of_birth: "",
        gender: "",
        passport_expiry: "",
        place_of_issue: "",
    };

    // ── Try MRZ parsing first (most reliable) ──
    // MRZ lines are 44 chars long for TD3 (passport) format
    const mrzLines = lines.filter(
        (l) => l.length >= 42 && /^[A-Z0-9<]+$/.test(l.replace(/\s/g, ""))
    );

    if (mrzLines.length >= 2) {
        const mrz = parseMRZ(mrzLines);
        if (mrz.full_name) {
            Object.assign(result, mrz);
            return result;
        }
    }

    // ── Fallback: regex-based field extraction ──

    // Passport number: typically alphanumeric, 7-9 chars, often starts with a letter
    const passportMatch = text.match(
        /(?:PASSPORT\s*(?:NO|NUMBER|NUM|#)[.\s:]*)\s*([A-Z]?\d{6,9}[A-Z]?\d?)/i
    ) || text.match(/\b([A-Z]\d{7,8})\b/);
    if (passportMatch) result.passport_number = passportMatch[1].trim();

    // Full name: look for "SURNAME" / "GIVEN NAME" or "NAME" patterns
    const surnameMatch = text.match(/(?:SURNAME|FAMILY\s*NAME)[:\s/]*([A-Z\s'-]+)/);
    const givenMatch = text.match(/(?:GIVEN\s*NAME|FIRST\s*NAME|PRENOM)[:\s/]*([A-Z\s'-]+)/);
    if (surnameMatch && givenMatch) {
        result.full_name = `${givenMatch[1].trim()} ${surnameMatch[1].trim()}`;
    } else {
        // Try simpler "Name" field
        const nameMatch = text.match(/(?:NAME)[:\s/]+([A-Z][A-Z\s'-]{2,30})/);
        if (nameMatch) result.full_name = nameMatch[1].trim();
    }

    // Nationality
    const natMatch = text.match(
        /(?:NATIONALITY|KEWARGANEGARAAN|CITIZENSHIP)[:\s/]*([A-Z\s]+)/
    );
    if (natMatch) result.nationality = titleCase(natMatch[1].trim());

    // Date of birth — various formats
    const dobMatch = text.match(
        /(?:DATE\s*OF\s*BIRTH|DOB|BIRTH\s*DATE|TANGGAL\s*LAHIR|BORN)[:\s/]*(\d{1,2}[\s./-]\w{2,9}[\s./-]\d{2,4}|\d{4}[\s./-]\d{2}[\s./-]\d{2})/i
    );
    if (dobMatch) result.date_of_birth = normalizeDateString(dobMatch[1]);

    // Gender
    const genderMatch = text.match(/(?:SEX|GENDER|JENIS\s*KELAMIN)[:\s/]*(M|F|MALE|FEMALE|LELAKI|PEREMPUAN)/i);
    if (genderMatch) {
        const g = genderMatch[1].toUpperCase();
        result.gender = g === "M" || g === "MALE" || g === "LELAKI" ? "Male" : "Female";
    }

    // Expiry date
    const expMatch = text.match(
        /(?:DATE\s*OF\s*EXPIR|EXPIRY|EXPIRATION|VALID\s*UNTIL|BERLAKU\s*HINGGA)[:\s/Y]*(\d{1,2}[\s./-]\w{2,9}[\s./-]\d{2,4}|\d{4}[\s./-]\d{2}[\s./-]\d{2})/i
    );
    if (expMatch) result.passport_expiry = normalizeDateString(expMatch[1]);

    // Place of issue
    const placeMatch = text.match(
        /(?:PLACE\s*OF\s*ISSUE|AUTHORITY|ISSUING|TEMPAT\s*DIKELUARKAN)[:\s/]*([A-Z][A-Z\s,'-]+)/i
    );
    if (placeMatch) result.place_of_issue = titleCase(placeMatch[1].trim());

    // Clean up name — remove stray numbers or noise
    result.full_name = result.full_name
        .replace(/\d/g, "")
        .replace(/\s{2,}/g, " ")
        .trim();

    return result;
}

/* ── MRZ Parser for TD3 passport format ── */

function parseMRZ(mrzLines) {
    const result = {
        full_name: "",
        passport_number: "",
        nationality: "",
        date_of_birth: "",
        gender: "",
        passport_expiry: "",
        place_of_issue: "",
    };

    try {
        // Clean MRZ lines (remove spaces, normalize)
        const line1 = mrzLines[mrzLines.length - 2].replace(/\s/g, "");
        const line2 = mrzLines[mrzLines.length - 1].replace(/\s/g, "");

        // Line 1: P<ISSUING_COUNTRY<SURNAME<<GIVEN_NAMES<<<...
        if (line1.startsWith("P")) {
            const countryCode = line1.substring(2, 5).replace(/</g, "");
            result.place_of_issue = countryCode;

            const nameSection = line1.substring(5);
            const nameParts = nameSection.split("<<").filter(Boolean);
            const surname = (nameParts[0] || "").replace(/</g, " ").trim();
            const givenNames = (nameParts[1] || "").replace(/</g, " ").trim();

            if (surname || givenNames) {
                result.full_name = titleCase(`${givenNames} ${surname}`.trim());
            }

            // Country code → nationality
            result.nationality = countryCodeToNationality(countryCode);
        }

        // Line 2: PASSPORT_NUMBER + CHECK + NATIONALITY + DOB + CHECK + GENDER + EXPIRY + CHECK + ...
        if (line2.length >= 28) {
            result.passport_number = line2.substring(0, 9).replace(/</g, "");

            const natCode = line2.substring(10, 13).replace(/</g, "");
            if (natCode && !result.nationality) {
                result.nationality = countryCodeToNationality(natCode);
            }

            const dob = line2.substring(13, 19); // YYMMDD
            result.date_of_birth = mrzDateToString(dob);

            const gender = line2[20];
            result.gender = gender === "F" ? "Female" : gender === "M" ? "Male" : "";

            const expiry = line2.substring(21, 27); // YYMMDD
            result.passport_expiry = mrzDateToString(expiry);
        }
    } catch (e) {
        console.error("[ocr] MRZ parse error:", e);
    }

    return result;
}

/* ── Helpers ── */

function mrzDateToString(yymmdd) {
    if (!yymmdd || yymmdd.length !== 6) return "";
    const yy = parseInt(yymmdd.substring(0, 2), 10);
    const mm = yymmdd.substring(2, 4);
    const dd = yymmdd.substring(4, 6);
    // Pivot: 00-30 → 2000s, 31-99 → 1900s
    const year = yy <= 30 ? 2000 + yy : 1900 + yy;
    return `${year}-${mm}-${dd}`;
}

function titleCase(str) {
    return str
        .toLowerCase()
        .replace(/(?:^|\s|[-'])\w/g, (c) => c.toUpperCase());
}

function normalizeDateString(dateStr) {
    if (!dateStr) return "";
    // Try to convert common formats to YYYY-MM-DD
    const cleaned = dateStr.replace(/[.\s]/g, "-").replace(/--+/g, "-");
    // If already YYYY-MM-DD-ish
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    // Try DD-Mon-YYYY or DD-MM-YYYY
    const parts = cleaned.split("-");
    if (parts.length === 3) {
        const monthMap = {
            JAN: "01", FEB: "02", MAR: "03", APR: "04",
            MAY: "05", JUN: "06", JUL: "07", AUG: "08",
            SEP: "09", OCT: "10", NOV: "11", DEC: "12",
        };
        let [a, b, c] = parts;
        // Convert month name to number
        const bUpper = b.toUpperCase().substring(0, 3);
        if (monthMap[bUpper]) b = monthMap[bUpper];
        // Determine order
        if (a.length === 4) return `${a}-${b.padStart(2, "0")}-${c.padStart(2, "0")}`;
        if (c.length === 4) return `${c}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
        if (c.length === 2) {
            const yr = parseInt(c, 10);
            const fullYr = yr <= 30 ? 2000 + yr : 1900 + yr;
            return `${fullYr}-${b.padStart(2, "0")}-${a.padStart(2, "0")}`;
        }
    }
    return dateStr; // return as-is if we can't parse
}

function countryCodeToNationality(code) {
    const map = {
        IDN: "Indonesian", MYS: "Malaysian", SGP: "Singaporean",
        PHL: "Filipino", GBR: "British", IND: "Indian",
        USA: "American", AUS: "Australian", CHN: "Chinese",
        JPN: "Japanese", KOR: "South Korean", THA: "Thai",
        VNM: "Vietnamese", BGD: "Bangladeshi", NPL: "Nepali",
        PAK: "Pakistani", LKA: "Sri Lankan", MMR: "Myanmar",
        KHM: "Cambodian", TWN: "Taiwanese", HKG: "Hong Konger",
    };
    return map[code] || code;
}
