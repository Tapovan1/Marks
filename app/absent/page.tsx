"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PDFDownloadLink } from "@react-pdf/renderer";
import AbsentStudentsPDF from "@/components/AbsentstudentPdf";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { standards, StandardKey } from "@/Data/index";

type AbsentStudent = {
  id: number;
  rollNo: string;
  name: string;
  standard: string;
  class: string;
  date: string;
  reason?: string;
};

export default function AbsentStudentReason() {
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [absentStudents, setAbsentStudents] = useState<AbsentStudent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedStandard, setSelectedStandard] = useState<StandardKey | "">(
    ""
  );
  const [selectedClass, setSelectedClass] = useState<string>("");

  const fetchAbsentStudents = async () => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return;
    }

    const adjustedStartDate = new Date(startDate);
    const adjustedEndDate = new Date(endDate);

    adjustedStartDate.setDate(adjustedStartDate.getDate() + 1);
    adjustedEndDate.setDate(adjustedEndDate.getDate() + 1);

    adjustedStartDate.setHours(0, 0, 0, 0);
    adjustedEndDate.setHours(0, 0, 0, 0);

    const startTimestamp = adjustedStartDate.getTime();
    const endTimestamp = adjustedEndDate.getTime();

    setIsLoading(true);
    setError(null);

    try {
      // ✅ build query params dynamically
      const params = new URLSearchParams({
        startDate: startTimestamp.toString(),
        endDate: endTimestamp.toString(),
      });

      if (selectedStandard) params.append("standard", selectedStandard);
      if (selectedClass) params.append("className", selectedClass);

      const response = await fetch(
        `https://t1-api-attendance.vercel.app/api/absent-students?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch absent students data");
      }
      const data = await response.json();
      setAbsentStudents(data);
    } catch (error) {
      console.error("Error fetching absent students:", error);
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReasonUpdate = async (studentId: number, reason: string) => {
    try {
      const response = await fetch(
        `https://t1-api-attendance.vercel.app/api/absent-students`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId, reason }),
        }
      );
      if (!response.ok) {
        throw new Error("Failed to update reason");
      }
      // Refresh the absent students data
      fetchAbsentStudents();
    } catch (error) {
      console.error("Error updating reason:", error);
      setError("Failed to update reason. Please try again.");
    }
  };
  // date-month-year like format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Absent Student Reasons</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date Pickers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate" className="mb-2 block">
                Start Date
              </Label>
              <DatePicker date={startDate} setDate={setStartDate} />
            </div>
            <div>
              <Label htmlFor="endDate" className="mb-2 block">
                End Date
              </Label>
              <DatePicker date={endDate} setDate={setEndDate} />
            </div>
          </div>

          {/* Standard & Class Select */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="standard" className="mb-2 block">
                Standard (optional)
              </Label>
              <Select
                onValueChange={(value) => {
                  setSelectedStandard(value as StandardKey);
                  setSelectedClass(""); // reset class if standard changes
                }}
                value={selectedStandard}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Standard" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(standards).map((std) => (
                    <SelectItem key={std} value={std}>
                      {std}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="className" className="mb-2 block">
                Class (optional)
              </Label>
              <Select
                onValueChange={(value) => setSelectedClass(value)}
                value={selectedClass}
                disabled={!selectedStandard}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Class" />
                </SelectTrigger>
                <SelectContent>
                  {selectedStandard &&
                    standards[selectedStandard].classes.map((cls) => (
                      <SelectItem key={cls} value={cls}>
                        {cls}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fetch + PDF Buttons */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              onClick={fetchAbsentStudents}
              disabled={isLoading || !startDate || !endDate}
              className="min-w-[200px]"
            >
              {isLoading ? "Fetching..." : "Get Absent Students"}
            </Button>

            {absentStudents.length > 0 && (
              <PDFDownloadLink
                document={
                  <AbsentStudentsPDF
                    absentStudents={absentStudents}
                    startDate={startDate?.toISOString() || ""}
                    endDate={endDate?.toISOString() || ""}
                  />
                }
                fileName={`absent_students_report.pdf`}
              >
                {/*@ts-ignore */}
                {({ loading }) => (
                  <Button disabled={loading} className="min-w-[200px]">
                    {loading ? "Generating PDF..." : "Download PDF"}
                  </Button>
                )}
              </PDFDownloadLink>
            )}
          </div>

          {error && <div className="text-red-500 text-center">{error}</div>}

          {/* Table */}
          {absentStudents.length > 0 && (
            <div className="w-full overflow-auto sm:overflow-visible">
              <div className="min-w-[800px] sm:w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="whitespace-nowrap">
                      <TableHead className="px-2">Date</TableHead>
                      <TableHead className="px-2">Standard</TableHead>
                      <TableHead className="px-2">Class</TableHead>
                      <TableHead className="px-2">Roll No</TableHead>
                      <TableHead className="px-2">Name</TableHead>
                      <TableHead className="px-2">Reason</TableHead>
                      <TableHead className="px-2">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {absentStudents.map((student) => (
                      <TableRow
                        key={`${student.id}-${student.date}`}
                        className="whitespace-nowrap"
                      >
                        <TableCell className="px-2">
                          {formatDate(student.date)}
                        </TableCell>
                        <TableCell className="px-2">
                          {student.standard}
                        </TableCell>
                        <TableCell className="px-2">{student.class}</TableCell>
                        <TableCell className="px-2">{student.rollNo}</TableCell>
                        <TableCell className="px-2">{student.name}</TableCell>
                        <TableCell className="px-2">
                          {student.reason || "Not specified"}
                        </TableCell>
                        <TableCell className="px-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                Update Reason
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Update Absence Reason</DialogTitle>
                              </DialogHeader>
                              <ReasonSelector
                                initialReason={student.reason || ""}
                                onReasonUpdate={(reason) =>
                                  handleReasonUpdate(student.id, reason)
                                }
                              />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ReasonSelector({
  initialReason,
  onReasonUpdate,
}: {
  initialReason: string;
  onReasonUpdate: (reason: string) => Promise<void>;
}) {
  const [selectedReason, setSelectedReason] = useState(
    initialReason || "Please select reason"
  );
  const [customReason, setCustomReason] = useState(
    initialReason &&
      !["Lagan ma gayel chhe", "Bimar padel chhe", "Bar gayel chhe"].includes(
        initialReason
      )
      ? initialReason
      : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReasonChange = (value: string) => {
    setSelectedReason(value);
    if (value !== "Other") {
      setCustomReason("");
    }
  };

  const handleSubmit = async () => {
    if (selectedReason === "Please select reason") return;

    setIsSubmitting(true);
    try {
      const finalReason =
        selectedReason === "Other" ? customReason.trim() : selectedReason;
      await onReasonUpdate(finalReason);
    } catch (error) {
      console.error("Error updating reason:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reason">Reason</Label>
        <Select onValueChange={handleReasonChange} value={selectedReason}>
          <SelectTrigger>
            <SelectValue placeholder="Select reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Please select reason">
              Please select reason
            </SelectItem>
            <SelectItem value="Lagan ma gayel chhe">
              Lagan ma gayel chhe
            </SelectItem>
            <SelectItem value="Bimar padel chhe">Bimar padel chhe</SelectItem>
            <SelectItem value="Bar gayel chhe">Bar gayel chhe</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {selectedReason === "Other" && (
        <div className="space-y-2">
          <Label htmlFor="customReason">Custom Reason</Label>
          <Input
            id="customReason"
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            placeholder="Enter custom reason"
          />
        </div>
      )}
      <DialogFooter>
        <Button
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            selectedReason === "Please select reason" ||
            (selectedReason === "Other" && !customReason.trim())
          }
        >
          {isSubmitting ? "Updating..." : "Update Reason"}
        </Button>
      </DialogFooter>
    </div>
  );
}
