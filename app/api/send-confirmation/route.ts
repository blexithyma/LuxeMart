export async function POST(request: Request) {
  try {
    const { email, name, orderId, total } = await request.json();

    if (!email || !name || !orderId || total === undefined) {
      return Response.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const domain = process.env.MAILGUN_DOMAIN;
    const apiKey = process.env.MAILGUN_API_KEY;
    const from = process.env.MAILGUN_FROM_EMAIL;

    if (!domain || !apiKey || !from) {
      return Response.json(
        { error: "Mailgun is not configured" },
        { status: 500 }
      );
    }

    const form = new FormData();

    form.append("from", from);
    form.append("to", email);
    form.append("subject", `LuxeMart Order #${orderId}`);
    form.append(
      "text",
      `Hello ${name},

Thank you for shopping with LuxeMart.

Your order #${orderId} has been received.

Total: ₦${Number(total).toLocaleString("en-NG")}

Thank you,
LuxeMart`
    );

    const response = await fetch(
      `https://api.mailgun.net/v3/${domain}/messages`,
      {
        method: "POST",
        headers: {
          Authorization:
            "Basic " +
            Buffer.from(`api:${apiKey}`).toString("base64"),
        },
        body: form,
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error(result);

      return Response.json(
        { error: "Mailgun failed to send email" },
        { status: 500 }
      );
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}