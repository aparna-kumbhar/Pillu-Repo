# Exam Marks System - Implementation Guide

## Overview
Complete exam marks management system with backend models, routes, and frontend UI for entering, saving, viewing, and publishing exam marks for students in batches.

## Backend Implementation

### 1. Model: ExamMarks.js
**Location**: `Backend/Models/ExamMarks.js`

**Schema Fields**:
- `instituteId` (required, indexed): Filter marks by institute
- `batchId` (required, indexed): Group marks by batch
- `examName` (required, indexed): Exam identifier
- `subject` (required): Subject name
- `subjectCode` (optional): Subject code
- `studentId` (required, indexed): Student identifier
- `studentName` (required): Student's full name
- `studentRoll` (optional): Student's roll number
- `marks` (required): Marks obtained (0 to totalMarks)
- `totalMarks` (required, default 100): Total marks for the exam
- `percentage` (auto-calculated): Percentage score
- `grade` (auto-calculated): Letter grade (A-F)
- `remarks` (optional): Additional remarks
- `published` (default false): Publication status
- `createdBy`: Admin/Assistant who created the record
- `updatedBy`: User who last updated the record
- `timestamps`: Created and updated timestamps

**Indexes**:
- Compound unique index on (instituteId, batchId, examName, studentId)
- Auto-calculation: Grade and percentage are calculated on save

### 2. Routes: marksRoutes.js
**Location**: `Backend/Routes/marksRoutes.js`

**Endpoints**:

#### GET /api/marks
Fetch all marks for an institute with optional filters
- Query params: `instituteId`, `batchId`, `examName`, `published`
- Returns: Array of exam marks records

#### GET /api/marks/student/:studentId
Fetch marks for a specific student
- Query params: `instituteId`
- Returns: Array of marks for the student

#### GET /api/marks/batches/list
Fetch unique batches with marks summary
- Query params: `instituteId`
- Returns: Array of batches with marksCount, examsCount, published status

#### GET /api/marks/batch/:batchId
Fetch marks for a specific batch
- Query params: `instituteId`, `examName` (optional)
- Returns: Array of student marks for the batch

#### GET /api/marks/exam/:examName
Fetch marks for a specific exam
- Query params: `instituteId`
- Returns: Array of marks across all students in the exam

#### POST /api/marks/save
Save exam marks (single or bulk)
- Request body:
  ```json
  {
    "instituteId": "string",
    "batchId": "string",
    "instituteName": "string",
    "batchName": "string",
    "marksArray": [
      {
        "examName": "string",
        "subject": "string",
        "subjectCode": "string (optional)",
        "studentId": "string",
        "studentName": "string",
        "studentRoll": "string (optional)",
        "marks": number,
        "totalMarks": number,
        "remarks": "string (optional)"
      }
    ],
    "createdBy": {
      "adminName": "string",
      "email": "string"
    }
  }
  ```
- Returns: Saved marks with count and any errors

#### PUT /api/marks/:id
Update a specific mark record
- Query params: `instituteId`
- Request body: `marks`, `totalMarks`, `remarks`, `grade`
- Returns: Updated mark record

#### DELETE /api/marks/:id
Delete a mark record
- Query params: `instituteId`
- Returns: Success message

#### POST /api/marks/publish/batch
Publish/unpublish marks for a batch
- Request body:
  ```json
  {
    "instituteId": "string",
    "batchId": "string",
    "examName": "string (optional)",
    "published": boolean
  }
  ```
- Returns: Number of modified records

### 3. Server Configuration
Updated `Backend/Server.js`:
- Added ExamMarks model import
- Added marksRoutes registration at `/api/marks`
- Added ExamMarks to ensureCollections() for collection creation

## Frontend Implementation

### 1. Marks Entry Page: Marksinput.js
**Location**: `Frontend/Screens/Assistant/Marksentry/Marksinput.js`

**Features**:
- Form to enter exam details (name, subject, total marks)
- Table for entering marks for all students in batch
- Subject dropdown selector
- Marks validation (0 to totalMarks)
- Save Marks button → POST to `/api/marks/save`
- Publish Marks button → POST to `/api/marks/publish/batch`
- Real-time counter showing filled marks
- Form validation and error handling

**Props from Route**:
- `instituteId`: Institute identifier
- `batchId`: Batch identifier
- `batchName`: Display name of batch
- `batchStudents`: Array of student objects

**API Calls**:
1. POST `/api/marks/save` - Save marks with exam details
2. POST `/api/marks/publish/batch` - Publish saved marks

### 2. Marks View Page: MarksView.js
**Location**: `Frontend/Screens/Assistant/MarksView/MarksView.js`

**Features**:
- Two-screen stack navigation
- **Screen 1 (BatchList)**:
  - Display list of batches with marks
  - Search functionality for batch names
  - Show marksCount, examsCount, published status for each batch
  - Navigate to batch details on tap
  
- **Screen 2 (MarksDetail)**:
  - Show all marks for selected batch
  - Filter by exam (dropdown/chips)
  - Display for each mark:
    - Student name and roll number
    - Exam name and subject
    - Marks and total marks
    - Percentage score
    - Grade (with color coding: A=green, F=red, D/E=orange)
    - Published/Draft status
    - Remarks if any
  - Edit and Delete buttons for each mark
  - Delete functionality with confirmation

