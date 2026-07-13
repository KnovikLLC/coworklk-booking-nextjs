# Cowork.lk Booking Engine

A real-time coworking space booking platform built for **Cowork Lanka (Pvt) Ltd** (Pannipitiya, Sri Lanka). This web application provides a seamless booking experience for hot desks, dedicated desks, meeting rooms, and event spaces.

---

## What It Does

The platform acts as a unified hub for space management, invoicing, and user authentication, handling both public bookings and admin-focused operations.

### Key Features

*   **Space Catalog & Booking Engine**: An interactive, responsive interface enabling users to browse different workspace categories, view details, and book spaces.
*   **Real-time Availability Grid**: A slot-selection calendar powered by a robust Supabase database check engine that ensures zero double-bookings.
*   **Flexible Checkout Flow**: Supports guest bookings with automatic prompt/flow to convert guests into registered members immediately after a successful checkout.
*   **Integrated Payments**:
    *   **Online Payments**: Powered by the **PayHere** gateway (LKR payments) with automated webhook signature verification.
    *   **Manual Payments**: Supports bank transfers and QR code payments with an admin dashboard verification and approval workflow.
*   **Member Loyalty Engine**: Automatically identifies returning members and applies a **10% discount** on base prices if they had a completed booking within the prior 30 days.
*   **Automated Accounting (Zoho Books)**: Automatically synchronizes booking invoices, payments, and customer accounts to Zoho Books. Integrations degrade gracefully without disrupting the user flow if credentials are not configured.
*   **Admin Command Center**:
    *   Walk-in booking creation (handles cash/card/QR payments).
    *   Interactive scheduling grid and booking calendar view.
    *   Check-in management and customer logs.
*   **Tiered Refund Policy**: Automated cancellation processing with graduated refunds (80% if >24 hours, 50% if 4–24 hours, 0% if <4 hours prior).
*   **Automated Background Crons**: Automatically expires unpaid bookings after 30 minutes to free up locked inventory, and manages queued invoice syncs.

### Technology Stack

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router, Server Components)
*   **Language**: [TypeScript](https://www.typescriptlang.org/)
*   **Database & Authentication**: [Supabase](https://supabase.com/) (Postgres, Row-Level Security, Database Triggers, SSR Cookie Auth)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
*   **Email Notifications**: [Resend](https://resend.com/)

---

## Contributors

*   **Madusanka Premaratne** — [rmmpremaratne@gmail.com](mailto:rmmpremaratne@gmail.com)
