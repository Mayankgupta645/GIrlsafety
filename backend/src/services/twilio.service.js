import twilio from "twilio";

let client;

const getClient = () => {
  if (client) return client;

  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();

  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials are not configured");
  }

  client = twilio(accountSid, authToken);
  return client;
};

export const makeSOSCall = async (toNumber) => {
  if (!toNumber) {
    throw new Error("Phone number (to) is missing");
  }

  const twilioPhone = process.env.TWILIO_PHONE_NUMBER?.trim();
  if (!twilioPhone) {
    throw new Error("Twilio phone number is not configured");
  }

  return getClient().calls.create({
    to: toNumber,
    from: twilioPhone,
    twiml: `<Response>
              <Say voice="alice">
                This is an emergency alert. The user needs immediate help.
              </Say>
            </Response>`
  });
};