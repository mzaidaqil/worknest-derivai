import { COMPLIANCE_DATA, EMPLOYEE_PROFILE } from "../../../lib/mockData";
import { generateFormalEmailHtml } from "../../../lib/emailTemplates";
import nodemailer from "nodemailer";

export async function POST() {
    const expiringItems = [];
    const logs = [];

    // 1. Identify items expiring soon (7, 14, 21, 28 days only)
    COMPLIANCE_DATA.expirations.forEach((item) => {
        if ([7, 14, 21, 28].includes(item.daysLeft)) {
            expiringItems.push(item);
        }
    });

    // Configuration from environment variables
    const SENDER_EMAIL = process.env.COMPLIANCE_SENDER_EMAIL || "no-reply@worknest.ai";
    const SENDER_PASSWORD = process.env.COMPLIANCE_EMAIL_PASSWORD; // App Password
    const HR_EMAIL = process.env.COMPLIANCE_HR_EMAIL || "hr@worknest.ai";
    const EMP_EMAIL = process.env.COMPLIANCE_EMPLOYEE_EMAIL || "employee@worknest.ai";

    // 2. Send Real Emails
    if (expiringItems.length > 0) {
        logs.push(`Found ${expiringItems.length} items expiring soon.`);

        if (!SENDER_PASSWORD) {
            logs.push("ERROR: No App Password provided. Emails not sent.");
            return Response.json({ success: false, message: "Missing email credentials", actions: logs });
        }

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: SENDER_EMAIL,
                pass: SENDER_PASSWORD,
            },
            family: 4, // Force IPv4 to avoid EHOSTUNREACH
        });

        for (const item of expiringItems) {
            const emailHtml = generateFormalEmailHtml(EMPLOYEE_PROFILE, item);

            const mailOptions = {
                from: `"WorkNest Compliance" <${SENDER_EMAIL}>`,
                to: `${HR_EMAIL}, ${EMP_EMAIL}`,
                subject: `ACTION REQUIRED: ${item.type} Expiration`,
                text: `Formal Notice: The ${item.type} for ${EMPLOYEE_PROFILE.name} is expiring on ${item.expiry}. Please check the employee portal.`,
                html: emailHtml
            };

            try {
                await transporter.sendMail(mailOptions);
                console.log(`[Email Sent] To: ${HR_EMAIL}, ${EMP_EMAIL} | Subject: ${mailOptions.subject}`);
                logs.push(`Formal email sent to ${HR_EMAIL} & ${EMP_EMAIL} for: ${item.type}`);
            } catch (error) {
                console.error("Error sending email:", error);
                logs.push(`FAILED to send email for: ${item.type}. Error: ${error.message}`);
            }
        }
    } else {
        logs.push("No items found matching the reminder schedule (7, 14, 21, 28 days left).");
    }

    return Response.json({
        success: true,
        message: "Compliance check completed.",
        actions: logs,
        timestamp: new Date().toISOString()
    });
}
