import "./env";
import { connectDB } from "@/lib/mongodb";
import { FloorLevel } from "@/models/FloorLevel";

const RECORDS = [
  { slug: "ypogeio", name: "Υπόγειο" },
  { slug: "imiypogeio", name: "Ημιυπόγειο" },
  { slug: "isogeio", name: "Ισόγειο" },
  { slug: "imiorofos", name: "Ημιόροφος" },
  { slug: "1os", name: "1ος" },
  { slug: "2os", name: "2ος" },
  { slug: "3os", name: "3ος" },
  { slug: "4os", name: "4ος" },
  { slug: "5os", name: "5ος" },
  { slug: "6os", name: "6ος" },
  { slug: "7os", name: "7ος" },
  { slug: "8os", name: "8ος" },
  { slug: "9os", name: "9ος" },
  { slug: "10os", name: "10ος" },
  { slug: "11os", name: "11ος" },
  { slug: "12os", name: "12ος" },
  { slug: "13os", name: "13ος" },
  { slug: "14os", name: "14ος" },
  { slug: "15os", name: "15ος" },
  { slug: "16os", name: "16ος" },
  { slug: "17os", name: "17ος" },
  { slug: "18os", name: "18ος" },
  { slug: "19os", name: "19ος" },
  { slug: "20os", name: "20ος" },
  { slug: "21os", name: "21ος" },
  { slug: "22os", name: "22ος" },
  { slug: "23os", name: "23ος" },
  { slug: "24os", name: "24ος" },
  { slug: "25os", name: "25ος" },
  { slug: "26os", name: "26ος" },
  { slug: "27os", name: "27ος" },
  { slug: "28os", name: "28ος" },
  { slug: "29os", name: "29ος" },
  { slug: "30os", name: "30ος" },
  { slug: "31os", name: "31ος" },
  { slug: "32os", name: "32ος" },
  { slug: "33os", name: "33ος" },
  { slug: "34os", name: "34ος" },
  { slug: "35os", name: "35ος" },
  { slug: "36os", name: "36ος" },
  { slug: "37os", name: "37ος" },
  { slug: "38os", name: "38ος" },
  { slug: "39os", name: "39ος" },
  { slug: "40os", name: "40ος" },
  { slug: "41os", name: "41ος" },
  { slug: "42os", name: "42ος" },
  { slug: "43os", name: "43ος" },
  { slug: "44os", name: "44ος" },
  { slug: "45os", name: "45ος" },
  { slug: "46os", name: "46ος" },
  { slug: "47os", name: "47ος" },
  { slug: "48os", name: "48ος" },
  { slug: "49os", name: "49ος" },
  { slug: "50os", name: "50ος" },
];

async function seedFloorLevel() {
  await connectDB();

  for (const { slug, name } of RECORDS) {
    const existing = await FloorLevel.findOne({ slug, deletedAt: null });
    if (existing) {
      console.log(`Floor Level already exists: ${slug}`);
      continue;
    }

    await FloorLevel.create({ slug, name });
    console.log(`Floor Level created: ${slug} (${name})`);
  }
}

seedFloorLevel()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed floor levels:", error);
    process.exit(1);
  });
