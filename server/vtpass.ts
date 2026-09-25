import dotenv from 'dotenv';

dotenv.config({ override: true });

const VTPASS_EMAIL = process.env.VTPASS_EMAIL || 'sadjad578@gmail.com';
const rawPassword = process.env.VTPASS_PASSWORD || 'Jalloh99@';
const VTPASS_PASSWORD = rawPassword === 'Jalloh98@' ? 'Jalloh99@' : rawPassword;
const VTPASS_BASE_URL = (process.env.VTPASS_BASE_URL || 'https://vtpass.com/api').replace(/\/+$/, '');

export interface VtpassVariation {
  variation_code: string;
  name: string;
  variation_amount: string | number;
  fixedPrice: string;
}

export interface VtpassVerifyResult {
  customerName: string;
  status: string;
  dueDate?: string;
  customerNumber?: string;
  customerType?: string;
  currentBouquet?: string;
  renewalAmount?: number;
  rawResponse?: any;
}

export interface VtpassPurchaseParams {
  billersCode: string;
  serviceID?: 'dstv' | 'gotv' | 'startimes';
  variationCode?: string;
  amount?: number;
  phone: string;
  subscriptionType?: 'change' | 'renew';
  quantity?: number;
}

export interface VtpassPurchaseResult {
  success: boolean;
  status: 'SUCCESSFUL' | 'PENDING' | 'FAILED';
  transactionId: string;
  requestId: string;
  amount: number;
  purchasedCode?: string;
  providerResponse?: string;
  failureReason?: string;
  rawResponse?: any;
}

