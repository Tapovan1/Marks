"use client";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from "@react-pdf/renderer";
import { TableHeader } from "./ui/table";

// Register Gujarati font
Font.register({
  family: "Roboto",
  src: "https://fonts.gstatic.com/s/roboto/v29/KFOmCnqEu92Fr1Me5Q.ttf",
});

Font.register({
  family: "NotoSansGujarati",
  src: "/fonts/NotoSansGujarati-Regular.ttf",
});

interface MarkSheetProps {
  subject: string;
  standard: string;
  chapter: string;
  testName: string;
  maxMarks: number;

  date: string;
  students: {
    srNo: number;
    rollNo: string;
    name: string;
    marks: string | number;
  }[];
}

interface HeaderProps {
  subject: string;
  chapter: string;
  standard: string;
  date: string;
  testName: string;
}

const styles = StyleSheet.create({
  gujratiText: {
    fontFamily: "NotoSansGujarati",
    fontSize: 12,
  },
  page: {
    padding: 10,
    fontSize: 12,
  },
  header: {
    backgroundColor: "#2B579A",
    padding: 20,
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: "#FFD700",
  },
  schoolName: {
    color: "#FFD700",
    fontSize: 26,
    textAlign: "center",
    fontFamily: "NotoSansGujarati",
    fontWeight: "bold",
  },
  subHeader: {
    color: "#FFD700",
    fontSize: 16,
    textAlign: "center",
    marginTop: 5,
  },
  examInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#FFD700",
    marginTop: 10,
    paddingHorizontal: 10,
  },
  table: {
    width: "100%",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  tableHeader: {
    backgroundColor: "#4A90E2",

    fontWeight: "bold",
    color: "Black",
    padding: 5,

    textAlign: "center",
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderRightColor: "#000",
    backgroundColor: "#E8F0FE",
  },
  srNo: {
    width: "10%",
    textAlign: "center",
  },
  rollNo: {
    width: "15%",
    textAlign: "center",
  },
  name: {
    width: "55%",
    textAlign: "center",
  },
  marks: {
    width: "20%",
    textAlign: "center",
  },
  absentText: {
    color: "red",
    textAlign: "center",
  },
});
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}-${month}-${year}`;
};

const Header = ({
  subject,
  chapter,
  standard,
  date,
  testName,
}: HeaderProps) => (
  <View style={styles.header}>
    <Text style={styles.schoolName}>TAPOVAN VIDHYAMANDIR SANKUL</Text>
    <Text style={styles.subHeader}>{testName}</Text>
    <View style={styles.examInfo}>
      <Text>SUB - {subject}</Text>
      {chapter && <Text>CH - {chapter} </Text>}
      <Text>STD - {standard}</Text>
      <Text>DATE - {formatDate(date)}</Text>
    </View>
  </View>
);

export function MarkSheetPDF({
  subject,
  chapter,
  testName,
  maxMarks,
  standard,
  date,
  students,
}: MarkSheetProps) {
  // Calculate how many students to show per page (for example, 25 students per page)
  const STUDENTS_PER_PAGE = 27;
  const totalPages = Math.ceil(students.length / STUDENTS_PER_PAGE);

  return (
    <Document>
      {Array.from({ length: totalPages }).map((_, pageIndex) => (
        <Page key={pageIndex} size="A4" style={styles.page}>
          <Header
            subject={subject}
            chapter={chapter}
            standard={standard}
            date={date}
            testName={testName}
          />
          <View style={styles.table}>
            <View style={styles.tableRow}>
              <View style={[styles.tableCell, styles.srNo, styles.tableHeader]}>
                <Text>Sr No</Text>
              </View>
              <View
                style={[styles.tableCell, styles.rollNo, styles.tableHeader]}
              >
                <Text>Roll No</Text>
              </View>
              <View style={[styles.tableCell, styles.name, styles.tableHeader]}>
                <Text>Name</Text>
              </View>
              <View
                style={[styles.tableCell, styles.marks, styles.tableHeader]}
              >
                <Text>Marks ({maxMarks})</Text>
              </View>
            </View>
            <TableHeader />
            {students
              .slice(
                pageIndex * STUDENTS_PER_PAGE,
                (pageIndex + 1) * STUDENTS_PER_PAGE
              )
              .map((student) => (
                <View key={student.srNo} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.srNo]}>
                    <Text>{student.srNo}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.rollNo]}>
                    <Text>{student.rollNo}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.name]}>
                    <Text>{student.name}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.marks]}>
                    <Text
                      style={
                        student.marks === "AB" ? styles.absentText : undefined
                      }
                    >
                      {student.marks}
                    </Text>
                  </View>
                </View>
              ))}
          </View>
        </Page>
      ))}
    </Document>
  );
}
