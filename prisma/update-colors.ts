import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
p.company.updateMany({
  where: {},
  data: { primaryColor: "#6633cc", secondaryColor: "#0d0d0d" },
}).then((r) => {
  console.log("Updated", r.count, "company record(s)");
  return p.$disconnect();
});
