"use client";

// PayHere's checkout expects a classic HTML form POST (not fetch/XHR) so the
// customer lands on their hosted payment page. Builds and submits a hidden
// form with the fields returned by /api/payments/payhere/initiate.
export function redirectToPayhereCheckout(url: string, formData: Record<string, string | number>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = url;

  for (const [key, value] of Object.entries(formData)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  }

  document.body.appendChild(form);
  form.submit();
}
