# Email Configuration for Maintenance System

## Overview
The maintenance system now includes email functionality to automatically notify technicians when maintenance tasks are assigned.

## Email Configuration

### 1. Update Email Settings
In `backend/main.py`, locate the `send_maintenance_email` function and update these variables:

```python
sender_email = "your_email@gmail.com"        # Your Gmail address
sender_password = "your_app_password"         # Your Gmail app password
```

### 2. Gmail App Password Setup
For security reasons, Gmail requires an "App Password" instead of your regular password:

1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Navigate to "Security" → "2-Step Verification"
3. Scroll down to "App passwords"
4. Generate a new app password for "Mail"
5. Use this 16-character password in the `sender_password` field

### 3. Technician Email Mapping
The system automatically maps technicians to their email addresses:

- **Technician-1** → `v.dhanushigan@gmail.com`
- **Technician-2** → `v.dhanushikan@gmail.com`

### 4. Email Template
The system uses this email template:

```
Hi [Technician's Name],

Hope you're doing well.

We've identified some issues in the turbine monitoring system that require your attention. Please review and carry out maintenance on the following components:

- [Component 1]
- [Component 2]
- [Component 3]

Turbine ID: [Turbine-1 / Turbine-2 / Turbine-3]

If needed, I can share the recent health status reports and sensor logs.

Please confirm once you've scheduled or completed the maintenance.

Best regards,
Admin
```

## How It Works

1. **Assign Technicians**: Use the dropdown in the maintenance modal to assign technicians to components
2. **Click Confirm**: Click the "Confirm & Send Email" button
3. **Automatic Emails**: The system sends personalized emails to each assigned technician
4. **Success Confirmation**: You'll see a success message when emails are sent

## API Endpoint

- **URL**: `POST /send-maintenance-email`
- **Request Body**:
```json
{
  "to": "technician@email.com",
  "subject": "Maintenance Assignment - Turbine-1",
  "technician": "Technician-1",
  "components": ["Gearbox", "Blade System"],
  "turbineId": "Turbine-1"
}
```

## Troubleshooting

### Common Issues:
1. **Authentication Failed**: Check your Gmail app password
2. **SMTP Error**: Verify Gmail SMTP settings (smtp.gmail.com:587)
3. **Email Not Sent**: Check console logs for error messages

### Testing:
1. Start the backend: `cd backend && python3 main.py`
2. Open the frontend and navigate to Maintenance
3. Click the wrench icon to open the modal
4. Assign technicians to components
5. Click "Confirm & Send Email"

## Security Notes

- Never commit real email passwords to version control
- Use environment variables for production deployments
- Consider using a dedicated email service for production use
