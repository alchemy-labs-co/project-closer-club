# Product Requirements Document (PRD)

## Closer Club - Insurance Agent Training Platform

**Version:** 1.1 (Revised)  
**Date:** December 2024  
**Status:** In Review  
**Authors:** Based on call transcript between Jimmy Youssef, Manny Coleman, and development team. Revised by AI analysis.

---

### Change Log

- **v1.1:** Added specificity from call transcript, introduced formal User Stories, clarified user roles, added "Out of Scope" and "Risks & Dependencies" sections for improved clarity and project management. Re-structured for better developer readability.

---

## 1. Executive Summary

Closer Club requires a comprehensive online training platform to overcome the physical limitations of its office and scale agent recruitment nationwide. The platform will provide virtual onboarding, standardized training, and continuous education through a sequential, trackable learning path. Initially serving internal agents, the system will be architected for future expansion into a public, subscription-based service. This project is time-sensitive to capitalize on current business momentum.

---

## 2. Project Overview

- **Product Name:** Closer Club Training Platform
- **Primary Stakeholders:** Jimmy Youssef, Manny Coleman
- **Development Team:** Mani and team
- **Target Launch:** July 1st (Flexible to August 1st)
- **Total Budget:** $9,000
- **Payment Terms:** 50% upfront ($4,500), 50% on completion.

---

## 3. Business Objectives

- **Enable Scalable Growth:** Facilitate nationwide agent recruitment by removing the dependency on the physical San Diego office.
- **Standardize Agent Onboarding:** Ensure every agent receives consistent, high-quality training, regardless of location.
- **Improve Compliance & Performance:** Actively track agent progress, module completion, and assessment scores to ensure comprehension and identify coaching opportunities.
- **Create a Future Revenue Stream:** Build a robust platform with the long-term goal of offering it as a subscription service ($50–$100/month) to external agents.
- **Accelerate Time-to-Productivity:** Streamline the onboarding process so agents can become productive ("game time") faster.

---

## 4. User Personas & Stories

### 4.1. Insurance Agent (Primary User)

**Description:** New or existing life insurance agents at Closer Club.

**User Stories:**

- As an Agent, I want to access all training materials from any location so that I can learn from home.
- As an Agent, I want to follow a sequential learning path where I must complete one module to unlock the next, so I learn concepts in the correct order.
- As an Agent, I want to see my progress visually (e.g., progress bars) so I know how far I've come and what's left.
- As an Agent, I want to download attached resources (PDFs, documents) for specific lessons so I can reference them offline. (imagekit)
- As an Agent, I want to receive a branded certificate upon completion so I have a tangible record of my achievement.

### 4.2. Administrator (Jimmy & Manny)

**Description:** Closer Club leadership with full platform control.

**User Stories:**

- As an Administrator, I want a simple interface to upload, modify, and organize course content (videos, audio, documents) at any time, so the platform stays current.
- As an Administrator, I want to view a central dashboard showing the progress of all agents, including completion status, quiz scores, and time spent, so I can monitor compliance and performance. ✅
- As an Administrator, I want to manage user roles, granting or revoking access for Agents and Team Leaders, so I can control who uses the platform. ✅
- As an Administrator, I want to receive email notifications for new agent sign-up form submissions so I can follow up with leads promptly. 

### 4.3. Team Leader

**Description:** Senior agents with supervisory responsibilities.

**User Stories:**

- As a Team Leader, I want to access a dashboard view to track the progress and quiz results of the agents on my specific team, so I can provide targeted support.
- As a Team Leader, I want the same content access as a standard agent but with additional, limited administrative oversight for my team.

---

## 5. Core Features & Requirements 

### 5.1. Authentication & Role-Based Access Control

- **Secure Login:** A standard, secure email and password login system.
- **Domain-Based Access:** The system must restrict registration and login to users with specific company email domains: `@universecoverage` and `@spectra`.
- **Role Tiers:** The platform must support three distinct user roles:
  - **Agent:** Base-level access to view and complete assigned courses.
  - **Team Leader:** Agent access + a dashboard to view the progress of their assigned team members.
  - **Administrator:** Full control over content management, user management, and platform analytics.

### 5.2. Course Structure & Content Management

- **Sequential Progression:** Users must complete videos and modules in a predefined order. The ability to skip ahead in a course or within a video must be disabled.
- **Admin Content Portal:** A user-friendly backend interface for Administrators to:
  - Upload and manage video (2-5 min length) and audio files.
  - Attach downloadable resources (PDF, DOCX, etc.) to specific lessons.
  - Create and order courses, modules, and lessons.
  - Create and manage quizzes associated with lessons.
