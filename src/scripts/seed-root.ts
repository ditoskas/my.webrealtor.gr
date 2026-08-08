import "./env";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/User";

// Root has no firstName/lastName/realtorId in this project's User model (see CLAUDE.md → Data
// layer) — a Root user is just an email/password/role, and its realtorId is always null
// (enforced by the schema's pre("validate") hook regardless of what's passed here).
const ROOT_USER = {
  email: "dimitris@thinkpozitive.net",
  password: "2521020995",
  role: "Root" as const,
};

async function seedRootUser() {
  await connectDB();

  const existingUser = await User.findOne({ email: ROOT_USER.email });
  if (existingUser) {
    console.log(`Root user already exists: ${ROOT_USER.email}`);
    return;
  }

  const user = new User({
    ...ROOT_USER,
    tokenVersion: 0,
  });

  await user.save();
  console.log(`Root user created: ${ROOT_USER.email}`);
}

seedRootUser()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to seed root user:", error);
    process.exit(1);
  });