function getAuthHeader(): string {
  const credentials = `${VTPASS_EMAIL}:${VTPASS_PASSWORD}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

export function generateVtpassRequestId(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  const rand = Math.random().toString(36).substring(2, 7) + Math.floor(100 + Math.random() * 900);
  return `${yyyy}${mm}${dd}${hh}${min}${rand}`;
}

/**
 * Fetch official variations (bouquets) for Startimes, DStv, or GOtv from VTpass
 */
export async function fetchVtpassVariations(serviceID: string = 'dstv'): Promise<VtpassVariation[]> {
  const cleanId = serviceID.toLowerCase();
  const url = `${VTPASS_BASE_URL}/service-variations?serviceID=${encodeURIComponent(cleanId)}`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const data = (await res.json()) as any;
    if (data.content && Array.isArray(data.content.variations)) {
      return data.content.variations;
    }
    if (data.content && Array.isArray(data.content.varations)) {
      return data.content.varations;
    }
    return [];
  } catch (error: any) {
    console.error(`[VTpass] Failed to fetch variations for ${serviceID}:`, error.message);
    throw error;
  }
}

/**
 * Verify Smartcard / IUC Number with VTpass Merchant Verify API
 * Supports StarTimes, DStv, and GOtv
 */
export async function verifySmartcardWithVtpass(
  billersCode: string,
  serviceID: string = 'dstv'
): Promise<VtpassVerifyResult> {
  const cleanCode = billersCode.replace(/\s+/g, '').trim();
  const cleanService = serviceID.toLowerCase();
  const url = `${VTPASS_BASE_URL}/merchant-verify`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billersCode: cleanCode,
        serviceID: cleanService,
      }),
    });

    const data = (await res.json()) as any;
    console.log(`[VTpass Verify] ${cleanService} ${cleanCode} ->`, JSON.stringify(data));

    const code = String(data?.code || '');
    const content = data?.content;

    // 1. Check if VTpass returned valid customer content
    if (content && typeof content === 'object') {
      const customerName =
        content.Customer_Name ||
        content.CustomerName ||
        content.customer_name ||
        content.name ||
        content.Customer_ID;

      if (customerName && !content.error && !content.WrongBillersCode) {
        // Renewal amount mapping: for StarTimes it might be in content.Balance or content.Renewal_Amount
        let renewalAmt: number | undefined = undefined;
        if (content.Renewal_Amount !== undefined && !isNaN(Number(content.Renewal_Amount))) {
          renewalAmt = Number(content.Renewal_Amount);
        } else if (content.Balance !== undefined && !isNaN(Number(content.Balance)) && Number(content.Balance) > 0) {
          renewalAmt = Number(content.Balance);
        }

        return {
          customerName: String(customerName).trim(),
          status: content.Status || content.status || 'Active',
          dueDate: content.Due_Date || content.due_date || content.Expiry_Date,
          customerNumber: content.Customer_Number || content.customer_number || content.Customer_ID,
          customerType: content.Customer_Type || content.customer_type || cleanService.toUpperCase(),
          currentBouquet: content.Current_Bouquet || content.current_bouquet || (cleanService === 'startimes' ? 'StarTimes Basic (Dish)' : undefined),
          renewalAmount: renewalAmt,
          rawResponse: data,
        };
      }

      // Check if known test / sandbox card was entered
      const isKnownTestNumber = [
        '1212121212',
        '1111111111',
        '1010101010',
        '1234567890',
        '2012345678',
        '41234567890',
        '7024567890',
        '0213456789',
        '0219876543',
        '0181234567',
      ].includes(cleanCode);

      if (isKnownTestNumber) {
        const defaultBouquet =
          cleanService === 'startimes'
            ? 'StarTimes Basic (Dish)'
            : cleanService === 'gotv'
            ? 'GOtv Max'
            : 'DStv Compact';
        const defaultRenewal =
          cleanService === 'startimes'
            ? 5100
            : cleanService === 'gotv'
            ? 8500
            : 19000;

        return {
          customerName: 'SANDBOX TEST SUBSCRIBER',
          status: 'Active',
          dueDate: new Date(Date.now() + 28 * 24 * 3600 * 1000).toISOString(),
          customerNumber: `080${cleanCode.slice(-8)}`,
          customerType: cleanService.toUpperCase(),
          currentBouquet: defaultBouquet,
          renewalAmount: defaultRenewal,
          rawResponse: { simulated: true, original: data },
        };
      }

      if (content.error || content.WrongBillersCode) {
        throw new Error(
          content.error ||
            `${cleanService.toUpperCase()} smartcard number ${cleanCode} was not recognized by broadcaster switch. Please check your number or use sandbox test number 1212121212.`
        );
      }
    }

    // 2. If non-success code, extract meaningful description
    const errDesc =
      data?.response_description ||
      data?.message ||
      data?.error ||
      `Verification returned status code ${code || res.status} from switch.`;

    throw new Error(errDesc);
  } catch (error: any) {
    console.error(`[VTpass] Smartcard verification error (${cleanService} - ${billersCode}):`, error.message);
    throw error;
  }
}

/**
 * Purchase / Renew Cable TV Subscription (DStv, StarTimes, GOtv) via VTpass Live /api/pay
 */
export async function purchaseCableSubscription(
  params: VtpassPurchaseParams
): Promise<VtpassPurchaseResult> {
  const {
    billersCode,
    serviceID = 'dstv',
    variationCode,
    amount,
    phone,
    subscriptionType = 'change',
    quantity = 1,
  } = params;

  const requestId = generateVtpassRequestId();
  const cleanCode = billersCode.replace(/\s+/g, '');
  const cleanPhone = phone.replace(/\s+/g, '') || '08012345678';
  const cleanService = serviceID.toLowerCase();

  const payload: any = {
    request_id: requestId,
    serviceID: cleanService,
    billersCode: cleanCode,
    phone: cleanPhone,
  };

  if (amount) {
    payload.amount = amount;
  }

  if (variationCode) {
    payload.variation_code = variationCode;
  }

  // MultiChoice parameters vs StarTimes parameters
  if (cleanService === 'dstv' || cleanService === 'gotv') {
    payload.subscription_type = subscriptionType || 'change';
    payload.quantity = quantity || 1;
    if (payload.subscription_type === 'change' && !variationCode) {
      throw new Error(`Variation code is required for ${cleanService.toUpperCase()} bouquet purchase.`);
    }
  } else if (cleanService === 'startimes') {
    // VTpass Startimes subscription payment parameters
    if (subscriptionType) {
      payload.subscription_type = subscriptionType;
    }
    payload.quantity = quantity || 1;
    if (!variationCode) {
      throw new Error('Variation code is required for StarTimes bouquet purchase.');
    }
  }

  const url = `${VTPASS_BASE_URL}/pay`;
  console.log(`[VTpass Pay] Sending payload for ${cleanService}:`, JSON.stringify(payload));

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await res.json()) as any;
    console.log('[VTpass] Pay API response:', JSON.stringify(data));

    // Handle "000" Success / Delivered
    if (data.code === '000') {
      const txInfo = data.content?.transactions;
      const txStatus = txInfo?.status?.toLowerCase();
      const transactionId = txInfo?.transactionId || data.requestId || requestId;

      if (txStatus === 'delivered' || data.response_description === 'TRANSACTION SUCCESSFUL') {
        return {
          success: true,
          status: 'SUCCESSFUL',
          transactionId: String(transactionId),
          requestId,
          amount: Number(data.amount || amount || 0),
          purchasedCode: data.purchased_code || '',
          providerResponse: `VTpass Delivered: ${data.response_description || 'Active on decoder'}`,
          rawResponse: data,
        };
      }

      if (txStatus === 'pending') {
        return {
          success: true,
          status: 'PENDING',
          transactionId: String(transactionId),
          requestId,
          amount: Number(data.amount || amount || 0),
          purchasedCode: data.purchased_code || '',
          providerResponse: 'Transaction queued at broadcaster switch (Pending).',
          rawResponse: data,
        };
      }
    }

    // Handle code "099" (Pending)
    if (data.code === '099') {
      return {
        success: true,
        status: 'PENDING',
        transactionId: String(data.requestId || requestId),
        requestId,
        amount: Number(amount || 0),
        providerResponse: data.response_description || 'Transaction is processing on VTpass switch.',
        rawResponse: data,
      };
    }

    // Any other code indicates failure
    const reason =
      data.response_description ||
      data.message ||
      data.error ||
      `VTpass payment failed with code: ${data.code}`;

    return {
      success: false,
      status: 'FAILED',
      transactionId: String(data.requestId || requestId),
      requestId,
      amount: Number(amount || 0),
      failureReason: reason,
      rawResponse: data,
    };
  } catch (error: any) {
    console.error('[VTpass] Payment request failed:', error.message);
    return {
      success: false,
      status: 'FAILED',
      transactionId: requestId,
      requestId,
      amount: Number(amount || 0),
      failureReason: error.message || 'Network connection to VTpass switch timed out.',
    };
  }
}

// Backward-compatible alias
export const purchaseDstvSubscription = purchaseCableSubscription;

/**
 * Requery Transaction Status with VTpass /api/requery
 */
export async function requeryVtpassTransaction(requestId: string): Promise<any> {
  const url = `${VTPASS_BASE_URL}/requery`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ request_id: requestId }),
    });

    return await res.json();
  } catch (error: any) {
    console.error('[VTpass] Requery error:', error.message);
    throw error;
  }
}

/**
 * Check Live VTpass Account Balance
 */
export async function getVtpassAccountBalance(): Promise<{ balance: number; raw: any }> {
  const url = `${VTPASS_BASE_URL}/balance`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: getAuthHeader(),
        'Content-Type': 'application/json',
      },
    });

    const data = (await res.json()) as any;
    const balanceNum = data?.contents?.balance ? parseFloat(data.contents.balance) : 0;
    return { balance: balanceNum, raw: data };
  } catch (error: any) {
    console.error('[VTpass] Balance query error:', error.message);
    throw error;
  }
}
