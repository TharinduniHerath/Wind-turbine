#!/usr/bin/env python3
"""
Test script for email functionality
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import traceback

def test_email():
    """Test email sending with different SMTP servers"""
    
    # Test different SMTP configurations
    smtp_configs = [
        {
            "name": "Outlook",
            "server": "smtp-mail.outlook.com",
            "port": 587
        },
        {
            "name": "Office 365",
            "server": "smtp.office365.com", 
            "port": 587
        },
        {
            "name": "Gmail",
            "server": "smtp.gmail.com",
            "port": 587
        }
    ]
    
    sender_email = "v.dhanushikan@gmail.com"
    sender_password = "meoe oveq hais uibu"
    to_email = "v.dhanushikan@gmail.com"
    
    for config in smtp_configs:
        print(f"\n{'='*50}")
        print(f"Testing {config['name']} SMTP")
        print(f"Server: {config['server']}:{config['port']}")
        print(f"{'='*50}")
        
        try:
            # Create message
            msg = MIMEMultipart()
            msg['From'] = sender_email
            msg['To'] = to_email
            msg['Subject'] = f"Test Email - {config['name']}"
            
            body = f"""Hi,

This is a test email from the Wind Turbine maintenance system.

SMTP Server: {config['server']}
Port: {config['port']}

Best regards,
Admin"""
            
            msg.attach(MIMEText(body, 'plain'))
            
            # Test connection
            print(f"Attempting to connect to {config['server']}:{config['port']}")
            server = smtplib.SMTP(config['server'], config['port'])
            print("✅ SMTP connection established")
            
            # Test TLS
            print("Starting TLS encryption...")
            server.starttls()
            print("✅ TLS started successfully")
            
            # Test login
            print(f"Attempting to login with {sender_email}")
            server.login(sender_email, sender_password)
            print("✅ Login successful")
            
            # Test sending
            print(f"Sending email to {to_email}")
            text = msg.as_string()
            server.sendmail(sender_email, to_email, text)
            print("✅ Email sent successfully!")
            
            server.quit()
            print(f"🎉 SUCCESS with {config['name']} SMTP!")
            return True
            
        except Exception as e:
            print(f"❌ Error with {config['name']}: {e}")
            print(f"Full error details:")
            print(traceback.format_exc())
            print()
            
            # Try to close server if it exists
            try:
                if 'server' in locals():
                    server.quit()
            except:
                pass
    
    return False

if __name__ == "__main__":
    print("🧪 Testing Email Functionality")
    print("="*50)
    
    success = test_email()
    
    if success:
        print("\n🎉 Email test completed successfully!")
    else:
        print("\n❌ All email configurations failed. Check the error details above.")
