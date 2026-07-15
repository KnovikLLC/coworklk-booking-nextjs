# Cowork.lk Booking Engine

A real-time coworking space booking platform built for **Cowork Lanka (Pvt) Ltd** (Pannipitiya, Sri Lanka). This web application provides a premium, responsive, and seamless booking experience for hot desks, dedicated desks, meeting rooms, and creative studio spaces.


## What It Does

The platform acts as a unified hub for space management, invoicing, community engagement, and user authentication, handling both public bookings and admin-focused operations.

### Key Features

*   **Premium Figma-Aligned UI/UX**: A polished web interface featuring a modern typography system, smooth micro-animations, curved visual accents, and customized responsive page layouts matching the Cowork.lk Figma brand guidelines.
*   **Space Catalog & Booking Engine**: An interactive interface enabling users to browse different workspace categories (hot desks, workspace seats, 4-seater and 5-seater meeting rooms, lobby lounge, and creative studios).
*   **Real-time Availability Grid**: A slot-selection calendar powered by a robust Supabase database check engine that ensures zero double-bookings.
*   **Interactive Events Hub**: A dedicated events page showcasing past community events (celebrations, creative recording sessions, foosball tournaments, training workshops) with full-featured photo galleries.
*   **Active WhatsApp Community Portal**: A community landing page detailing member perks (member discounts, hiring opportunities, partner perks) with direct integrations to join the Cowork Sri Lanka WhatsApp community.
*   **Flexible Checkout Flow**: Supports guest bookings with an automatic redirection flow to convert guests into registered members immediately after a successful checkout.
*   **Integrated Payments**:
    *   **Online Payments**: Powered by the **PayHere** gateway (LKR payments) with automated webhook signature verification.
    *   **Manual Payments**: Supports bank transfers and QR code payments with an admin verification and approval workflow.
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


## Contributors

*   **Madusanka Premaratne** — [madusankapremaratne.com](https://madusankapremaratne.com)
*   **Iroshana Wickremasingha** — [iroshana.com](https://iroshana.com)
*   **Dinithi Viranga De Silva** — [dinithi.com](https://dinithi.com)
