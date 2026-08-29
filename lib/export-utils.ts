import * as XLSX from "xlsx-js-style";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

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

  // Style Definitions for Excel Tables
  const titleStyle = {
    font: { bold: true, sz: 16, color: { rgb: "7EA428" }, name: "Segoe UI" }
  };
  const metaStyle = {
    font: { name: "Segoe UI", sz: 10, color: { rgb: "4B5563" } }
  };
  const headerStyle = {
    fill: { fgColor: { rgb: "9ACD32" } },
    font: { bold: true, color: { rgb: "000000" }, sz: 10, name: "Segoe UI" },
    alignment: { horizontal: "center", vertical: "center" },
    border: {
      top: { style: "thin", color: { rgb: "7EA428" } },
      bottom: { style: "medium", color: { rgb: "000000" } },
      left: { style: "thin", color: { rgb: "7EA428" } },
      right: { style: "thin", color: { rgb: "7EA428" } }
    }
  };
  const dataStyle = {
    font: { name: "Segoe UI", sz: 10 },
    border: {
      top: { style: "thin", color: { rgb: "E5E7EB" } },
      bottom: { style: "thin", color: { rgb: "E5E7EB" } },
      left: { style: "thin", color: { rgb: "E5E7EB" } },
      right: { style: "thin", color: { rgb: "E5E7EB" } }
    }
  };
  const rightDataStyle = {
    ...dataStyle,
    alignment: { horizontal: "right" }
  };
  const centerDataStyle = {
    ...dataStyle,
    alignment: { horizontal: "center" }
  };
  const summaryLabelStyle = {
    font: { bold: true, name: "Segoe UI", sz: 10, color: { rgb: "374151" } },
    alignment: { horizontal: "right" }
  };
  const summaryValueStyle = {
    font: { bold: true, name: "Segoe UI", sz: 10 },
    border: {
      top: { style: "thin", color: { rgb: "000000" } },
      bottom: { style: "double", color: { rgb: "000000" } } // Standard double border for totals
    }
  };

  // Iterate over worksheet cells to apply styles
  const range = XLSX.utils.decode_range(ws['!ref'] || "");
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellRef = XLSX.utils.encode_cell({ c: C, r: R });
      const cell = ws[cellRef];
      if (!cell) continue;

      if (R === 0) {
        cell.s = titleStyle;
      } else if (R > 0 && R < 5) {
        cell.s = metaStyle;
      } else if (R === 6) {
        cell.s = headerStyle;
      } else if (R >= 7 && R < lastStudentRow) {
        if (C === 3 || C === 5 || C === 6 || C === 7) {
          cell.s = rightDataStyle;
        } else if (C === 2 || C === 4) {
          cell.s = centerDataStyle;
        } else {
          cell.s = dataStyle;
        }
      }
    }
  }

  // Pre-calculate values for formula totals to ensure they evaluate on load
  const totalRevenueVal = students.reduce((sum, s) => sum + s.amountPaid, 0);
  const avgProgressSum = students.reduce((sum, s) => sum + s.progressPercent, 0);
  const avgProgressVal = students.length > 0 ? (avgProgressSum / students.length) / 100 : 0;

  // Insert vertical summary rows with both formulas and values
  ws[`C${totalRowIndex}`] = { t: "s", v: "Total Students Count:", s: summaryLabelStyle };
  ws[`D${totalRowIndex}`] = { t: "n", f: `COUNTA(A8:A${lastStudentRow})`, v: students.length, s: summaryValueStyle };

  ws[`C${totalRowIndex + 1}`] = { t: "s", v: "Total Sales Revenue:", s: summaryLabelStyle };
  ws[`D${totalRowIndex + 1}`] = { t: "n", f: `SUM(D8:D${lastStudentRow})`, v: totalRevenueVal, z: "$#,##0.00", s: summaryValueStyle };

  ws[`C${totalRowIndex + 2}`] = { t: "s", v: "Avg Student Progress:", s: summaryLabelStyle };
  ws[`D${totalRowIndex + 2}`] = { t: "n", f: `AVERAGE(H8:H${lastStudentRow})`, v: avgProgressVal, z: "0.0%", s: summaryValueStyle };

  // Set grid lines explicitly visible
  ws["!views"] = [{ showGridLines: true }];

  // Set number formatting for data rows
  for (let r = 8; r <= lastStudentRow; r++) {
    const cellD = ws[`D${r}`];
    if (cellD) cellD.z = "$#,##0.00";
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

  // Calculate averages for footer
  const avgProgressSum = students.reduce((sum, s) => sum + s.progressPercent, 0);
  const avgProgress = students.length > 0 ? avgProgressSum / students.length : 0;

  // Zebra table footer showing totals inline
  const tableFooter = [
    ["Total Summary", "", `${students.length} students`, `$${totalRevenue.toFixed(2)}`, "", `Avg: ${avgProgress.toFixed(0)}%`]
  ];

  // Render Table via autoTable directly
  autoTable(doc, {
    startY: 58,
    head: tableHeaders,
    body: tableRows,
    foot: tableFooter,
    theme: "striped",
    headStyles: {
      fillColor: [154, 205, 50], // Match #9ACD32
      textColor: [0, 0, 0],
      fontStyle: "bold"
    },
    footStyles: {
      fillColor: [240, 240, 240],
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
