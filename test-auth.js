/**
 * Test script to debug authentication issues
 */

const { PrismaClient } = require("@prisma/client");
const jwt = require("jsonwebtoken");

const prisma = new PrismaClient();

async function testAuth() {
  console.log("🔍 Testing Authentication...");

  try {
    // Get a user from the database
    const user = await prisma.user.findFirst({
      select: { id: true, email: true, type: true },
    });

    if (!user) {
      console.log("❌ No users found in database");
      return;
    }

    console.log(`📄 Testing with user: ${user.email} (ID: ${user.id})`);

    // Create a test JWT token
    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change";
    const payload = {
      userId: user.id,
      email: user.email,
      type: user.type,
      companyId: null,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
    console.log(`🔑 Generated test token: ${token.substring(0, 50)}...`);

    // Test the API with the token
    console.log("\n🌐 Testing API with token...");
    const response = await fetch(
      "http://localhost:3001/api/resumes/1c1e4b37-6e6b-43c0-8f1d-c61e36e0d1a3/presigned-url",
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`📊 Response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ API call successful!");
      console.log(
        `🔗 Presigned URL: ${
          data.presignedUrl
            ? data.presignedUrl.substring(0, 80) + "..."
            : "No URL"
        }`
      );
    } else {
      const error = await response.text();
      console.log("❌ API call failed:");
      console.log(`   Status: ${response.status}`);
      console.log(`   Error: ${error}`);
    }
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuth();
