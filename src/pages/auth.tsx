import { useState } from "react";
import { Tabs, Form, Input, Button, Typography, message } from "antd";
import { useRouter } from "next/router";

export default function AuthPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: any, endpoint: "login" | "auth/signup") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed");
      localStorage.setItem("token", data.token);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
      message.success("Welcome!");
      router.replace("/analytics");
    } catch (e: any) {
      message.error(e.message || "Error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* Left Column - Blue Background with Branding */}
      <div
        style={{
          flex: 0.5, // Changed to 0.5 for 50% width
          background:
            "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #1e40af 100%)",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "40px",
          overflow: "hidden",
        }}
      >
        {/* Background Polygon Shapes */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "300px",
            height: "300px",
            background: "rgba(255, 255, 255, 0.1)",
            clipPath: "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)",
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "400px",
            height: "400px",
            background: "rgba(0, 0, 0, 0.1)",
            clipPath:
              "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)",
            transform: "rotate(15deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "10%",
            width: "200px",
            height: "200px",
            background: "rgba(255, 255, 255, 0.05)",
            clipPath:
              "polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)",
            transform: "rotate(-30deg)",
          }}
        />

        {/* Branding Content */}
        <div style={{ textAlign: "center", zIndex: 10, color: "white" }}>
          <Typography.Title
            level={1}
            style={{
              color: "white",
              fontWeight: "800",
              fontSize: "48px",
              marginBottom: "16px",
              textShadow: "0 4px 8px rgba(0,0,0,0.3)",
            }}
          >
            Synchro Hire
          </Typography.Title>
          <Typography.Paragraph
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "20px",
              margin: 0,
              maxWidth: "400px",
              lineHeight: "1.6",
            }}
          >
            Streamline your hiring workflow with our comprehensive HR management
            platform
          </Typography.Paragraph>
        </div>
      </div>

      {/* Right Column - White Form */}
      <div
        style={{
          flex: 0.5, // Changed to 0.5 for 50% width
          background: "white",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start", // Changed from center to flex-start
          padding: "40px",
          maxWidth: "none",
          position: "relative", // Added for fixed positioning
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "500px", // Reduced from 600px for better positioning
            position: "absolute", // Fixed position
            top: "50%", // Center vertically
            left: "50%", // Center horizontally
            transform: "translate(-50%, -50%)", // Perfect centering
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "32px" }}>
            <Typography.Title
              level={2}
              style={{
                color: "#1e3a8a",
                fontWeight: "700",
                marginBottom: "8px",
                fontSize: "28px",
              }}
            >
              Welcome Back
            </Typography.Title>
            <Typography.Paragraph
              style={{
                color: "#64748b",
                fontSize: "16px",
                margin: 0,
              }}
            >
              Sign in to your account or create a new company
            </Typography.Paragraph>
          </div>

          {/* Form Tabs */}
          <Tabs
            items={[
              {
                key: "signin",
                label: (
                  <span
                    style={{
                      color: "#1e3a8a",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    Sign In
                  </span>
                ),
                children: (
                  <Form
                    layout="vertical"
                    onFinish={(v) => onFinish(v, "login")}
                  >
                    <Form.Item
                      name="email"
                      label={
                        <span
                          style={{
                            color: "#374151",
                            fontWeight: "700", // Increased from 500 to 700
                            fontSize: "15px", // Increased from 14px
                          }}
                        >
                          Email
                        </span>
                      }
                      rules={[{ required: true, type: "email" }]}
                    >
                      <Input
                        placeholder="you@example.com"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "12px 16px",
                          fontSize: "15px", // Increased from 14px
                          fontWeight: "600", // Added bold font weight
                          height: "44px",
                        }}
                      />
                    </Form.Item>
                    <Form.Item
                      name="password"
                      label={
                        <span
                          style={{
                            color: "#374151",
                            fontWeight: "700", // Increased from 500 to 700
                            fontSize: "15px", // Increased from 14px
                          }}
                        >
                          Password
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input.Password
                        placeholder="••••••••"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "12px 16px",
                          fontSize: "15px", // Increased from 14px
                          fontWeight: "600", // Added bold font weight
                          height: "44px",
                        }}
                      />
                    </Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{
                        height: "44px",
                        borderRadius: "8px",
                        background:
                          "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: "600",
                        marginTop: "24px",
                      }}
                    >
                      Sign In
                    </Button>
                  </Form>
                ),
              },
              {
                key: "signup",
                label: (
                  <span
                    style={{
                      color: "#1e3a8a",
                      fontWeight: "600",
                      fontSize: "16px",
                    }}
                  >
                    Company Sign Up
                  </span>
                ),
                children: (
                  <Form
                    layout="vertical"
                    onFinish={(v) => onFinish(v, "auth/signup")}
                  >
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <Form.Item
                        name="companyName"
                        label={
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: "700", // Increased from 500 to 700
                              fontSize: "13px", // Increased from 12px
                            }}
                          >
                            Company Name
                          </span>
                        }
                        rules={[{ required: true }]}
                      >
                        <Input
                          placeholder="Company name"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            padding: "10px 12px",
                            fontSize: "14px", // Increased from 13px
                            fontWeight: "600", // Added bold font weight
                            height: "40px",
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        name="companyCountry"
                        label={
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: "700", // Increased from 500 to 700
                              fontSize: "13px", // Increased from 12px
                            }}
                          >
                            Country
                          </span>
                        }
                        rules={[{ required: true }]}
                      >
                        <Input
                          placeholder="Country"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            padding: "10px 12px",
                            fontSize: "14px", // Increased from 13px
                            fontWeight: "600", // Added bold font weight
                            height: "40px",
                          }}
                        />
                      </Form.Item>
                    </div>

                    <Form.Item
                      name="companyAddress"
                      label={
                        <span
                          style={{
                            color: "#374151",
                            fontWeight: "700", // Increased from 500 to 700
                            fontSize: "13px", // Increased from 12px
                          }}
                        >
                          Company Address
                        </span>
                      }
                      rules={[{ required: true }]}
                    >
                      <Input
                        placeholder="Street, City"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "10px 12px",
                          fontSize: "14px", // Increased from 13px
                          fontWeight: "600", // Added bold font weight
                          height: "40px",
                        }}
                      />
                    </Form.Item>

                    <Form.Item
                      name="companyWebsite"
                      label={
                        <span
                          style={{
                            color: "#374151",
                            fontWeight: "700", // Increased from 500 to 700
                            fontSize: "13px", // Increased from 12px
                          }}
                        >
                          Website (Optional)
                        </span>
                      }
                    >
                      <Input
                        placeholder="https://example.com"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "10px 12px",
                          fontSize: "14px", // Increased from 13px
                          fontWeight: "600", // Added bold font weight
                          height: "40px",
                        }}
                      />
                    </Form.Item>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "16px",
                      }}
                    >
                      <Form.Item
                        name="adminName"
                        label={
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: "700", // Increased from 500 to 700
                              fontSize: "13px", // Increased from 12px
                            }}
                          >
                            Admin Name
                          </span>
                        }
                        rules={[{ required: true }]}
                      >
                        <Input
                          placeholder="Full name"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            padding: "10px 12px",
                            fontSize: "14px", // Increased from 13px
                            fontWeight: "600", // Added bold font weight
                            height: "40px",
                          }}
                        />
                      </Form.Item>
                      <Form.Item
                        name="adminEmail"
                        label={
                          <span
                            style={{
                              color: "#374151",
                              fontWeight: "700", // Increased from 500 to 700
                              fontSize: "13px", // Increased from 12px
                            }}
                          >
                            Admin Email
                          </span>
                        }
                        rules={[{ required: true, type: "email" }]}
                      >
                        <Input
                          placeholder="admin@example.com"
                          style={{
                            borderRadius: "8px",
                            border: "1px solid #d1d5db",
                            padding: "10px 12px",
                            fontSize: "14px", // Increased from 13px
                            fontWeight: "600", // Added bold font weight
                            height: "40px",
                          }}
                        />
                      </Form.Item>
                    </div>

                    <Form.Item
                      name="adminPassword"
                      label={
                        <span
                          style={{
                            color: "#374151",
                            fontWeight: "700", // Increased from 500 to 700
                            fontSize: "13px", // Increased from 12px
                          }}
                        >
                          Admin Password
                        </span>
                      }
                      rules={[{ required: true, min: 6 }]}
                    >
                      <Input.Password
                        placeholder="At least 6 characters"
                        style={{
                          borderRadius: "8px",
                          border: "1px solid #d1d5db",
                          padding: "10px 12px",
                          fontSize: "14px", // Increased from 13px
                          fontWeight: "600", // Added bold font weight
                          height: "40px",
                        }}
                      />
                    </Form.Item>

                    <Button
                      type="primary"
                      htmlType="submit"
                      block
                      loading={loading}
                      style={{
                        height: "44px",
                        borderRadius: "8px",
                        background:
                          "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)",
                        border: "none",
                        fontSize: "16px",
                        fontWeight: "600",
                        marginTop: "24px",
                      }}
                    >
                      Create Company
                    </Button>
                  </Form>
                ),
              },
            ]}
            tabBarStyle={{
              marginBottom: "24px",
            }}
          />
        </div>
      </div>
    </div>
  );
}
