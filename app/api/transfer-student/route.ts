import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const {
      studentId,
      sourceStandard,
      sourceClass,
      destinationStandard,
      destinationClass,
      destinationSubClass,
      testLinks = [], // Array of {sourceEntryId, destinationEntryId, studentMark}
    } = await request.json();

    // Validate input
    if (!studentId) {
      return NextResponse.json(
        { success: false, error: "Student ID is required" },
        { status: 400 }
      );
    }

    if (
      !sourceStandard ||
      !sourceClass ||
      !destinationStandard ||
      !destinationClass
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Source and destination standard/class are required",
        },
        { status: 400 }
      );
    }

    // Get current academic year
    const currentYear = new Date().getFullYear();

    // Start a transaction to ensure the core transfer stays consistent
    const updatedStudent = await prisma.$transaction(
      async (tx) => {
        // 1. Find the student to transfer
        const student = await tx.student.findUnique({
          where: {
            id: Number(studentId),
          },
        });

        if (!student) {
          throw new Error("Student not found");
        }

        // Verify student is in the expected source location
        if (
          student.currentStandard !== Number(sourceStandard) ||
          student.currentClass !== sourceClass
        ) {
          throw new Error(
            `Student is not in Standard ${sourceStandard} Class ${sourceClass}`
          );
        }

        // 2. Create academic history entry
        await tx.academicHistory.create({
          data: {
            year: currentYear,
            standard: student.currentStandard,
            class: student.currentClass,
            studentId: student.id,
          },
        });

        // 3. Update student
        const updateData: any = {
          currentStandard: Number(destinationStandard),
          currentClass: destinationClass,
        };

        // Update subClass if provided (for standards 11 and 12)
        if (destinationSubClass !== undefined && destinationSubClass !== null) {
          updateData.subClass = destinationSubClass;
        }

        const studentAfterUpdate = await tx.student.update({
          where: {
            id: student.id,
          },
          data: updateData,
        });

        return studentAfterUpdate;
      },
     
    );

    // After the student transfer succeeds, optionally link historical marks
    let linkedMarksCount = 0;
    const normalizedLinks = Array.isArray(testLinks)
      ? testLinks
          .map((link: any) => ({
            sourceEntryId: Number(link?.sourceEntryId),
            destinationEntryId: Number(link?.destinationEntryId),
            studentMark: link?.studentMark,
          }))
          .filter(
            (link) =>
              Number.isInteger(link.destinationEntryId) &&
              typeof link.studentMark === "string" &&
              link.studentMark.trim() !== ""
          )
      : [];

    if (normalizedLinks.length > 0) {
      const destinationEntryIds = normalizedLinks.map(
        (link) => link.destinationEntryId
      );

      const existingMarks = await prisma.mark.findMany({
        where: {
          studentId: Number(studentId),
          markEntryId: {
            in: destinationEntryIds,
          },
        },
        select: { markEntryId: true },
      });

      const existingMarkIds = new Set(
        existingMarks.map((mark) => mark.markEntryId)
      );

      const marksToCreate = normalizedLinks
        .filter((link) => !existingMarkIds.has(link.destinationEntryId))
        .map((link) => ({
          studentId: Number(studentId),
          markEntryId: link.destinationEntryId,
          score: link.studentMark,
          academicYear: currentYear,
        }));

      if (marksToCreate.length > 0) {
        const createResult = await prisma.mark.createMany({
          data: marksToCreate,
          skipDuplicates: true,
        });
        linkedMarksCount = createResult.count ?? marksToCreate.length;
      }
    }

    const message =
      linkedMarksCount > 0
        ? `Successfully transferred student from Standard ${sourceStandard} Class ${sourceClass} to Standard ${destinationStandard} Class ${destinationClass} and linked ${linkedMarksCount} test mark(s)`
        : `Successfully transferred student from Standard ${sourceStandard} Class ${sourceClass} to Standard ${destinationStandard} Class ${destinationClass}`;

    return NextResponse.json({
      success: true,
      message,
      student: updatedStudent,
      linkedMarksCount,
    });
  } catch (error) {
    console.error("Transfer error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Internal server error during transfer",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

