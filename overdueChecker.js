import { base44 } from '@/api/base44Client';

export const notificationService = {
  async createNotification(adminId, notificationData) {
    try {
      const notification = await base44.entities.Notification.create({
        admin_id: adminId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        reference_id: notificationData.reference_id || '',
        reference_type: notificationData.reference_type || '',
        priority: notificationData.priority || 'medium',
        is_read: false,
        email_sent: false,
      });

      // Check admin's notification settings and send email if needed
      const admin = await base44.entities.Admin.filter({ id: adminId });
      if (admin.length > 0) {
        const settings = admin[0].notification_settings;
        if (settings?.enable_alerts) {
          const shouldEmail =
            (notificationData.priority === 'critical' && settings.email_on_critical) ||
            (notificationData.priority === 'high' && settings.email_on_high);

          if (shouldEmail && admin[0].email) {
            try {
              await base44.integrations.Core.SendEmail({
                to: admin[0].email,
                subject: `[${notificationData.priority.toUpperCase()}] ${notificationData.title}`,
                body: `${notificationData.message}\n\nPriority: ${notificationData.priority}`,
              });
              await base44.entities.Notification.update(notification.id, { email_sent: true });
            } catch (emailErr) {
              console.log('Email notification failed (user not registered):', emailErr.message);
            }
          }
        }
      }

      return notification;
    } catch (err) {
      console.error('Error creating notification:', err);
    }
  },

  // Trigger notification for new access request
  async notifyAccessRequest(accessRequestId, requestData) {
    const admins = await base44.entities.Admin.filter({ is_active: true });
    for (const admin of admins) {
      const settings = admin.notification_settings;
      if (settings?.alert_types?.includes('access_request')) {
        await this.createNotification(admin.id, {
          type: 'access_request',
          title: 'New Access Request',
          message: `New staff access request from ${requestData.full_name} (${requestData.employee_id})`,
          reference_id: accessRequestId,
          reference_type: 'AccessRequest',
          priority: 'high',
        });
      }
    }
  },

  // Trigger notification for overdue invoice
  async notifyOverdueInvoice(invoiceId, invoiceData) {
    const admins = await base44.entities.Admin.filter({ is_active: true });
    for (const admin of admins) {
      const settings = admin.notification_settings;
      if (settings?.alert_types?.includes('overdue_invoice')) {
        await this.createNotification(admin.id, {
          type: 'overdue_invoice',
          title: 'Overdue Invoice Alert',
          message: `Invoice #${invoiceData.invoice_number} for ${invoiceData.client_name} is now overdue`,
          reference_id: invoiceId,
          reference_type: 'Invoice',
          priority: 'critical',
        });
      }
    }
  },

  // Trigger notification for document review
  async notifyDocumentReview(documentId, documentData) {
    const admins = await base44.entities.Admin.filter({ is_active: true });
    for (const admin of admins) {
      const settings = admin.notification_settings;
      if (settings?.alert_types?.includes('document_review')) {
        await this.createNotification(admin.id, {
          type: 'document_review',
          title: 'Document Review Required',
          message: `${documentData.document_type} from ${documentData.client_name} requires review`,
          reference_id: documentId,
          reference_type: 'ClientDocument',
          priority: 'medium',
        });
      }
    }
  },

  // Trigger system alert
  async notifySystemAlert(title, message, priority = 'medium') {
    const admins = await base44.entities.Admin.filter({ is_active: true });
    for (const admin of admins) {
      const settings = admin.notification_settings;
      if (settings?.alert_types?.includes('system_alert')) {
        await this.createNotification(admin.id, {
          type: 'system_alert',
          title,
          message,
          priority,
        });
      }
    }
  },

  // Get unread count
  async getUnreadCount(adminId) {
    const notifications = await base44.entities.Notification.filter({
      admin_id: adminId,
      is_read: false,
    });
    return notifications.length;
  },
};