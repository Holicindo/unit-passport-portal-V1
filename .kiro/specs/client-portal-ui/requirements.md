# Requirements Document

## Introduction

The Client Portal UI is a dedicated, client-facing section of the Unit Passport Portal. It allows authenticated clients (companies that own Holicindo units) to log in and access a self-service dashboard where they can view their registered fleet, inspect individual unit details, review service history, read service reports, monitor warranty status, and communicate with the Holicindo team via live chat. The portal is built on the existing Next.js (TypeScript) frontend and NestJS backend, reusing the current JWT-based authentication system and the `CLIENT` user role.

---

## Glossary

- **Client_Portal**: The client-facing section of the Unit Passport Portal, accessible only to users with the `CLIENT` role.
- **Client**: A company registered in the system that owns one or more Holicindo units.
- **Client_User**: A user account with `role = CLIENT` that is linked to a `client_id`.
- **Unit**: A piece of equipment manufactured by Holicindo, identified by a serial number and QR token.
- **Fleet**: The collection of all Units currently assigned to a Client.
- **Service_Log**: A record of a service event performed on a Unit, including issue description, action taken, service date, and attachments.
- **Service_Report**: A structured digital form (e.g., Inspection, Cooling, Rework) submitted by a Partner or Admin for a Unit.
- **Warranty**: A warranty record associated with a Unit, including type, start date, end date, and status.
- **Notification**: An in-app alert or message delivered to a user about relevant system events.
- **Conversation**: A live chat thread between a Client_User and the Holicindo team.
- **Dashboard**: The main landing page of the Client_Portal showing a summary of the Client's fleet and recent activity.
- **Auth_Service**: The backend authentication service responsible for validating credentials and issuing JWT tokens.
- **Portal_Router**: The Next.js routing layer responsible for directing Client_Users to the correct portal pages.
- **Access_Guard**: The frontend route protection mechanism that verifies the user's role before rendering a page.

---

## Requirements

### Requirement 1: Client Authentication and Access Control

**User Story:** As a client user, I want to log in with my credentials and be directed to the client portal, so that I can access my company's unit information securely.

#### Acceptance Criteria

1. WHEN a Client_User submits valid credentials on the login page, THE Auth_Service SHALL return a JWT token containing the user's `role`, `client_id`, and `id`.
2. WHEN a Client_User successfully authenticates, THE Portal_Router SHALL redirect the user to `/client-portal/dashboard`.
3. WHEN an unauthenticated user attempts to access any `/client-portal/*` route, THE Access_Guard SHALL redirect the user to `/login?redirect=/client-portal/dashboard`.
4. WHEN a user with a role other than `CLIENT` attempts to access any `/client-portal/*` route, THE Access_Guard SHALL redirect the user to their role-appropriate home page.
5. WHEN a Client_User's session token expires, THE Client_Portal SHALL redirect the user to the login page and clear the stored token from local storage.
6. THE Client_Portal SHALL display the authenticated Client_User's name and company name in the navigation header on all portal pages.

---

### Requirement 2: Client Dashboard

**User Story:** As a client user, I want to see a summary dashboard when I log in, so that I can quickly understand the status of my fleet at a glance.

#### Acceptance Criteria

1. WHEN a Client_User navigates to `/client-portal/dashboard`, THE Dashboard SHALL display the total number of Units in the Client's fleet.
2. WHEN a Client_User navigates to `/client-portal/dashboard`, THE Dashboard SHALL display the count of Units grouped by status (e.g., `ACTIVE`, `IN_SERVICE`, `INACTIVE`).
3. WHEN a Client_User navigates to `/client-portal/dashboard`, THE Dashboard SHALL display the count of Units with an `ACTIVE` warranty.
4. WHEN a Client_User navigates to `/client-portal/dashboard`, THE Dashboard SHALL display the count of Units with an expired or expiring warranty (within 30 days).
5. WHEN a Client_User navigates to `/client-portal/dashboard`, THE Dashboard SHALL display the 5 most recent Service_Logs across all Units in the Client's fleet, ordered by `service_date` descending.
6. WHEN the Client's fleet contains zero Units, THE Dashboard SHALL display an empty-state message indicating no units are registered.

---

