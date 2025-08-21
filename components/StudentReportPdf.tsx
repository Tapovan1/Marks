import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
  Font,
} from "@react-pdf/renderer";



const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 20,
  },
  logo: {
    width: 80,
    height: 90,
  },
  schoolInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  subHeader: {
    fontSize: 16,
    textAlign: "center",
    marginTop: 4,
  },
  monthlyReport: {
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 8,
  },
  divider: {
    borderBottomWidth: 1,
    borderColor: "#000",
    marginVertical: 10,
  },
  studentInfoContainer: {
    marginVertical: 20,
  },
  studentInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  studentName: {
    fontSize: 14,
    fontWeight: "bold",
  },
  studentDetail: {
    fontSize: 14,
    fontWeight: "bold",
  },
  table: {
    width: "100%",
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#000",
  },
  tableRow: {
    flexDirection: "row",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#000",
  },
  subjectCell: {
    width: "25%",
    padding: 8,
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  marksSection: {
    width: "45%",
  },
  marksHeader: {
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: "#000",
    padding: 4,
    textAlign: "center",
  },
  testScores: {
    flexDirection: "row",
  },
  testCell: {
    width: "33.33%",
    padding: 8,
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  totalCell: {
    width: "15%",
    padding: 8,
    borderRightWidth: 1,
    borderColor: "#000",
    textAlign: "center",
  },
  averageCell: {
    width: "15%",
    padding: 8,
    textAlign: "center",
  },
  boldText: {
    fontWeight: "bold",
  },
  attendanceTable: {
    width: "50%",
    marginTop: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#000",
  },
  attendanceRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  attendanceLabel: {
    width: "60%",
    padding: 8,
    borderRightWidth: 1,
    borderRightColor: "#000",
    textAlign: "center",
  },
  attendanceValue: {
    width: "40%",
    padding: 8,
    textAlign: "center",
  },
  signatureSection: {
    position: "absolute",
    bottom: 20,
    left: 30,
    right: 30,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 20,
  },
  signatureBlock: {
    flex: 1,
  },
  signatureLine: {
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    marginBottom: 8,
  },
  signatureText: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
  },
});

// Helper function to convert marks to 30 marks scale
// Helper function to convert marks to 30 marks scale
function convertTo30MarksScale(
  score: number | null | string,
  maxMarks: number
): number | string {
  

  if (score === null || score === "AB" || score === "ab") return "AB"; // Handle absent case
  if (typeof score === "string") {
    const parsedScore = parseFloat(score); // Convert string to number
   
    if (isNaN(parsedScore)) return score; // If still NaN, return original string
    score = parsedScore;
    
  }
  return Math.round((score / maxMarks) * 30);
}

interface StudentReportProps {
  month: string;
  year: string;
  student: {
    name: string;
    rollNo: string;
    currentStandard: number;
  };
  subjects: {
    name: string;
    examDetails: Array<{
      examName: string;
      score: number | null | string;
      maxMarks: number;
    }>;
  }[];
  attendance: {
    totalDays: number;
    presentDays: number;
  };
}

export function StudentReportPDF({
  month,
  year,
  student,
  subjects,
  attendance,
}: StudentReportProps) {
  const processedSubjects = subjects.map((subject) => {
   

    const convertedScores = subject.examDetails.map((exam) => {
      return convertTo30MarksScale(exam.score, exam.maxMarks);
    });

    // Extract valid numeric scores
    const validScores = convertedScores
      .map((score) => (score !== "AB" ? Number(score) : score))
      .filter(
        (score): score is number => typeof score === "number" && !isNaN(score)
      );

    // Calculate total and average
    const total = validScores.reduce((sum, score) => sum + score, 0);
    const average =
      validScores.length > 0 ? (total / validScores.length).toFixed(2) : "0.00";

    return {
      name: subject.name,
      scores: convertedScores,
      total,
      average,
    };
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Image src="/logo.png" style={styles.logo} />
          <View style={styles.schoolInfo}>
            <Text style={styles.schoolName}>TAPOVAN VIDHYAMANDIR SANKUL</Text>
            <Text style={styles.subHeader}>(SAPTESHVAR VIDHYALAY)</Text>
            <Text style={styles.monthlyReport}>
              MONTHLY REPORT - {month.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.studentInfoContainer}>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentName}>NAME : {student.name}</Text>
          </View>
          <View style={styles.studentInfoRow}>
            <Text style={styles.studentDetail}>
              STD : {student.currentStandard}
            </Text>
            <Text style={styles.studentDetail}>ROLL NO : {student.rollNo}</Text>
          </View>
        </View>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <View style={styles.subjectCell}>
              <Text style={styles.boldText}>SUBJECT</Text>
            </View>
            <View style={styles.marksSection}>
              <View style={styles.marksHeader}>
                <Text style={styles.boldText}>MARKS - 30</Text>
              </View>
              <View style={styles.testScores}>
                <View style={styles.testCell}>
                  <Text style={styles.boldText}>TEST - 1</Text>
                </View>
                <View style={styles.testCell}>
                  <Text style={styles.boldText}>TEST - 2</Text>
                </View>
                <View style={styles.testCell}>
                  <Text style={styles.boldText}>TEST - 3</Text>
                </View>
              </View>
            </View>
            <View style={styles.totalCell}>
              <Text style={styles.boldText}>TOTAL</Text>
              <Text style={styles.boldText}>(90)</Text>
            </View>
            <View style={styles.averageCell}>
              <Text style={styles.boldText}>AVERAGE</Text>
              <Text style={styles.boldText}>(30)</Text>
            </View>
          </View>

          {processedSubjects.map((subject, index) => (
            <View key={index} style={styles.tableRow}>
              <View style={styles.subjectCell}>
                <Text style={styles.boldText}>{subject.name}</Text>
              </View>
              <View style={styles.marksSection}>
                <View style={styles.testScores}>
                  {subject.scores.map((score, idx) => (
                    <View key={idx} style={styles.testCell}>
                      <Text>{score ?? ""}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.totalCell}>
                <Text>{subject.total}</Text>
              </View>
              <View style={styles.averageCell}>
                <Text>{subject.average}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.attendanceTable}>
          <View style={styles.attendanceRow}>
            <View style={styles.attendanceLabel}>
              <Text>TOTAL DAYS</Text>
            </View>
            <View style={styles.attendanceValue}>
              <Text>{attendance.totalDays}</Text>
            </View>
          </View>
          <View style={[styles.attendanceRow, { borderBottomWidth: 0 }]}>
            <View style={styles.attendanceLabel}>
              <Text>PRESENT</Text>
            </View>
            <View style={styles.attendanceValue}>
              <Text>{attendance.presentDays}</Text>
            </View>
          </View>
        </View>

        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Class Teacher</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Parent Sign 1</Text>
          </View>
          <View style={styles.signatureBlock}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureText}>Parent Sign 2</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
