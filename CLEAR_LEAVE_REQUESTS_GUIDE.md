# Clear Leave Requests - Fresh Start Guide

## 🎯 Purpose
Clear all existing leave requests from the database to start fresh. From today onwards, only new leave requests will appear with real-time synchronization.

---

## 📋 Steps to Clear Leave Requests

### Step 1: Ensure Convex is Running
Make sure your Convex development server is running:
```bash
npx convex dev
```

### Step 2: Run the Clear Function
In a new terminal, run:
```bash
npx convex run clearLeaveRequests:clearAll
```

### Expected Output:
```
✅ Cleared X leave requests from database
📝 System is now ready for fresh leave requests
🔄 All new requests will sync in real-time
```

---

## ✅ What Happens After Clearing

### 1. **Empty Leave Management Page**
- All users will see "No leave requests" message
- Approved: 0
- Pending: 0  
- Rejected: 0

### 2. **Fresh Start**
- System is ready for new leave requests
- All new requests will sync in real-time
- No old/test data cluttering the system

### 3. **Real-Time Sync**
- When anyone raises a leave request, it appears instantly
- Approvals/rejections sync immediately
- All users see live updates

---

## 🔄 How Leave Requests Work (After Clearing)

### For All Team Members:
1. Click "Request Leave" button (prominent purple button at top)
2. Fill in the form:
   - Start Date
   - End Date
   - Leave Type (Vacation/Sick/Personal)
   - Reason
3. Submit request
4. Request appears instantly in "Pending" section
5. Wait for approval from team leads

### For Approval Team (CEO, CTO, CSO, CMO):
1. See all pending requests in real-time
2. Click "Approve" or "Reject" buttons
3. Status updates instantly for everyone
4. Employee sees approval/rejection immediately

---

## 👥 Who Can Approve Leave Requests?

Only 4 heads have approval authority:
- ✅ **CEO (Sahith)** - Can approve all requests
- ✅ **CTO (Shubham)** - Can approve all requests
- ✅ **CSO (Swaraag)** - Can approve all requests
- ✅ **CMO (Abhiram)** - Can approve all requests

All other team members can:
- ✅ Raise leave requests
- ✅ View their own request status
- ✅ See request history
- ❌ Cannot approve/reject requests

---

## 📊 Leave Request Flow

```
Employee Raises Request
        ↓
Status: PENDING (Yellow)
        ↓
Team Lead Reviews
        ↓
    ┌───────┴───────┐
    ↓               ↓
APPROVED        REJECTED
(Green)         (Red)
    ↓               ↓
Employee        Employee
Notified        Notified
```

---

## 🔐 Leave System Rules

### Post-Login Leave:
- Employees can take leave anytime after login
- No restriction on same-day leave post login
- Partial leave allowed after logging in

### Full Day Absence:
- If absent for full day (no login), leave approval is **mandatory**
- Leave must be approved by Team Lead, Reporting Manager, CTO, or CEO

### Leave Types:
- **Present**: Logged in and working
- **Partial Leave**: Logged in but left early
- **Full Leave**: No login with approved leave request
- **Absent**: No login without approved leave (auto-marked)

---

## 🎨 UI Features

### Request Leave Button:
- **Location**: Top of Leave Management page
- **Color**: Purple gradient background
- **Size**: Large, prominent button
- **Text**: "Request Leave" / "Cancel Request"

### Leave Request Form:
- Clean, modern design
- Required fields marked with *
- Date pickers for start/end dates
- Dropdown for leave type
- Text area for reason
- Submit and Cancel buttons

### Status Display:
- **Pending**: Yellow badge with clock icon
- **Approved**: Green badge with checkmark
- **Rejected**: Red badge with X icon

---

## 📱 Mobile Responsive

The leave management system is fully mobile responsive:
- ✅ Touch-friendly buttons (44x44px minimum)
- ✅ Mobile-optimized forms
- ✅ Responsive layout for all screen sizes
- ✅ Easy to use on phones and tablets

---

## 🚀 Benefits of Fresh Start

1. **Clean Slate**: No old test data
2. **Real Production Data**: Only actual leave requests
3. **Better Testing**: See real-time sync in action
4. **Accurate Reporting**: True leave statistics
5. **Professional Look**: Clean, organized system

---

## ⚠️ Important Notes

- **Backup**: This action deletes all leave requests permanently
- **Cannot Undo**: Once cleared, old requests cannot be recovered
- **Fresh Start**: Perfect for going live with the system
- **Real-Time**: All new requests sync instantly across all users

---

## 🎯 Next Steps After Clearing

1. ✅ Inform all team members about the fresh start
2. ✅ Ask them to raise new leave requests if needed
3. ✅ Test the real-time sync by having someone submit a request
4. ✅ Verify approval workflow works correctly
5. ✅ Monitor the system for any issues

---

## 📞 Support

If you encounter any issues:
1. Check Convex dashboard: https://dashboard.convex.dev
2. Verify `npx convex dev` is running
3. Check browser console for errors
4. Restart development server if needed

---

**Status**: ✅ Ready to clear leave requests and start fresh!
