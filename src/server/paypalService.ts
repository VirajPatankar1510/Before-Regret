export interface CreateOrderParams {
  amount: string;
  currency: string;
  type: 'report' | 'vendor_subscription';
  description: string;
  returnUrl: string;
  cancelUrl: string;
  userEmail?: string;
  propertyAddress?: string;
  vendorId?: string;
}

export function isPayPalConfigured(): boolean {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

async function getPayPalAccessToken(): Promise<string> {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = (await response.json()) as any;

  if (!data.access_token) {
    throw new Error('Failed to obtain PayPal access token');
  }

  return data.access_token;
}

export async function createPayPalOrder(params: CreateOrderParams) {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

  const body = {
    intent: 'CAPTURE',
    purchase_units: [
      {
        amount: {
          currency_code: params.currency,
          value: params.amount,
        },
        description: params.description,
        custom_id: JSON.stringify({
          type: params.type,
          email: params.userEmail,
          propertyAddress: params.propertyAddress,
          vendorId: params.vendorId,
        }),
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          return_url: params.returnUrl,
          cancel_url: params.cancelUrl,
          user_action: 'PAY_NOW',
          brand_name: 'BeforeRegret',
          locale: 'en-US',
        },
      },
    },
  };

  try {
    const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as any;

    if (!data.id) {
      throw new Error(data.message || 'Failed to create PayPal order');
    }

    return {
      success: true,
      orderId: data.id,
      status: data.status,
    };
  } catch (error) {
    console.error('PayPal order creation failed:', error);
    throw error;
  }
}

export async function capturePayPalOrder(orderId: string) {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

  try {
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json()) as any;

    if (!data.id) {
      throw new Error(data.message || 'Failed to capture PayPal order');
    }

    const captureData = data.purchase_units?.[0]?.payments?.captures?.[0];

    return {
      success: true,
      orderId: data.id,
      status: data.status,
      captureId: captureData?.id,
      amount: captureData?.amount?.value,
      currency: captureData?.amount?.currency_code,
      payerEmail: data.payer?.email_address,
      payerName: data.payer?.name?.given_name,
    };
  } catch (error) {
    console.error('PayPal order capture failed:', error);
    throw error;
  }
}

export async function getPayPalOrder(orderId: string) {
  if (!isPayPalConfigured()) {
    throw new Error('PayPal is not configured');
  }

  const accessToken = await getPayPalAccessToken();
  const baseUrl =
    process.env.PAYPAL_MODE === 'live'
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com';

  try {
    const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json()) as any;

    if (!data.id) {
      throw new Error(data.message || 'Failed to fetch PayPal order');
    }

    return {
      success: true,
      orderId: data.id,
      status: data.status,
      amount: data.purchase_units?.[0]?.amount?.value,
      currency: data.purchase_units?.[0]?.amount?.currency_code,
    };
  } catch (error) {
    console.error('PayPal order fetch failed:', error);
    throw error;
  }
}
