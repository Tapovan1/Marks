"use client";

import { useState, useEffect, useCallback } from "react";
import { PDFDownloadLink } from "@react-pdf/renderer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MarkSheetPDF } from "@/components/MaeksheetPdf";
import { MarkEntryCard } from "@/components/MarkEntryCard";
import Breadcrumbs from "@/components/Breadcrumbs";
import { useStudents } from "@/hooks/useStudents";
import { useMarkEntries } from "@/hooks/useMarkEntries";
import { useMarks } from "@/hooks/useMarks";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MarkEntry {
  id: string;
  name: string;
  Chapter?: string;
  test: string;
  MaxMarks: number;
  date: string;
}

export default function SubjectPage({
  params,
}: {
  params: { standard: string; class: string; subject: string };
}) {
  const subjectName = decodeURIComponent(params.subject);
  const [selectedEntry, setSelectedEntry] = useState<MarkEntry | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(false);

  const { students } = useStudents(
    params.standard,
    params.class,
    params.subject
  );
  // console.log("students", students);

  const { markEntries, addMarkEntry } = useMarkEntries(
    params.standard,
    subjectName,
    params.class
  );
  const { marks, setMarks, submitMarks, loading } = useMarks(
    students,
    selectedEntry?.id || null
  );

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleMarkChange = useCallback(
    (studentId: string, value: string) => {
      setMarks((prevMarks) => ({
        ...prevMarks,
        [studentId]: value,
      }));
    },
    [setMarks]
  );

  const handleCreateEntry = useCallback(
    (newEntry: MarkEntry) => {
      addMarkEntry(newEntry);
      setSelectedEntry(newEntry);
    },
    [addMarkEntry]
  );

  const handleSelectEntry = useCallback((entry: MarkEntry | null) => {
    setLoadingEntry(true);
    setSelectedEntry(entry);
    setLoadingEntry(false);
  }, []);

  const getPdfData = useCallback(() => {
    return {
      subject: subjectName.toUpperCase(),
      chapter: selectedEntry?.Chapter || "",
      testName: selectedEntry?.name || "",
      maxMarks: selectedEntry?.MaxMarks || 0,
      standard: params.standard,
      date: selectedEntry?.date || new Date().toLocaleDateString("en-GB"),
      entryName: selectedEntry?.name || "",
      students: students.map((student: any, index: number) => ({
        srNo: index + 1,
        rollNo: student.rollNo,
        name: student.name.toUpperCase(),
        marks: marks[student.id] || "AB",
      })),
    };
  }, [subjectName, selectedEntry, params.standard, students, marks]);

  return (
    <div className="min-h-screen bg-slate-950 mt-2">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          {
            label: `Standard ${params.standard}`,
            href: `/standard/${params.standard}`,
          },
          { label: subjectName, href: "#" },
        ]}
      />

      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-2 sm:p-4 md:p-6">
          <div className="flex gap-4 items-center">
            <Select
              value={selectedEntry?.id || ""}
              onValueChange={(value) => {
                const selected = markEntries.find(
                  (entry) => entry.id === value
                );
                if (selected) {
                  handleSelectEntry(selected);
                }
              }}
            >
              <SelectTrigger className="w-full sm:w-[250px] bg-slate-800 border-slate-700 ">
                <SelectValue placeholder="Select an entry" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {markEntries.map((entry) => (
                  <SelectItem
                    key={entry.id}
                    value={entry.id}
                    className="hover:bg-slate-700 focus:bg-slate-700"
                  >
                    {entry.name} - {new Date(entry.date).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <MarkEntryCard
              standard={params.standard}
              className={params.class}
              subject={subjectName}
              onCreateEntry={handleCreateEntry}
            />
          </div>

          {loadingEntry && (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          )}

          {selectedEntry && (
            <div className="mt-6 space-y-6">
              <div className="overflow-x-auto -mx-2 sm:mx-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-200">Roll No</TableHead>
                      <TableHead className="text-slate-200">Name</TableHead>
                      <TableHead className="text-slate-200">
                        Mark ({selectedEntry.MaxMarks})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student: any) => (
                      <TableRow key={student.id} className="border-slate-800">
                        <TableCell className="text-slate-300">
                          {student.rollNo}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {student.name}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            value={marks[student.id] || ""}
                            onChange={(e) =>
                              handleMarkChange(student.id, e.target.value)
                            }
                            onBlur={() => {
                              const currentValue = marks[student.id] || "";
                              if (currentValue.trim() === "") {
                                handleMarkChange(student.id, "");
                              } else if (
                                Number.parseInt(currentValue) >
                                selectedEntry.MaxMarks
                              ) {
                                alert(
                                  `Max marks allowed is ${selectedEntry.MaxMarks}. Please enter a valid value.`
                                );
                                handleMarkChange(student.id, "");
                              }
                            }}
                            className="w-[80px] bg-slate-800 border-slate-700 text-slate-200"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-between mt-6">
                {isClient && (
                  <PDFDownloadLink
                    document={<MarkSheetPDF {...getPdfData()} />}
                    fileName={`Marks-${params.standard}-${subjectName}-${selectedEntry.name}.pdf`}
                  >
                    {/*@ts-ignore */}
                    {({ loading }) => (
                      <Button
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {loading ? "Generating PDF..." : "Download PDF"}
                      </Button>
                    )}
                  </PDFDownloadLink>
                )}
                <Button
                  onClick={submitMarks}
                  disabled={loading}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? "Saving..." : "Save Marks"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
