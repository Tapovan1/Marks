import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const standard = searchParams.get("standard");
  const classParam = searchParams.get("class");
  const subject = searchParams.get("subject");
  const subClass = searchParams.get("subClass");
  // console.log("standard", standard);
  // console.log("classParam", classParam);
  // console.log("subject", subject);
  // console.log("subClass", subClass);

  let students;

  if (standard === "11" || standard === "12") {
    if (subject === "Maths" || subject === "Computer") {
      students = await prisma.student.findMany({
        where: {
          currentStandard: standard ? parseInt(standard) : undefined,
          currentClass: classParam || undefined,
          subClass: subClass || undefined,
        },
      });
    } else if (subject === "Biology" || subject === "Sanskrit") {
      students = await prisma.student.findMany({
        where: {
          currentStandard: standard ? parseInt(standard) : undefined,
          currentClass: classParam || undefined,
          //if subClass is there use or not fetch undefined
          subClass: subClass || undefined,
        },
      });
    } else if (
      subject === "Chemistry" ||
      subject === "Physics" ||
      subject === "English"
    ) {
      students = await prisma.student.findMany({
        where: {
          currentStandard: standard ? parseInt(standard) : undefined,
          //for currentClass if std 12 so make include class Maths and Biology else as it
          currentClass:
            standard === "12"
              ? { in: ["Maths", "Biology"] }
              : classParam || undefined,
        },
      });
    } else {
      students = await prisma.student.findMany({
        where: {
          currentStandard: standard ? parseInt(standard) : undefined,
          currentClass: classParam || undefined,
          subClass: subClass || undefined,
        },
      });
    }
  } else {
    students = await prisma.student.findMany({
      where: {
        currentStandard: standard ? parseInt(standard) : undefined,
        currentClass: classParam || undefined,
        subClass: subClass || undefined,
      },
    });
  }

  // if (
  //   (subject === "Chemistry" ||
  //     subject === "Physics" ||
  //     subject === "English") &&
  //   (standard === "11" || standard === "12")
  // ) {
  //   students = await prisma.student.findMany({
  //     where: {
  //       currentStandard: standard ? parseInt(standard) : undefined,
  //       ...(classParam &&
  //       ["Jee", "Neet", "Eng-Jee", "Eng-Neet"].includes(classParam)
  //         ? { currentClass: classParam }
  //         : {}),
  //     },
  //   });
  // } else {
  //   students = await prisma.student.findMany({
  //     where: {
  //       currentStandard: standard ? parseInt(standard) : undefined,
  //       currentClass: classParam || undefined,
  //       subClass:subClass || undefined
  //     },
  //   });
  // }

  // console.log("students", students);

  //@ts-expect-error
  const sortedStudents = students.sort((a, b) => a.rollNo - b.rollNo);

  return NextResponse.json(sortedStudents);
}

export async function POST(request: Request) {
  const data = await request.json();
  console.log("data", data);

  const student = await prisma.student.create({
    data: {
      name: data.name,
      rollNo: data.rollNo,
      currentStandard: parseInt(data.currentStandard),
      currentClass: data.class,
      subClass: data.subClass,
      academicHistory: {
        create: {
          year: new Date().getFullYear(),
          standard: parseInt(data.currentStandard),
          class: data.class,
        },
      },
    },
  });
  return NextResponse.json(student);
}
