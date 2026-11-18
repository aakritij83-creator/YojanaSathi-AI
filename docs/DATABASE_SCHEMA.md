# Database Schema

Live persistence uses the typed schema defined in `backend/db/store.ts` (`backend/data/yojanasathi-db.json` with atomic temp-file writes), aligned 1:1 with the Firestore collections defined in `firebase/firestore.rules`.

## Collections

1. **`users`**: `id`, `email`, `passwordHash`, `passwordSalt`, `role` (`'citizen' | 'admin'`), `consentAccepted`, `consentTimestamp`, `preferredLanguage`, `themePreference`, `profile` (14 citizen fields), `notificationPreferences`, `recentlyViewedSchemeIds`, `createdAt`, `updatedAt`.
2. **`schemes`**: `id`, `name`, `shortCode`, `officialDescription`, `department`, `classification` (`Central | State`), `applicableState`, `categories`, `targetBeneficiaries`, `eligibilityRequirementsSummary`, `benefits`, `requiredDocuments`, `applicationProcedure`, `preparationTasks`, `applicationDatesText`, `applicationDeadlineIso`, `applicationAvailability`, `officialApplicationUrl`, `officialSourceUrl`, `lastVerifiedDate`, `verificationStatus`, `criteria`, `faqs`, `grievanceResource`.
3. **`savedSchemes`**: `id`, `userId`, `schemeId`, `savedAt`.
4. **`applications`**: `id`, `userId`, `schemeId`, `schemeName`, `applicationReference`, `applicationDate`, `currentStatus` (9 lifecycle statuses), `statusSource` (`'Self-Reported'`), `collectedDocuments`, `completedTasks`, `notes`, `statusHistory`, `createdAt`, `updatedAt`.
5. **`notifications`**: `id`, `userId`, `type`, `title`, `message`, `relatedSchemeId`, `isRead`, `createdAt`.
6. **`reminders`**: `id`, `userId`, `title`, `dueDate`, `notes`, `completed`, `createdAt`.
7. **`conversations`**: `id`, `userId`, `title`, `language`, `createdAt`, `updatedAt`.
8. **`messages`**: `id`, `conversationId`, `userId`, `role` (`'user' | 'assistant'`), `content`, `citations`, `createdAt`.
9. **`rejectionAnalyses`**: `id`, `userId`, `fileName`, `inputType` (`pdf | image | text`), `schemeNameHint`, `result` (`confirmedReasons`, `possibleContributingReasons`, `clarificationQuestions`, `missingOrMismatchedDocuments`, `actionChecklist`, `grievanceChannels`, `disclaimer`), `createdAt`.
10. **`feedback`**: `id`, `userId`, `userEmail`, `category`, `schemeId`, `message`, `status`, `adminNote`, `createdAt`.
11. **`adminAuditLogs`**: `id`, `adminUserId`, `adminEmail`, `action`, `targetType`, `targetId`, `details`, `createdAt`.
12. **`passwordResetTokens`**: Server-only short-lived reset token store.
