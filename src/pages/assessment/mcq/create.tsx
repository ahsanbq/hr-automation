/**
 * MCQ Creation Page
 */

import React from "react";
import { useRouter } from "next/router";
import AppLayout from "@/components/layout/AppLayout";
import MCQCreator from "@/components/assessment/MCQCreator";
import { MCQQuestion } from "@/lib/mcq-service";

export default function MCQCreatePage() {
  const router = useRouter();

  const handleSave = async (questions: MCQQuestion[]) => {
    try {
      // TODO: Implement save to database
      console.log("Saving questions:", questions);

      // For now, just show success message
      // In the future, this will save to the database via API
    } catch (error) {
      console.error("Failed to save questions:", error);
    }
  };

  const handleSend = async (questions: MCQQuestion[]) => {
    try {
      // TODO: Implement send to candidates
      console.log("Sending questions:", questions);

      // For now, just show success message
      // In the future, this will integrate with external sending module
    } catch (error) {
      console.error("Failed to send questions:", error);
    }
  };

  return (
    <AppLayout
      title="Create MCQ Test"
      subtitle="Generate and manage multiple choice questions for candidates"
    >
      <MCQCreator onSave={handleSave} onSend={handleSend} />
    </AppLayout>
  );
}