### Requirement 3: Fleet Overview

**User Story:** As a client user, I want to see a list of all units registered under my company, so that I can find and navigate to any specific unit.

#### Acceptance Criteria

1. WHEN a Client_User navigates to `/client-portal/fleet`, THE Client_Portal SHALL fetch and display all Units associated with the Client_User's `client_id` using the `GET /units/my-fleet` endpoint.
2. THE Client_Portal SHALL display each Unit in the fleet list with its model name, serial number, production date, warranty expiry date, and current status.
3. WHEN the fleet list contains more than 10 Units, THE Client_Portal SHALL paginate the results, displaying 10 Units per page.
4. WHEN a Client_User enters text in the fleet search field, THE Client_Portal SHALL filter the displayed Units to those whose model name or serial number contains the entered text, within 300ms of the last keystroke.
5. WHEN a Client_User selects a Unit from the fleet list, THE Portal_Router SHALL navigate to `/client-portal/units/[id]`.
6. IF the `GET /units/my-fleet` request fails, THEN THE Client_Portal SHALL display an error message and provide a retry button.

---

### Requirement 4: Unit Detail View

**User Story:** As a client user, I want to view the full details of a specific unit, so that I can understand its specifications, warranty, and service history.

#### Acceptance Criteria

1. WHEN a Client_User navigates to `/client-portal/units/[id]`, THE Client_Portal SHALL fetch and display the Unit's model name, serial number, production date, warranty expiry date, status, and specifications (`specs` JSONB field).
2. WHEN a Client_User navigates to `/client-portal/units/[id]`, THE Client_Portal SHALL display all Warranty records associated with the Unit, including warranty type, duration label, start date, end date, and status.
3. WHEN a Warranty record has a status of `ACTIVE` and its `end_date` is within 30 days of the current date, THE Client_Portal SHALL display a visual warning indicator on that Warranty record.
4. WHEN a Client_User navigates to `/client-portal/units/[id]`, THE Client_Portal SHALL display the complete Service_Log history for the Unit, ordered by `service_date` descending, including issue description, action taken, service date, and partner name.
5. WHEN a Service_Log has one or more attachments, THE Client_Portal SHALL display a link for each attachment that opens the file in a new browser tab.
6. WHEN a Client_User navigates to `/client-portal/units/[id]`, THE Client_Portal SHALL display all Service_Reports associated with the Unit, showing the form type, creation date, and the name of the user who created the report.
7. IF the `GET /units/:id` request returns a 404 status, THEN THE Client_Portal SHALL display a "Unit not found" message and a link to return to the fleet overview.

---

### Requirement 5: Service Report Viewing

**User Story:** As a client user, I want to view the details of a service report for my unit, so that I can understand what work was performed.

#### Acceptance Criteria

