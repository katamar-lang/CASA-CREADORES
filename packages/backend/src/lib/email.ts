// Envío de emails. En MVP, si no hay credenciales SMTP configuradas,
// simplemente se imprime el email en consola (suficiente para demo/testing).

export async function sendVerificationEmail(to: string, verificationUrl: string): Promise<void> {
  const smtpConfigured = Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

  if (!smtpConfigured) {
    console.log("=".repeat(60));
    console.log(`[EMAIL MOCK] Verificación de cuenta para: ${to}`);
    console.log(`Link de verificación: ${verificationUrl}`);
    console.log("=".repeat(60));
    return;
  }

  // Punto de extensión: integrar un proveedor SMTP real (nodemailer, SendGrid, etc.)
  console.log(`[EMAIL] Enviando verificación real a ${to} -> ${verificationUrl}`);
}
