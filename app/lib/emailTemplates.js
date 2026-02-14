
export function generateFormalEmailHtml(employee, item) {
  const currentYear = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background-color: #1a1a1a; padding: 20px; text-align: center; }
    .logo { color: #ffffff; font-size: 24px; font-weight: bold; text-decoration: none; letter-spacing: 1px; }
    .content { padding: 40px; }
    .title { color: #1a1a1a; margin-top: 0; font-size: 22px; }
    .alert-box { background-color: #fff8e1; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; color: #856404; }
    .info-table { width: 100%; border-collapse: collapse; margin: 25px 0; font-size: 14px; }
    .info-table th { text-align: left; padding: 12px; border-bottom: 2px solid #eee; color: #666; width: 35%; }
    .info-table td { padding: 12px; border-bottom: 1px solid #eee; font-weight: 500; color: #333; }
    .expiry-date { color: #d32f2f; font-weight: bold; }
    .btn-container { text-align: center; margin-top: 30px; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #999; background-color: #f9f9f9; border-top: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">WORKNEST</div>
    </div>
    <div class="content">
      <h1 class="title">Compliance Action Required</h1>
      <p>Dear <strong>${employee.name}</strong>,</p>
      
      <p>This is a generic formal notification regarding the status of your employment compliance documentation. Our records indicate that an item requires your immediate attention.</p>
      
      <div class="alert-box">
        <strong>Notice:</strong> The following document is approaching its expiration date. Failure to renew may impact your employment eligibility or access to company resources.
      </div>
      
      <table class="info-table">
        <tr>
          <th>Employee Name</th>
          <td>${employee.name}</td>
        </tr>
        <tr>
          <th>Employee ID</th>
          <td>${employee.id}</td>
        </tr>
        <tr>
          <th>Department</th>
          <td>${employee.department}</td>
        </tr>
        <tr>
          <th>Document Type</th>
          <td>${item.type}</td>
        </tr>
        <tr>
          <th>Expiration Date</th>
          <td class="expiry-date">${item.expiry}</td>
        </tr>
      </table>
      
      <p>Please log in to the Human Resources portal to upload the renewed document or contact HR execution support.</p>
      
      <div class="btn-container">
        <a href="http://localhost:3000/profile" class="btn">Access Employee Portal</a>
      </div>
    </div>
    <div class="footer">
      <p>&copy; ${currentYear} WorkNest Inc. All rights reserved.</p>
      <p>CONFIDENTIALITY NOTICE: The contents of this email message and any attachments are intended solely for the addressee(s) and may contain confidential and/or privileged information and may be legally protected from disclosure.</p>
    </div>
  </div>
</body>
</html>
  `;
}