1. WHEN a Client_User selects a Service_Report from the Unit Detail View, THE Client_Portal SHALL navigate to `/client-portal/reports/[id]`.
2. WHEN a Client_User navigates to `/client-portal/reports/[id]`, THE Client_Portal SHALL fetch and display the report's form type, creation date, creator name, and all structured data fields from the report's `data` JSONB field.
3. WHEN a Service_Report contains one or more photo URLs in `photo_urls`, THE Client_Portal SHALL display each photo as a thumbnail that can be expanded to full size on click.
4. WHEN a Service_Report has a `revision_note`, THE Client_Portal SHALL display the revision note in a clearly labeled section.
5. IF the `GET /reports/:id` request returns a 403 status (report belongs to a different client's unit), THEN THE Client_Portal SHALL display an "Access Denied" message and redirect the user to the fleet overview after 3 seconds.

---

### Requirement 6: Warranty Status Monitoring

**User Story:** As a client user, I want to see the warranty status of all my units in one place, so that I can proactively manage warranty renewals.

#### Acceptance Criteria

1. WHEN a Client_User navigates to `/client-portal/warranty`, THE Client_Portal SHALL display a list of all Units in the fleet alongside their associated Warranty records.
2. THE Client_Portal SHALL visually distinguish Warranty records by status using color coding: `ACTIVE` in green, expiring within 30 days in amber, and `EXPIRED` or `VOIDED` in red.
3. WHEN a Client_User selects a Unit from the warranty overview, THE Portal_Router SHALL navigate to `/client-portal/units/[id]`.
4. WHEN the warranty overview list contains more than 10 items, THE Client_Portal SHALL paginate the results, displaying 10 items per page.

---

### Requirement 7: In-App Messaging (Live Chat)

**User Story:** As a client user, I want to send and receive messages with the Holicindo team directly in the portal, so that I can get support without leaving the application.

#### Acceptance Criteria

1. WHEN a Client_User navigates to `/client-portal/messages`, THE Client_Portal SHALL fetch and display all Conversations associated with the Client_User using the `GET /messages/conversations` endpoint.
2. WHEN a Client_User selects a Conversation, THE Client_Portal SHALL fetch and display the full chat history for that Conversation using the `GET /messages/conversations/:id` endpoint.
3. WHEN a Client_User submits a message in the chat input field, THE Client_Portal SHALL send the message using the `POST /messages/conversations/:id/send` endpoint and display the sent message in the conversation view without requiring a page reload.
4. WHEN a new message is received in an active Conversation, THE Client_Portal SHALL display the new message in the conversation view within 5 seconds without requiring a manual page refresh.
5. WHEN a Client_User has one or more unread messages, THE Client_Portal SHALL display an unread message count badge on the messages navigation item.
6. IF the `POST /messages/conversations/:id/send` request fails, THEN THE Client_Portal SHALL display an inline error message and retain the unsent message text in the input field.

---

### Requirement 8: In-App Notifications

**User Story:** As a client user, I want to receive in-app notifications about my units, so that I am informed of important events like completed service or expiring warranties.

#### Acceptance Criteria

1. WHEN a Client_User is logged in, THE Client_Portal SHALL poll the `GET /notifications/alerts` endpoint every 60 seconds to check for new notifications.
2. WHEN the Client_Portal receives one or more unread notifications, THE Client_Portal SHALL display an unread count badge on the notifications icon in the navigation header.
3. WHEN a Client_User opens the notifications panel, THE Client_Portal SHALL display all notifications ordered by creation date descending, showing the notification message and timestamp.
4. WHEN a Client_User clicks a notification, THE Client_Portal SHALL call the `PATCH /notifications/:id/read` endpoint to mark it as read and update the unread count badge.
5. WHEN all notifications have been read, THE Client_Portal SHALL remove the unread count badge from the notifications icon.

---

### Requirement 9: Service Request Submission

**User Story:** As a client user, I want to request service for one of my units directly from the portal, so that I can initiate a support ticket without contacting Holicindo separately.

#### Acceptance Criteria

1. WHEN a Client_User is viewing a Unit Detail page, THE Client_Portal SHALL display a "Request Service" button.
2. WHEN a Client_User clicks the "Request Service" button, THE Client_Portal SHALL display a form with fields for city, notes, contact name, and contact phone number.
3. WHEN a Client_User submits the service request form with all required fields populated, THE Client_Portal SHALL call the `POST /units/:id/request-service` endpoint and display a success confirmation message.
4. IF the `POST /units/:id/request-service` request fails, THEN THE Client_Portal SHALL display an error message describing the failure and allow the user to resubmit.
5. WHEN the service request is submitted successfully, THE Client_Portal SHALL disable the "Request Service" button for that unit for the duration of the current session to prevent duplicate submissions.

---

### Requirement 10: Client Portal Navigation

**User Story:** As a client user, I want a clear and consistent navigation structure within the portal, so that I can move between sections efficiently.

#### Acceptance Criteria

1. THE Client_Portal SHALL provide a persistent navigation sidebar or bottom navigation bar (on mobile) containing links to: Dashboard, Fleet, Warranty, Messages, and Notifications.
2. WHEN a Client_User is on a specific portal page, THE Client_Portal SHALL visually highlight the corresponding navigation item as active.
3. THE Client_Portal SHALL display a logout button that, when clicked, clears the JWT token from local storage and redirects the user to `/login`.
4. WHEN the viewport width is less than 768px, THE Client_Portal SHALL render a mobile-optimized layout with a bottom navigation bar instead of a sidebar.
5. THE Client_Portal SHALL display the Holicindo brand logo and the Client's company name in the portal header on all pages.
