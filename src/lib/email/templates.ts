const GUTZ_IMAGE_URL =
  'https://mdamossubweuqntwsblp.supabase.co/storage/v1/object/public/media/gutz-hero.png'

const BASE_URL = 'https://otaku-saas.vercel.app'

export function inviteEmailHtml({
  name,
  email,
  password,
}: {
  name: string
  email: string
  password: string
}): string {
  const firstName = name.split(' ')[0]
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Bem-vindo ao Otaku Estóico</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:0 0 24px 0;text-align:center;">
            <span style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#e63946;font-weight:700;">
              OTAKU ESTÓICO
            </span>
          </td>
        </tr>

        <!-- Hero image -->
        <tr>
          <td style="border-radius:16px 16px 0 0;overflow:hidden;line-height:0;">
            <img
              src="${GUTZ_IMAGE_URL}"
              alt="Gutz — Otaku Estóico"
              width="600"
              style="width:100%;display:block;border-radius:16px 16px 0 0;"
            />
          </td>
        </tr>

        <!-- Main card -->
        <tr>
          <td style="background:#141414;border-radius:0 0 16px 16px;padding:40px 48px 48px;">

            <!-- Greeting -->
            <p style="margin:0 0 8px;font-size:13px;color:#e63946;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
              Seu acesso está pronto
            </p>
            <h1 style="margin:0 0 20px;font-size:32px;font-weight:900;color:#ffffff;line-height:1.1;letter-spacing:-0.02em;">
              Bem-vindo, ${firstName}.
            </h1>
            <p style="margin:0 0 32px;font-size:15px;color:#888;line-height:1.7;">
              Você foi adicionado à plataforma <strong style="color:#ccc;">Otaku Estóico</strong>.
              Abaixo estão suas credenciais de acesso. Recomendamos trocar a senha no primeiro login.
            </p>

            <!-- Credentials box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:12px;margin-bottom:32px;">
              <tr>
                <td style="padding:24px 28px;">
                  <p style="margin:0 0 16px;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#555;font-weight:700;">
                    CREDENCIAIS DE ACESSO
                  </p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="padding:8px 0;border-bottom:1px solid #2a2a2a;">
                        <span style="font-size:12px;color:#555;display:block;margin-bottom:4px;">E-mail</span>
                        <span style="font-size:15px;color:#eee;font-weight:600;">${email}</span>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:8px 0 0;">
                        <span style="font-size:12px;color:#555;display:block;margin-bottom:4px;">Senha temporária</span>
                        <span style="font-size:16px;color:#eee;font-weight:700;font-family:'Courier New',monospace;letter-spacing:0.05em;">${password}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td align="center">
                  <a
                    href="${BASE_URL}/login"
                    style="display:inline-block;background:#e63946;color:#fff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;padding:16px 48px;border-radius:8px;"
                  >
                    Acessar a Plataforma →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Footer note -->
            <p style="margin:32px 0 0;font-size:12px;color:#444;text-align:center;line-height:1.7;">
              Se você não esperava esse e-mail, ignore-o.<br/>
              Este acesso foi criado por um administrador da plataforma.
            </p>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">
              © ${new Date().getFullYear()} Otaku Estóico · Todos os direitos reservados
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

export function recoveryEmailHtml({ email }: { email: string }): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Redefinição de senha — Otaku Estóico</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 0;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="padding:0 0 24px 0;text-align:center;">
            <span style="font-size:11px;letter-spacing:0.25em;text-transform:uppercase;color:#e63946;font-weight:700;">
              OTAKU ESTÓICO
            </span>
          </td>
        </tr>

        <!-- Hero image -->
        <tr>
          <td style="border-radius:16px 16px 0 0;overflow:hidden;line-height:0;">
            <img
              src="${GUTZ_IMAGE_URL}"
              alt="Gutz — Otaku Estóico"
              width="600"
              style="width:100%;display:block;border-radius:16px 16px 0 0;"
            />
          </td>
        </tr>

        <!-- Main card -->
        <tr>
          <td style="background:#141414;border-radius:0 0 16px 16px;padding:40px 48px 48px;">

            <p style="margin:0 0 8px;font-size:13px;color:#e63946;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;">
              Redefinição de senha
            </p>
            <h1 style="margin:0 0 20px;font-size:32px;font-weight:900;color:#ffffff;line-height:1.1;letter-spacing:-0.02em;">
              Esqueceu sua senha?
            </h1>
            <p style="margin:0 0 32px;font-size:15px;color:#888;line-height:1.7;">
              Recebemos uma solicitação para redefinir a senha da conta vinculada a
              <strong style="color:#ccc;">${email}</strong>.
              Clique no botão abaixo para criar uma nova senha. O link expira em <strong style="color:#ccc;">1 hora</strong>.
            </p>

            <!-- CTA button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a
                    href="{{ .ConfirmationURL }}"
                    style="display:inline-block;background:#e63946;color:#fff;text-decoration:none;font-weight:800;font-size:14px;letter-spacing:0.06em;text-transform:uppercase;padding:16px 48px;border-radius:8px;"
                  >
                    Redefinir senha →
                  </a>
                </td>
              </tr>
            </table>

            <!-- Safety note box -->
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#1e1e1e;border:1px solid #2a2a2a;border-radius:10px;padding:18px 22px;">
                  <p style="margin:0;font-size:12px;color:#555;line-height:1.7;">
                    🔒 <strong style="color:#666;">Não solicitou isso?</strong> Ignore este e-mail — sua senha permanece a mesma.
                    Se você suspeita de acesso não autorizado, entre em contato com o suporte.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:24px 0 0;text-align:center;">
            <p style="margin:0;font-size:11px;color:#333;letter-spacing:0.1em;text-transform:uppercase;">
              © ${new Date().getFullYear()} Otaku Estóico · Todos os direitos reservados
            </p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}
