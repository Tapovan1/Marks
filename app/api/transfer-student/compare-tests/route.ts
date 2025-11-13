import { type NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const standard = searchParams.get("standard");
    const sourceClass = searchParams.get("sourceClass");
    const destinationClass = searchParams.get("destinationClass");
    const studentId = searchParams.get("studentId");

    if (!standard || !sourceClass || !destinationClass || !studentId) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // Get all mark entries from source class
    const sourceEntries = await prisma.markEntry.findMany({
      where: {
        standard: parseInt(standard),
        class: sourceClass,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Get all mark entries from destination class
    const destinationEntries = await prisma.markEntry.findMany({
      where: {
        standard: parseInt(standard),
        class: destinationClass,
      },
      orderBy: {
        date: "desc",
      },
    });

    // Get student's existing marks from source class
    const studentMarks = await prisma.mark.findMany({
      where: {
        studentId: parseInt(studentId),
        markEntry: {
          standard: parseInt(standard),
          class: sourceClass,
        },
      },
      include: {
        markEntry: true,
      },
    });

    // Match tests between source and destination
    // Match by: subject, name (similar), date (same or close), MaxMarks
    const matchedTests = sourceEntries.map((sourceEntry) => {
      // Find best match in destination entries
      const matches = destinationEntries
        .map((destEntry) => {
          let score = 0;
          const reasons = [];

          // Exact subject match
          if (sourceEntry.subject === destEntry.subject) {
            score += 10;
            reasons.push("Same subject");
          }

          // Name similarity (exact or contains)
          if (
            sourceEntry.name.toLowerCase() === destEntry.name.toLowerCase()
          ) {
            score += 10;
            reasons.push("Same test name");
          } else if (
            sourceEntry.name
              .toLowerCase()
              .includes(destEntry.name.toLowerCase()) ||
            destEntry.name.toLowerCase().includes(sourceEntry.name.toLowerCase())
          ) {
            score += 5;
            reasons.push("Similar test name");
          }

          // Date proximity (within 7 days)
          const dateDiff = Math.abs(
            new Date(sourceEntry.date).getTime() -
              new Date(destEntry.date).getTime()
          );
          const daysDiff = dateDiff / (1000 * 60 * 60 * 24);
          if (daysDiff <= 1) {
            score += 10;
            reasons.push("Same date");
          } else if (daysDiff <= 7) {
            score += 5;
            reasons.push("Close date");
          }

          // MaxMarks match
          if (sourceEntry.MaxMarks === destEntry.MaxMarks) {
            score += 5;
            reasons.push("Same max marks");
          }

          // Chapter match (if exists)
          if (
            sourceEntry.Chapter &&
            destEntry.Chapter &&
            sourceEntry.Chapter === destEntry.Chapter
          ) {
            score += 3;
            reasons.push("Same chapter");
          }

          return {
            destinationEntry: destEntry,
            score,
            reasons,
            daysDiff: Math.round(daysDiff),
          };
        })
        .filter((match) => match.score > 0)
        .sort((a, b) => b.score - a.score);

      const bestMatch = matches.length > 0 ? matches[0] : null;
      const hasStudentMark = studentMarks.some(
        (mark) => mark.markEntryId === sourceEntry.id
      );

      return {
        sourceEntry,
        bestMatch,
        allMatches: matches.slice(0, 3), // Top 3 matches
        hasStudentMark,
        studentMark: hasStudentMark
          ? studentMarks.find((mark) => mark.markEntryId === sourceEntry.id)
          : null,
        canLink: bestMatch && bestMatch.score >= 15, // Minimum score to auto-link
      };
    });

    // Group by subject for better display
    const groupedBySubject = matchedTests.reduce((acc, test) => {
      const subject = test.sourceEntry.subject;
      if (!acc[subject]) {
        acc[subject] = [];
      }
      acc[subject].push(test);
      return acc;
    }, {} as Record<string, typeof matchedTests>);

    return NextResponse.json({
      sourceClass,
      destinationClass,
      totalSourceTests: sourceEntries.length,
      totalDestinationTests: destinationEntries.length,
      matchedTests,
      groupedBySubject,
      summary: {
        canAutoLink: matchedTests.filter((t) => t.canLink).length,
        needsManualReview: matchedTests.filter(
          (t) => t.bestMatch && !t.canLink
        ).length,
        noMatch: matchedTests.filter((t) => !t.bestMatch).length,
        hasMarks: matchedTests.filter((t) => t.hasStudentMark).length,
      },
    });
  } catch (error) {
    console.error("Error comparing tests:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to compare tests",
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

