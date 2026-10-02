import { env } from '../config/env.js';

export interface SendMtParams {
  msisdn: string;
  message: string;
  type: 'otp' | 'optin' | 'optout' | 'business';
  extTransactionId?: string;
}

export const SpService = {
  /**
   * Send an MT SMS message via the Telecom SP Gateway (OpenAPI Contract)
   */
  async sendMt(params: SendMtParams): Promise<{ success: boolean; data?: any; error?: string }> {
    // In local development or testing without live gateway, echo to console
    if (env.NODE_ENV === 'development' || env.SP_GATEWAY_URL.includes('localhost')) {
      console.log(`[SP MT Echo] To: ${params.msisdn} | Type: ${params.type} | Message: "${params.message}"`);
      return { success: true, data: { simulated: true } };
    }

    try {
      const response = await fetch(`${env.SP_GATEWAY_URL}/api/v1/mt/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': env.SP_API_KEY,
        },
        body: JSON.stringify({
          serviceId: env.SP_SERVICE_ID,
          msisdn: params.msisdn,
          message: params.message,
          type: params.type,
          shortcode: env.SHORTCODE,
          shortCode: env.SHORTCODE,
          sender: env.SHORTCODE,
          senderId: env.SHORTCODE,
          extTransactionId: params.extTransactionId || `tx_${Date.now()}`,
          callbackUrl: `https://ethiofantasy-api.${env.DOMAIN}/api/v1/webhooks/dlr`,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        return { success: false, error: `SP Gateway responded ${response.status}: ${text}` };
      }

      const data = await response.json();
      return { success: true, data };
    } catch (err: any) {
      console.error('[SP Gateway Error] Failed to send MT:', err);
      return { success: false, error: err.message };
    }
  },
};
