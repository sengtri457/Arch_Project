import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

export function exportCourseToExcel(course: any, students: any[]) {
  // Format data for sheet
  const headers = [
    ["Course Revenue Report"],
    [`Course: ${course.title}`],
    [`Software: ${course.software_used || "General"}`],
    [`Total Enrolled: ${students.length} students`],
    [`Price: $${course.price ? Number(course.price).toFixed(2) : "49.99"}`],
    [],
    ["Student Name", "Email", "Admission Type", "Amount Paid ($)", "Enrollment Date", "Completed Lessons", "Total Lessons", "Progress %"]
  ];

  const rows = students.map((s) => [
    s.name,
    s.email,
    s.admissionType,
    s.amountPaid,
    s.enrollDate ? new Date(s.enrollDate).toLocaleDateString() : "N/A",
    s.completedLessons,
    s.totalLessons,
    s.progressPercent / 100 // Excel formatting handles percentages
  ]);

  // Create sheet
  const ws = XLSX.utils.aoa_to_sheet(headers);

  // Add the student data starting after headers (row index 7, which is 0-indexed row 7, i.e., line 8)
  XLSX.utils.sheet_add_aoa(ws, rows, { origin: "A8" });

  const lastStudentRow = headers.length + rows.length; // e.g., 7 + 10 = 17
  const totalRowIndex = lastStudentRow + 2; // e.g., 17 + 2 = 19 (Leaving row 18 blank)

  // Vertical Summary Row Block
  ws[`C${totalRowIndex}`] = { t: "s", v: "Total Students Count:" };
  ws[`D${totalRowIndex}`] = { t: "n", f: `COUNTA(A8:A${lastStudentRow})` };

  ws[`C${totalRowIndex + 1}`] = { t: "s", v: "Total Sales Revenue:" };
  ws[`D${totalRowIndex + 1}`] = { t: "n", f: `SUM(D8:D${lastStudentRow})`, z: "$#,##0.00" };

  ws[`C${totalRowIndex + 2}`] = { t: "s", v: "Avg Student Progress:" };
  ws[`D${totalRowIndex + 2}`] = { t: "n", f: `AVERAGE(H8:H${lastStudentRow})`, z: "0.0%" };

  // Set number formatting for student table rows
  for (let r = 8; r <= lastStudentRow; r++) {
    // Amount Paid cell
    const cellD = ws[`D${r}`];
    if (cellD) cellD.z = "$#,##0.00";
    
    // Progress % cell
    const cellH = ws[`H${r}`];
    if (cellH) cellH.z = "0.0%";
  }

  // Column widths
  ws["!cols"] = [
    { wch: 25 }, // Name
    { wch: 30 }, // Email
    { wch: 20 }, // Admission Type
    { wch: 16 }, // Amount Paid
    { wch: 18 }, // Enrollment Date
    { wch: 18 }, // Completed
    { wch: 15 }, // Total
    { wch: 12 }  // Progress %
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Course Report");
  
  // Clean filename
  const cleanTitle = course.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  XLSX.writeFile(wb, `${cleanTitle}_accounting_report.xlsx`);
}

export function exportCourseToPDF(course: any, students: any[], totalRevenue: number) {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  // Header Title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(154, 205, 50); // Primary green matching #9ACD32
  doc.text("ARCHVIZ PORTFOLIO WEBSITE", 14, 20);

  doc.setFontSize(12);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text("Accounting Ledger - Course Performance Report", 14, 26);
  
  // Horizontal divider
  doc.setDrawColor(200, 200, 200);
  doc.line(14, 30, pageWidth - 14, 30);

  // Metadata block
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text("Course Title:", 14, 38);
  doc.setFont("helvetica", "normal");
  doc.text(course.title, 42, 38);

  doc.setFont("helvetica", "bold");
  doc.text("Software Used:", 14, 44);
  doc.setFont("helvetica", "normal");
  doc.text(course.software_used || "General", 42, 44);

  doc.setFont("helvetica", "bold");
  doc.text("Enrolled Students:", 14, 50);
  doc.setFont("helvetica", "normal");
  doc.text(`${students.length} active students`, 48, 50);

  // Stats block (right aligned or column 2)
  const col2X = 120;
  doc.setFont("helvetica", "bold");
  doc.text("Course Price:", col2X, 38);
  doc.setFont("helvetica", "normal");
  doc.text(`$${course.price ? Number(course.price).toFixed(2) : "49.99"} USD`, col2X + 28, 38);

  doc.setFont("helvetica", "bold");
  doc.text("Total Revenue:", col2X, 44);
  doc.setFont("helvetica", "normal");
  doc.text(`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD`, col2X + 30, 44);

  // Table header & rows
  const tableHeaders = [
    ["Student Name", "Email", "Access Type", "Paid", "Date", "Progress"]
  ];

  const tableRows = students.map((s) => [
    s.name,
    s.email,
    s.admissionType === "Paid (KHQR/Stripe)" ? "Paid" : "Manual",
    `$${s.amountPaid.toFixed(2)}`,
    s.enrollDate ? new Date(s.enrollDate).toLocaleDateString() : "N/A",
    `${s.completedLessons}/${s.totalLessons} (${s.progressPercent.toFixed(0)}%)`
  ]);

  // Render Table
  (doc as any).autoTable({
    startY: 58,
    head: tableHeaders,
    body: tableRows,
    theme: "striped",
    headStyles: {
      fillColor: [154, 205, 50], // Match #9ACD32
      textColor: [0, 0, 0],
      fontStyle: "bold"
    },
    styles: {
      fontSize: 8,
      cellPadding: 3
    },
    columnStyles: {
      0: { cellWidth: 35 }, // Name
      1: { cellWidth: 50 }, // Email
      2: { cellWidth: 25 }, // Access Type
      3: { cellWidth: 22 }, // Paid
      4: { cellWidth: 25 }, // Date
      5: { cellWidth: 30 }  // Progress
    },
    didDrawPage: (data: any) => {
      // Footer page numbering
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      const str = "Page " + doc.getNumberOfPages();
      doc.text(str, pageWidth - 14 - doc.getTextWidth(str), pageHeight - 10);
      doc.text(`Report generated on: ${new Date().toLocaleString()}`, 14, pageHeight - 10);
    }
  });

  const cleanTitle = course.title.replace(/[^a-z0-9]/gi, "_").toLowerCase();
  doc.save(`${cleanTitle}_accounting_report.pdf`);
}
