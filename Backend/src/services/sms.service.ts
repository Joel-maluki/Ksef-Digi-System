import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

export type SmsDispatchResult = {
  delivered: boolean;
  mode: 'gateway' | 'textbee' | 'disabled';
  message: string;
};

export const getJudgeLoginEmail = (email: string) =>
  String(email || '').trim().toLowerCase();

export const buildJudgeCredentialsSms = ({
  fullName,
  email,
  temporaryPassword,
  categoryNames,
}: {
  fullName: string;
  email: string;
  temporaryPassword: string;
  categoryNames: string[];
}) => {
  const loginEmail = getJudgeLoginEmail(email);
  const loginUrl = `${env.frontendUrl.replace(/\/$/, '')}/login`;
  const categories =
    categoryNames.length > 0 ? categoryNames.join(', ') : 'assigned categories';

  return `KSEF Judge Account for ${fullName}. Login email: ${loginEmail}. Temporary password: ${temporaryPassword}. Categories: ${categories}. Login: ${loginUrl}. Change the password after first login. You will only view projects assigned to you.`;
};

export const buildPasswordRecoverySms = ({
  fullName,
  role,
  loginIdentifier,
  temporaryPassword,
}: {
  fullName: string;
  role: 'judge' | 'patron';
  loginIdentifier: string;
  temporaryPassword: string;
}) => {
  const loginUrl = `${env.frontendUrl.replace(/\/$/, '')}/login`;
  const roleLabel = role === 'judge' ? 'Judge' : 'Patron';

  return `KSEF ${roleLabel} password reset for ${fullName}. Login identifier: ${loginIdentifier}. Temporary password: ${temporaryPassword}. Login: ${loginUrl}. Change the password immediately after signing in.`;
};

export const sendSms = async ({
  to,
  message,
}: {
  to: string;
  message: string;
}): Promise<SmsDispatchResult> => {
  if (env.textBeeApiKey && env.textBeeDeviceId) {
    const digits = String(to || '').replace(/\D/g, '');
    const recipient = digits.startsWith('254')
      ? `+${digits}`
      : digits.startsWith('0') && digits.length === 10
        ? `+254${digits.slice(1)}`
        : digits.startsWith('7') && digits.length === 9
          ? `+254${digits}`
          : to;

    const response = await fetch(
      `${env.textBeeBaseUrl.replace(/\/$/, '')}/gateway/devices/${env.textBeeDeviceId}/send-sms`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': env.textBeeApiKey,
        },
        body: JSON.stringify({
          recipients: [recipient],
          message,
        }),
      }
    );

    if (!response.ok) {
      let providerMessage = 'Failed to send SMS with TextBee';

      try {
        const body = (await response.json()) as { message?: string; error?: string };
        if (body?.message || body?.error) {
          providerMessage = body.message || body.error || providerMessage;
        }
      } catch {
        providerMessage = response.statusText || providerMessage;
      }

      throw new ApiError(502, providerMessage);
    }

    return {
      delivered: true,
      mode: 'textbee',
      message: 'SMS sent successfully via TextBee',
    };
  }

  if (!env.smsGatewayUrl) {
    console.info(`[SMS disabled] To ${to}: ${message}`);
    return {
      delivered: false,
      mode: 'disabled',
      message: 'SMS gateway is not configured',
    };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (env.smsGatewayToken) {
    headers.Authorization = `Bearer ${env.smsGatewayToken}`;
  }

  const response = await fetch(env.smsGatewayUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      to,
      message,
      senderId: env.smsSenderId || undefined,
    }),
  });

  if (!response.ok) {
    let providerMessage = 'Failed to send SMS';

    try {
      const body = (await response.json()) as { message?: string };
      if (body?.message) {
        providerMessage = body.message;
      }
    } catch {
      providerMessage = response.statusText || providerMessage;
    }

    throw new ApiError(502, providerMessage);
  }

  return {
    delivered: true,
    mode: 'gateway',
    message: 'SMS sent successfully',
  };
};
