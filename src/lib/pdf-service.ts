import { OfferLetterWithDetails } from "@/types/offer";

export interface PDFGenerationOptions {
  offer: OfferLetterWithDetails;
  template?: "standard" | "detailed";
}

export function generateOfferLetterHTML(offer: OfferLetterWithDetails): string {
  const { jobPost, resume, createdBy } = offer;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Offer Letter - ${resume?.candidateName}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 40px 20px;
          background: #fff;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1890ff;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .company-name {
          font-size: 24px;
          font-weight: bold;
          color: #1890ff;
          margin-bottom: 5px;
        }
        .company-address {
          font-size: 14px;
          color: #666;
        }
        .date {
          text-align: right;
          margin-bottom: 30px;
          font-size: 14px;
          color: #666;
        }
        .candidate-info {
          margin-bottom: 30px;
        }
        .candidate-name {
          font-size: 18px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .candidate-details {
          font-size: 14px;
          color: #666;
        }
        .content {
          margin-bottom: 30px;
        }
        .content h2 {
          color: #1890ff;
          font-size: 20px;
          margin-bottom: 15px;
        }
        .content p {
          margin-bottom: 15px;
          text-align: justify;
        }
        .offer-details {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .offer-details h3 {
          color: #1890ff;
          margin-bottom: 15px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 5px 0;
          border-bottom: 1px solid #e8e8e8;
        }
        .detail-label {
          font-weight: bold;
          color: #333;
        }
        .detail-value {
          color: #666;
        }
        .signature-section {
          margin-top: 50px;
          display: flex;
          justify-content: space-between;
        }
        .signature-box {
          width: 200px;
          text-align: center;
        }
        .signature-line {
          border-bottom: 1px solid #333;
          height: 40px;
          margin-bottom: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #e8e8e8;
          padding-top: 20px;
        }
        @media print {
          body { margin: 0; padding: 20px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${jobPost?.companyName}</div>
        <div class="company-address">${jobPost?.location}</div>
      </div>

      <div class="date">
        ${formatDate(offer.offerDate)}
      </div>

      <div class="candidate-info">
        <div class="candidate-name">${resume?.candidateName}</div>
        <div class="candidate-details">
          ${resume?.candidateEmail ? `Email: ${resume.candidateEmail}<br>` : ""}
          ${resume?.candidatePhone ? `Phone: ${resume.candidatePhone}` : ""}
        </div>
      </div>

      <div class="content">
        <h2>Job Offer Letter</h2>
        
        <p>Dear ${resume?.candidateName},</p>
        
        <p>We are pleased to offer you the position of <strong>${
          offer.offeredPosition
        }</strong> at ${jobPost?.companyName}. 
        After careful consideration of your qualifications and experience, we believe you would be a valuable addition to our team.</p>

        <div class="offer-details">
          <h3>Offer Details</h3>
          <div class="detail-row">
            <span class="detail-label">Position:</span>
            <span class="detail-value">${offer.offeredPosition}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Company:</span>
            <span class="detail-value">${jobPost?.companyName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Location:</span>
            <span class="detail-value">${jobPost?.location}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Salary:</span>
            <span class="detail-value">${offer.salary}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Joining Date:</span>
            <span class="detail-value">${
              offer.joiningDate
                ? formatDate(offer.joiningDate)
                : "To be determined"
            }</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">Job Type:</span>
            <span class="detail-value">${jobPost?.jobType}</span>
          </div>
        </div>

        <p>This offer is contingent upon your acceptance and successful completion of any remaining pre-employment requirements. 
        We are excited about the possibility of you joining our team and contributing to our continued success.</p>

        ${
          offer.notes
            ? `<p><strong>Additional Notes:</strong><br>${offer.notes}</p>`
            : ""
        }

        <p>Please respond to this offer by ${new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}. If you have any questions, please don't hesitate to contact us.</p>

        <p>We look forward to welcoming you to our team!</p>

        <p>Sincerely,<br>
        ${createdBy?.name || "HR Team"}<br>
        ${jobPost?.companyName}</p>
      </div>

      <div class="signature-section">
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>Candidate Signature</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">Date: ___________</div>
        </div>
        <div class="signature-box">
          <div class="signature-line"></div>
          <div>HR Representative</div>
          <div style="font-size: 12px; color: #666; margin-top: 5px;">Date: ___________</div>
        </div>
      </div>

      <div class="footer">
        <p>This offer letter is confidential and intended solely for the recipient.</p>
        <p>Generated on ${formatDate(
          new Date().toISOString()
        )} by HR Automation System</p>
      </div>
    </body>
    </html>
  `;

  return html;
}

export function downloadOfferLetterPDF(offer: OfferLetterWithDetails): void {
  const html = generateOfferLetterHTML(offer);

  // Create a new window with the HTML content
  const printWindow = window.open("", "_blank");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();

    // Wait for content to load, then trigger print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Close the window after printing (optional)
        // printWindow.close();
      }, 500);
    };
  }
}

export function generateOfferLetterPDFBlob(
  offer: OfferLetterWithDetails
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const html = generateOfferLetterHTML(offer);

    // Create a temporary element to hold the HTML
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = html;
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    document.body.appendChild(tempDiv);

    // Use html2pdf library if available, otherwise fallback to print
    if (typeof window !== "undefined" && (window as any).html2pdf) {
      const element = tempDiv;
      const opt = {
        margin: 1,
        filename: `offer-letter-${offer.resume?.candidateName
          ?.replace(/\s+/g, "-")
          .toLowerCase()}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      };

      (window as any)
        .html2pdf()
        .set(opt)
        .from(element)
        .save()
        .then(() => {
          document.body.removeChild(tempDiv);
          resolve(new Blob());
        })
        .catch((error: any) => {
          document.body.removeChild(tempDiv);
          reject(error);
        });
    } else {
      // Fallback to print dialog
      document.body.removeChild(tempDiv);
      downloadOfferLetterPDF(offer);
      resolve(new Blob());
    }
  });
}