- **Video Hosting:** All video and audio content must be hosted directly on the platform's servers, not embedded from external services like YouTube or Vimeo.

### 5.3. Progress Tracking & Analytics

- **Agent-Facing Progress:**
  - Visual progress bars for both individual modules and overall course completion.
  - Clear indicators for completed lessons (e.g., a checkmark).
- **Admin/Leader Dashboard:**
  - A high-level overview of all users' progress.
  - Ability to drill down into an individual agent's record to see module completion, quiz scores (pass/fail), and time spent.

### 5.4. Assessment & Certification

- **Mini-Quizzes:** Ability for Admins to create short, multiple-choice quizzes within modules to verify comprehension.
- **Passing Requirement:** Agents must achieve a passing score on a quiz to unlock the next lesson or module.
- **Certificate Generation:** Upon 100% course completion, the system must automatically generate a downloadable, professional-looking certificate.
- **Branding:** The certificate must be branded with the "Closer Club" logo and name.

### 5.5. Landing Page & Lead Capture

- **Public Landing Page:** A professional, modern landing page that explains the platform's benefits and includes a login portal.
- **Lead Capture Form:**
  - The landing page must feature a prominent "Join the Team" call-to-action that leads to a lead capture form.
  - This form will replace the current Google Form and must match the platform's custom branding.
  - **Data Fields:** Collect prospective agent information (Name, Contact Details, Background Info).
  - **Email Notification:** Upon submission, the form data must be sent via email to a designated administrator address.

---

## 6. Design & UX Requirements

- **Overall Aesthetic:** Professional, modern, and engaging. The design should feel custom and high-quality.
- **Key Differentiator:** The user experience must not look or feel like a generic, template-based course platform. It should be uniquely branded to Closer Club.
- **Inspiration:** The flow and functionality of Andy Elliott's training platform can be used as a reference, but the visual design must be original.
- **Branding:** The platform will use the "Closer Club" name. The logo is a dependency and will be provided by the client or created by the development team.
- **User Experience:** Navigation must be intuitive and streamlined, with a clear, linear progression through the training material.
- **Responsiveness:** While primarily desktop-focused, the platform should be mobile-responsive for access on tablets and phones.

---

## 7. Technical Requirements

- **Platform:** Custom-built platform.
- **Hosting:** Capable of securely hosting and streaming video/audio files efficiently to concurrent users.
- **Scalability:** The architecture must support future growth in users and content, including the eventual integration of a payment/subscription system.
- **Browser Support:** Full compatibility with modern versions of Chrome, Firefox, Safari, and Edge.

---

## 8. Out of Scope for V1.0

To meet the aggressive timeline and budget, the following features will be considered for future releases but are not part of the initial launch:

- Public Subscription & Payment Gateway Integration.
- Advanced Gamification (Leaderboards, badges beyond the certificate).
- Native Mobile App (iOS/Android).
- CRM Integration.
- Advanced AI-driven analytics.

---

## 9. Risks, Constraints & Dependencies

- **Risk: Aggressive Timeline:** The 2-4 week development schedule is highly ambitious and requires focused effort and clear communication to mitigate risks of delay or reduced quality.
  - **Mitigation:** A visual prototype will be delivered within 3 days to ensure alignment and build confidence, addressing the pain point from the previous developer.
- **Dependency: Client Content:** The platform's launch is dependent on the client providing all necessary video, audio, and document content for the courses.
- **Dependency: Branding Assets:** The final design is dependent on the client providing a logo and brand guidelines, or approving a design created by the development team.
- **Constraint: Fixed Budget:** The project is fixed at $9,000. Any requests for features outside the defined scope will require a separate discussion and contract.

---

## 10. Success Metrics

- **On-Time Delivery:** Platform launched and fully functional by the target date.
- **User Adoption:** 100% of new agents are onboarded using the platform within the first month of launch.
- **Course Completion Rate:** Achieve an 85%+ course completion rate among agents who start the training.
- **Stakeholder Satisfaction:** The platform meets or exceeds the expectations of Jimmy and Manny, resulting in a "wow" factor.
- **Positive User Feedback:** Agents report that the platform is easy to use and valuable to their training.

---

## 11. Approval & Next Steps

- **Approval:** This document requires sign-off from Jimmy Youssef and Manny Coleman.

**Next Steps:**

1. Development team to provide a technical specification document.
2. Client to provide/approve branding assets (logo, colors).
3. Client to begin compiling all course content for upload.
4. Development to begin, with the 3-day visual prototype as the first milestone.