**API Calls**:
1. GET `/api/marks/batches/list?instituteId=...` - Fetch batch list
2. GET `/api/marks/batch/:batchId?instituteId=...` - Fetch marks for batch
3. DELETE `/api/marks/:id?instituteId=...` - Delete mark record

### 3. Marks Entry Navigation: Marksbatch.js
**Location**: `Frontend/Screens/Assistant/Marksentry/Marksbatch.js`

**Purpose**: 
- First screen when "Marks Entry" is selected
- Shows list of batches for selecting which batch to enter marks for
- Navigates to Marksinput.js with batch details

**Features**:
- Fetch batches from backend
- Search and filter batches
- Display batch cards with student count and status
- Navigate to marks entry form

## Integration with Assistant Dashboard

### Update AssistantSidebar (if needed)
The AssistantSidebar already includes:
- "Marks Entry" (marksentry) → Marksbatch.js → Marksinput.js

**Optional**: Add "View Exam Marks" navigation item:
```javascript
{ id: 'marksview', label: 'View Exam Marks', icon: '📊' }
```

Then add to SCREEN_COMPONENTS:
```javascript
marksview: MarksView,
```

## Data Flow

### Entering Marks
1. User selects "Marks Entry" from sidebar
2. AssistantSidebar loads Marksbatch.js
3. Marksbatch displays batches fetched from GET `/api/batches`
4. User selects batch → navigates to Marksinput.js
5. Marksinput shows form with:
   - Exam name input
   - Subject dropdown
   - Total marks input
   - Student marks table
6. User fills marks and clicks "Save Marks"
7. POST to `/api/marks/save` with marksArray
8. Marks saved to database with exam details
9. User can click "Publish Marks" to mark as published

### Viewing Marks
1. User selects "View Exam Marks" (or similar) from sidebar
2. MarksView loads BatchList screen
3. GET `/api/marks/batches/list` fetches all batches with marks
4. Display batch cards with summary
5. User selects batch → navigate to MarksDetail
6. GET `/api/marks/batch/:batchId` fetches marks
7. Display student marks with grades, percentages, etc.
8. Filter by exam using dropdown
9. View details, edit, or delete marks for each student

## Database Query Examples

### Find all marks for an institute
```javascript
ExamMarks.find({ instituteId: 'inst123' })
```

### Find marks for a batch and exam
```javascript
ExamMarks.find({ 
  instituteId: 'inst123', 
  batchId: 'batch456',
  examName: 'Midterm 2024'
})
```

### Find published marks for a student
```javascript
ExamMarks.find({
  instituteId: 'inst123',
  studentId: 'student789',
  published: true
})
```

### Aggregate marks by batch
```javascript
ExamMarks.aggregate([
  { $match: { instituteId: 'inst123' } },
  {
    $group: {
      _id: '$batchId',
      batchName: { $first: '$batchName' },
      marksCount: { $sum: 1 }
    }
  }
])
```

## Grade Calculation

Marks are automatically graded based on percentage:
- A: 90-100%
- B: 80-89%
- C: 70-79%
- D: 60-69%
- E: 50-59%
- F: Below 50%

## Institute-Specific Filtering

All marks queries must include `instituteId` parameter to ensure data isolation between institutes. This is enforced in all routes.

## Error Handling

- Missing instituteId returns 400 Bad Request
- Institute not found returns 404 Not Found
- Invalid mark values are rejected
- Duplicate entries are updated instead of created (upsert)
- Bulk operations report individual errors

## Testing Endpoints with cURL

```bash
# Save marks
curl -X POST http://localhost:5001/api/marks/save \
  -H "Content-Type: application/json" \
  -d '{
    "instituteId": "inst123",
    "batchId": "batch456",
    "marksArray": [
      {
        "examName": "Midterm 2024",
        "subject": "Mathematics",
        "studentId": "s1",
        "studentName": "John Doe",
        "marks": 85,
        "totalMarks": 100
      }
    ]
  }'

# Fetch batch marks
curl http://localhost:5001/api/marks/batch/batch456?instituteId=inst123

# Fetch batches with marks summary
curl http://localhost:5001/api/marks/batches/list?instituteId=inst123

# Publish marks
curl -X POST http://localhost:5001/api/marks/publish/batch \
  -H "Content-Type: application/json" \
  -d '{
    "instituteId": "inst123",
    "batchId": "batch456",
    "published": true
  }'
```

## Files Modified/Created

- ✅ `Backend/Models/ExamMarks.js` - Created new marks model
- ✅ `Backend/Routes/marksRoutes.js` - Created marks API routes
- ✅ `Backend/Server.js` - Added marks model and routes
- ✅ `Frontend/Screens/Assistant/Marksentry/Marksinput.js` - Updated with backend integration
- ✅ `Frontend/Screens/Assistant/MarksView/MarksView.js` - Created new marks view page
- `Frontend/Screens/Assistant/Dashboard/AssistantSidebar.js` - Already includes "Marks Entry"

## Next Steps (Optional)

1. Add "View Exam Marks" to AssistantSidebar for easier access
2. Add edit marks functionality in MarksDetail screen
3. Add marks analytics/reports page
4. Add export marks to CSV/PDF
5. Add parent notification when marks are published
