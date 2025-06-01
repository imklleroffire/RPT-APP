import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as sgMail from "@sendgrid/mail";

admin.initializeApp();

// Initialize SendGrid with your API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY || "");

export const onNewPatient = functions.firestore
  .document("patients/{patientId}")
  .onCreate(async (snap, context) => {
    const patientData = snap.data();
    const patientId = context.params.patientId;

    try {
      // Get therapist data to personalize the email
      const therapistDoc = await admin.firestore()
        .collection('users')
        .doc(patientData.therapistId)
        .get();
      
      const therapistData = therapistDoc.data();
      const therapistName = therapistData?.name || 'Your Physical Therapist';

      const msg = {
        to: patientData.email,
        from: {
          email: process.env.SENDER_EMAIL || 'physicaltherapyapp1@gmail.com',
          name: process.env.SENDER_NAME || 'Physical Therapy App'
        },
        templateId: 'd-your_template_id_here', // Replace with your actual template ID
        dynamicTemplateData: {
          patientName: patientData.name,
          therapistName: therapistName,
          registrationLink: `https://physical-therapy-app-demo.web.app/register?patientId=${patientId}`,
          supportEmail: process.env.SENDER_EMAIL || 'physicaltherapyapp1@gmail.com'
        }
      };

      const response = await sgMail.send(msg);
      console.log('Invitation email sent successfully to:', patientData.email);
      console.log('SendGrid Response:', response[0].statusCode);
      
      // Update patient document to record email sent
      await snap.ref.update({
        emailSent: true,
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error: any) {
      console.error('Error sending invitation email:', error);
      
      // Log error details for debugging
      if (error.response) {
        console.error('SendGrid API Error:', error.response.body);
      }
      
      // Update patient document to record failed email
      await snap.ref.update({
        emailSent: false,
        emailError: error.message || 'Unknown error occurred',
        emailSentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Re-throw the error to mark the function as failed
      throw error;
    }
  }); 