// src/utils/formspree.ts
type FormValues = Record<string, unknown>;

interface SubmitToFormspreeParams {
  endpoint: string;
  values: FormValues;
  excludeKeys?: string[];
  formName?: string;
}

interface FormspreeResponse {
  errors?: { message?: string }[];
  error?: string;
  message?: string;
}

export async function submitToFormspree({
  endpoint,
  values,
  excludeKeys = [],
  formName,
}: SubmitToFormspreeParams) {
  if (!endpoint) {
    throw new Error("Form configuration is missing a Formspree endpoint.");
  }

  const sanitizedEntries = Object.entries(values).filter(
    ([key]) => !excludeKeys.includes(key)
  );

  const payload: FormValues = Object.fromEntries(sanitizedEntries);

  if (formName && !payload.formName) {
    payload.formName = formName;
  }

  if (typeof window !== "undefined" && window.location?.href) {
    payload.pageUrl = payload.pageUrl ?? window.location.href;
  }

  // File uploads can't survive JSON.stringify — a File serializes to
  // "[object File]". When any value is a File/Blob, send multipart/form-data
  // instead and let the browser set the boundary (never set Content-Type
  // manually for FormData, or the boundary is missing and Formspree 422s).
  const hasFile = Object.values(payload).some(
    (v) =>
      (typeof File !== "undefined" && v instanceof File) ||
      (typeof Blob !== "undefined" && v instanceof Blob) ||
      (Array.isArray(v) &&
        v.some(
          (x) =>
            (typeof File !== "undefined" && x instanceof File) ||
            (typeof Blob !== "undefined" && x instanceof Blob)
        ))
  );

  let response: Response;

  if (hasFile) {
    const body = new FormData();
    for (const [key, value] of Object.entries(payload)) {
      if (Array.isArray(value)) {
        // Skip empty file inputs so Formspree doesn't record a 0-byte upload.
        for (const item of value) {
          if (item instanceof File && item.size === 0) continue;
          body.append(key, item as string | Blob);
        }
      } else if (value instanceof File && value.size === 0) {
        continue;
      } else if (value === null || value === undefined) {
        continue;
      } else if (value instanceof Blob) {
        body.append(key, value);
      } else {
        body.append(key, String(value));
      }
    }

    response = await fetch(endpoint, {
      method: "POST",
      headers: { Accept: "application/json" },
      body,
    });
  } else {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  if (!response.ok) {
    let errorMessage = `Unable to submit the form (status ${response.status}).`;

    try {
      const bodyText = await response.text();
      if (bodyText) {
        try {
          const data = JSON.parse(bodyText) as FormspreeResponse;
          errorMessage =
            data?.errors?.[0]?.message ||
            data?.error ||
            data?.message ||
            errorMessage;
        } catch {
          errorMessage = bodyText;
        }
      }
    } catch {
      // Ignore parse errors
    }

    if (response.status === 403 && errorMessage.includes("status 403")) {
      errorMessage =
        "Formspree rejected this submission (403). Check that the form is active and this domain is allowed in Formspree.";
    }

    throw new Error(errorMessage);
  }
}
